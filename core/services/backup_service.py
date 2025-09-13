# core/services/backup_service.py
# -*- coding: utf-8 -*-

import logging
import json
import os
from typing import Dict, Any, List, Optional, TYPE_CHECKING
import discord
import aiofiles
import asyncio

from core import metrics

if TYPE_CHECKING:
    from apps.discord_bot.main import SecurityBot

logger = logging.getLogger(__name__)
BACKUP_DIR = "backups"

async def get_backups_list(bot: "SecurityBot", guild_id: int) -> List[Dict[str, Any]]:
    backups = []
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT backup_name, created_at, options_json FROM backups WHERE guild_id = %s ORDER BY created_at DESC",
                    (guild_id,)
                )
                rows = await cursor.fetchall()
                for row in rows:
                    options = json.loads(row[2]) if row[2] else {}
                    backups.append({
                        'name': row[0],
                        'created_at': row[1],
                        'options': options
                    })
        return backups
    except Exception as e:
        logger.error(f"Не удалось получить список бэкапов для сервера {guild_id}: {e}", exc_info=True)
        return []

async def create_backup(
    bot: "SecurityBot", 
    guild: discord.Guild, 
    user: discord.Member, 
    backup_name: str, 
    backup_messages: bool,
    messages_limit: int
) -> Dict[str, Any]:
    guild_backup_dir = os.path.join(BACKUP_DIR, str(guild.id))
    os.makedirs(guild_backup_dir, exist_ok=True)
    file_name = f"{backup_name}.json"
    file_path = os.path.join(guild_backup_dir, file_name)

    backup_data = {
        'guild_info': {'name': guild.name, 'icon_url': str(guild.icon.url) if guild.icon else None},
        'roles': [], 'categories': [], 'channels': []
    }

    roles_map = {role.id: role.name for role in guild.roles}
    for role in sorted(guild.roles, key=lambda r: r.position, reverse=True):
        if role.is_default():
            backup_data['everyone_role_name'] = role.name
            continue
        backup_data['roles'].append({
            'name': role.name, 'color': role.color.value, 'permissions': role.permissions.value,
            'hoist': role.hoist, 'mentionable': role.mentionable, 'position': role.position
        })

    for category, channels in guild.by_category():
        if category:
            backup_data['categories'].append({
                'name': category.name, 'position': category.position,
                'overwrites': [{'type': 'role', 'name': roles_map[target.id], 'allow': perms.pair()[0].value, 'deny': perms.pair()[1].value}
                               for target, perms in category.overwrites.items() if isinstance(target, discord.Role) and target.id in roles_map]
            })
        
        for channel in channels:
            channel_data = {
                'name': channel.name, 'type': str(channel.type), 'category': category.name if category else None,
                'position': channel.position, 'topic': getattr(channel, 'topic', None),
                'slowmode_delay': getattr(channel, 'slowmode_delay', None), 'nsfw': channel.is_nsfw(),
                'overwrites': [{'type': 'role', 'name': roles_map[target.id], 'allow': perms.pair()[0].value, 'deny': perms.pair()[1].value}
                               for target, perms in channel.overwrites.items() if isinstance(target, discord.Role) and target.id in roles_map],
                'messages': []
            }
            if backup_messages and isinstance(channel, discord.TextChannel) and channel.permissions_for(guild.me).read_message_history:
                try:
                    async for message in channel.history(limit=messages_limit):
                        channel_data['messages'].append({
                            'author_id': message.author.id, 'author_name': message.author.name, 'content': message.content,
                            'created_at': message.created_at.isoformat(), 'embeds': [e.to_dict() for e in message.embeds],
                            'attachments': [a.url for a in message.attachments]
                        })
                except Exception as e:
                    logger.warning(f"Не удалось забэкапить сообщения в канале {channel.name}: {e}")
            backup_data['channels'].append(channel_data)

    try:
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(backup_data, indent=4))
        
        options = {'messages': backup_messages, 'limit': messages_limit if backup_messages else 0}
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO backups (guild_id, user_id, backup_name, file_name, options_json) VALUES (%s, %s, %s, %s, %s)",
                    (guild.id, user.id, backup_name, file_name, json.dumps(options))
                )
        
        metrics.BACKUPS_CREATED.labels(guild_id=str(guild.id)).inc()
        
        return {'status': 'success', 'options': options}
    except Exception as e:
        logger.error(f"Не удалось сохранить бэкап '{backup_name}' для сервера {guild.id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error'}

async def delete_backup(bot: "SecurityBot", guild_id: int, backup_name: str) -> Dict[str, Any]:
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT file_name FROM backups WHERE guild_id = %s AND backup_name = %s", (guild_id, backup_name))
                result = await cursor.fetchone()
                if not result: return {'status': 'error', 'code': 'not_found'}
                file_name = result[0]
                
                await cursor.execute("DELETE FROM backups WHERE guild_id = %s AND backup_name = %s", (guild_id, backup_name))
        
        file_path = os.path.join(BACKUP_DIR, str(guild_id), file_name)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Не удалось удалить бэкап '{backup_name}' для сервера {guild_id}: {e}", exc_info=True)
        return {'status': 'error', 'code': 'db_error'}

async def load_backup_data(bot: "SecurityBot", guild_id: int, backup_name: str) -> Optional[Dict[str, Any]]:
    try:
        async with bot.db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT file_name FROM backups WHERE guild_id = %s AND backup_name = %s", (guild_id, backup_name))
                result = await cursor.fetchone()
                if not result: return None
                file_name = result[0]
        
        file_path = os.path.join(BACKUP_DIR, str(guild_id), file_name)
        if not os.path.exists(file_path):
            logger.error(f"Файл бэкапа {file_path} не найден на диске, хотя запись в БД есть.")
            return None
            
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            return json.loads(await f.read())
    except Exception as e:
        logger.error(f"Ошибка при загрузке данных бэкапа '{backup_name}' для сервера {guild_id}: {e}", exc_info=True)
        return None

async def apply_backup_to_guild(
    bot: "SecurityBot", 
    guild: discord.Guild, 
    backup_data: Dict[str, Any],
    restore_messages: bool
) -> Dict[str, Any]:
    try:
        logger.info(f"Начинаю очистку сервера {guild.name} ({guild.id})")
        for channel in await guild.fetch_channels(): await channel.delete(reason="Применение бэкапа")
        for role in guild.roles:
            if not role.is_default() and not role.is_bot_managed() and role.position < guild.me.top_role.position:
                await role.delete(reason="Применение бэкапа")

        logger.info(f"Создаю роли для сервера {guild.name}...")
        created_roles = {}
        for role_data in backup_data['roles']:
            role = await guild.create_role(
                name=role_data['name'], permissions=discord.Permissions(role_data['permissions']),
                color=discord.Color(role_data['color']), hoist=role_data['hoist'],
                mentionable=role_data['mentionable'], reason="Применение бэкапа"
            )
            created_roles[role_data['name']] = {'obj': role, 'pos': role_data['position']}
        
        logger.info(f"Выстраиваю иерархию ролей для сервера {guild.name}...")
        sorted_roles_by_pos = sorted(created_roles.values(), key=lambda r: r['pos'], reverse=True)
        role_positions = {role_info['obj']: role_info['pos'] for role_info in sorted_roles_by_pos}
        if role_positions:
            await guild.edit_role_positions(positions=role_positions, reason="Применение бэкапа: иерархия")

        logger.info(f"Создаю каналы и категории для сервера {guild.name}...")
        categories_map = {}
        channels_map = {}
        roles_for_overwrites = {role_info['obj'].name: role_info['obj'] for role_info in created_roles.values()}
        everyone_name = backup_data.get('everyone_role_name', '@everyone')
        roles_for_overwrites[everyone_name] = guild.default_role

        for cat_data in backup_data['categories']:
            overwrites = {}
            for ow_data in cat_data.get('overwrites', []):
                role = roles_for_overwrites.get(ow_data['name'])
                if role:
                    overwrites[role] = discord.PermissionOverwrite.from_pair(discord.Permissions(ow_data['allow']), discord.Permissions(ow_data['deny']))
            category = await guild.create_category(name=cat_data['name'], overwrites=overwrites, reason="Применение бэкапа")
            categories_map[cat_data['name']] = category
        
        for chan_data in backup_data['channels']:
            overwrites = {}
            for ow_data in chan_data.get('overwrites', []):
                role = roles_for_overwrites.get(ow_data['name'])
                if role:
                    overwrites[role] = discord.PermissionOverwrite.from_pair(discord.Permissions(ow_data['allow']), discord.Permissions(ow_data['deny']))
            category = categories_map.get(chan_data['category'])
            
            channel_type = chan_data.get('type', 'text')
            if channel_type == 'text':
                new_channel = await guild.create_text_channel(
                    name=chan_data['name'], topic=chan_data.get('topic'), category=category,
                    slowmode_delay=chan_data.get('slowmode_delay', 0), nsfw=chan_data.get('nsfw', False),
                    overwrites=overwrites, reason="Применение бэкапа"
                )
                channels_map[chan_data['name']] = new_channel
            elif channel_type == 'voice':
                await guild.create_voice_channel(name=chan_data['name'], category=category, overwrites=overwrites, reason="Применение бэкапа")
        
        if restore_messages:
            logger.info(f"Начинаю восстановление сообщений для сервера {guild.name}...")
            for chan_data in backup_data['channels']:
                if chan_data['type'] == 'text' and chan_data.get('messages'):
                    new_channel = channels_map.get(chan_data['name'])
                    if new_channel:
                        for msg_data in reversed(chan_data['messages']):
                            if not msg_data['content'] and not msg_data['embeds'] and not msg_data['attachments']: continue
                            try:
                                await new_channel.send(f"**{msg_data['author_name']}:** {msg_data['content']}")
                            except Exception as e:
                                logger.warning(f"Не удалось восстановить сообщение в {new_channel.name}: {e}")
        
        logger.info(f"Восстановление сервера {guild.name} успешно завершено.")
        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Критическая ошибка при применении бэкапа к серверу {guild.id}: {e}", exc_info=True)
        return {'status': 'error', 'message': str(e)}