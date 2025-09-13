# cogs/dashboard.py
# -*- coding: utf-8 -*-

import logging
import discord
from discord import app_commands
from discord.ext import commands
from typing import TYPE_CHECKING, List, Optional
import json

if TYPE_CHECKING:
    from main import SecurityBot
    from .anti_nuke import AntiNukeCog

logger = logging.getLogger(__name__)

# =========================================================================================
# >> UI КОМПОНЕНТ ДЛЯ ВЫБОРА СЕРВЕРА
# =========================================================================================
class ServerSelectView(discord.ui.View):
    def __init__(self, bot: "SecurityBot", author_id: int, owner_guilds: List[discord.Guild]):
        super().__init__(timeout=300.0)
        self.bot = bot
        self.author_id = author_id
        
        options = [
            discord.SelectOption(label=guild.name, value=str(guild.id), emoji="🖥️")
            for guild in owner_guilds
        ]
        
        self.select_menu = discord.ui.Select(
            placeholder="Выберите сервер для просмотра дашборда...",
            options=options, min_values=1, max_values=1
        )
        self.select_menu.callback = self.select_callback
        self.add_item(self.select_menu)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.author_id:
            lang = self.bot.default_language
            t = self.bot.translator.get
            # ИЗМЕНЕНО
            await interaction.response.send_message(t("ui.interaction_denied", lang=lang), ephemeral=True)
            return False
        return True

    async def select_callback(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True, thinking=True)

        selected_guild_id = int(self.select_menu.values[0])
        guild = self.bot.get_guild(selected_guild_id)
        if not guild:
            await interaction.followup.send("Не удалось найти этот сервер. Возможно, я был с него удален.", ephemeral=True)
            return

        lang = await self.bot.get_guild_language(guild.id)
        t = self.bot.translator.get

        # --- Собираем всю информацию для дашборда ---
        embed = discord.Embed(
            title=f"📊 Дашборд для сервера «{guild.name}»",
            color=discord.Color.blurple()
        )
        embed.set_thumbnail(url=guild.icon.url if guild.icon else None)

        # 1. Общие настройки
        quarantine_role_json = await self.get_config(guild.id, "quarantine_role")
        quarantine_role_status = "❌ Не настроена"
        if quarantine_role_json:
            try:
                role_data = json.loads(quarantine_role_json)
                role_name = role_data.get("name", "Имя не найдено")
                quarantine_role_status = f"✅ Настроена (`{role_name}`)"
            except (json.JSONDecodeError, TypeError):
                quarantine_role_status = "⚠️ Требуется перенастройка (`/setup quarantine`)"

        telegram_user_id = await self.get_config(guild.id, "telegram_user_id")
        telegram_status = "✅ Настроены" if telegram_user_id else "❌ Не настроены"
        
        settings_text = (
            f"**Язык:** `{lang.upper()}`\n"
            f"**Роль карантина:** {quarantine_role_status}\n"
            f"**Оповещения в Telegram:** {telegram_status}"
        )
        embed.add_field(name="⚙️ Основные настройки", value=settings_text, inline=False)

        # 2. Настройки Анти-нюка
        antinuke_cog: Optional["AntiNukeCog"] = self.bot.get_cog("Анти-нюк")
        if antinuke_cog:
            antinuke_settings = []
            # ИЗМЕНЕНО: Используем новые ключи
            setting_keys = {
                "threshold": "threshold", "decay": "decay",
                "channel_delete": "channel_del", "channel_create": "channel_add",
                "role_create": "role_add", "webhook_create": "webhook_add",
                "ban": "ban", "kick": "kick",
            }

            for key, translation_key_suffix in setting_keys.items():
                value = await antinuke_cog._get_guild_setting(guild.id, key)
                # ИЗМЕНЕНО
                name = t(f"setup.antinuke.field_{translation_key_suffix}", lang=lang)
                
                is_default = (value == antinuke_cog.defaults.get(key))
                # ИЗМЕНЕНО
                default_suffix = t("system.default_value_suffix", lang=lang)
                value_str = f"**{name}:** {value}{default_suffix if is_default else ''}"
                antinuke_settings.append(value_str)
            
            embed.add_field(name="🛡️ Настройки Анти-нюка", value="\n".join(antinuke_settings), inline=True)

        # 3. Список бэкапов
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT backup_name, created_at, options_json FROM backups WHERE guild_id = %s ORDER BY created_at DESC LIMIT 5", (guild.id,))
                    backups = await cursor.fetchall()
            
            backup_text = ""
            if not backups:
                # ИЗМЕНЕНО
                backup_text = t("backup.server.list_no_backups", lang=lang)
            else:
                for name, created_at, options_json in backups:
                    options = json.loads(options_json)
                    msg_icon = "💬" if options.get("messages") else "📄"
                    timestamp = f"<t:{int(created_at.timestamp())}:R>"
                    backup_text += f"{msg_icon} **`{name}`** (создан {timestamp})\n"

            embed.add_field(name="🗄️ Последние 5 бэкапов", value=backup_text, inline=True)
        except Exception as e:
            logger.error(f"Ошибка при получении бэкапов для дашборда: {e}")
            embed.add_field(name="🗄️ Бэкапы", value="Не удалось загрузить список.", inline=True)
            
        for item in self.children:
            item.disabled = True
        await interaction.edit_original_response(view=self)
        await interaction.followup.send(embed=embed, ephemeral=True)

    async def get_config(self, guild_id: int, key: str) -> Optional[str]:
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (guild_id, key))
                    result = await cursor.fetchone()
                    return result[0] if result else None
        except Exception as e:
            logger.error(f"Ошибка при получении конфига '{key}' для дашборда: {e}")
            return None

# =========================================================================================
# >> ОСНОВНОЙ КЛАСС КОГА
# =========================================================================================
class DashboardCog(commands.Cog, name="Дашборд"):
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot

    @app_commands.command(name="my_servers", description="Показать дашборд с информацией по вашим серверам (только в ЛС)")
    async def my_servers(self, interaction: discord.Interaction):
        if interaction.guild:
            await interaction.response.send_message("Эта команда предназначена для использования только в личных сообщениях со мной.", ephemeral=True)
            return

        owner_guilds = [g for g in self.bot.guilds if g.owner_id == interaction.user.id]

        if not owner_guilds:
            await interaction.response.send_message("Я не нашел серверов под вашим управлением, на которых я присутствую.", ephemeral=True)
            return
        
        view = ServerSelectView(bot=self.bot, author_id=interaction.user.id, owner_guilds=owner_guilds)
        await interaction.response.send_message("Пожалуйста, выберите сервер для просмотра его дашборда:", view=view, ephemeral=True)

async def setup(bot: "SecurityBot"):
    await bot.add_cog(DashboardCog(bot))