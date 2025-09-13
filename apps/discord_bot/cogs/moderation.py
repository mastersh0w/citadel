# apps/discord_bot/cogs/moderation.py
# -*- coding: utf-8 -*-

import asyncio
import logging
from datetime import timedelta
from typing import Optional, TYPE_CHECKING
import discord
from discord import app_commands
from discord.ext import commands
import re
import os

# --- ИСПРАВЛЕНИЕ ИМПОРТОВ ---
from core.ui import PaginationView
from core.services.moderation_service import timeout_member, untimeout_member

if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

def _parse_duration_string(duration_str: str) -> int:
    """
    Простая функция для парсинга строки времени (e.g., "10m", "1h", "7d").
    Возвращает количество секунд. Вызывает ValueError при ошибке.
    """
    match = re.match(r"(\d+)([smhd])", duration_str.lower())
    if not match:
        raise ValueError("Invalid duration format")
    
    value, unit = match.groups()
    value = int(value)
    
    if unit == 's': return value
    elif unit == 'm': return value * 60
    elif unit == 'h': return value * 3600
    elif unit == 'd': return value * 86400
    
    raise ValueError("Invalid time unit")


class ModerationCog(commands.Cog, name="Модерация"):
    """
    Команды для управления мьютами и другими действиями модерации.
    """

    def __init__(self, bot: "SecurityBot"):
        self.bot = bot

    @app_commands.command(name="mute", description="Изолировать участника (выдать мьют).")
    @app_commands.describe(member="Участник, которого нужно изолировать.")
    @app_commands.checks.has_permissions(moderate_members=True)
    async def mute(self, interaction: discord.Interaction, member: discord.Member):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        # --- ИСПРАВЛЕНИЕ: `translator` и `lang` нужно передавать в Modal ---
        modal = self.bot.translator.get_modal("moderation.mute.modal", lang)
        await interaction.response.send_modal(modal)
        
        timed_out = await modal.wait()
        if timed_out: return

        duration_str = modal.duration.value
        reason = modal.reason.value or self.bot.translator.get("moderation.log.no_reason", lang)
        
        try:
            max_duration = timedelta(days=28)
            if duration_str:
                duration_seconds = _parse_duration_string(duration_str)
                duration_delta = timedelta(seconds=duration_seconds)

                if duration_delta > max_duration:
                    msg = self.bot.translator.get("moderation.mute.error_max_duration", lang)
                    await interaction.followup.send(msg, ephemeral=True)
                    return
            else:
                duration_delta = max_duration
        except ValueError:
            await interaction.followup.send("❌ Неверный формат времени. Используйте `10m`, `1h`, `7d`.", ephemeral=True)
            return

        result = await timeout_member(
            bot=self.bot,
            target_member=member,
            moderator=interaction.user,
            duration=duration_delta,
            reason=reason
        )
        
        if result['status'] == 'error':
            error_code = result['code']
            error_message = ""
            if error_code == 'cannot_mute_self':
                error_message = self.bot.translator.get("moderation.mute.error_self", lang)
            elif error_code == 'cannot_mute_bot':
                error_message = self.bot.translator.get("moderation.mute.error_bot", lang)
            elif error_code == 'target_is_admin':
                error_message = self.bot.translator.get("moderation.mute.error_admin", lang)
            elif error_code == 'hierarchy_error':
                error_message = self.bot.translator.get("moderation.mute.error_hierarchy", lang)
            elif error_code == 'already_muted':
                end_ts = discord.utils.format_dt(result['end_timestamp'], 'R') if result['end_timestamp'] else "N/A"
                mod = interaction.guild.get_member(result['moderator_id'])
                mod_mention = mod.mention if mod else self.bot.translator.get("system.unknown_user", lang)
                
                embed = discord.Embed(
                    title=self.bot.translator.get("moderation.mute.error_already_muted_title", lang),
                    description=self.bot.translator.get(
                        "moderation.mute.error_already_muted_description", lang,
                        member_mention=member.mention, moderator_mention=mod_mention,
                        reason=result['reason'], end_timestamp=end_ts
                    ),
                    color=discord.Color.orange()
                )
                await interaction.followup.send(embed=embed, ephemeral=True)
                return
            else:
                error_message = self.bot.translator.get("system.db_error", lang)
            
            await interaction.followup.send(error_message, ephemeral=True)
            return

        end_timestamp = result['end_timestamp']
        end_ts_formatted = discord.utils.format_dt(end_timestamp, 'F')
        
        embed = discord.Embed(
            title=self.bot.translator.get("moderation.mute.embed_title", lang),
            description=self.bot.translator.get(
                "moderation.mute.embed_description", lang,
                member_mention=member.mention, moderator_mention=interaction.user.mention,
                reason=reason, end_timestamp=end_ts_formatted
            ),
            color=discord.Color.green()
        )
        await interaction.followup.send(embed=embed)

        try:
            dm_embed = discord.Embed(
                title=self.bot.translator.get("moderation.mute.dm_title", lang, guild_name=interaction.guild.name),
                description=self.bot.translator.get(
                    "moderation.mute.dm_description", lang,
                    moderator_mention=interaction.user.mention, reason=reason,
                    end_timestamp=end_ts_formatted, owner_id=interaction.guild.owner_id
                ),
                color=discord.Color.red()
            )
            await member.send(embed=dm_embed)
        except discord.Forbidden:
            logger.warning(f"Не удалось отправить ЛС о мьюте пользователю {member.id}")

    @app_commands.command(name="unmute", description="Снять изоляцию с участника.")
    @app_commands.describe(member="Участник, с которого нужно снять изоляцию.")
    @app_commands.checks.has_permissions(moderate_members=True)
    async def unmute(self, interaction: discord.Interaction, member: discord.Member):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        result = await untimeout_member(
            bot=self.bot,
            target_member=member,
            moderator=interaction.user
        )

        if result['status'] == 'error':
            error_code = result['code']
            error_message = ""
            if error_code == 'not_muted':
                error_message = self.bot.translator.get("moderation.unmute.error_not_muted", lang, member_mention=member.mention)
            elif error_code == 'hierarchy_error':
                error_message = self.bot.translator.get("moderation.mute.error_hierarchy", lang)
            else:
                error_message = self.bot.translator.get("system.db_error", lang)
            
            await interaction.response.send_message(error_message, ephemeral=True)
            return

        embed = discord.Embed(
            title=self.bot.translator.get("moderation.unmute.embed_title", lang),
            description=self.bot.translator.get(
                "moderation.unmute.embed_description", lang,
                member_mention=member.mention, moderator_mention=interaction.user.mention
            ),
            color=discord.Color.green()
        )
        await interaction.response.send_message(embed=embed)
        
        try:
            dm_embed = discord.Embed(
                title=self.bot.translator.get("moderation.unmute.dm_title", lang, guild_name=interaction.guild.name),
                description=self.bot.translator.get("moderation.unmute.dm_description", lang),
                color=discord.Color.green()
            )
            await member.send(embed=dm_embed)
        except discord.Forbidden:
            logger.warning(f"Не удалось отправить ЛС о размьюте пользователю {member.id}")

    @app_commands.command(name="muted", description="Показать список участников в изоляции.")
    @app_commands.checks.has_permissions(moderate_members=True)
    async def muted(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT user_id, moderator_id, reason, end_timestamp FROM mutes WHERE guild_id = %s AND status = 'active' ORDER BY created_at DESC",
                    (interaction.guild_id,)
                )
                muted_users = await cursor.fetchall()

        if not muted_users:
            await interaction.response.send_message(self.bot.translator.get("moderation.muted_list.empty", lang), ephemeral=True)
            return
            
        entries = []
        for i, (user_id, moderator_id, reason, end_timestamp) in enumerate(muted_users):
            member = interaction.guild.get_member(user_id)
            moderator = interaction.guild.get_member(moderator_id)
            
            entry_text = self.bot.translator.get(
                "moderation.muted_list.entry", lang,
                index=i + 1,
                member_mention=member.mention if member else f"`{user_id}`",
                moderator_mention=moderator.mention if moderator else self.bot.translator.get("system.unknown_user", lang),
                reason=reason,
                end_timestamp=discord.utils.format_dt(end_timestamp, 'R')
            )
            entries.append(entry_text)
            
        limit = int(os.getenv("PAGINATION_LIMIT", 20))
        embeds = []
        for i in range(0, len(entries), limit):
            chunk = entries[i:i+limit]
            embed = discord.Embed(
                title=self.bot.translator.get("moderation.muted_list.title", lang),
                description="\n\n".join(chunk),
                color=discord.Color.blue()
            )
            embeds.append(embed)
            
        view = PaginationView(interaction, embeds) # Исправлено
        await interaction.response.send_message(embed=embeds[0], view=view)

async def setup(bot: "SecurityBot"):
    await bot.add_cog(ModerationCog(bot))