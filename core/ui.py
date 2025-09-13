# core/ui.py
# -*- coding: utf-8 -*-

import logging
import json
import discord
from typing import Optional, List, TYPE_CHECKING
import math

# --- ИСПРАВЛЕНИЕ ИМПОРТА ---
if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

# =========================================================================================
# >> УНИВЕРСАЛЬНЫЙ VIEW ДЛЯ ПОДТВЕРЖДЕНИЯ (ДА/НЕТ)
# =========================================================================================
class ConfirmationView(discord.ui.View):
    """
    Класс для простого да/нет подтверждения.
    Он полностью универсален, так как все тексты передаются ему при создании.
    """
    def __init__(self, *, author: discord.User, timeout: float = 3600.0,
                 approve_label: str, deny_label: str, interaction_denied_message: str):
        super().__init__(timeout=timeout)
        self.author = author
        self.result: Optional[bool] = None
        self.interaction: Optional[discord.Interaction] = None
        self.interaction_denied_message = interaction_denied_message

        approve_button = discord.ui.Button(label=approve_label, style=discord.ButtonStyle.green, emoji="✅")
        deny_button = discord.ui.Button(label=deny_label, style=discord.ButtonStyle.red, emoji="❌")
        
        approve_button.callback = self.approve_callback
        deny_button.callback = self.deny_callback

        self.add_item(approve_button)
        self.add_item(deny_button)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        """Проверяет, что с кнопкой взаимодействует именно тот, кому она предназначена."""
        if interaction.user.id != self.author.id:
            await interaction.response.send_message(self.interaction_denied_message, ephemeral=True)
            return False
        return True

    async def on_timeout(self):
        """Вызывается, если владелец не нажал кнопку в течение заданного времени."""
        self.result = False
        self.stop()

    async def approve_callback(self, interaction: discord.Interaction):
        """Коллбэк для кнопки 'Одобрить'."""
        self.result = True
        self.interaction = interaction
        for item in self.children:
            item.disabled = True
        await interaction.response.edit_message(view=self)
        self.stop()

    async def deny_callback(self, interaction: discord.Interaction):
        """Коллбэк для кнопки 'Отклонить'."""
        self.result = False
        self.interaction = interaction
        for item in self.children:
            item.disabled = True
        await interaction.response.edit_message(view=self)
        self.stop()

