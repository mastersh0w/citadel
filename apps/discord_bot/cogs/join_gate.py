# cogs/join_gate.py
# -*- coding: utf-8 -*-

# Этот ког отвечает исключительно за обработку события on_member_join.
# Его задача - служить "привратником" для сервера, проверяя каждого, кто входит.

import logging
import discord
from discord.ext import commands
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from main import SecurityBot

logger = logging.getLogger(__name__)

class JoinGateCog(commands.Cog, name="Контроль входа"):
    """
    Ког, управляющий логикой при входе нового участника на сервер.
    Разделяет проверку на два основных случая: если вошел бот и если вошел обычный пользователь.
    """
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        self.t = self.bot.translator.get

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        """
        Обработчик события входа участника на сервер.
        """
        # --- Сценарий 1: Вошел бот ---
        if member.bot:
            adder = None
            lang = await self.bot.get_guild_language(member.guild.id) # Получаем язык для логов
            
            try:
                # Пытаемся найти в журнале аудита, кто именно добавил этого бота.
                async for entry in member.guild.audit_logs(action=discord.AuditLogAction.bot_add, limit=5):
                    # Ищем запись, где цель - наш новый бот.
                    if entry.target and entry.target.id == member.id:
                        adder = entry.user
                        # Если бота добавил владелец сервера, мы ему доверяем и ничего не делаем.
                        if adder and adder.id == member.guild.owner_id:
                            # ИЗМЕНЕНО (создадим ключ на лету)
                            logging.getLogger('bot.info').info(f"Владелец сервера {adder.name} добавил бота {member.name} ({member.id}). Проверка не требуется.")
                            return
                        break # Нашли нужную запись, выходим из цикла.
            except Exception as e: 
                logger.error(f"Ошибка при проверке аудит-лога для {member.name}: {e}")

            # Проверяем, есть ли бот в "белом списке" в нашей базе данных.
            is_allowed = False
            try:
                async with self.bot.db_pool.acquire() as conn:
                    async with conn.cursor() as cursor:
                        await cursor.execute("SELECT 1 FROM allowed_bots WHERE guild_id = %s AND bot_id = %s", (member.guild.id, member.id))
                        if await cursor.fetchone(): 
                            is_allowed = True
            except Exception as e: 
                logger.error(f"Ошибка при проверке бота {member.id} в БД.", exc_info=True)
            
            adder_mention = f" (добавил: {adder.mention})" if adder else ""
            if is_allowed:
                # Если бот в белом списке, просто логируем это.
                # ИЗМЕНЕНО (создадим ключ на лету)
                logging.getLogger('bot.info').info(f"Авторизованный бот {member.name} ({member.id}) присоединился к серверу" + adder_mention)
            else:
                # Если бота нет в белом списке - немедленно его баним.
                try:
                    # Проверяем, есть ли у нас права на бан и выше ли наша роль роли бота.
                    if not member.guild.me.guild_permissions.ban_members: 
                        raise commands.BotMissingPermissions(["ban_members"])
                    if member.top_role >= member.guild.me.top_role: 
                        raise commands.CommandError("Bot cannot ban a member with equal or higher role.")
                    await member.ban(reason="Автоматический бан: бот не авторизован")
                    # ИЗМЕНЕНО (создадим ключ на лету)
                    logging.error(f"Неавторизованный бот {member.name} ({member.id}) был забанен" + adder_mention)
                except commands.BotMissingPermissions:
                    # ИЗМЕНЕНО (создадим ключ на лету)
                    logging.error(f"Не удалось забанить бота {member.name} ({member.id}): отсутствуют права на бан" + adder_mention)
                except Exception as e:
                    # ИЗМЕНЕНО (создадим ключ на лету)
                    logging.error(f"Не удалось забанить бота {member.name} ({member.id}): ошибка иерархии ролей. {e}" + adder_mention, exc_info=True)
            return # Завершаем выполнение, так как это был бот.

        # --- Сценарий 2: Вошел обычный пользователь ---
        try:
            # Проверяем, не находится ли этот пользователь в нашей базе данных карантина.
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT 1 FROM quarantined_users WHERE user_id = %s AND guild_id = %s", (member.id, member.guild.id))
                    is_quarantined = await cursor.fetchone()
                    if is_quarantined:
                        # Если пользователь в карантине, снова выдаем ему карантинную роль.
                        await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (member.guild.id, "quarantine_role_id"))
                        result = await cursor.fetchone()
                        if not result:
                            logging.error(f"Не могу применить карантин к {member.mention}: карантинная роль не настроена для этого сервера.")
                            return
                        quarantine_role_id = int(result[0])
                        quarantine_role = member.guild.get_role(quarantine_role_id)
                        if not quarantine_role:
                            logging.error(f"Не могу применить карантин к {member.mention}: роль с ID {quarantine_role_id} не найдена.")
                            return
                        await member.add_roles(quarantine_role, reason="Повторное применение карантина при перезаходе на сервер")
                        # ИЗМЕНЕНО (создадим ключ на лету)
                        logging.getLogger('bot.info').info(f"Пользователь {member.mention} перезашел на сервер и был снова помещен в карантин.")
        except discord.Forbidden:
            # ИЗМЕНЕНО (создадим ключ на лету)
            logging.error(f"Не удалось повторно поместить {member.mention} в карантин: ошибка прав.")
        except Exception as e:
            logger.error(f"Ошибка при проверке карантина для пользователя {member.id} при входе: {e}", exc_info=True)

async def setup(bot: "SecurityBot"):
    """Функция для загрузки кога в бота."""
    await bot.add_cog(JoinGateCog(bot))