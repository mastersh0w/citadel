# cogs/config_events.py
# -*- coding: utf-8 -*-

import logging
import discord
from discord.ext import commands
from typing import TYPE_CHECKING, Optional
import json

if TYPE_CHECKING:
    from main import SecurityBot
    from .anti_nuke import AntiNukeCog

logger = logging.getLogger(__name__)

class ConfigEventsCog(commands.Cog, name="События Конфигурации"):
    """
    Этот ког не содержит команд. Он отвечает исключительно за обработку событий,
    которые могут повлиять на конфигурацию бота (удаление/переименование ролей, каналов и т.д.),
    а также за аудит конфигурации при запуске.
    """
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        self.t = self.bot.translator.get

    @commands.Cog.listener()
    async def on_guild_role_update(self, before: discord.Role, after: discord.Role):
        if self.bot.is_shutting_down: return
        if before.name == after.name:
            return

        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (before.guild.id, "quarantine_role"))
                    result = await cursor.fetchone()
            
            if not result:
                return

            role_data = json.loads(result[0])
            if role_data.get("id") != after.id:
                return

            logger.info(f"Карантинная роль на сервере '{before.guild.name}' была переименована с '{before.name}' на '{after.name}'. Обновляю запись в БД.")
            
            new_config_data = json.dumps({"id": after.id, "name": after.name})
            
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("UPDATE guild_configs SET config_value = %s WHERE guild_id = %s AND config_key = %s", (new_config_data, after.guild.id, "quarantine_role"))

        except (json.JSONDecodeError, KeyError, TypeError):
            pass
        except Exception as e:
            logger.error(f"Ошибка при обновлении имени карантинной роли для сервера {before.guild.id}: {e}", exc_info=True)

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role: discord.Role):
        if self.bot.is_shutting_down: return
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (role.guild.id, "quarantine_role"))
                    result = await cursor.fetchone()

            if not result:
                return

            role_data = json.loads(result[0])
            if role_data.get("id") != role.id:
                return

            logger.warning(f"Карантинная роль '{role.name}' на сервере '{role.guild.name}' была удалена! Очищаю запись в БД и уведомляю владельца.")
            
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("DELETE FROM guild_configs WHERE guild_id = %s AND config_key = %s", (role.guild.id, "quarantine_role"))
            
            owner = role.guild.owner
            if owner:
                lang = await self.bot.get_guild_language(role.guild.id)
                # ИЗМЕНЕНО
                message = self.t("setup.quarantine.role_deleted_dm", lang=lang, guild_name=role.guild.name)
                try:
                    await owner.send(message)
                except discord.Forbidden:
                    logger.warning(f"Не удалось отправить ЛС-уведомление об удалении карантинной роли владельцу сервера {role.guild.name} (ЛС закрыты).")

        except (json.JSONDecodeError, KeyError, TypeError):
            pass
        except Exception as e:
            logger.error(f"Ошибка при обработке удаления роли на сервере {role.guild.id}: {e}", exc_info=True)

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel):
        if self.bot.is_shutting_down: return

        guild = channel.guild
        log_channel_id = None
        
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (guild.id, "moderation_log_channel_id"))
                    result = await cursor.fetchone()
                    if result:
                        log_channel_id = int(result[0])
        except Exception:
            return

        if not log_channel_id or log_channel_id != channel.id:
            return

        deleter = None
        try:
            async for entry in guild.audit_logs(action=discord.AuditLogAction.channel_delete, limit=5):
                if entry.target and entry.target.id == channel.id:
                    deleter = entry.user
                    break
        except Exception:
            pass

        if not deleter:
            return

        lang = await self.bot.get_guild_language(guild.id)

        if deleter.id == guild.owner_id:
            logger.info(f"Владелец сервера {guild.name} ({deleter.name}) удалил лог-канал.")
            try:
                async with self.bot.db_pool.acquire() as conn:
                    async with conn.cursor() as cursor:
                        await cursor.execute("DELETE FROM guild_configs WHERE guild_id = %s AND config_key = %s", (guild.id, "moderation_log_channel_id"))
                
                # ИЗМЕНЕНО
                dm_desc = self.t("setup.logs.owner_deleted_dm_desc", lang=lang, channel_name=channel.name, guild_name=guild.name)
                embed = discord.Embed(title=self.t("setup.logs.owner_deleted_dm_title", lang=lang), description=dm_desc, color=discord.Color.blue())
                await deleter.send(embed=embed)
            except discord.Forbidden:
                pass
            except Exception as e:
                logger.error(f"Ошибка при обработке удаления лог-канала владельцем: {e}", exc_info=True)
            return

        if deleter.id == self.bot.user.id:
            return
        
        logger.critical(f"КРИТИЧЕСКИЙ ИНЦИДЕНТ на сервере {guild.name}: Пользователь {deleter.name} удалил лог-канал!")

        anti_nuke_cog: Optional["AntiNukeCog"] = self.bot.get_cog("Анти-нюк")
        if anti_nuke_cog:
            # ИЗМЕНЕНО
            reason_key = "log_channel_deleted"
            await anti_nuke_cog._quarantine_user(deleter, reason_key, score=999, threshold=1)
        
        try:
            overwrites = {
                guild.default_role: discord.PermissionOverwrite(read_messages=False),
                guild.me: discord.PermissionOverwrite(read_messages=True, send_messages=True),
            }
            if guild.owner:
                overwrites[guild.owner] = discord.PermissionOverwrite(read_messages=True)
                
            new_channel = await guild.create_text_channel("server-logs", overwrites=overwrites, reason="Автоматическое восстановление лог-канала")
        except discord.Forbidden:
            logger.error(f"Не удалось создать новый лог-канал на сервере {guild.name}: нет прав.")
            return

        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("UPDATE guild_configs SET config_value = %s WHERE guild_id = %s AND config_key = %s", (str(new_channel.id), guild.id, "moderation_log_channel_id"))

            if guild.owner:
                # ИЗМЕНЕНО
                dm_desc = self.t("setup.logs.user_deleted_dm_desc", lang=lang, guild_name=guild.name, user_mention=deleter.mention, new_channel_mention=new_channel.mention)
                embed = discord.Embed(title=self.t("setup.logs.user_deleted_dm_title", lang=lang), description=dm_desc, color=discord.Color.dark_red())
                try:
                    await guild.owner.send(embed=embed)
                except discord.Forbidden:
                    pass
            
            # ИЗМЕНЕНО
            await new_channel.send(self.t("setup.logs.recreated_message", lang=lang))

        except Exception as e:
            logger.error(f"Не удалось обновить БД или отправить уведомление после пересоздания лог-канала: {e}", exc_info=True)

    async def check_quarantine_roles_on_startup(self):
        """
        Проверяет все настроенные карантинные роли при запуске, чтобы
        синхронизировать состояние с БД после возможного простоя.
        """
        logger.info("Начинаю аудит настроек карантинных ролей...")
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT guild_id, config_value FROM guild_configs WHERE config_key = %s", ("quarantine_role",))
                    all_configs = await cursor.fetchall()
            
            for guild_id, config_json in all_configs:
                guild = self.bot.get_guild(guild_id)
                if not guild:
                    continue
                
                try:
                    role_data = json.loads(config_json)
                    role_id = role_data.get("id")
                    stored_name = role_data.get("name")
                    if not role_id or not stored_name:
                        continue

                    role = guild.get_role(role_id)
                    
                    if not role:
                        logger.warning(f"[Аудит] Карантинная роль (ID: {role_id}) на сервере '{guild.name}' была удалена в офлайне.")
                        await self._handle_deleted_role(guild, stored_name)
                        continue
                        
                    if role.name != stored_name:
                        logger.info(f"[Аудит] Карантинная роль на сервере '{guild.name}' была переименована в офлайне с '{stored_name}' на '{role.name}'.")
                        await self._handle_renamed_role(guild, role, stored_name)

                except (json.JSONDecodeError, KeyError, TypeError):
                    continue
                    
        except Exception as e:
            logger.error(f"Критическая ошибка во время аудита карантинных ролей: {e}", exc_info=True)
            
        logger.info("Аудит карантинных ролей завершен.")
        
    async def _handle_deleted_role(self, guild: discord.Guild, old_role_name: str):
        """Обрабатывает удаление роли: чистит БД и уведомляет владельца."""
        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM guild_configs WHERE guild_id = %s AND config_key = %s", (guild.id, "quarantine_role"))
        
        owner = guild.owner
        if owner:
            lang = await self.bot.get_guild_language(guild.id)
            # ИЗМЕНЕНО
            message = self.t("setup.quarantine.role_deleted_dm", lang=lang, guild_name=guild.name)
            try:
                await owner.send(message)
            except discord.Forbidden:
                logger.warning(f"Не удалось отправить ЛС (аудит) об удалении роли владельцу {guild.name}.")

    async def _handle_renamed_role(self, guild: discord.Guild, role: discord.Role, old_name: str):
        """Обрабатывает переименование роли: обновляет БД и уведомляет владельца."""
        new_config_data = json.dumps({"id": role.id, "name": role.name})
        async with self.bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("UPDATE guild_configs SET config_value = %s WHERE guild_id = %s AND config_key = %s", (new_config_data, guild.id, "quarantine_role"))

        owner = guild.owner
        if owner:
            lang = await self.bot.get_guild_language(guild.id)
            # ИЗМЕНЕНО
            message = self.t("setup.quarantine.role_renamed_dm", lang=lang, guild_name=guild.name, old_name=old_name, new_name=role.name)
            try:
                await owner.send(message)
            except discord.Forbidden:
                logger.warning(f"Не удалось отправить ЛС (аудит) о переименовании роли владельцу {guild.name}.")


async def setup(bot: "SecurityBot"):
    await bot.add_cog(ConfigEventsCog(bot))