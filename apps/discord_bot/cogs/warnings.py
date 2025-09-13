# apps/discord_bot/cogs/warnings.py
# -*- coding: utf-8 -*-

import asyncio
import logging
from typing import Optional, TYPE_CHECKING
from datetime import datetime, timedelta
import discord
from discord import app_commands
from discord.ext import commands
import humanize
import re
import os

# --- ИСПРАВЛЕНИЕ ИМПОРТОВ ---
from core.ui import PaginationView
from core.services.moderation_service import add_warning, check_and_apply_auto_mute
from core.translator import Translator

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

class WarnModal(discord.ui.Modal):
    def __init__(self, translator: Translator, lang: str):
        super().__init__(title=translator.get("moderation.warn.modal_title", lang))
        
        self.reason = discord.ui.TextInput(
            label=translator.get("moderation.warn.modal_reason_label", lang),
            style=discord.TextStyle.paragraph,
            placeholder=translator.get("moderation.warn.modal_reason_placeholder", lang),
            required=False
        )
        self.add_item(self.reason)

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer()

class WarningsCog(commands.Cog, name="Предупреждения"):
    """Команды для управления системой предупреждений."""

    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        humanize.i18n.activate("ru_RU")

    warns_group = app_commands.Group(name="warns", description="Управление системой предупреждений")

    @warns_group.command(name="add", description="Выдать предупреждение участнику.")
    @app_commands.describe(member="Участник, которому нужно выдать предупреждение.")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def warns_add(self, interaction: discord.Interaction, member: discord.Member):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        modal = WarnModal(translator=self.bot.translator, lang=lang)
        await interaction.response.send_modal(modal)
        
        timed_out = await modal.wait()
        if timed_out:
            return

        reason = modal.reason.value or self.bot.translator.get("moderation.log.no_reason", lang)
        
        result = await add_warning(
            bot=self.bot,
            guild=interaction.guild,
            target_member=member,
            moderator=interaction.user,
            reason=reason
        )

        if result['status'] == 'error':
            if result['code'] == 'target_is_moderator':
                error_msg = self.bot.translator.get("moderation.warn.error_is_mod", lang)
                await interaction.followup.send(error_msg, ephemeral=True)
            else:
                error_msg = self.bot.translator.get("system.db_error", lang)
                await interaction.followup.send(error_msg, ephemeral=True)
            return

        warn_count = result['warn_count']
        warn_threshold = result['warn_threshold']

        embed = discord.Embed(
            title=self.bot.translator.get("moderation.warn.embed_title", lang),
            description=self.bot.translator.get(
                "moderation.warn.embed_description", lang, 
                member_mention=member.mention,
                moderator_mention=interaction.user.mention,
                reason=reason,
                warn_count=warn_count,
                warn_threshold=warn_threshold or "∞"
            ),
            color=discord.Color.orange()
        )
        await interaction.followup.send(embed=embed)
        
        try:
            dm_embed = discord.Embed(
                title=self.bot.translator.get("moderation.warn.dm_title", lang, guild_name=interaction.guild.name),
                description=self.bot.translator.get(
                    "moderation.warn.dm_description", lang,
                    moderator_mention=interaction.user.mention,
                    reason=reason,
                    warn_count=warn_count,
                    warn_threshold=warn_threshold or "∞"
                ),
                color=discord.Color.orange()
            )
            await member.send(embed=dm_embed)
        except discord.Forbidden:
            logger.warning(f"Не удалось отправить ЛС о варне пользователю {member.id} на сервере {interaction.guild.id}")

        if warn_threshold > 0 and warn_count >= warn_threshold:
            auto_mute_result = await check_and_apply_auto_mute(
                bot=self.bot,
                guild=interaction.guild,
                target_member=member,
                last_warn_reason=reason
            )
            
            if auto_mute_result.get('muted'):
                duration_str = auto_mute_result.get('duration_str')
                auto_mute_embed = discord.Embed(
                    title=self.bot.translator.get("moderation.warn.auto_mute_embed_title", lang),
                    description=self.bot.translator.get(
                        "moderation.warn.auto_mute_embed_description", lang,
                        member_mention=member.mention,
                        warn_count=warn_count,
                        duration=duration_str
                    ),
                    color=discord.Color.red()
                )
                await interaction.followup.send(embed=auto_mute_embed)

                try:
                    end_ts_formatted = discord.utils.format_dt(auto_mute_result['end_timestamp'], 'F')
                    auto_dm_embed = discord.Embed(
                        title=self.bot.translator.get("moderation.mute.auto_dm_title", lang, guild_name=interaction.guild.name),
                        description=self.bot.translator.get(
                            "moderation.mute.auto_dm_description", lang,
                            warn_count=warn_count,
                            reason=reason,
                            end_timestamp=end_ts_formatted,
                            owner_id=interaction.guild.owner_id
                        ),
                        color=discord.Color.red()
                    )
                    await member.send(embed=auto_dm_embed)
                except (discord.Forbidden, KeyError):
                    logger.warning(f"Не удалось отправить ЛС об авто-мьюте пользователю {member.id}")
            elif auto_mute_result['status'] != 'success':
                 logger.error(f"Ошибка при попытке авто-мьюта пользователя {member.id} на сервере {interaction.guild.id}: {auto_mute_result}")

    @warns_group.command(name="setup", description="Настроить порог и срок автоматического мьюта за предупреждения.")
    @app_commands.describe(
        count="Количество варнов для мьюта (0 чтобы отключить).",
        duration="Срок мьюта (например, 10m, 1h, 7d)."
    )
    @app_commands.checks.has_permissions(manage_guild=True)
    async def warns_setup(self, interaction: discord.Interaction, count: int, duration: str):
        lang = await self.bot.get_guild_language(interaction.guild_id)

        if count < 0:
            await interaction.response.send_message("❌ Количество предупреждений не может быть отрицательным.", ephemeral=True)
            return
        
        if count > 0:
            try:
                _parse_duration_string(duration)
            except ValueError:
                await interaction.response.send_message("❌ Неверный формат времени. Используйте `10m`, `1h`, `7d`.", ephemeral=True)
                return

        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """INSERT INTO guild_configs (guild_id, config_key, config_value) 
                       VALUES (%s, %s, %s) 
                       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)""",
                    (interaction.guild_id, 'warn_threshold', str(count))
                )
                await cursor.execute(
                    """INSERT INTO guild_configs (guild_id, config_key, config_value) 
                       VALUES (%s, %s, %s) 
                       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)""",
                    (interaction.guild_id, 'warn_mute_duration', duration)
                )
        
        await interaction.response.send_message(
            self.bot.translator.get("setup.warns.setup_success", lang, count=count, duration=duration),
            ephemeral=True
        )

    @warns_group.command(name="setup-lifetime", description="Настроить, через сколько дней предупреждения сгорают.")
    @app_commands.describe(days="Количество дней (0 - никогда не сгорают).")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def warns_setup_lifetime(self, interaction: discord.Interaction, days: int):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        if days < 0:
            await interaction.response.send_message("❌ Количество дней не может быть отрицательным.", ephemeral=True)
            return
        
        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """INSERT INTO guild_configs (guild_id, config_key, config_value) 
                       VALUES (%s, %s, %s) 
                       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)""",
                    (interaction.guild_id, 'warn_lifetime_days', str(days))
                )
        
        await interaction.response.send_message(
            self.bot.translator.get("setup.warns.lifetime_success", lang, days=days),
            ephemeral=True
        )

    @warns_group.command(name="settings", description="Показать текущие настройки системы предупреждений.")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def warns_settings(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        configs = {}
        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT config_key, config_value FROM guild_configs WHERE guild_id = %s AND config_key IN ('warn_threshold', 'warn_mute_duration', 'warn_lifetime_days')",
                    (interaction.guild_id,)
                )
                rows = await cursor.fetchall()
                configs = {row[0]: row[1] for row in rows}
        
        threshold = configs.get('warn_threshold', self.bot.translator.get("setup.warns.value_disabled", lang))
        duration = configs.get('warn_mute_duration', self.bot.translator.get("setup.warns.value_not_set", lang))
        lifetime = configs.get('warn_lifetime_days', self.bot.translator.get("setup.warns.value_not_set", lang))

        embed = discord.Embed(
            title=self.bot.translator.get("setup.warns.settings_title", lang),
            color=discord.Color.blue()
        )
        embed.add_field(
            name=self.bot.translator.get("setup.warns.field_threshold", lang),
            value=self.bot.translator.get("setup.warns.value_count", lang, count=threshold) if threshold.isdigit() else threshold,
            inline=False
        )
        embed.add_field(
            name=self.bot.translator.get("setup.warns.field_duration", lang),
            value=duration,
            inline=False
        )
        embed.add_field(
            name=self.bot.translator.get("setup.warns.field_lifetime", lang),
            value=self.bot.translator.get("setup.warns.value_days", lang, count=lifetime) if lifetime.isdigit() else lifetime,
            inline=False
        )

        await interaction.response.send_message(embed=embed, ephemeral=True)

    @warns_group.command(name="list", description="Показать все предупреждения участника.")
    @app_commands.describe(member="Участник, чьи предупреждения нужно показать.")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def warns_list(self, interaction: discord.Interaction, member: discord.Member):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT incident_id, moderator_id, reason, created_at, status FROM warnings WHERE guild_id = %s AND user_id = %s ORDER BY created_at DESC",
                    (interaction.guild_id, member.id)
                )
                warnings = await cursor.fetchall()

        if not warnings:
            await interaction.response.send_message(self.bot.translator.get("moderation.warns_list.no_warns", lang, member_mention=member.mention), ephemeral=True)
            return

        embeds = []
        for i, (incident_id, moderator_id, reason, created_at, status) in enumerate(warnings):
            mod = interaction.guild.get_member(moderator_id) or self.bot.translator.get("system.unknown_user", lang)
            timestamp = discord.utils.format_dt(created_at, 'f')
            status_text = ""
            if status == 'archived':
                status_text = self.bot.translator.get("moderation.warns_list.status_archived", lang)
            elif status == 'expired':
                status_text = self.bot.translator.get("moderation.warns_list.status_expired", lang)

            embed = discord.Embed(
                title=self.bot.translator.get("moderation.warns_list.title", lang, member_name=member.display_name),
                description=self.bot.translator.get(
                    "moderation.warns_list.entry", lang,
                    index=i + 1,
                    moderator_mention=mod.mention if isinstance(mod, discord.Member) else mod,
                    timestamp=timestamp,
                    status=status_text,
                    reason=reason
                ),
                color=discord.Color.blue()
            )
            embeds.append(embed)
        
        view = PaginationView(interaction, embeds)
        await interaction.response.send_message(embed=embeds[0], view=view)

    @warns_group.command(name="remove", description="Снять предупреждение с участника по номеру.")
    @app_commands.describe(
        member="Участник, с которого нужно снять предупреждение.",
        incident_index="Номер предупреждения (можно посмотреть в /warns list)."
    )
    @app_commands.checks.has_permissions(manage_messages=True)
    async def warns_remove(self, interaction: discord.Interaction, member: discord.Member, incident_index: int):
        lang = await self.bot.get_guild_language(interaction.guild_id)

        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id FROM warnings WHERE guild_id = %s AND user_id = %s ORDER BY created_at DESC",
                    (interaction.guild_id, member.id)
                )
                warnings_ids = [row[0] for row in await cursor.fetchall()]

        if not warnings_ids or incident_index <= 0 or incident_index > len(warnings_ids):
            await interaction.response.send_message(self.bot.translator.get("moderation.warns_remove.not_found", lang, incident_index=incident_index), ephemeral=True)
            return
        
        incident_to_remove_id = warnings_ids[incident_index - 1]
        
        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE warnings SET status = 'archived' WHERE id = %s",
                    (incident_to_remove_id,)
                )

        embed = discord.Embed(
            title=self.bot.translator.get("moderation.warns_remove.success_title", lang),
            description=self.bot.translator.get(
                "moderation.warns_remove.success_desc", lang,
                incident_index=incident_index,
                member_mention=member.mention,
                moderator_mention=interaction.user.mention
            ),
            color=discord.Color.green()
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="my-warnings", description="Показать мои предупреждения на этом сервере.")
    async def my_warnings(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        
        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT moderator_id, reason, created_at, status FROM warnings WHERE guild_id = %s AND user_id = %s ORDER BY created_at DESC",
                    (interaction.guild_id, interaction.user.id)
                )
                warnings = await cursor.fetchall()
        
        if not warnings:
            await interaction.response.send_message(self.bot.translator.get("moderation.my_warnings.no_warns", lang), ephemeral=True)
            return
            
        embeds = []
        for i, (moderator_id, reason, created_at, status) in enumerate(warnings):
            mod = interaction.guild.get_member(moderator_id) or self.bot.translator.get("system.unknown_user", lang)
            timestamp = discord.utils.format_dt(created_at, 'f')
            status_text = ""
            if status == 'archived':
                status_text = self.bot.translator.get("moderation.warns_list.status_archived", lang)
            elif status == 'expired':
                status_text = self.bot.translator.get("moderation.warns_list.status_expired", lang)

            description_text = self.bot.translator.get(
                "moderation.warns_list.entry", lang,
                index=i + 1,
                moderator_mention=mod.mention if isinstance(mod, discord.Member) else mod,
                timestamp=timestamp,
                status=status_text,
                reason=reason
            )
            embeds.append(description_text)
            
        paginator = commands.Paginator(prefix="", suffix="", max_size=1024)
        for item in embeds:
            paginator.add_line(item + "\n")
            
        response_embed = discord.Embed(
            title=self.bot.translator.get("moderation.my_warnings.title", lang),
            color=discord.Color.blue()
        )
        
        if paginator.pages:
            response_embed.description = paginator.pages[0]
            await interaction.response.send_message(embed=response_embed, ephemeral=True)
        else:
            await interaction.response.send_message(self.bot.translator.get("moderation.my_warnings.no_warns", lang), ephemeral=True)

async def setup(bot: "SecurityBot"):
    await bot.add_cog(WarningsCog(bot))