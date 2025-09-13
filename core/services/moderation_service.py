# core/services/moderation_service.py
# -*- coding: utf-8 -*-

import logging
import re
from typing import Dict, Any, TYPE_CHECKING
from datetime import timedelta
import discord

if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)

def _parse_duration_for_service(duration_str: str) -> timedelta:
    """Простая функция для парсинга строки времени (e.g., "10m", "1h", "7d")."""
    match = re.match(r"(\d+)([smhd])", duration_str.lower())
    if not match: return timedelta(days=28)
    
    value, unit = match.groups()
    value = int(value)
    
    if unit == 's': return timedelta(seconds=value)
    if unit == 'm': return timedelta(minutes=value)
    if unit == 'h': return timedelta(hours=value)
    if unit == 'd': return timedelta(days=value)
    
    return timedelta(days=28)


async def add_warning(
    bot: "SecurityBot", 
    guild: discord.Guild, 
    target_member: discord.Member, 
    moderator: discord.Member, 
    reason: str
) -> Dict[str, Any]:
    """
    Сервисная функция для добавления предупреждения пользователю.
    Выполняет всю бизнес-логику и возвращает словарь с результатом.
    """
    if target_member.guild_permissions.manage_messages:
        return {'status': 'error', 'code': 'target_is_moderator'}

    warn_count = 0
    warn_threshold = 0
    
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (%s, %s, %s, %s)",
                    (guild.id, target_member.id, moderator.id, reason)
                )
                
                await cursor.execute(
                    """SELECT COUNT(*) FROM warnings 
                       WHERE guild_id = %s AND user_id = %s AND status = 'active'""",
                    (guild.id, target_member.id)
                )
                warn_count_result = await cursor.fetchone()
                warn_count = warn_count_result[0] if warn_count_result else 0

                await cursor.execute(
                    "SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = 'warn_threshold'",
                    (guild.id,)
                )
                threshold_result = await cursor.fetchone()
                warn_threshold = int(threshold_result[0]) if threshold_result else 0

        return {
            'status': 'success',
            'warn_count': warn_count,
            'warn_threshold': warn_threshold
        }
    except Exception as e:
        logger.error(f"Ошибка в сервисе add_warning для сервера {guild.id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error', 'message': str(e)}


async def timeout_member(
    bot: "SecurityBot",
    target_member: discord.Member,
    moderator: discord.Member,
    duration: timedelta,
    reason: str
) -> Dict[str, Any]:
    """
    Сервисная функция для изоляции (мьюта) участника.
    """
    if target_member.id == moderator.id:
        return {'status': 'error', 'code': 'cannot_mute_self'}
    if target_member.id == bot.user.id:
        return {'status': 'error', 'code': 'cannot_mute_bot'}
    if target_member.guild_permissions.administrator:
        return {'status': 'error', 'code': 'target_is_admin'}
    if target_member.is_timed_out():
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT moderator_id, reason, end_timestamp FROM mutes WHERE guild_id = %s AND user_id = %s AND status = 'active'",
                    (target_member.guild.id, target_member.id)
                )
                existing_mute = await cursor.fetchone()
        return {
            'status': 'error', 
            'code': 'already_muted', 
            'moderator_id': existing_mute[0] if existing_mute else 0,
            'reason': existing_mute[1] if existing_mute else "N/A",
            'end_timestamp': existing_mute[2] if existing_mute else None
        }

    end_timestamp = discord.utils.utcnow() + duration

    try:
        await target_member.timeout(duration, reason=reason)
        
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO mutes (guild_id, user_id, moderator_id, reason, end_timestamp) VALUES (%s, %s, %s, %s, %s)",
                    (target_member.guild.id, target_member.id, moderator.id, reason, end_timestamp)
                )
        
        return {'status': 'success', 'end_timestamp': end_timestamp}

    except discord.Forbidden:
        return {'status': 'error', 'code': 'hierarchy_error'}
    except Exception as e:
        logger.error(f"Ошибка в сервисе timeout_member для сервера {target_member.guild.id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error', 'message': str(e)}


async def untimeout_member(
    bot: "SecurityBot",
    target_member: discord.Member,
    moderator: discord.Member
) -> Dict[str, Any]:
    """
    Сервисная функция для снятия изоляции (мьюта) с участника.
    """
    if not target_member.is_timed_out():
        return {'status': 'error', 'code': 'not_muted'}

    try:
        await target_member.timeout(None, reason=f"Unmuted by {moderator}")
        
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE mutes SET status = 'inactive' WHERE guild_id = %s AND user_id = %s AND status = 'active'",
                    (target_member.guild.id, target_member.id)
                )
        
        return {'status': 'success'}

    except discord.Forbidden:
        return {'status': 'error', 'code': 'hierarchy_error'}
    except Exception as e:
        logger.error(f"Ошибка в сервисе untimeout_member для сервера {target_member.guild.id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error', 'message': str(e)}

async def check_and_apply_auto_mute(
    bot: "SecurityBot",
    guild: discord.Guild,
    target_member: discord.Member,
    last_warn_reason: str
) -> Dict[str, Any]:
    """
    Проверяет, нужно ли автоматически замьютить пользователя, и применяет мьют.
    """
    duration_str = None
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = 'warn_mute_duration'",
                    (guild.id,)
                )
                result = await cursor.fetchone()
                if not result or not result[0]:
                    return {'status': 'success', 'muted': False}
                duration_str = result[0]
    except Exception as e:
        logger.error(f"Не удалось получить настройки автомьюта для сервера {guild.id}: {e}")
        return {'status': 'error', 'code': 'db_error'}
        
    duration = _parse_duration_for_service(duration_str)
    reason = f"Авто-мьют: достигнут порог предупреждений. Последняя причина: {last_warn_reason}"

    result = await timeout_member(
        bot=bot,
        target_member=target_member,
        moderator=guild.me,
        duration=duration,
        reason=reason
    )
    
    if result['status'] == 'success':
        return {
            'status': 'success',
            'muted': True,
            'duration_str': duration_str,
            'end_timestamp': result['end_timestamp']
        }
    else:
        return result