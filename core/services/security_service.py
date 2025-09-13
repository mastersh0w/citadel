# core/services/security_service.py
# -*- coding: utf-8 -*-

import logging
import json
from typing import Dict, Any, List, TYPE_CHECKING
import discord

from core import metrics

if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

async def quarantine_user(
    bot: "SecurityBot", 
    member: discord.Member, 
    reason: str
) -> Dict[str, Any]:
    """
    Сервисная функция для помещения пользователя в карантин.
    """
    guild = member.guild
    
    quarantine_role_id = 0
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = 'quarantine_role_id'", (guild.id,))
                result = await cursor.fetchone()
                if result: quarantine_role_id = int(result[0])
    except Exception as e:
        logger.error(f"Не удалось получить ID роли карантина для сервера {guild.id}: {e}")
        return {'status': 'error', 'code': 'db_error'}
        
    if not quarantine_role_id:
        return {'status': 'error', 'code': 'quarantine_not_configured'}
        
    quarantine_role = guild.get_role(quarantine_role_id)
    if not quarantine_role:
        return {'status': 'error', 'code': 'quarantine_role_not_found'}

    user_roles = [role.id for role in member.roles if role != guild.default_role]
    
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO quarantined_users (guild_id, user_id, roles_json, reason, status) VALUES (%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE roles_json=VALUES(roles_json), reason=VALUES(reason), status='active', quarantined_at=NOW()",
                    (guild.id, member.id, json.dumps(user_roles), reason, 'active')
                )
        
        await member.edit(roles=[quarantine_role], reason=f"Помещение в карантин: {reason}")
        
        metrics.QUARANTINED_USERS_COUNT.inc()
        
        return {'status': 'success'}

    except discord.Forbidden:
        return {'status': 'error', 'code': 'hierarchy_error'}
    except Exception as e:
        logger.error(f"Ошибка в сервисе quarantine_user для сервера {guild.id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error'}


async def unquarantine_user(
    bot: "SecurityBot", 
    guild: discord.Guild,
    user_id: int,
    moderator_reason: str
) -> Dict[str, Any]:
    """
    Сервисная функция для вывода пользователя из карантина и восстановления ролей.
    """
    member = guild.get_member(user_id)
    if not member:
        return {'status': 'error', 'code': 'user_not_found'}

    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT roles_json FROM quarantined_users WHERE user_id = %s AND guild_id = %s AND status = 'active'",
                    (user_id, guild.id)
                )
                result = await cursor.fetchone()
                if not result:
                    return {'status': 'error', 'code': 'not_in_quarantine'}

                roles_json = result[0]
                role_ids = json.loads(roles_json)
                roles_to_add = [guild.get_role(rid) for rid in role_ids if guild.get_role(rid) is not None]
                await member.edit(roles=roles_to_add, reason=moderator_reason)

                await cursor.execute(
                    "UPDATE quarantined_users SET status = 'inactive' WHERE user_id = %s AND guild_id = %s", 
                    (user_id, guild.id)
                )
        
        metrics.QUARANTINED_USERS_COUNT.dec()
        
        return {'status': 'success', 'member': member}

    except discord.Forbidden:
        return {'status': 'error', 'code': 'hierarchy_error'}
    except Exception as e:
        logger.error(f"Ошибка в сервисе unquarantine_user для сервера {guild.id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error'}

async def get_quarantined_users(bot: "SecurityBot", guild_id: int) -> List[Dict[str, Any]]:
    """
    Получает список активных пользователей в карантине для сервера.
    """
    users = []
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT user_id, quarantined_at FROM quarantined_users WHERE guild_id = %s AND status = 'active'",
                    (guild_id,)
                )
                rows = await cursor.fetchall()
                for row in rows:
                    users.append({'user_id': row[0], 'quarantined_at': row[1]})
        return users
    except Exception as e:
        logger.error(f"Не удалось получить список карантина для сервера {guild_id}: {e}")
        return []

async def ban_quarantined_user(bot: "SecurityBot", guild: discord.Guild, user_id: int, moderator_reason: str) -> Dict[str, Any]:
    """
    Банит пользователя и помечает его запись о карантине как неактивную.
    """
    user_object = discord.Object(id=user_id)
    try:
        await guild.ban(user_object, reason=moderator_reason)

        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE quarantined_users SET status = 'inactive' WHERE user_id = %s AND guild_id = %s",
                    (user_id, guild.id)
                )
        
        metrics.QUARANTINED_USERS_COUNT.dec()
        return {'status': 'success'}
    except discord.Forbidden:
        return {'status': 'error', 'code': 'hierarchy_error'}
    except Exception as e:
        logger.error(f"Не удалось забанить пользователя {user_id} из карантина: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error'}

async def keep_user_in_quarantine(bot: "SecurityBot", guild_id: int, user_id: int) -> Dict[str, Any]:
    """
    Помечает запись о карантине как неактивную, не меняя роли пользователя.
    """
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE quarantined_users SET status = 'inactive' WHERE user_id = %s AND guild_id = %s",
                    (user_id, guild_id)
                )
        
        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Не удалось обновить статус карантина для {user_id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error'}