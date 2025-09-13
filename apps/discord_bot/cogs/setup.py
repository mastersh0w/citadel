# apps/discord_bot/cogs/setup.py
# -*- coding: utf-8 -*-

import logging
import asyncio
import discord
from discord import app_commands
from discord.ext import commands
from typing import TYPE_CHECKING, Optional, List
import os
import json

# --- ИСПРАВЛЕНИЕ ИМПОРТОВ ---
from core.permissions import is_guild_owner_check
from core.services import settings_service

# Указываем полный путь к нашему главному классу бота и другим когам для type hinting
if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot
    from apps.discord_bot.cogs.anti_nuke import AntiNukeCog 
    from apps.discord_bot.cogs.backup import BackupCog

logger = logging.getLogger(__name__)

@app_commands.guild_only()
@app_commands.default_permissions(administrator=True)
class LanguageSetupGroup(app_commands.Group, name="language", description="Управление языковыми настройками бота"):
    def __init__(self, bot: "SecurityBot"):
        super().__init__()
        self.bot = bot

    @app_commands.command(name="set", description="Установить язык для бота на этом сервере")
    @app_commands.describe(language="Выберите язык из доступного списка")
    @app_commands.check(is_guild_owner_check)
    async def set(self, interaction: discord.Interaction, language: str):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer(ephemeral=True)

        if language not in self.bot.translator.strings:
            await interaction.followup.send("Выбран неверный язык.")
            return

        result = await settings_service.set_guild_setting(self.bot, interaction.guild_id, 'language', language)
        
        if result['status'] == 'success':
            new_lang = await self.bot.get_guild_language(interaction.guild_id)
            await interaction.followup.send(t("setup.language.success", lang=new_lang, language_name=language.upper()))
        else:
            await interaction.followup.send(t("system.db_error", lang=lang))

    @set.autocomplete('language')
    async def set_autocomplete(self, interaction: discord.Interaction, current: str) -> List[app_commands.Choice[str]]:
        langs = list(self.bot.translator.strings.keys())
        choices = [app_commands.Choice(name=lang.upper(), value=lang) for lang in langs]
        if current:
            return [choice for choice in choices if current.lower() in choice.name.lower()]
        return choices

