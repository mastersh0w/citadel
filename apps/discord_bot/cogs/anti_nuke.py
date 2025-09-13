# apps/discord_bot/cogs/anti_nuke.py
# -*- coding: utf-8 -*-

import os
import asyncio
import logging
from typing import Dict, Any, Coroutine, Callable, TYPE_CHECKING
from collections import defaultdict
import discord
from discord.ext import commands, tasks

from core import metrics
from core.services import security_service

if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

SETTINGS_CACHE_TTL = 600
THREAT_KEY_PREFIX = "threats"
SETTINGS_KEY_PREFIX = "antinuke_settings"

class AntiNukeCog(commands.Cog, name="Анти-нюк"):
    """
    Реактивная система защиты, отслеживающая быстрые и массовые действия
    и помещающая нарушителей в карантин.
    """
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        
        self.default_settings = {
            'threshold': float(os.getenv("THREAT_SCORE_THRESHOLD", 25.0)),
            'decay': float(os.getenv("SCORE_DECAY_PER_SECOND", 2.0)),
            'channel_delete': float(os.getenv("SCORE_PER_CHANNEL_DELETE", 10.0)),
            'channel_create': float(os.getenv("SCORE_PER_CHANNEL_CREATE", 10.0)),
            'role_create': float(os.getenv("SCORE_PER_ROLE_CREATE", 5.0)),
            'ban': float(os.getenv("SCORE_PER_BAN", 8.0)),
            'kick': float(os.getenv("SCORE_PER_KICK", 8.0)),
            'webhook_create': float(os.getenv("SCORE_PER_WEBHOOK_CREATE", 5.0)),
        }
        
        self.action_map: Dict[str, Callable[[Any], Coroutine[Any, Any, None]]] = {
            "on_guild_channel_delete": self.on_guild_channel_delete,
            "on_guild_channel_create": self.on_guild_channel_create,
            "on_guild_role_create": self.on_guild_role_create,
            "on_member_ban": self.on_member_ban,
            "on_member_remove": self.on_member_remove,
            "on_webhooks_update": self.on_webhooks_update,
        }
        
        self.decay_task.start()

    def cog_unload(self):
        self.decay_task.cancel()
        
    async def _get_settings(self, guild_id: int) -> Dict[str, float]:
        redis_key = f"{SETTINGS_KEY_PREFIX}:{guild_id}"
        cached_settings = await self.bot.redis.hgetall(redis_key)
        if cached_settings:
            return {k: float(v) for k, v in cached_settings.items()}
        db_settings = {}
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_key, config_value FROM guild_configs WHERE guild_id = %s AND config_key LIKE 'antinuke_%'", (guild_id,))
                    rows = await cursor.fetchall()
                    for row in rows:
                        key_name = row[0].replace("antinuke_", "")
                        db_settings[key_name] = float(row[1])
        except Exception as e:
            logger.error(f"Не удалось получить настройки анти-нюка из БД для сервера {guild_id}: {e}")
            return self.default_settings
        final_settings = self.default_settings.copy()
        final_settings.update(db_settings)
        pipeline = self.bot.redis.pipeline()
        pipeline.hset(redis_key, mapping=final_settings)
        pipeline.expire(redis_key, SETTINGS_CACHE_TTL)
        await pipeline.execute()
        return final_settings

    async def _add_threat_score(self, member: discord.Member, event_type: str):
        if member.bot or member.id == self.bot.user.id or member.id == member.guild.owner_id:
            return
        guild = member.guild
        settings = await self._get_settings(guild.id)
        score_to_add = settings.get(event_type, 0.0)
        if score_to_add <= 0: return
        redis_key = f"{THREAT_KEY_PREFIX}:{guild.id}"
        new_score = float(await self.bot.redis.hincrbyfloat(redis_key, str(member.id), score_to_add))
        threshold = settings['threshold']
        logger.debug(f"Anti-nuke: Пользователь {member} ({member.id}) на сервере {guild.name} совершил действие '{event_type}'. Добавлено {score_to_add} очков. Итого: {new_score:.2f}/{threshold}")
        if new_score >= threshold:
            lang = await self.bot.get_guild_language(guild.id)
            reason = self.bot.translator.get(f"security.reasons.{event_type}", lang)
            await self.bot.redis.hdel(redis_key, str(member.id))
            await self._trigger_quarantine_procedure(member, new_score, threshold, reason)

    async def _trigger_quarantine_procedure(self, member: discord.Member, score: float, threshold: float, reason: str):
        guild = member.guild
        lang = await self.bot.get_guild_language(guild.id)
        
        result = await security_service.quarantine_user(self.bot, member, reason)

        if result['status'] == 'error':
            error_code = result['code']
            if error_code == 'quarantine_not_configured':
                logger.warning(f"АТАКА НА СЕРВЕРЕ {guild.name}! Пользователь {member} превысил порог, но роль карантина не настроена!")
                telegram_cog = self.bot.get_cog("TelegramSetupCog")
                if telegram_cog:
                    await telegram_cog.send_telegram_notification(guild.id, 'critical_config', user_name=str(member), user_id=member.id, guild_name=guild.name)
            elif error_code == 'hierarchy_error':
                logger.error(f"Недостаточно прав для помещения {member} в карантин на сервере {guild.name}. Пытаюсь забанить как крайнюю меру.")
                await guild.ban(member, reason="Anti-nuke: Quarantine failed, fallback to ban")
            else:
                logger.error(f"Не удалось поместить в карантин {member} на сервере {guild.name} из-за ошибки: {error_code}")
            return

        metrics.ANTI_NUKE_TRIGGERS.labels(guild_id=str(guild.id)).inc()

        log_channel_id = 0
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = 'log_channel_id'",(guild.id,))
                    res = await cursor.fetchone()
                    if res: log_channel_id = int(res[0])
        except Exception: pass
        
        log_channel = guild.get_channel(log_channel_id)
        if log_channel:
            log_message = self.bot.translator.get("security.quarantine_log", lang, user_mention=member.mention, score=score, threshold=threshold)
            await log_channel.send(log_message)
        
        owner = guild.owner
        if owner:
            # Тут нужно будет поправить, когда перенесем confirmation.py
            # view = self.bot.get_cog("Подтверждения").QuarantineDecisionView(member.id, guild.id)
            embed = discord.Embed(
                title=self.bot.translator.get("security.embed_titles.incident_report", lang),
                description=self.bot.translator.get("security.confirm.quarantine.description", lang, user_mention=member.mention, reason=reason),
                color=discord.Color.red()
            )
            # await owner.send(embed=embed, view=view) # Временно отключено
            await owner.send(embed=embed)


        telegram_cog = self.bot.get_cog("TelegramSetupCog")
        if telegram_cog:
            await telegram_cog.send_telegram_notification(guild.id, 'quarantine', guild_name=guild.name, user_name=str(member), user_id=member.id, reason=reason)

    @tasks.loop(seconds=2.0)
    async def decay_task(self):
        try:
            async for key in self.bot.redis.scan_iter(match=f"{THREAT_KEY_PREFIX}:*"):
                guild_id_str = key.split(':')[1]
                try:
                    settings = await self._get_settings(int(guild_id_str))
                    decay_amount = settings.get('decay', 2.0) * 2.0
                except Exception as e:
                    logger.warning(f"Не удалось получить настройки для guild_id {guild_id_str} в decay_task: {e}. Пропускаем...")
                    continue
                if decay_amount <= 0: continue
                users_to_update = {}
                async for user_id, score_str in self.bot.redis.hscan_iter(key):
                    new_score = float(score_str) - decay_amount
                    users_to_update[user_id] = new_score
                if not users_to_update: continue
                pipeline = self.bot.redis.pipeline()
                for user_id, new_score in users_to_update.items():
                    if new_score <= 0:
                        pipeline.hdel(key, user_id)
                    else:
                        pipeline.hset(key, user_id, new_score)
                await pipeline.execute()
        except Exception as e:
            logger.error(f"Ошибка в задаче уменьшения очков угрозы (decay_task): {e}", exc_info=True)

    @decay_task.before_loop
    async def before_decay_task(self):
        await self.bot.wait_until_ready()

    async def process_event(self, event_type: str, member: discord.Member, *args, **kwargs):
        if not member or not isinstance(member, discord.Member): return
        await self._add_threat_score(member, event_type)

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel):
        async for entry in channel.guild.audit_logs(limit=1, action=discord.AuditLogAction.channel_delete):
            await self.process_event('channel_delete', entry.user); break

    @commands.Cog.listener()
    async def on_guild_channel_create(self, channel):
        async for entry in channel.guild.audit_logs(limit=1, action=discord.AuditLogAction.channel_create):
            await self.process_event('channel_create', entry.user); break

    @commands.Cog.listener()
    async def on_guild_role_create(self, role):
        async for entry in role.guild.audit_logs(limit=1, action=discord.AuditLogAction.role_create):
            await self.process_event('role_create', entry.user); break

    @commands.Cog.listener()
    async def on_member_ban(self, guild, user):
        async for entry in guild.audit_logs(limit=1, action=discord.AuditLogAction.ban):
            await self.process_event('ban', entry.user); break

    @commands.Cog.listener()
    async def on_member_remove(self, member):
        await asyncio.sleep(1)
        async for entry in member.guild.audit_logs(limit=1, action=discord.AuditLogAction.kick):
            if entry.target.id == member.id:
                await self.process_event('kick', entry.user); break
    
    @commands.Cog.listener()
    async def on_webhooks_update(self, channel):
        await asyncio.sleep(1)
        async for entry in channel.guild.audit_logs(limit=1, action=discord.AuditLogAction.webhook_create):
            if entry.target.channel_id == channel.id:
                 await self.process_event('webhook_create', entry.user); break


async def setup(bot: "SecurityBot"):
    await bot.add_cog(AntiNukeCog(bot))