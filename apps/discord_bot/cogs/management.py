# apps/discord_bot/cogs/management.py
# -*- coding: utf-8 -*-

import logging
from typing import Optional, TYPE_CHECKING
import discord
from discord import app_commands
from discord.ext import commands

# --- ИЗМЕНЕНИЕ ИМПОРТОВ ---
# Импортируем проверку прав из общей папки core
from core.permissions import is_guild_owner_check
# Импортируем наши сервисы из общей папки core/services
from core.services import security_service, management_service

# Этот импорт показывает, что мы должны будем перенести ui.py в общую папку core
# Если ты уже это сделал, он будет работать. Если нет, мы сделаем это на следующем шаге.
from core.ui import PaginationView

# Указываем полный путь к нашему главному классу бота для type hinting
if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

# Класс QuarantineListActionView мы оставляем здесь, так как он очень специфичен
# для команды /quarantine list и вряд ли будет переиспользован где-то еще.
# Разделение логики и представления уже достигнуто тем, что коллбэки кнопок
# вызывают функции из сервисного слоя.
class QuarantineListActionView(discord.ui.View):
    def __init__(self, bot: "SecurityBot", author_id: int, user_options: list, lang: str):
        super().__init__(timeout=300.0)
        self.bot = bot
        self.author_id = author_id
        self.lang = lang
        t = self.bot.translator.get

        self.select_menu = discord.ui.Select(
            placeholder=t("management.quarantine.select_placeholder", lang=lang),
            options=user_options, min_values=1, max_values=1
        )
        self.select_menu.callback = self.select_callback
        self.add_item(self.select_menu)

        self.restore_button = discord.ui.Button(label=t("ui.button_restore_roles", lang=lang), style=discord.ButtonStyle.success, emoji="✅", disabled=True)
        self.ban_button = discord.ui.Button(label=t("ui.button_ban_user", lang=lang), style=discord.ButtonStyle.danger, emoji="🔨", disabled=True)
        self.keep_button = discord.ui.Button(label=t("ui.button_close", lang=lang), style=discord.ButtonStyle.secondary, emoji="✖️", disabled=True)

        self.restore_button.callback = self.restore_callback
        self.ban_button.callback = self.ban_callback
        self.keep_button.callback = self.keep_callback

        self.add_item(self.restore_button)
        self.add_item(self.ban_button)
        self.add_item(self.keep_button)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        return interaction.user.id == self.author_id

    async def select_callback(self, interaction: discord.Interaction):
        self.restore_button.disabled = False
        self.ban_button.disabled = False
        self.keep_button.disabled = False
        await interaction.response.edit_message(view=self)

    async def _handle_action(self, interaction: discord.Interaction, action_type: str):
        await interaction.response.defer()
        t = self.bot.translator.get
        target_user_id = int(self.select_menu.values[0])
        user_mention = f"<@{target_user_id}>"
        
        result = {}
        if action_type == 'restore':
            result = await security_service.unquarantine_user(self.bot, interaction.guild, target_user_id, f"Решение Владельца ({interaction.user})")
        elif action_type == 'ban':
            result = await security_service.ban_quarantined_user(self.bot, interaction.guild, target_user_id, f"Решение Владельца ({interaction.user})")
        
        if result.get('status') == 'success':
            title_key = "security.embed_titles.roles_restored" if action_type == 'restore' else "security.embed_titles.user_banned"
            desc_key = "management.quarantine.unquarantine_success" if action_type == 'restore' else "security.confirm.quarantine.ban_log"
            color = discord.Color.green() if action_type == 'restore' else discord.Color.dark_red()
            
            new_embed = discord.Embed(
                title=t(title_key, lang=self.lang),
                description=t(desc_key, lang=self.lang, user_mention=user_mention),
                color=color
            )
            for item in self.children: item.disabled = True
            await interaction.edit_original_response(embed=new_embed, view=self)
        else:
            await interaction.edit_original_response(content=t("system.db_error", lang=self.lang), embed=None, view=None)

    async def restore_callback(self, interaction: discord.Interaction):
        await self._handle_action(interaction, 'restore')

    async def ban_callback(self, interaction: discord.Interaction):
        await self._handle_action(interaction, 'ban')

    async def keep_callback(self, interaction: discord.Interaction):
        await interaction.response.defer()
        for item in self.children: item.disabled = True
        await interaction.edit_original_response(view=self)