@app_commands.guild_only()
@app_commands.default_permissions(administrator=True)
class QuarantineSetupGroup(app_commands.Group, name="quarantine", description="Настроить роль для карантина (для анти-рейд/анти-нюк системы)"):
    
    def __init__(self, bot: "SecurityBot"):
        super().__init__()
        self.bot = bot
    
    @app_commands.command(name="configure", description="Настроить или создать роль для карантина")
    @app_commands.check(is_guild_owner_check)
    async def configure(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer(ephemeral=True, thinking=True)
        
        result = await settings_service.configure_quarantine(self.bot, interaction.guild)
        
        if result['status'] == 'success':
            role = result['role']
            response_message = t("setup.quarantine.role_created", lang=lang) if role.created_at.timestamp() > interaction.created_at.timestamp() else t("setup.quarantine.role_found", lang=lang)
            if interaction.guild.me.top_role <= role:
                response_message += "\n" + t("setup.quarantine.role_perms_error", lang=lang)
            await interaction.followup.send(response_message)
        else:
            error_code = result.get('code', 'unknown')
            error_message = f"❌ Ошибка при настройке карантина: `{error_code}`. Проверьте права бота."
            await interaction.followup.send(error_message)
            
@app_commands.guild_only()
@app_commands.default_permissions(administrator=True)
class AntiNukeSetupGroup(app_commands.Group, name="antinuke", description="Настроить параметры системы защиты от атак (Анти-нюк)"):
    def __init__(self, bot: "SecurityBot"):
        super().__init__()
        self.bot = bot
        
    async def get_setting_keys(self, lang: str) -> dict:
        t = self.bot.translator.get
        return {
            "threshold": t("setup.antinuke.field_threshold", lang=lang), "decay": t("setup.antinuke.field_decay", lang=lang),
            "channel_delete": t("setup.antinuke.field_channel_del", lang=lang), "channel_create": t("setup.antinuke.field_channel_add", lang=lang),
            "role_create": t("setup.antinuke.field_role_add", lang=lang), "webhook_create": t("setup.antinuke.field_webhook_add", lang=lang),
            "ban": t("setup.antinuke.field_ban", lang=lang), "kick": t("setup.antinuke.field_kick", lang=lang),
        }

    @app_commands.command(name="view", description="Показать текущие настройки системы Анти-нюк для этого сервера")
    @app_commands.check(is_guild_owner_check)
    async def view(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer(ephemeral=True)
        
        antinuke_cog: Optional["AntiNukeCog"] = self.bot.get_cog("Анти-нюк")
        if not antinuke_cog:
            await interaction.followup.send("Ошибка: компонент Анти-нюка не загружен.")
            return

        embed = discord.Embed(
            title=t("setup.antinuke.settings_title", lang=lang, guild_name=interaction.guild.name),
            description=t("setup.antinuke.settings_desc", lang=lang), color=discord.Color.blue()
        )
        
        guild_settings = await antinuke_cog._get_settings(interaction.guild_id)
        
        setting_keys = await self.get_setting_keys(lang)
        for key, name in setting_keys.items():
            value = guild_settings.get(key, antinuke_cog.default_settings.get(key))
            is_default = (value == antinuke_cog.default_settings.get(key))
            default_suffix = t("system.default_value_suffix", lang=lang)
            value_str = f"{value} {default_suffix}" if is_default else f"**{value}**"
            embed.add_field(name=name, value=value_str, inline=True)
            
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="configure", description="Изменить один или несколько параметров системы Анти-нюк")
    @app_commands.check(is_guild_owner_check)
    async def configure(self, interaction: discord.Interaction, 
                        threshold: Optional[float] = None, decay: Optional[float] = None,
                        channel_delete: Optional[float] = None, channel_create: Optional[float] = None,
                        role_create: Optional[float] = None, webhook_create: Optional[float] = None,
                        ban: Optional[float] = None, kick: Optional[float] = None):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer(ephemeral=True)
        
        settings_to_update = {
            "threshold": threshold, "decay": decay, "channel_delete": channel_delete,
            "channel_create": channel_create, "role_create": role_create,
            "webhook_create": webhook_create, "ban": ban, "kick": kick
        }
        
        tasks = []
        for key, value in settings_to_update.items():
            if value is not None:
                tasks.append(settings_service.set_guild_setting(self.bot, interaction.guild_id, f"antinuke_{key}", value))
        
        if not tasks:
            await interaction.followup.send("Вы не указали ни одного параметра для изменения.")
            return
            
        results = await asyncio.gather(*tasks)
        if all(res['status'] == 'success' for res in results):
            await interaction.followup.send(t("setup.antinuke.configure_success", lang=lang))
        else:
            await interaction.followup.send(t("system.db_error", lang=lang))

    @app_commands.command(name="reset", description="Сбросить настройку Анти-нюка до значения по умолчанию")
    @app_commands.describe(setting="Настройка, которую нужно сбросить")
    @app_commands.check(is_guild_owner_check)
    async def reset(self, interaction: discord.Interaction, setting: str):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer(ephemeral=True)
        
        setting_keys = await self.get_setting_keys(lang)
        if setting not in setting_keys:
            await interaction.followup.send("Выбрана неверная настройка.")
            return

        result = await settings_service.delete_guild_setting(self.bot, interaction.guild_id, f"antinuke_{setting}")
        
        if result['status'] == 'success':
            setting_name = setting_keys[setting]
            await interaction.followup.send(t("setup.antinuke.reset_success", lang=lang, setting_name=setting_name))
        else:
            setting_name = setting_keys.get(setting, setting)
            await interaction.followup.send(t("setup.antinuke.reset_fail", lang=lang, setting_name=setting_name))

    @reset.autocomplete('setting')
    async def reset_autocomplete(self, interaction: discord.Interaction, current: str) -> List[app_commands.Choice[str]]:
        lang = await self.bot.get_guild_language(interaction.guild.id)
        setting_keys = await self.get_setting_keys(lang)
        choices = [app_commands.Choice(name=name, value=key) for key, name in setting_keys.items()]
        if current:
            return [choice for choice in choices if current.lower() in choice.name.lower()]
        return choices

@app_commands.guild_only()
@app_commands.default_permissions(administrator=True)
class BackupSettingsGroup(app_commands.Group, name="backup-settings", description="Настроить лимит сообщений для бэкапов"):
    def __init__(self, bot: "SecurityBot"):
        super().__init__()
        self.bot = bot

    @app_commands.command(name="messages-limit", description="Установить, сколько последних сообщений сохранять из каждого канала")
    @app_commands.describe(limit="Число от 0 (отключить) до 1000. По умолчанию: 100.")
    @app_commands.check(is_guild_owner_check)
    async def set_messages_limit(self, interaction: discord.Interaction, limit: app_commands.Range[int, 0, 1000]):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        await interaction.response.defer(ephemeral=True)
        
        result = await settings_service.set_guild_setting(self.bot, interaction.guild_id, "backup_messages_limit", limit)
        
        if result['status'] == 'success':
            await interaction.followup.send(t("setup.backup_messages.limit_success", lang=lang, limit=limit))
        else:
            await interaction.followup.send(t("system.db_error", lang=lang))

@app_commands.guild_only()
@app_commands.default_permissions(administrator=True)
class LogSetupGroup(app_commands.Group, name="logs", description="Управление каналом для логов модерации"):
    def __init__(self, bot: "SecurityBot"):
        super().__init__()
        self.bot = bot
        self.t = self.bot.translator.get

    @app_commands.command(name="set", description="Установить канал для отправки логов")
    @app_commands.describe(channel="Текстовый канал, куда будут отправляться логи")
    @app_commands.check(is_guild_owner_check)
    async def set_log_channel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        result = await settings_service.set_guild_setting(self.bot, interaction.guild_id, "moderation_log_channel_id", channel.id)
        
        if result['status'] == 'success':
            await interaction.response.send_message(self.t("setup.logs.set_success", lang=lang, channel_mention=channel.mention), ephemeral=True)
        else:
            await interaction.response.send_message(self.t("system.db_error", lang=lang), ephemeral=True)

    @app_commands.command(name="disable", description="Отключить отправку логов в канал")
    @app_commands.check(is_guild_owner_check)
    async def disable_log_channel(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        result = await settings_service.delete_guild_setting(self.bot, interaction.guild_id, "moderation_log_channel_id")
        
        if result['status'] == 'success':
            await interaction.response.send_message(self.t("setup.logs.disabled_success", lang=lang), ephemeral=True)
        else:
            await interaction.response.send_message(self.t("system.db_error", lang=lang), ephemeral=True)

@app_commands.guild_only()
@app_commands.default_permissions(administrator=True)
class SetupGroup(app_commands.Group, name="setup", description="Управление настройками бота на этом сервере"):
     def __init__(self, bot: "SecurityBot"):
        super().__init__()
        self.add_command(LanguageSetupGroup(bot))
        self.add_command(QuarantineSetupGroup(bot))
        self.add_command(AntiNukeSetupGroup(bot))
        self.add_command(BackupSettingsGroup(bot))
        self.add_command(LogSetupGroup(bot))

class SetupCog(commands.Cog, name="Настройки"):
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        bot.tree.add_command(SetupGroup(bot))

async def setup(bot: "SecurityBot"):
    await bot.add_cog(SetupCog(bot))