# core/telegram_manager.py
# -*- coding: utf-8 -*-

import logging
import aiogram
from core import crypto
import re

logger = logging.getLogger(__name__)

def discord_md_to_html(text: str) -> str:
    """
    Конвертирует базовый Markdown от Discord в HTML для Telegram.
    Также очищает специфичные упоминания Discord.
    """
    # ИСПРАВЛЕНИЕ: Удаляем упоминания Discord (<@...>, <#...>, <@&...>),
    # так как Telegram их не понимает и они вызывают ошибки.
    text = re.sub(r'<(@[!&]?|#)\d+>', '', text)

    # Экранируем специальные HTML символы
    text = text.replace('&', '&').replace('<', '<').replace('>', '>')

    # Заменяем Markdown на HTML теги
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'_(.*?)_', r'<i>\1</i>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    text = re.sub(r'__(.*?)__', r'<u>\1</u>', text)
    text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)
    return text

async def send_telegram_alert(db_pool, guild_id: int, message: str):
    """
    Отправляет оповещение в Telegram, если он настроен для данного сервера.
    """
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (guild_id, "telegram_user_id"))
                user_id_res = await cursor.fetchone()
                await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (guild_id, "telegram_bot_token_encrypted"))
                token_res = await cursor.fetchone()

        if not user_id_res or not token_res:
            return

        user_id = user_id_res[0]
        token = crypto.decrypt_data(token_res[0])

        tg_bot = aiogram.Bot(token=token)
        try:
            message_html = discord_md_to_html(message)
            await tg_bot.send_message(chat_id=user_id, text=message_html, parse_mode="HTML")
        except Exception as e:
            # Ошибка будет залогирована здесь, если отправка не удалась
            logger.error(f"Не удалось отправить оповещение в Telegram для сервера {guild_id}: {e}")
        finally:
            await tg_bot.session.close()

    except Exception as e:
        logger.error(f"Критическая ошибка в send_telegram_alert для сервера {guild_id}: {e}")