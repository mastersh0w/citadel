# apps/discord_bot/cogs/backup.py
# -*- coding: utf-8 -*-

import logging
from typing import List, Optional, TYPE_CHECKING
import discord
from discord import app_commands
from discord.ext import commands
import re

# --- ИСПРАВЛЕНИЕ ИМПОРТОВ ---
from core.permissions import is_guild_owner_check
from core.ui import ConfirmationView
from core.services import backup_service

if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

async def backup_name_autocomplete(
    interaction: discord.Interaction,
    current: str
) -> List[app_commands.Choice[str]]:
    if not hasattr(interaction.client, "db_pool"): return []
    
    source_guild_id = interaction.namespace.source_server_id or interaction.guild_id
    
    try:
        guild_id_to_check = int(source_guild_id)
    except (ValueError, TypeError):
        guild_id_to_check = interaction.guild_id

    backups = await backup_service.get_backups_list(interaction.client, guild_id_to_check)
    
    return [
        app_commands.Choice(name=backup['name'], value=backup['name'])
        for backup in backups if current.lower() in backup['name'].lower()
    ][:25]


class BackupCog(commands.Cog, name="Резервное Копирование"):
    """
    Команды для создания, восстановления и управления бэкапами сервера.
    """

    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        self.valid_backup_name = re.compile(r"^[a-zA-Z0-9_-]+$")

    async def _send_completion_message(self, guild: discord.Guild, user: discord.User, message: str):
        """Отправляет сообщение сначала в ЛС, а при неудаче - в первый доступный канал."""
        try:
            await user.send(message)
        except discord.Forbidden:
            logger.warning(f"Не удалось отправить ЛС пользователю {user.id}. Ищу канал для отправки...")
            for channel in guild.text_channels:
                if channel.permissions_for(guild.me).send_messages:
                    try:
                        await channel.send(f"{user.mention}, {message}")
                        return
                    except Exception as e:
                        logger.error(f"Не удалось отправить фоллбэк-сообщение в канал {channel.id}: {e}")
            logger.error(f"Не найдено ни одного канала для отправки фоллбэк-сообщения на сервере {guild.id}")

    backup = app_commands.Group(name="backup", description="Управление бэкапами сервера.")

    @backup.command(name="create", description="Создать новый бэкап (снимок) сервера.")
    @app_commands.describe(
        name="Название бэкапа (латиница, цифры, _, -).",
        messages="Сохранить последние сообщения в каналах? (по умолчанию: Да)"
    )
    @app_commands.check(is_guild_owner_check)
    async def backup_create(self, interaction: discord.Interaction, name: str, messages: bool = True):
        lang = await self.bot.get_guild_language(interaction.guild_id)

        if not self.valid_backup_name.match(name):
            await interaction.response.send_message(self.bot.translator.get("backup.server.create_invalid_name", lang), ephemeral=True)
            return

        backups = await backup_service.get_backups_list(self.bot, interaction.guild_id)
        if name in [b['name'] for b in backups]:
            await interaction.response.send_message(self.bot.translator.get("backup.server.create_already_exists", lang, backup_name=name), ephemeral=True)
            return
        
        if len(backups) >= 10:
            await interaction.response.send_message(self.bot.translator.get("backup.server.create_limit_reached", lang, limit=10), ephemeral=True)
            return

        await interaction.response.send_message(self.bot.translator.get("backup.server.create_started", lang, backup_name=name), ephemeral=True)
        
        messages_limit = 100
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = 'backup_messages_limit'", (interaction.guild_id,))
                    res = await cursor.fetchone()
                    if res: messages_limit = int(res[0])
        except Exception: pass
        
        result = await backup_service.create_backup(
            bot=self.bot, guild=interaction.guild, user=interaction.user,
            backup_name=name, backup_messages=messages, messages_limit=messages_limit
        )

        if result['status'] == 'error':
            await interaction.followup.send(self.bot.translator.get("system.db_error", lang), ephemeral=True)
            return
            
        options_list = [f"- {self.bot.translator.get('backup.server.options.structure', lang)}"]
        if result['options']['messages']:
            options_list.append(f"- {self.bot.translator.get('backup.server.options.messages', lang, limit=result['options']['limit'])}")

        embed = discord.Embed(
            title=self.bot.translator.get("backup.server.create_success_title", lang, backup_name=name),
            description=self.bot.translator.get("backup.server.create_success_desc", lang, options_list='\n'.join(options_list)),
            color=discord.Color.green()
        )
        await interaction.followup.send(embed=embed, ephemeral=True)

    @backup.command(name="list", description="Показать список всех доступных бэкапов для этого сервера.")
    @app_commands.check(is_guild_owner_check)
    async def backup_list(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        backups = await backup_service.get_backups_list(self.bot, interaction.guild_id)

        if not backups:
            await interaction.response.send_message(self.bot.translator.get("backup.server.list_no_backups", lang), ephemeral=True)
            return

        description = []
        for b in backups:
            timestamp = discord.utils.format_dt(b['created_at'], 'f')
            description.append(self.bot.translator.get("backup.server.list_entry", lang, backup_name=b['name'], timestamp=timestamp))
            
        embed = discord.Embed(
            title=self.bot.translator.get("backup.server.list_title", lang, guild_name=interaction.guild.name),
            description='\n'.join(description),
            color=discord.Color.blue()
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @backup.command(name="delete", description="Удалить существующий бэкап.")
    @app_commands.describe(name="Название бэкапа для удаления.")
    @app_commands.autocomplete(name=backup_name_autocomplete)
    @app_commands.check(is_guild_owner_check)
    async def backup_delete(self, interaction: discord.Interaction, name: str):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        view = ConfirmationView(
            author=interaction.user,
            approve_label=self.bot.translator.get("ui.button_approve", lang),
            deny_label=self.bot.translator.get("ui.button_deny", lang),
            interaction_denied_message=self.bot.translator.get("ui.interaction_denied", lang)
        )
        
        embed = discord.Embed(
            title=self.bot.translator.get("backup.server.delete_confirm_title", lang),
            description=self.bot.translator.get("backup.server.delete_confirm_desc", lang, backup_name=name),
            color=discord.Color.orange()
        )
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)
        await view.wait()

        if view.result:
            result = await backup_service.delete_backup(self.bot, interaction.guild_id, name)
            if result['status'] == 'success':
                await interaction.edit_original_response(content=self.bot.translator.get("backup.server.delete_success", lang, backup_name=name), embed=None, view=None)
            elif result['code'] == 'not_found':
                await interaction.edit_original_response(content=self.bot.translator.get("backup.server.delete_not_found", lang, backup_name=name), embed=None, view=None)
            else:
                await interaction.edit_original_response(content=self.bot.translator.get("system.db_error", lang), embed=None, view=None)
        else:
            await interaction.edit_original_response(content="Операция отменена.", embed=None, view=None)

    @backup.command(name="restore", description="Восстановить сервер из бэкапа (ОПАСНО).")
    @app_commands.describe(name="Название бэкапа для восстановления.")
    @app_commands.autocomplete(name=backup_name_autocomplete)
    @app_commands.check(is_guild_owner_check)
    async def backup_restore(self, interaction: discord.Interaction, name: str):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        backup_data = await backup_service.load_backup_data(self.bot, interaction.guild_id, name)
        if not backup_data:
            await interaction.response.send_message(self.bot.translator.get("backup.server.restore_not_found", lang), ephemeral=True)
            return

        view = ConfirmationView(
            author=interaction.user, approve_label=self.bot.translator.get("ui.button_approve", lang),
            deny_label=self.bot.translator.get("ui.button_deny", lang),
            interaction_denied_message=self.bot.translator.get("ui.interaction_denied", lang)
        )
        embed = discord.Embed(
            title=self.bot.translator.get("backup.server.restore_confirm_title", lang),
            description=self.bot.translator.get("backup.server.restore_confirm_desc", lang, backup_name=name),
            color=discord.Color.red()
        )
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)
        await view.wait()

        if view.result:
            await interaction.edit_original_response(content=self.bot.translator.get("backup.server.restore_started", lang, backup_name=name), embed=None, view=None)
            result = await backup_service.apply_backup_to_guild(self.bot, interaction.guild, backup_data, restore_messages=True)
            if result['status'] == 'success':
                msg = self.bot.translator.get("backup.server.progress.restore_final_success", lang, guild_name=interaction.guild.name)
            else:
                msg = self.bot.translator.get("backup.server.restore_failed", lang, error=result.get('message', 'Unknown error'))
            await self._send_completion_message(interaction.guild, interaction.user, msg)
        else:
            await interaction.edit_original_response(content="Операция отменена.", embed=None, view=None)

    @backup.command(name="clone", description="Клонировать структуру другого сервера (ОЧЕНЬ ОПАСНО).")
    @app_commands.describe(
        source_server_id="ID сервера, с которого был взят бэкап.",
        backup_name="Название бэкапа, структуру которого нужно применить."
    )
    @app_commands.autocomplete(backup_name=backup_name_autocomplete)
    @app_commands.check(is_guild_owner_check)
    async def backup_clone(self, interaction: discord.Interaction, source_server_id: str, backup_name: str):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        try:
            source_id = int(source_server_id)
        except ValueError:
            await interaction.response.send_message("❌ ID исходного сервера должен быть числом.", ephemeral=True)
            return
            
        backup_data = await backup_service.load_backup_data(self.bot, source_id, backup_name)
        if not backup_data:
            await interaction.response.send_message(self.bot.translator.get("backup.server.restore_not_found", lang), ephemeral=True)
            return
            
        source_server_name = backup_data.get('guild_info', {}).get('name', 'Неизвестный сервер')
        view = ConfirmationView(
            author=interaction.user, approve_label=self.bot.translator.get("ui.button_approve", lang),
            deny_label=self.bot.translator.get("ui.button_deny", lang),
            interaction_denied_message=self.bot.translator.get("ui.interaction_denied", lang)
        )
        embed = discord.Embed(
            title=self.bot.translator.get("backup.server.clone_confirm_title", lang),
            description=self.bot.translator.get("backup.server.clone_confirm_desc", lang, target_server_name=interaction.guild.name, backup_name=backup_name, source_server_name=source_server_name),
            color=discord.Color.red()
        )
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)
        await view.wait()

        if view.result:
            await interaction.edit_original_response(content=self.bot.translator.get("backup.server.clone_started", lang), embed=None, view=None)
            result = await backup_service.apply_backup_to_guild(self.bot, interaction.guild, backup_data, restore_messages=False)
            if result['status'] == 'success':
                msg = self.bot.translator.get("backup.server.clone_success", lang)
            else:
                msg = self.bot.translator.get("backup.server.clone_failed", lang, error=result.get('message', 'Unknown error'))
            await self._send_completion_message(interaction.guild, interaction.user, msg)
        else:
            await interaction.edit_original_response(content="Операция отменена.", embed=None, view=None)

async def setup(bot: "SecurityBot"):
    await bot.add_cog(BackupCog(bot))