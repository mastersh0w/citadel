# cogs/help.py
# -*- coding: utf-8 -*-

import logging
import discord
from discord import app_commands
from discord.ext import commands
from typing import TYPE_CHECKING, Dict

from core.permissions import is_guild_owner_check
from main import translator

if TYPE_CHECKING:
    from main import SecurityBot

logger = logging.getLogger(__name__)

# --- VIEW И SELECT МЕНЮ ---
class HelpView(discord.ui.View):
    def __init__(self, bot: "SecurityBot", author_id: int):
        super().__init__(timeout=300.0)
        self.bot = bot
        self.author_id = author_id
        self.add_item(HelpSelect(bot=self.bot))
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.author_id:
            lang = await self.bot.get_guild_language(interaction.guild_id)
            # ИЗМЕНЕНО
            await interaction.response.send_message(translator.get("ui.interaction_denied", lang=lang), ephemeral=True)
            return False
        return True
    async def on_timeout(self):
        for item in self.children:
            item.disabled = True
        if self.message:
            try:
                await self.message.edit(view=self)
            except discord.NotFound: pass

class HelpSelect(discord.ui.Select):
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        t = self.bot.translator.get
        lang = self.bot.default_language
        
        # ИЗМЕНЕНО
        options = [
            discord.SelectOption(label=t("help.category_setup.label", lang=lang), value="initial_setup", emoji="👋"),
            discord.SelectOption(label=t("help.category_moderation.label", lang=lang), value="moderation", emoji="🛠️"),
            discord.SelectOption(label=t("help.category_management.label", lang=lang), value="management", emoji="⚙️"),
            discord.SelectOption(label=t("help.category_concept.label", lang=lang), value="concept", emoji="🛡️")
        ]
        super().__init__(placeholder=t("help.placeholder", lang=lang), min_values=1, max_values=1, options=options)

    async def callback(self, interaction: discord.Interaction):
        guild_lang = await self.bot.get_guild_language(interaction.guild_id)
        chosen_category = self.values[0]
        help_cog = self.bot.get_cog("Помощь")
        if not help_cog: return await interaction.response.defer()

        if chosen_category == "initial_setup":
            embed = help_cog.get_initial_setup_embed(guild_lang)
        elif chosen_category == "moderation":
            embed = help_cog.get_moderation_embed(guild_lang)
        elif chosen_category == "management":
            embed = help_cog.get_management_embed(guild_lang)
        elif chosen_category == "concept":
            embed = help_cog.get_concept_embed(guild_lang)
        else:
            return await interaction.response.defer()
        await interaction.response.edit_message(embed=embed)


# --- ОСНОВНОЙ КЛАСС КОГА ---
class HelpCog(commands.Cog, name="Помощь"):
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot

    def get_initial_setup_embed(self, lang: str) -> discord.Embed:
        t = self.bot.translator.get
        # ИЗМЕНЕНО
        description = t("help.category_setup.description", lang=lang)
        embed = discord.Embed(title=t("help.category_setup.title", lang=lang), description=description, color=discord.Color.green())
        return embed

    def get_moderation_embed(self, lang: str) -> discord.Embed:
        """Генерирует Embed для категории 'Модерация'."""
        t = self.bot.translator.get
        # ИЗМЕНЕНО
        description = t("help.category_moderation.description", lang=lang)
        embed = discord.Embed(title=t("help.category_moderation.title", lang=lang), description=description, color=discord.Color.orange())
        return embed

    def get_management_embed(self, lang: str) -> discord.Embed:
        t = self.bot.translator.get
        # ИЗМЕНЕНО
        description = t("help.category_management.description", lang=lang)
        embed = discord.Embed(title=t("help.category_management.title", lang=lang), description=description, color=discord.Color.blue())
        return embed

    def get_concept_embed(self, lang: str) -> discord.Embed:
        t = self.bot.translator.get
        # ИЗМЕНЕНО
        embed = discord.Embed(title=t("help.category_concept.title", lang=lang), description=t("help.category_concept.description", lang=lang), color=discord.Color.purple())
        return embed

    @app_commands.command(name="help", description="Показывает интерактивное справочное сообщение")
    @app_commands.check(is_guild_owner_check)
    async def help(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        # ИЗМЕНЕНО
        embed = discord.Embed(title=t("help.initial_title", lang=lang), description=t("help.initial_description", lang=lang), color=discord.Color.blurple())
        view = HelpView(bot=self.bot, author_id=interaction.user.id)
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)
        view.message = await interaction.original_response()

async def setup(bot: "SecurityBot"):
    await bot.add_cog(HelpCog(bot))