# core/log_handler.py
# -*- coding: utf-8 -*-

import asyncio
import discord
import logging
from typing import Dict, Optional

class DiscordLogHandler(logging.Handler):
    """
    Кастомный обработчик логов, который асинхронно отправляет записи
    в указанные каналы Discord.
    """
    def __init__(self, channel_ids: Dict[str, int]):
        super().__init__()
        self.channel_ids = channel_ids
        self.queue = asyncio.Queue()
        self.bot: Optional[discord.Client] = None
        self.log_sender_task: Optional[asyncio.Task] = None
        
        self.colors = {
            'STARTUP': discord.Color.blue(),
            'INFO': discord.Color.green(),
            'WARNING': discord.Color.orange(),
            'ERROR': discord.Color.red(),
            'CRITICAL': discord.Color.dark_red()
        }

    def set_bot(self, bot: discord.Client):
        self.bot = bot
        self.log_sender_task = asyncio.create_task(self._log_consumer())
        logging.info("DiscordLogHandler успешно инициализирован и запущен.")

    def emit(self, record: logging.LogRecord):
        if self.bot and not self.bot.is_closed():
            self.queue.put_nowait(record)

    async def _log_consumer(self):
        while self.bot and not self.bot.is_closed():
            try:
                record = await self.queue.get()
                
                channel_id = None
                log_type = 'DEFAULT'
                level = record.levelno
                name = record.name

                if name == 'bot.startup':
                    channel_id = self.channel_ids.get('start')
                    log_type = 'STARTUP'
                elif name == 'bot.info':
                    channel_id = self.channel_ids.get('info')
                    log_type = 'INFO'
                elif level >= logging.ERROR:
                    channel_id = self.channel_ids.get('error')
                    log_type = 'ERROR' if level == logging.ERROR else 'CRITICAL'
                elif level == logging.WARNING: # Добавим обработку для Warning
                    channel_id = self.channel_ids.get('error') # Отправляем туда же, где и ошибки
                    log_type = 'WARNING'
                
                if not channel_id:
                    continue

                channel = self.bot.get_channel(channel_id)
                if not channel:
                    continue

                # --- ИСПРАВЛЕНИЕ: Убираем тройные кавычки (блок кода) ---
                # Теперь Discord будет обрабатывать Markdown (жирный шрифт, упоминания и т.д.)
                embed = discord.Embed(
                    description=record.getMessage(), # Просто передаем сообщение
                    color=self.colors.get(log_type, discord.Color.default()),
                    timestamp=discord.utils.utcnow()
                )
                embed.set_author(name=f"[{log_type}] - {record.name}")
                if record.exc_info:
                    # Трейсбек ошибки по-прежнему лучше оставлять в блоке кода
                    exc_text = self.formatException(record.exc_info)
                    embed.add_field(name="Traceback", value=f"```python\n{exc_text[:1000]}\n```", inline=False)
                
                await channel.send(embed=embed)

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Критическая ошибка в DiscordLogHandler: {e}")

    def close(self):
        if self.log_sender_task:
            self.log_sender_task.cancel()
        super().close()