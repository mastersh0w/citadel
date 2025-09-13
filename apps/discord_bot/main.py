# apps/discord_bot/main.py
# -*- coding: utf-8 -*-

import sys
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, project_root)

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Optional, TYPE_CHECKING
import discord
from discord import app_commands
from discord.ext import commands, tasks
from dotenv import load_dotenv
import aiohttp
import redis.asyncio as redis

from prometheus_client import generate_latest
from aiohttp import web
from core import metrics
from core.db import Database
from core.translator import Translator
from core.log_handler import DiscordLogHandler

if TYPE_CHECKING:
    from apps.discord_bot.cogs.greeting import GreetingCog
    from apps.discord_bot.cogs.config_events import ConfigEventsCog

load_dotenv()
translator = Translator()
DEFAULT_LANGUAGE = os.getenv("BOT_LANGUAGE", "ru").lower()
logger = logging.getLogger(__name__)

async def send_shutdown_webhook(message: str, color: int = 0x808080):
    webhook_url = os.getenv("SHUTDOWN_WEBHOOK_URL")
    if not webhook_url: return
    embed = { "title": "Статус Бота", "description": message, "color": color, "timestamp": datetime.now(timezone.utc).isoformat() }
    async with aiohttp.ClientSession() as session:
        try:
            await session.post(webhook_url, json={"embeds": [embed]}, timeout=5)
        except Exception as e:
            logger.error(f"Не удалось отправить финальный вебхук: {e}")

def setup_logging() -> DiscordLogHandler | None:
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    month_year_dir = os.path.join(log_dir, datetime.now().strftime("%m-%Y"))
    os.makedirs(month_year_dir, exist_ok=True)
    log_filename = f"{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log"
    log_filepath = os.path.join(month_year_dir, log_filename)
    file_formatter = logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s')
    console_formatter = logging.Formatter('%(levelname)-8s %(name)-15s: %(message)s')
    file_handler = logging.FileHandler(log_filepath, encoding='utf-8')
    file_handler.setFormatter(file_formatter)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_formatter)
    channel_ids = {
        'start': int(os.getenv("START_CHANNEL_ID", 0)),
        'info': int(os.getenv("INFO_CHANNEL_ID", 0)),
        'error': int(os.getenv("ERROR_CHANNEL_ID", 0))
    }
    discord_handler = None
    if any(channel_ids.values()):
        discord_handler = DiscordLogHandler(channel_ids)
    else:
        print("ПРЕДУПРЕЖДЕНИЕ: ID каналов для логирования в Discord не указаны. Логи в Discord отключены.")
    log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level_str)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    if discord_handler:
        root_logger.addHandler(discord_handler)
    logging.getLogger('discord.http').setLevel(logging.WARNING)
    return discord_handler

async def metrics_handler(request):
    return web.Response(body=generate_latest(), content_type='text/plain; version=0.0.4')

