# cogs/greeting.py
# -*- coding: utf-8 -*-

import logging
import discord
from discord.ext import commands
import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from main import SecurityBot

logger = logging.getLogger(__name__)

class GreetingCog(commands.Cog, name="Приветствие"):
    """
    Ког, который обрабатывает событие on_guild_join для отправки
    инструкции по настройке владельцу сервера.
    """
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        self.t = self.bot.translator.get

    async def send_welcome_message(self, guild: discord.Guild):
        """
        Собирает и отправляет приветственное сообщение владельцу сервера.
        """
        owner = guild.owner
        if not owner:
            try:
                owner = await guild.fetch_member(guild.owner_id)
            except Exception:
                logger.warning(f"Не удалось найти владельца сервера '{guild.name}' (ID: {guild.id}). Приветственное сообщение не отправлено.")
                return

        lang = await self.bot.get_guild_language(guild.id)
        
        owner_id = os.getenv("OWNER_DISCORD_ID", "ID не указан")
        invite_link = os.getenv("SUPPORT_SERVER_INVITE", "Ссылка не указана")

        # --- Сборка Embed-сообщения ---
        # ИЗМЕНЕНО
        embed = discord.Embed(
            title=self.t("welcome.embed_title", lang=lang, bot_name=self.bot.user.name),
            description=self.t("welcome.embed_description", lang=lang, bot_name=self.bot.user.name, guild_name=guild.name),
            color=discord.Color.green()
        )
        embed.add_field(
            name=self.t("welcome.field_roles_title", lang=lang),
            value=self.t("welcome.field_roles_value", lang=lang, bot_name=self.bot.user.name),
            inline=False
        )
        embed.add_field(
            name=self.t("welcome.field_setup_title", lang=lang),
            value=self.t("welcome.field_setup_value", lang=lang),
            inline=False
        )
        
        embed.add_field(name="\u200b", value="", inline=False)

        embed.add_field(
            name=self.t("welcome.field_moderation_title", lang=lang),
            value=self.t("welcome.field_moderation_value", lang=lang),
            inline=False
        )
        
        embed.add_field(name="\u200b", value="", inline=False)
        
        embed.add_field(
            name=self.t("welcome.field_telegram_title", lang=lang),
            value=self.t("welcome.field_telegram_value", lang=lang),
            inline=False
        )
        
        embed.add_field(name="\u200b", value="", inline=False)

        embed.add_field(
            name=self.t("welcome.field_help_title", lang=lang),
            value=self.t("welcome.field_help_value", lang=lang),
            inline=False
        )
        
        embed.add_field(
            name=self.t("welcome.author_info_title", lang=lang),
            value=self.t("welcome.author_info_value", lang=lang, owner_id=owner_id, invite_link=invite_link),
            inline=False
        )
        
        embed.set_footer(text=self.t("welcome.footer_text", lang=lang))

        # --- Отправка сообщения ---
        try:
            await owner.send(embed=embed)
            logger.info(f"Приветственное сообщение успешно отправлено владельцу сервера '{guild.name}'.")
        except discord.Forbidden:
            logger.warning(f"Не удалось отправить приветственное сообщение в ЛС владельцу сервера '{guild.name}'. Пытаюсь отправить на сервер.")
            
            target_channel = None
            if guild.system_channel and guild.system_channel.permissions_for(guild.me).send_messages:
                target_channel = guild.system_channel
            else:
                for channel in guild.text_channels:
                    if channel.permissions_for(guild.me).send_messages:
                        target_channel = channel
                        break
            
            if target_channel:
                try:
                    await target_channel.send(content=owner.mention, embed=embed)
                    logger.info(f"Резервное приветственное сообщение успешно отправлено в канал #{target_channel.name} на сервере '{guild.name}'.")
                except discord.Forbidden:
                    logger.error(f"Не удалось отправить резервное приветственное сообщение в канал #{target_channel.name} на сервере '{guild.name}' из-за отсутствия прав.")
            else:
                logger.warning(f"На сервере '{guild.name}' не найдено каналов для отправки сообщения. Пытаюсь создать новый канал.")
                try:
                    if guild.me.guild_permissions.manage_channels:
                        new_channel = await guild.create_text_channel(
                            name="security-bot-setup",
                            reason="Создание канала для отправки приветственного сообщения"
                        )
                        await new_channel.send(content=owner.mention, embed=embed)
                        logger.info(f"Создан новый канал #{new_channel.name} и в него отправлено приветственное сообщение на сервере '{guild.name}'.")
                    else:
                        logger.error(f"Не удалось создать новый канал на сервере '{guild.name}' из-за отсутствия права 'Управлять каналами'.")
                except Exception as e:
                    logger.error(f"Произошла ошибка при попытке создать новый канал на сервере '{guild.name}': {e}", exc_info=True)
                    
        except Exception as e:
            logger.error(f"Произошла неизвестная ошибка при отправке приветственного сообщения на сервер '{guild.name}': {e}", exc_info=True)

async def setup(bot: "SecurityBot"):
    await bot.add_cog(GreetingCog(bot))