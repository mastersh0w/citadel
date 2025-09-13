# core/services/management_service.py
# -*- coding: utf-8 -*-

import logging
from typing import Dict, Any, List, TYPE_CHECKING

if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

async def get_whitelisted_bots(bot: "SecurityBot", guild_id: int) -> List[int]:
    """
    Получает список ID ботов в белом списке для сервера.
    """
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT bot_id FROM allowed_bots WHERE guild_id = %s", (guild_id,))
                rows = await cursor.fetchall()
                return [row[0] for row in rows]
    except Exception as e:
        logger.error(f"Не удалось получить белый список ботов для сервера {guild_id}: {e}")
        return []

async def add_bot_to_whitelist(bot: "SecurityBot", guild_id: int, bot_id: int) -> Dict[str, Any]:
    """
    Добавляет бота в белый список.
    """
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO allowed_bots (guild_id, bot_id) VALUES (%s, %s) ON DUPLICATE KEY UPDATE bot_id=bot_id",
                    (guild_id, bot_id)
                )
        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Не удалось добавить бота {bot_id} в белый список для сервера {guild_id}: {e}")
        return {'status': 'error', 'code': 'db_error'}

async def remove_bot_from_whitelist(bot: "SecurityBot", guild_id: int, bot_id: int) -> Dict[str, Any]:
    """
    Удаляет бота из белого списка.
    """
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "DELETE FROM allowed_bots WHERE guild_id = %s AND bot_id = %s",
                    (guild_id, bot_id)
                )
        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Не удалось удалить бота {bot_id} из белого списка для сервера {guild_id}: {e}")
        return {'status': 'error', 'code': 'db_error'}