class SecurityBot(commands.Bot):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.db_manager = Database()
        self.translator = translator 
        self.db_pool = None
        self.redis: redis.Redis = None
        self.discord_handler = None
        self._synced_once = False
        self.users_under_review: set[int] = set()
        self.default_language = DEFAULT_LANGUAGE
        self.hardcoded_language = "en"
        self.start_time = discord.utils.utcnow()
        self.is_shutting_down = False
        self.tree.on_error = self.on_app_command_error
        self.tree.interaction_check = self.global_interaction_check

    @tasks.loop(seconds=15.0)
    async def update_stats_in_redis(self):
        for guild in self.guilds:
            try:
                online_members = sum(1 for m in guild.members if m.status != discord.Status.offline)
                
                stats = {
                    "serverName": str(guild.name),
                    "memberCount": str(guild.member_count),
                    "onlineCount": str(online_members),
                    "roleCount": str(len(guild.roles)),
                    "textChannelCount": str(len(guild.text_channels)),
                    "voiceChannelCount": str(len(guild.voice_channels)),
                    "botLatency": str(round(self.latency * 1000))
                }
                
                # --- ИСПРАВЛЕНИЕ: Используем pipeline для надежной записи ---
                async with self.redis.pipeline(transaction=False) as pipe:
                    for key, value in stats.items():
                        await pipe.hset(f"stats:{guild.id}", key, value)
                    await pipe.execute()

            except Exception as e:
                logger.warning(f"Не удалось обновить статистику для сервера {guild.id}: {e}")

    @update_stats_in_redis.before_loop
    async def before_update_stats_task(self):
        await self.wait_until_ready()

    async def cleanup_before_shutdown(self):
        logger.info("Выполняю очистку перед выключением...")
        try:
            uptime_channel_id = int(os.getenv("UPTIME_CHANNEL_ID", 0))
            if uptime_channel_id != 0:
                channel = self.get_channel(uptime_channel_id)
                if channel and channel.name != "⚪️ Uptime: Offline":
                    await channel.edit(name="⚪️ Uptime: Offline", reason="Bot shutdown")
                    logger.info("Статусный канал Uptime успешно обновлен на 'Offline'.")
        except Exception as e:
            logger.error(f"Не удалось обновить каналы при выключении: {e}")
        await send_shutdown_webhook("💤 Бот корректно выключен.", color=0x808080)

    async def close(self):
        if not self.is_shutting_down:
            self.is_shutting_down = True
            logging.getLogger('bot.startup').info("💤 Начинается процедура выключения бота...")
            await self.cleanup_before_shutdown()
            if self.redis:
                try:
                    await self.redis.aclose()
                    logging.getLogger('bot.startup').info("🔌 Соединение с Redis успешно закрыто.")
                except Exception as e:
                    logging.getLogger('bot.startup').error(f"Не удалось закрыть соединение с Redis: {e}")
            if self.discord_handler:
                await asyncio.sleep(1)
        await super().close()

    async def get_guild_language(self, guild_id: int | None) -> str:
        if not guild_id: return self.default_language
        redis_key = f"lang:{guild_id}"
        cached_lang = await self.redis.get(redis_key)
        if cached_lang: return cached_lang
        lang = None
        try:
            async with self.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = 'language'", (guild_id,))
                    result = await cursor.fetchone()
                    if result: lang = result[0]
        except Exception as e:
            logger.error(f"Не удалось получить настройку языка из БД для сервера {guild_id}: {e}")
        lang = lang or self.default_language
        if lang not in self.translator.strings: lang = self.hardcoded_language
        await self.redis.set(redis_key, lang)
        return lang

    async def start_metrics_server(self):
        app = web.Application()
        app.router.add_get("/metrics", metrics_handler)
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 8000)
        try:
            await site.start()
            logger.info("✅ Сервер метрик Prometheus запущен на порту 8000.")
        except Exception as e:
            logger.error(f"❌ Не удалось запустить сервер метрик Prometheus: {e}")

    async def setup_hook(self):
        self.discord_handler = setup_logging()
        if self.discord_handler: self.discord_handler.set_bot(self)
        logging.info("Запуск setup_hook...")
        try:
            self.db_pool = await self.db_manager.create_pool()
            await self.db_manager.initialize_tables(self.db_pool)
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", 6379))
            redis_db = int(os.getenv("REDIS_DB", 0))
            redis_password = os.getenv("REDIS_PASSWORD") or None
            self.redis = redis.Redis(host=redis_host, port=redis_port, db=redis_db, password=redis_password, decode_responses=True)
            await self.redis.ping()
            logging.getLogger('bot.info').info("✅ Успешное подключение к Redis.")
        except Exception as e:
            logging.critical(f"❌ Не удалось подключиться к внешним сервисам. Бот не может продолжить работу.", exc_info=True)
            await self.close()
            return
        cogs_to_load = ['greeting', 'management', 'setup', 'telegram_setup', 'join_gate', 'anti_nuke', 'confirmation', 'help', 'backup', 'dashboard', 'status', 'moderation', 'config_events', 'warnings', 'backup_manager']
        for cog_name in cogs_to_load:
            try:
                await self.load_extension(f"apps.discord_bot.cogs.{cog_name}")
                logging.info(f"Ког '{cog_name}' успешно загружен.")
            except Exception as e:
                logging.error(f"Не удалось загрузить ког 'apps.discord_bot.cogs.{cog_name}'.", exc_info=True)
        asyncio.create_task(self.start_metrics_server())

    async def on_guild_join(self, guild: discord.Guild):
        logging.getLogger('bot.info').info(f"👋 Бот был добавлен на новый сервер: **{guild.name}** (ID: {guild.id}).")
        metrics.GUILDS_COUNT.inc()
        await self._handle_new_guild(guild)

    async def on_guild_remove(self, guild: discord.Guild):
        await self.redis.delete(f"lang:{guild.id}", f"antinuke_settings:{guild.id}", f"threats:{guild.id}")
        metrics.GUILDS_COUNT.dec()
        logging.getLogger('bot.info').info(f"😭 Бот был удален с сервера: **{guild.name}** (ID: {guild.id}). Очищаю данные...")
        async with self.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM guilds WHERE guild_id = %s", (guild.id,))
                await cursor.execute("DELETE FROM guild_configs WHERE guild_id = %s", (guild.id,))

    async def sync_commands(self):
        startup_logger = logging.getLogger('bot.startup')
        try:
            startup_logger.info("Начинаю синхронизацию слэш-команд...")
            synced = await self.tree.sync()
            startup_logger.info(f"✅ Успешно синхронизировано {len(synced)} слэш-команд(ы).")
        except Exception as e:
            startup_logger.error(f"❌ Ошибка при синхронизации слэш-команд: {e}", exc_info=True)

    async def on_ready(self):
        if not self._synced_once:
            await self.sync_commands()
            await self.sync_guilds()
            metrics.GUILDS_COUNT.set(len(self.guilds))
            config_events_cog: Optional["ConfigEventsCog"] = self.get_cog("События Конфигурации")
            if config_events_cog and hasattr(config_events_cog, "check_quarantine_roles_on_startup"):
                await config_events_cog.check_quarantine_roles_on_startup()
            self.update_stats_in_redis.start()
            self._synced_once = True
        logging.getLogger('bot.startup').info(f"🚀 Бот {self.user} запущен и готов к работе!")

    async def _determine_and_set_language(self, guild: discord.Guild):
        target_lang = None
        locale_value = guild.preferred_locale
        is_community = "COMMUNITY" in guild.features
        if is_community:
            target_lang = 'ru' if str(locale_value) == 'ru' else 'en'
        else:
            target_lang = self.default_language
        try:
            async with self.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("INSERT INTO guild_configs (guild_id, config_key, config_value) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE config_value = %s", (guild.id, 'language', target_lang, target_lang))
            await self.redis.delete(f"lang:{guild.id}")
            logger.info(f"Для сервера '{guild.name}' (ID: {guild.id}) АВТОМАТИЧЕСКИ УСТАНОВЛЕН ЯЗЫК: {target_lang.upper()}")
        except Exception as e:
            logger.error(f"Не удалось автоматически установить язык для сервера {guild.id}: {e}")

    async def _handle_new_guild(self, guild: discord.Guild):
        async with self.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("INSERT INTO guilds (guild_id, guild_name) VALUES (%s, %s) ON DUPLICATE KEY UPDATE guild_name = %s", (guild.id, guild.name, guild.name))
        await self._determine_and_set_language(guild)
        greeting_cog: Optional["GreetingCog"] = self.get_cog("Приветствие")
        if greeting_cog:
            await greeting_cog.send_welcome_message(guild)

    async def sync_guilds(self):
        info_logger = logging.getLogger('bot.info')
        info_logger.info("Начинаю синхронизацию списка серверов...")
        current_guild_ids = {g.id for g in self.guilds}
        db_guild_ids = set()
        async with self.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT guild_id FROM guilds")
                rows = await cursor.fetchall()
                db_guild_ids = {row[0] for row in rows}
        new_guild_ids = current_guild_ids - db_guild_ids
        lost_guilds_ids = db_guild_ids - current_guild_ids
        for guild_id in new_guild_ids:
            guild = self.get_guild(guild_id)
            if guild:
                info_logger.info(f"➕ Обнаружен новый сервер: **{guild.name}** (ID: {guild.id}).")
                await self._handle_new_guild(guild)
        for guild_id in lost_guilds_ids:
            info_logger.info(f"➖ Обнаружен удаленный сервер: ID **{guild_id}**.")
            async with self.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("DELETE FROM guilds WHERE guild_id = %s", (guild.id,))
                    await cursor.execute("DELETE FROM guild_configs WHERE guild_id = %s", (guild.id,))
        info_logger.info("Синхронизация списка серверов завершена.")

    async def global_interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.command:
            metrics.COMMANDS_PROCESSED.labels(command_name=interaction.command.qualified_name).inc()
        return True

    async def on_app_command_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        lang = await self.get_guild_language(interaction.guild_id)
        if isinstance(error, app_commands.CheckFailure):
            if not interaction.response.is_done():
                await interaction.response.send_message(self.translator.get("system.check_failure", lang=lang), ephemeral=True)
        else:
            logger.error(f"Ошибка при выполнении слэш-команды `/{interaction.command.name}`:", exc_info=error)
            error_message = self.translator.get("system.unexpected_error", lang=lang)
            try:
                if interaction.response.is_done(): await interaction.followup.send(error_message, ephemeral=True)
                else: await interaction.response.send_message(error_message, ephemeral=True)
            except discord.errors.InteractionResponded: await interaction.followup.send(error_message, ephemeral=True)
            except Exception as e: logger.error(f"Не удалось отправить сообщение об ошибке пользователю: {e}")

async def main():
    intents = discord.Intents.all()
    bot = SecurityBot(command_prefix="!", intents=intents)
    async with bot:
        await bot.start(os.getenv("DISCORD_BOT_TOKEN"))

if __name__ == "__main__":
    try:
        os.chdir(project_root)
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Получен сигнал KeyboardInterrupt. Программа штатно завершается.")