# =========================================================================================
# >> VIEW ДЛЯ УДАЛЕНИЯ БОТОВ ИЗ БЕЛОГО СПИСКА
# =========================================================================================
class BotRemoveView(discord.ui.View):
    """
    View для интерактивного удаления ботов из белого списка через команду /botlist list.
    """
    def __init__(self, bot_options: List[discord.SelectOption], bot_instance: "SecurityBot", guild_id: int):
        super().__init__(timeout=300.0)
        self.bot = bot_instance
        self.guild_id = guild_id
        
        lang = self.bot.language_cache.get(guild_id, self.bot.default_language)
        t = self.bot.translator.get
        
        self.select_menu = discord.ui.Select(
            placeholder=t("management.botlist.select_placeholder", lang=lang), 
            options=bot_options,
            min_values=1, max_values=len(bot_options) if bot_options else 1
        )
        self.remove_button = discord.ui.Button(
            label=t("management.botlist.button_label", lang=lang), 
            style=discord.ButtonStyle.red, emoji="🗑️", disabled=True
        )

        self.select_menu.callback = self.select_callback
        self.remove_button.callback = self.button_callback

        self.add_item(self.select_menu)
        self.add_item(self.remove_button)

    async def select_callback(self, interaction: discord.Interaction):
        self.remove_button.disabled = not self.select_menu.values
        await interaction.response.edit_message(view=self)

    async def button_callback(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(self.guild_id)
        t = self.bot.translator.get

        if not self.select_menu.values:
            await interaction.response.send_message(t("management.botlist.remove_nothing_selected", lang=lang), ephemeral=True)
            return
            
        await interaction.response.defer()
        removed_bots_info = []
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    bot_ids_to_remove = [int(bot_id) for bot_id in self.select_menu.values]
                    placeholders = ', '.join(['%s'] * len(bot_ids_to_remove))
                    sql_query = f"DELETE FROM allowed_bots WHERE guild_id = %s AND bot_id IN ({placeholders})"
                    await cursor.execute(sql_query, (interaction.guild.id, *bot_ids_to_remove))
                    
            for bot_id_str in self.select_menu.values:
                option = next((opt for opt in self.select_menu.options if opt.value == bot_id_str), None)
                if option: 
                    removed_bots_info.append(f"• **{option.label}** (`{bot_id_str}`)")
                    
            description = "\n".join(removed_bots_info)
            new_embed = discord.Embed(
                title=t("management.botlist.remove_multi_success", lang=lang), 
                description=description, 
                color=discord.Color.green()
            )
            await interaction.edit_original_response(embed=new_embed, view=None)
        except Exception as e:
            logger.error(f"Ошибка при массовом удалении ботов: {e}", exc_info=True)
            await interaction.edit_original_response(content=t("system.db_error", lang=lang), view=None)


# =========================================================================================
# >> VIEW ДЛЯ ПАНЕЛИ УПРАВЛЕНИЯ КАРАНТИНОМ
# =========================================================================================
class QuarantineListActionView(discord.ui.View):
    """
    View для команды /quarantine list, позволяющий управлять пользователями в карантине.
    """
    def __init__(self, user_options: List[discord.SelectOption], bot_instance: "SecurityBot", guild_id: int):
        super().__init__(timeout=300.0)
        self.bot = bot_instance
        self.guild_id = guild_id
        
        lang = self.bot.language_cache.get(guild_id, self.bot.default_language)
        t = self.bot.translator.get

        self.select_menu = discord.ui.Select(
            placeholder=t("management.quarantine.select_placeholder", lang=lang),
            options=user_options, min_values=1, max_values=1
        )
        self.select_menu.callback = self.select_callback
        self.add_item(self.select_menu)

        self.restore_button = discord.ui.Button(label=t("ui.button_restore_roles", lang=lang), style=discord.ButtonStyle.success, emoji="✅", disabled=True, row=1)
        self.ban_button = discord.ui.Button(label=t("ui.button_ban_user", lang=lang), style=discord.ButtonStyle.danger, emoji="🔨", disabled=True, row=1)
        self.keep_button = discord.ui.Button(label=t("ui.button_close", lang=lang), style=discord.ButtonStyle.secondary, emoji="✖️", disabled=True, row=1)

        self.restore_button.callback = self.restore_callback
        self.ban_button.callback = self.ban_callback
        self.keep_button.callback = self.keep_callback

        self.add_item(self.restore_button)
        self.add_item(self.ban_button)
        self.add_item(self.keep_button)

    async def select_callback(self, interaction: discord.Interaction):
        self.restore_button.disabled = False
        self.ban_button.disabled = False
        self.keep_button.disabled = False
        await interaction.response.edit_message(view=self)

    async def _disable_all_items(self):
        for item in self.children:
            item.disabled = True

    async def restore_callback(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(self.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer()
        target_user_id = int(self.select_menu.values[0])
        guild = interaction.guild
        member = guild.get_member(target_user_id)

        if not member:
            await interaction.edit_original_response(content=t("management.quarantine.no_user_found", lang=lang, user_id=target_user_id), view=None, embed=None)
            return

        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT roles_json FROM quarantined_users WHERE user_id = %s AND guild_id = %s", (target_user_id, guild.id))
                    result = await cursor.fetchone()
                    if not result:
                        await interaction.edit_original_response(content=t("management.quarantine.action_already_taken", lang=lang), view=None, embed=None)
                        return

                    roles_json = result[0]
                    role_ids = json.loads(roles_json)
                    roles_to_add = [guild.get_role(rid) for rid in role_ids if guild.get_role(rid) is not None]
                    await member.edit(roles=roles_to_add, reason="Вывод из карантина по команде Владельца")
                    await cursor.execute("DELETE FROM quarantined_users WHERE user_id = %s AND guild_id = %s", (target_user_id, guild.id))
            
            new_embed = discord.Embed(title=t("security.embed_titles.roles_restored", lang=lang), description=t("management.quarantine.unquarantine_success", lang=lang, user_mention=member.mention), color=discord.Color.green())
            await self._disable_all_items()
            await interaction.edit_original_response(embed=new_embed, view=self)
            logging.getLogger('bot.info').info(t("management.quarantine.unquarantine_success", lang=lang, user_mention=member.mention))
        except Exception as e:
            logger.error(f"Не удалось вывести из карантина {target_user_id}: {e}", exc_info=True)
            await interaction.edit_original_response(content=t("system.db_error", lang=lang), view=None, embed=None)

    async def ban_callback(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(self.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer()
        target_user_id = int(self.select_menu.values[0])
        guild = interaction.guild
        user_mention = f"<@{target_user_id}>"
        target_user = discord.Object(id=target_user_id)

        try:
            await guild.ban(target_user, reason="Решение Владельца из панели управления карантином")
            new_embed = discord.Embed(title=t("security.embed_titles.user_banned", lang=lang), description=t("security.confirm.quarantine.ban_log", lang=lang, user_mention=user_mention), color=discord.Color.dark_red())
            await self._disable_all_items()
            await interaction.edit_original_response(embed=new_embed, view=self)
            logging.getLogger('bot.info').info(t("security.confirm.quarantine.ban_log", lang=lang, user_mention=user_mention))
        except Exception as e:
            logger.error(f"Не удалось забанить {target_user_id} из панели карантина: {e}", exc_info=True)
            await interaction.edit_original_response(content=f"Не удалось забанить пользователя: {e}", view=None, embed=None)

    async def keep_callback(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(self.guild_id)
        t = self.bot.translator.get

        await interaction.response.defer()
        await self._disable_all_items()
        new_embed = interaction.message.embeds[0]
        new_embed.set_footer(text=t("security.action_cancelled_footer", lang=lang))
        await interaction.edit_original_response(embed=new_embed, view=self)

# =========================================================================================
# >> VIEW ДЛЯ УВЕДОМЛЕНИЯ ВЛАДЕЛЬЦУ ПРИ АТАКЕ
# =========================================================================================
class QuarantineActionView(discord.ui.View):
    """
    View для принятия решения по пользователю в карантине (отправляется в ЛС владельцу).
    """
    def __init__(self, author: discord.User, bot_instance: "SecurityBot", target_user_id: int, guild_id: int):
        super().__init__(timeout=86400.0)
        self.author = author
        self.bot = bot_instance
        self.target_user_id = target_user_id
        self.guild_id = guild_id
        self.interaction: Optional[discord.Interaction] = None
        
        lang = self.bot.default_language
        t = self.bot.translator.get
        
        self.ban_button = discord.ui.Button(label=t("ui.button_ban_user", lang=lang), style=discord.ButtonStyle.danger, emoji="🔨")
        self.restore_button = discord.ui.Button(label=t("ui.button_restore_roles", lang=lang), style=discord.ButtonStyle.success, emoji="✅")
        self.keep_button = discord.ui.Button(label=t("ui.button_keep_quarantined", lang=lang), style=discord.ButtonStyle.secondary, emoji="🗣️")
        
        self.ban_button.callback = self.ban_callback
        self.restore_button.callback = self.restore_callback
        self.keep_button.callback = self.keep_callback

        self.add_item(self.ban_button)
        self.add_item(self.restore_button)
        self.add_item(self.keep_button)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.author.id:
            await interaction.response.send_message("Вы не можете использовать эти кнопки.", ephemeral=True)
            return False
        return True

    async def _disable_all_and_stop(self):
        for item in self.children: item.disabled = True
        if self.interaction:
            try:
                await self.interaction.message.edit(view=self)
            except discord.HTTPException: pass
        self.stop()
        
    async def ban_callback(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(self.guild_id)
        t = self.bot.translator.get
        
        self.interaction = interaction
        await interaction.response.defer(ephemeral=True)
        guild = self.bot.get_guild(self.guild_id)
        if not guild:
            await interaction.followup.send("Не удалось найти сервер.", ephemeral=True)
            return
        target_user = discord.Object(id=self.target_user_id)
        try:
            await guild.ban(target_user, reason="Решение Владельца после инцидента безопасности")
            await interaction.followup.send(t("security.confirm.quarantine.ban_log", lang=lang, user_mention=f"<@{self.target_user_id}>"), ephemeral=True)
            logging.getLogger('bot.info').info(t("security.confirm.quarantine.ban_log", lang=lang, user_mention=f"<@{self.target_user_id}>"))
        except Exception as e:
            await interaction.followup.send(f"Не удалось забанить пользователя: {e}", ephemeral=True)
            logger.error(f"Не удалось забанить пользователя {self.target_user_id}: {e}", exc_info=True)
        await self._disable_all_and_stop()

    async def restore_callback(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(self.guild_id)
        t = self.bot.translator.get
        
        self.interaction = interaction
        await interaction.response.defer(ephemeral=True)
        guild = self.bot.get_guild(self.guild_id)
        if not guild:
            await interaction.followup.send("Не удалось найти сервер.", ephemeral=True)
            return
        member = guild.get_member(self.target_user_id)
        if not member:
            await interaction.followup.send("Пользователь не найден на сервере.", ephemeral=True)
            await self._disable_all_and_stop()
            return
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT roles_json FROM quarantined_users WHERE user_id = %s AND guild_id = %s", (self.target_user_id, guild.id))
                    result = await cursor.fetchone()
                    if not result:
                        await interaction.followup.send(t("management.quarantine.action_already_taken", lang=lang), ephemeral=True)
                        await self._disable_all_and_stop()
                        return
                    roles_json = result[0]
                    role_ids = json.loads(roles_json)
                    roles_to_add = [guild.get_role(rid) for rid in role_ids if guild.get_role(rid) is not None]
                    await member.edit(roles=roles_to_add, reason="Восстановление ролей по решению Владельца")
                    await cursor.execute("DELETE FROM quarantined_users WHERE user_id = %s AND guild_id = %s", (self.target_user_id, guild.id))
            await interaction.followup.send(t("security.confirm.quarantine.restore_log", lang=lang, user_mention=member.mention), ephemeral=True)
            logging.getLogger('bot.info').info(t("security.confirm.quarantine.restore_log", lang=lang, user_mention=member.mention))
        except Exception as e:
            await interaction.followup.send(f"Не удалось восстановить роли: {e}", ephemeral=True)
            logger.error(f"Не удалось восстановить роли для {self.target_user_id}: {e}", exc_info=True)
        await self._disable_all_and_stop()
        
    async def keep_callback(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(self.guild_id)
        t = self.bot.translator.get
        
        self.interaction = interaction
        await interaction.response.defer(ephemeral=True)
        await interaction.followup.send(t("security.confirm.quarantine.keep_log", lang=lang, user_mention=f"<@{self.target_user_id}>"), ephemeral=True)
        logging.getLogger('bot.info').info(t("security.confirm.quarantine.keep_log", lang=lang, user_mention=f"<@{self.target_user_id}>"))
        await self._disable_all_and_stop()

# =========================================================================================
# >> УНИВЕРСАЛЬНЫЙ VIEW ДЛЯ ПАГИНАЦИИ
# =========================================================================================
class PaginationView(discord.ui.View):
    """
    Универсальный View для пагинации списка данных в Embed-сообщении.
    """
    def __init__(self, interaction: discord.Interaction, full_data_list: List[str], items_per_page: int, bot_instance: "SecurityBot", lang: str, embed_title: str, separator: str = "\n\n"):
        super().__init__(timeout=300.0)
        self.interaction = interaction
        self.full_data_list = full_data_list
        self.items_per_page = items_per_page
        self.bot = bot_instance
        self.t = self.bot.translator.get
        self.lang = lang
        self.embed_title = embed_title
        self.separator = separator
        
        self.current_page = 0
        self.total_pages = math.ceil(len(self.full_data_list) / self.items_per_page)

        self.prev_button = discord.ui.Button(label=self.t("ui.button_previous", lang=self.lang), style=discord.ButtonStyle.secondary, emoji="⬅️", disabled=True)
        self.next_button = discord.ui.Button(label=self.t("ui.button_next", lang=self.lang), style=discord.ButtonStyle.secondary, emoji="➡️")
        self.page_indicator = discord.ui.Button(style=discord.ButtonStyle.primary, disabled=True)

        self.prev_button.callback = self.prev_page
        self.next_button.callback = self.next_page

        self.add_item(self.prev_button)
        self.add_item(self.page_indicator)
        self.add_item(self.next_button)

        self.update_buttons()

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.interaction.user.id:
            await interaction.response.send_message(self.t("ui.interaction_denied", lang=self.lang), ephemeral=True)
            return False
        return True
    
    def update_buttons(self):
        self.prev_button.disabled = self.current_page == 0
        self.next_button.disabled = self.current_page >= self.total_pages - 1
        self.page_indicator.label = self.t("ui.pagination_page_indicator", lang=self.lang, current=self.current_page + 1, total=self.total_pages)

    def create_page_embed(self) -> discord.Embed:
        start_index = self.current_page * self.items_per_page
        end_index = start_index + self.items_per_page
        
        page_data = self.full_data_list[start_index:end_index]
        
        embed = discord.Embed(
            title=self.embed_title,
            description=self.separator.join(page_data),
            color=discord.Color.orange()
        )
        return embed

    async def prev_page(self, interaction: discord.Interaction):
        if self.current_page > 0:
            self.current_page -= 1
            self.update_buttons()
            embed = self.create_page_embed()
            await interaction.response.edit_message(embed=embed, view=self)

    async def next_page(self, interaction: discord.Interaction):
        if self.current_page < self.total_pages - 1:
            self.current_page += 1
            self.update_buttons()
            embed = self.create_page_embed()
            await interaction.response.edit_message(embed=embed, view=self)