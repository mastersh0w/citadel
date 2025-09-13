# cogs/status.py
# -*- coding: utf-8 -*-

import os
import logging
import discord
from discord.ext import commands, tasks
from typing import TYPE_CHECKING
from datetime import timedelta
import asyncio

if TYPE_CHECKING:
    from main import SecurityBot

logger = logging.getLogger(__name__)

def format_uptime(duration: timedelta) -> str:
    """Форматирует timedelta в строку "Xd Yh Zm"."""
    days = duration.days
    hours, remainder = divmod(duration.seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes >= 0:
        parts.append(f"{minutes}m")
        
    return " ".join(parts) if parts else "0m"

class StatusCog(commands.Cog, name="Статус"):
    """
    Ког, который управляет отображением статуса аптайма бота.
    """
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        
        # ИЗМЕНЕНИЕ: Оставляем только чтение ID для канала аптайма
        try:
            self.uptime_channel_id = int(os.getenv("UPTIME_CHANNEL_ID", 0))
            if self.uptime_channel_id != 0:
                self.update_status_channels.start()
            else:
                logger.warning("ID канала для аптайма не указан. Фоновая задача статуса не запущена.")
        except (ValueError, TypeError):
            logger.error("Неверный формат UPTIME_CHANNEL_ID в .env. Он должен быть числом. Задача статуса не запущена.")
            self.uptime_channel_id = 0

    def cog_unload(self):
        self.update_status_channels.cancel()

    # ИЗМЕНЕНИЕ: Полностью удален метод get_hosting_days_remaining()

    @tasks.loop(minutes=10)
    async def update_status_channels(self):
        """Фоновая задача, обновляющая название канала статуса аптайма."""
        if self.bot.is_shutting_down:
            return
            
        # ИЗМЕНЕНИЕ: Оставляем только логику для аптайма
        if self.uptime_channel_id != 0:
            uptime_channel = self.bot.get_channel(self.uptime_channel_id)
            if uptime_channel:
                uptime_delta = discord.utils.utcnow() - self.bot.start_time
                uptime_str = format_uptime(uptime_delta)
                new_name = f"⏳ Uptime: {uptime_str}"
                
                # Обновляем, только если название изменилось, чтобы избежать лишних запросов к API
                if uptime_channel.name != new_name:
                    try:
                        await uptime_channel.edit(name=new_name, reason="Обновление статуса")
                        logger.debug(f"Канал аптайма обновлен: '{new_name}'")
                    except Exception as e:
                        logger.warning(f"Ошибка при обновлении канала аптайма (ID: {self.uptime_channel_id}): {e}")
            else:
                logger.error(f"Не удалось найти канал для аптайма с ID: {self.uptime_channel_id}. Отключаю его от обновлений.")
                self.uptime_channel_id = 0

        # ИЗМЕНЕНИЕ: Упрощаем проверку для остановки задачи
        if self.uptime_channel_id == 0:
            logger.warning("Канал аптайма недоступен. Задача обновления статуса останавливается.")
            self.update_status_channels.cancel()

    @update_status_channels.before_loop
    async def before_update_status(self):
        await self.bot.wait_until_ready()
        await asyncio.sleep(10)

async def setup(bot: "SecurityBot"):
    await bot.add_cog(StatusCog(bot))