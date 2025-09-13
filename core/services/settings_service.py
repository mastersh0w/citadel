# core/services/settings_service.py
# -*- coding: utf-8 -*-

import logging
from typing import Dict, Any, TYPE_CHECKING
import discord

if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

QUARANTINE_ROLE_NAME = "🚫 Карантин"

async def configure_quarantine(bot: "SecurityBot", guild: discord.Guild) -> Dict[str, Any]:
    """
    Сервисная функция для настройки или проверки роли карантина.
    Ищет роль, создает если нужно, и ОБЯЗАТЕЛЬНО записывает ее ID в БД.
    """
    quarantine_role = discord.utils.get(guild.roles, name=QUARANTINE_ROLE_NAME)
    try:
        if not quarantine_role:
            logger.info(f"Роль '{QUARANTINE_ROLE_NAME}' не найдена на сервере {guild.name}, создаю...")
            permissions = discord.Permissions.none()
            quarantine_role = await guild.create_role(
                name=QUARANTINE_ROLE_NAME,
                permissions=permissions,
                reason="Настройка системы безопасности"
            )
            try:
                await quarantine_role.edit(position=guild.me.top_role.position - 1)
            except (discord.Forbidden, discord.HTTPException):
                logger.warning(f"Не удалось переместить роль карантина на сервере {guild.name}. Проверьте иерархию ролей.")
        
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """INSERT INTO guild_configs (guild_id, config_key, config_value) 
                       VALUES (%s, 'quarantine_role_id', %s) 
                       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)""",
                    (guild.id, str(quarantine_role.id))
                )
        
        await bot.redis.delete(f"antinuke_settings:{guild.id}")
        return {'status': 'success', 'role': quarantine_role}
    except discord.Forbidden:
        return {'status': 'error', 'code': 'missing_permissions'}
    except Exception as e:
        logger.error(f"Ошибка в сервисе configure_quarantine для сервера {guild.id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error'}


async def set_guild_setting(bot: "SecurityBot", guild_id: int, key: str, value: Any) -> Dict[str, Any]:
    """
    Универсальная функция для сохранения одной настройки сервера.
    """
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """INSERT INTO guild_configs (guild_id, config_key, config_value)
                       VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)""",
                    (guild_id, key, str(value))
                )
        
        if key == 'language':
            await bot.redis.delete(f"lang:{guild_id}")
        elif key.startswith('antinuke_'):
            await bot.redis.delete(f"antinuke_settings:{guild_id}")
            
        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Ошибка при сохранении настройки '{key}' для сервера {guild_id}: {e}")
        return {'status': 'error', 'code': 'db_error'}

async def delete_guild_setting(bot: "SecurityBot", guild_id: int, key: str) -> Dict[str, Any]:
    """
    Универсальная функция для удаления (сброса) одной настройки сервера.
    """
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "DELETE FROM guild_configs WHERE guild_id = %s AND config_key = %s",
                    (guild_id, key)
                )
        
        if key.startswith('antinuke_'):
            await bot.redis.delete(f"antinuke_settings:{guild_id}")

        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Ошибка при удалении настройки '{key}' для сервера {guild_id}: {e}")
        return {'status': 'error', 'code': 'db_error'}