class ManagementCog(commands.Cog, name="Управление"):
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot

    quarantine_group = app_commands.Group(name="quarantine", description="Управление пользователями в карантине.")
    botlist_group = app_commands.Group(name="botlist", description="Управление белым списком ботов.")

    @quarantine_group.command(name="list", description="Показать список пользователей в карантине.")
    @app_commands.check(is_guild_owner_check)
    async def quarantine_list(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get

        quarantined_users = await security_service.get_quarantined_users(self.bot, interaction.guild_id)

        if not quarantined_users:
            await interaction.response.send_message(t("management.quarantine.list_empty", lang=lang), ephemeral=True)
            return

        embed = discord.Embed(
            title=t("management.quarantine.list_title", lang=lang, guild_name=interaction.guild.name),
            color=discord.Color.orange()
        )
        
        user_options = []
        description_lines = []
        for user_data in quarantined_users:
            user_id = user_data['user_id']
            user = interaction.guild.get_member(user_id)
            user_mention = user.mention if user else f"`{user_id}`"
            user_display = user.display_name if user else t("system.unknown_user", lang)
            
            timestamp = discord.utils.format_dt(user_data['quarantined_at'], 'R')
            description_lines.append(t("management.quarantine.list_entry", lang=lang, user_mention=user_mention, user_id=user_id, timestamp=timestamp))
            user_options.append(discord.SelectOption(label=user_display, value=str(user_id)))

        embed.description = "\n".join(description_lines)
        view = QuarantineListActionView(self.bot, interaction.user.id, user_options, lang)
        
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

    @quarantine_group.command(name="add", description="Вручную поместить пользователя в карантин.")
    @app_commands.describe(member="Пользователь, которого нужно поместить в карантин.", reason="Причина (будет видна в логах и уведомлениях).")
    @app_commands.check(is_guild_owner_check)
    async def quarantine_add(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        await interaction.response.defer(ephemeral=True)

        result = await security_service.quarantine_user(self.bot, member, reason)

        if result['status'] == 'success':
            await interaction.followup.send(f"✅ Пользователь {member.mention} успешно помещен в карантин.", ephemeral=True)
        else:
            error_code = result.get('code', 'unknown_error')
            error_message = f"❌ Не удалось поместить пользователя в карантин. Ошибка: `{error_code}`"
            await interaction.followup.send(error_message, ephemeral=True)

    @botlist_group.command(name="add", description="Добавить доверенного бота в белый список.")
    @app_commands.describe(bot="Бот, которого нужно добавить.")
    @app_commands.check(is_guild_owner_check)
    async def botlist_add(self, interaction: discord.Interaction, bot: discord.User):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get

        if not bot.bot:
            await interaction.response.send_message(t("management.botlist.add_is_not_a_bot", lang=lang, user_name=bot.display_name, bot_id=bot.id), ephemeral=True)
            return

        result = await management_service.add_bot_to_whitelist(self.bot, interaction.guild_id, bot.id)
        
        if result['status'] == 'success':
            await interaction.response.send_message(t("management.botlist.add_success", lang=lang, user_name=bot.display_name, bot_id=bot.id), ephemeral=True)
        else:
            await interaction.response.send_message(t("system.db_error", lang=lang), ephemeral=True)

    @botlist_group.command(name="remove", description="Удалить бота из белого списка.")
    @app_commands.describe(bot="Бот, которого нужно удалить.")
    @app_commands.check(is_guild_owner_check)
    async def botlist_remove(self, interaction: discord.Interaction, bot: discord.User):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        result = await management_service.remove_bot_from_whitelist(self.bot, interaction.guild_id, bot.id)

        if result['status'] == 'success':
            await interaction.response.send_message(t("management.botlist.remove_success", lang=lang, bot_id=bot.id), ephemeral=True)
        else:
            await interaction.response.send_message(t("system.db_error", lang=lang), ephemeral=True)

    @botlist_group.command(name="list", description="Показать всех ботов в белом списке.")
    @app_commands.check(is_guild_owner_check)
    async def botlist_list(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        bot_ids = await management_service.get_whitelisted_bots(self.bot, interaction.guild_id)
        
        if not bot_ids:
            await interaction.response.send_message(t("management.botlist.list_empty", lang=lang), ephemeral=True)
            return
            
        description_lines = []
        for bot_id in bot_ids:
            try:
                user = self.bot.get_user(bot_id) or await self.bot.fetch_user(bot_id)
                description_lines.append(f"• {user.mention} (`{user.id}`)")
            except discord.NotFound:
                description_lines.append(f"• Неизвестный бот (`{bot_id}`)")
            
        embed = discord.Embed(
            title=t("management.botlist.list_title", lang=lang, guild_name=interaction.guild.name),
            description="\n".join(description_lines),
            color=discord.Color.blue()
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot: "SecurityBot"):
    await bot.add_cog(ManagementCog(bot))