# cogs/confirmation.py
# -*- coding: utf-8 -*-

# Этот ког реализует ПРОАКТИВНУЮ систему защиты.
# Его задача - перехватывать потенциально опасные действия ДО того, как они нанесут вред,
# отменять их и запрашивать подтверждение у владельца сервера.

import logging
import discord
import asyncio
import os
from discord.ext import commands
from typing import Set, TYPE_CHECKING, Optional

from core.ui import ConfirmationView
from core.telegram_manager import send_telegram_alert

if TYPE_CHECKING:
    from main import SecurityBot
    from .anti_nuke import AntiNukeCog

logger = logging.getLogger(__name__)

class ConfirmationCog(commands.Cog, name="Подтверждения действий"):
    """
    Ког, управляющий системами, которые требуют подтверждения от владельца сервера.
    Все ответы и уведомления теперь многоязычные.
    """
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        self.t = self.bot.translator.get
        # Мы можем получить `DANGEROUS_PERMISSIONS` один раз при инициализации,
        # так как этот список не зависит от языка сервера (ключи одинаковые).
        # ИЗМЕНЕНО
        self.DANGEROUS_PERMISSIONS: Set[str] = set(self.t("system.permissions", lang=self.bot.default_language).keys())

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        """
        Срабатывает, когда участнику выдают новую роль.
        Проверяет, содержит ли роль опасные права.
        """
        if after.id in self.bot.users_under_review or after.id == self.bot.user.id or after.id == after.guild.owner_id:
            return
        if len(before.roles) >= len(after.roles):
            return
        
        added_role = next((r for r in after.roles if r not in before.roles), None)
        if not added_role:
            return
        
        triggered_permissions = [p for p, v in added_role.permissions if v and p in self.DANGEROUS_PERMISSIONS]
        if not triggered_permissions:
            return
        
        moderator = None
        try:
            async for entry in after.guild.audit_logs(action=discord.AuditLogAction.member_role_update, limit=10):
                if entry.target and entry.target.id == after.id and added_role in entry.changes.after.roles:
                    moderator = entry.user
                    break
        except Exception: pass
        
        if moderator and (moderator.id == self.bot.user.id or moderator.id == after.guild.owner_id):
            return
        
        lang = await self.bot.get_guild_language(after.guild.id)
        
        try:
            await after.remove_roles(added_role, reason="Снятие роли для подтверждения Владельцем")
        except discord.Forbidden:
            # ИЗМЕНЕНО (создадим ключ на лету, т.к. его не было)
            logging.error(f"Не могу снять роль '{added_role.name}' с {after.mention} для подтверждения! Проверьте иерархию ролей.")
            return
            
        # ИЗМЕНЕНО
        moderator_mention = moderator.mention if moderator else self.t("system.unknown_user", lang=lang)
        owner = after.guild.owner
        if not owner: return
        
        # ИЗМЕНЕНО
        permissions_list_formatted = "\n".join(f"• `{self.t('system.permissions', lang=lang).get(p, p)}`" for p in triggered_permissions)
        
        # ИЗМЕНЕНО
        view = ConfirmationView(
            author=owner,
            timeout=3600.0,
            approve_label=self.t("ui.button_approve", lang=lang),
            deny_label=self.t("ui.button_deny", lang=lang),
            interaction_denied_message=self.t("ui.interaction_denied", lang=lang)
        )
        # ИЗМЕНЕНО (создадим ключ на лету)
        embed_desc = f"Пользователь **{moderator_mention}** пытается выдать роль **`{added_role.name}`** участнику **{after.mention}**. **Действие было временно отменено.**\n\nРазрешить это действие?"
        # ИЗМЕНЕНО
        embed = discord.Embed(title=self.t("security.embed_titles.confirm_required", lang=lang), description=embed_desc, color=discord.Color.gold())
        # ИЗМЕНЕНО
        embed.add_field(name=self.t("security.confirm.generic.permissions_field", lang=lang), value=permissions_list_formatted, inline=False)
        
        try:
            message = await owner.send(embed=embed, view=view)
        except discord.Forbidden:
            # ИЗМЕНЕНО
            logging.error(self.t("security.dm_permission_error_log", lang=lang))
            return
        
        moderator_str = f"{moderator.name} ({moderator.id})" if moderator else "Неизвестно"
        # ИЗМЕНЕНО
        telegram_alert = self.t("security.telegram.role_grant", 
                                lang=lang,
                                guild_name=after.guild.name, 
                                moderator_str=moderator_str, 
                                target_user_name=after.name,
                                target_user_id=after.id,
                                role_name=added_role.name)
        await send_telegram_alert(self.bot.db_pool, after.guild.id, telegram_alert)
        
        await view.wait()
        
        if view.result is True:
            await after.add_roles(added_role, reason="Действие одобрено Владельцем.")
            # ИЗМЕНЕНО
            logging.getLogger('bot.info').info(self.t("security.confirm.generic.role_approved_log", lang=lang, role_name=added_role.name, user_mention=after.mention, moderator_mention=moderator_mention))
            original_embed = view.interaction.message.embeds[0]
            # ИЗМЕНЕНО
            original_embed.title = self.t("security.embed_titles.action_approved", lang=lang)
            original_embed.color = discord.Color.green()
            await view.interaction.message.edit(embed=original_embed, view=None)
        else:
            # ИЗМЕНЕНО
            reason = self.t("system.reason_denied", lang=lang) if view.result is False else self.t("system.reason_timed_out", lang=lang)
            # ИЗМЕНЕНО
            logging.getLogger('bot.info').info(self.t("security.confirm.generic.role_denied_log", lang=lang, reason=reason, role_name=added_role.name, user_mention=after.mention, moderator_mention=moderator_mention))
            if view.interaction:
                original_embed = view.interaction.message.embeds[0]
                # ИЗМЕНЕНО
                original_embed.title = self.t("security.embed_titles.action_denied", lang=lang)
                original_embed.color = discord.Color.red()
                await view.interaction.message.edit(embed=original_embed, view=None)
            else:
                original_embed = message.embeds[0]
                # ИЗМЕНЕНО
                original_embed.title = self.t("security.embed_titles.action_timeout", lang=lang)
                original_embed.color = discord.Color.dark_grey()
                await message.edit(embed=original_embed, view=None)

    @commands.Cog.listener()
    async def on_guild_role_update(self, before: discord.Role, after: discord.Role):
        lang = await self.bot.get_guild_language(after.guild.id)
        
        before_perms = dict(iter(before.permissions))
        after_perms = dict(iter(after.permissions))
        added_dangerous_perms = []
        for perm_name in self.DANGEROUS_PERMISSIONS:
            if after_perms.get(perm_name) and not before_perms.get(perm_name):
                added_dangerous_perms.append(perm_name)
        if not added_dangerous_perms: return
        
        moderator = None
        try:
            async for entry in after.guild.audit_logs(action=discord.AuditLogAction.role_update, limit=5):
                if entry.target.id == after.id:
                    moderator = entry.user
                    break
        except Exception: pass
        if not moderator or moderator.id in self.bot.users_under_review or moderator.id == self.bot.user.id or moderator.id == after.guild.owner_id: return
        
        intended_permissions = after.permissions
        try:
            await after.edit(permissions=before.permissions, reason="Анти-нюк: откат опасных изменений прав")
        except discord.Forbidden:
            logging.error(f"Не могу откатить опасное изменение роли `{after.name}`! Проверьте иерархию ролей.")
            return
            
        # ИЗМЕНЕНО
        moderator_mention = moderator.mention if moderator else self.t("system.unknown_user", lang=lang)
        # ИЗМЕНЕНО
        log_message = self.t("security.confirm.role_update.log", lang=lang, user_mention=moderator_mention, role_name=after.name)
        logging.error(log_message)
        
        owner = after.guild.owner
        if not owner: return
        
        # ИЗМЕНЕНО
        permissions_list_formatted = "\n".join(f"• `{self.t('system.permissions', lang=lang).get(p, p)}`" for p in added_dangerous_perms)
        
        # ИЗМЕНЕНО
        view = ConfirmationView(
            author=owner, timeout=3600.0,
            approve_label=self.t("ui.button_approve", lang=lang),
            deny_label=self.t("ui.button_deny", lang=lang),
            interaction_denied_message=self.t("ui.interaction_denied", lang=lang)
        )
        # ИЗМЕНЕНО
        embed_desc = self.t("security.confirm.role_update.description", lang=lang, user_mention=moderator_mention, role_name=after.name)
        # ИЗМЕНЕНО
        embed = discord.Embed(title=self.t("security.embed_titles.confirm_required", lang=lang), description=embed_desc, color=discord.Color.gold())
        # ИЗМЕНЕНО
        embed.add_field(name=self.t("security.confirm.generic.permissions_field", lang=lang), value=permissions_list_formatted, inline=False)
        
        try:
            message = await owner.send(embed=embed, view=view)
        except discord.Forbidden:
            # ИЗМЕНЕНО
            logging.error(self.t("security.dm_permission_error_log", lang=lang))
            return
        
        moderator_str = f"{moderator.name} ({moderator.id})" if moderator else "Неизвестно"
        # ИЗМЕНЕНО
        perms_str = ", ".join([f"<code>{self.t('system.permissions', lang=lang).get(p, p)}</code>" for p in added_dangerous_perms])
        # ИЗМЕНЕНО
        telegram_alert = self.t("security.telegram.role_update",
                                lang=lang,
                                guild_name=after.guild.name,
                                moderator_str=moderator_str,
                                role_name=after.name,
                                permissions_str=perms_str)
        await send_telegram_alert(self.bot.db_pool, after.guild.id, telegram_alert)
        
        await view.wait()
        
        if view.result is True:
            try:
                await after.edit(permissions=intended_permissions, reason="Действие одобрено Владельцем")
                # ИЗМЕНЕНО (создадим ключ)
                logging.getLogger('bot.info').info(f"✅ Владелец **одобрил** изменение прав для роли **`{after.name}`** (инициатор: **{moderator_mention}**).")
            except discord.Forbidden:
                logging.error(f"Не могу применить одобренные права к роли `{after.name}`! Иерархия изменилась?")
            original_embed = view.interaction.message.embeds[0]
            # ИЗМЕНЕНО
            original_embed.title = self.t("security.embed_titles.action_approved", lang=lang)
            original_embed.color = discord.Color.green()
            await view.interaction.message.edit(embed=original_embed, view=None)
        else:
            # ИЗМЕНЕНО
            reason = self.t("system.reason_denied", lang=lang) if view.result is False else self.t("system.reason_timed_out", lang=lang)
            # ИЗМЕНЕНО (создадим ключ)
            logging.getLogger('bot.info').info(f"❌ Владелец **{reason}** изменение прав для роли **`{after.name}`** (инициатор: **{moderator_mention}**).")
            if view.interaction:
                original_embed = view.interaction.message.embeds[0]
                # ИЗМЕНЕНО
                original_embed.title = self.t("security.embed_titles.action_denied", lang=lang)
                original_embed.color = discord.Color.red()
                await view.interaction.message.edit(embed=original_embed, view=None)
            else:
                original_embed = message.embeds[0]
                # ИЗМЕНЕНО
                original_embed.title = self.t("security.embed_titles.action_timeout", lang=lang)
                original_embed.color = discord.Color.dark_grey()
                await message.edit(embed=original_embed, view=None)

    @commands.Cog.listener()
    async def on_webhooks_update(self, channel: discord.TextChannel):
        await asyncio.sleep(1.5)
        guild = channel.guild
        lang = await self.bot.get_guild_language(guild.id)
        
        try:
            actor, entry = None, None
            async for audit_entry in guild.audit_logs(action=discord.AuditLogAction.webhook_create, limit=1):
                if (discord.utils.utcnow() - audit_entry.created_at).total_seconds() < 5:
                    actor = audit_entry.user
                    entry = audit_entry
                    break

            if not actor or not entry or actor.id == self.bot.user.id or actor.id == guild.owner_id:
                return

            anti_nuke_cog: Optional["AntiNukeCog"] = self.bot.get_cog("Анти-нюк")
            if anti_nuke_cog:
                score = await anti_nuke_cog._get_guild_setting(guild.id, "webhook_create")
                # ИЗМЕНЕНО
                await anti_nuke_cog._handle_threat(actor, score, "webhook_spam")
            
            if actor.id in self.bot.users_under_review:
                return

            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(
                        "SELECT id FROM action_permissions WHERE guild_id = %s AND user_id = %s AND action_type = %s AND expires_at > NOW() AND is_used = FALSE",
                        (guild.id, actor.id, "webhook_create")
                    )
                    permission_row = await cursor.fetchone()

            if permission_row:
                permission_id = permission_row[0]
                async with self.bot.db_pool.acquire() as conn:
                    async with conn.cursor() as cursor:
                        await cursor.execute("UPDATE action_permissions SET is_used = TRUE WHERE id = %s", (permission_id,))
                logger.info(f"Пользователь {actor.name} использовал временное разрешение на создание вебхука.")
                return

            webhook_name = getattr(entry.changes.after, 'name', 'Неизвестный вебхук')
            webhook_id = entry.target.id
            try:
                webhook_to_delete = await self.bot.fetch_webhook(webhook_id)
                await webhook_to_delete.delete(reason="Несанкционированное создание, ожидание подтверждения")
                logger.info(f"Вебхук '{webhook_name}' ({webhook_id}) от {actor.name} был немедленно удален.")
            except (discord.Forbidden, discord.NotFound) as e:
                logger.warning(f"Не удалось удалить несанкционированный вебхук (возможно, уже удален): {e}")
                return

            owner = guild.owner
            if not owner: return
            
            member_obj = guild.get_member(actor.id)
            if member_obj:
                # ИЗМЕНЕНО
                message_to_user = self.t("security.confirm.webhook_create.creator_request_sent", lang=lang, webhook_name=webhook_name, channel_mention=channel.mention)
                try:
                    await member_obj.send(message_to_user)
                except discord.Forbidden:
                    logger.warning(f"Не удалось отправить ЛС пользователю {actor.name} с запросом на подтверждение вебхука (ЛС закрыты).")
                    try:
                        await channel.send(f"{member_obj.mention}, {message_to_user}")
                    except discord.Forbidden:
                        logger.error(f"Не удалось отправить резервное сообщение в канал #{channel.name}.")
                except Exception as e:
                    logger.error(f"Неизвестная ошибка при отправке ЛС-запроса пользователю {actor.name}: {e}")

            # ИЗМЕНЕНО
            view = ConfirmationView(
                author=owner, timeout=3600.0,
                approve_label=self.t("ui.button_approve", lang=lang),
                deny_label=self.t("ui.button_deny", lang=lang),
                interaction_denied_message=self.t("ui.interaction_denied", lang=lang)
            )
            
            # ИЗМЕНЕНО
            telegram_alert = self.t("security.telegram.webhook",
                                    lang=lang,
                                    guild_name=guild.name,
                                    user_name=actor.name,
                                    user_id=actor.id,
                                    webhook_name=webhook_name,
                                    channel_name=channel.name)
            
            # ИЗМЕНЕНО
            embed_desc_for_discord = self.t("security.confirm.webhook_create.description", lang=lang, creator_mention=actor.mention, webhook_name=webhook_name, channel_mention=channel.mention)
            # ИЗМЕНЕНО
            embed = discord.Embed(title=self.t("security.embed_titles.confirm_required", lang=lang), description=embed_desc_for_discord, color=discord.Color.gold())

            message = None
            try:
                message = await owner.send(embed=embed, view=view)
                await send_telegram_alert(self.bot.db_pool, guild.id, telegram_alert)
            except discord.Forbidden:
                # ИЗМЕНЕНО
                logging.error(self.t("security.dm_permission_error_log", lang=lang))
                return

            await view.wait()

            if view.result is True:
                try:
                    async with self.bot.db_pool.acquire() as conn:
                        async with conn.cursor() as cursor:
                            await cursor.execute("INSERT INTO action_permissions (guild_id, user_id, action_type, expires_at) VALUES (%s, %s, %s, NOW() + INTERVAL 1 HOUR)", (guild.id, actor.id, "webhook_create"))
                    
                    if member_obj:
                        # ИЗМЕНЕНО
                        message_to_user = self.t("security.confirm.webhook_create.creator_request_approved", lang=lang, webhook_name=webhook_name)
                        try:
                            await member_obj.send(message_to_user)
                        except discord.Forbidden:
                            logger.warning(f"Не удалось уведомить {actor.name} об одобрении вебхука (ЛС закрыты).")
                            try:
                                await channel.send(f"{member_obj.mention}, {message_to_user}")
                            except discord.Forbidden:
                                logger.error(f"Не удалось отправить резервное сообщение об одобрении в канал #{channel.name}.")
                except Exception as e:
                    logger.error(f"Не удалось создать разрешение на вебхук в БД: {e}", exc_info=True)

                original_embed = view.interaction.message.embeds[0]
                # ИЗМЕНЕНО
                original_embed.title = self.t("security.embed_titles.action_approved", lang=lang)
                original_embed.color = discord.Color.green()
                await view.interaction.message.edit(embed=original_embed, view=None)
            else:
                if member_obj:
                    # ИЗМЕНЕНО
                    message_to_user = self.t("security.confirm.webhook_create.creator_request_denied", lang=lang, webhook_name=webhook_name)
                    try:
                        await member_obj.send(message_to_user)
                    except discord.Forbidden:
                        logger.warning(f"Не удалось уведомить {actor.name} об отклонении запроса на вебхук (ЛС закрыты).")
                        try:
                            await channel.send(f"{member_obj.mention}, {message_to_user}")
                        except discord.Forbidden:
                            logger.error(f"Не удалось отправить резервное сообщение об отклонении в канал #{channel.name}.")
                
                # ИЗМЕНЕНО
                reason = self.t("system.reason_denied", lang=lang) if view.result is False else self.t("system.reason_timed_out", lang=lang)
                # ИЗМЕНЕНО
                logging.getLogger('bot.info').info(self.t("security.confirm.generic.webhook_denied_log", lang=lang, reason=reason, webhook_name=webhook_name, creator_mention=actor.mention))
                if view.interaction:
                    original_embed = view.interaction.message.embeds[0]
                    # ИЗМЕНЕНО
                    original_embed.title = self.t("security.embed_titles.action_denied", lang=lang)
                    original_embed.color = discord.Color.red()
                    await view.interaction.message.edit(embed=original_embed, view=None)
                elif message:
                    original_embed = message.embeds[0]
                    # ИЗМЕНЕНО
                    original_embed.title = self.t("security.embed_titles.action_timeout", lang=lang)
                    original_embed.color = discord.Color.dark_grey()
                    await message.edit(embed=original_embed, view=None)
        except Exception as e:
            logger.error(f"Критическая ошибка при обработке события webhooks_update: {e}", exc_info=True)

async def setup(bot: "SecurityBot"):
    await bot.add_cog(ConfirmationCog(bot))