# cogs/telegram_setup.py
# -*- coding: utf-8 -*-

# Этот ког отвечает за настройку интеграции с Telegram.
# Все описания команд и их параметров теперь снова статичны для стабильности.

import logging
import discord
from discord import app_commands
from discord.ext import commands
import typing
import aiogram

# Импортируем наши кастомные модули
from core import crypto
from core.permissions import is_guild_owner_check

if typing.TYPE_CHECKING:
    from main import SecurityBot

logger = logging.getLogger(__name__)

# =========================================================================================
# >> ПОДГРУППА /setup telegram
# =========================================================================================
@app_commands.guild_only()
@app_commands.default_permissions(administrator=True)
class TelegramSetupGroup(app_commands.Group, name="telegram", description="Настроить оповещения в Telegram"):
    def __init__(self, bot: "SecurityBot"):
        super().__init__()
        self.bot = bot

    @app_commands.command(name="configure", description="Указать токен и ID для оповещений")
    @app_commands.describe(
        user_id="Ваш личный числовой User ID в Telegram",
        bot_token="Токен вашего Telegram-бота от @BotFather"
    )
    @app_commands.check(is_guild_owner_check)
    async def configure(self, interaction: discord.Interaction, user_id: str, bot_token: str):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            int(user_id)
            encrypted_token = crypto.encrypt_data(bot_token)
            
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(
                        "INSERT INTO guild_configs (guild_id, config_key, config_value) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE config_value = %s", 
                        (interaction.guild.id, "telegram_user_id", user_id, user_id)
                    )
                    await cursor.execute(
                        "INSERT INTO guild_configs (guild_id, config_key, config_value) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE config_value = %s", 
                        (interaction.guild.id, "telegram_bot_token_encrypted", encrypted_token, encrypted_token)
                    )
            # ИЗМЕНЕНО
            await interaction.followup.send(t("setup.telegram.success", lang=lang))
        except ValueError:
            await interaction.followup.send("User ID должен быть числом.")
        except Exception as e:
            logger.error(f"Ошибка при настройке Telegram: {e}", exc_info=True)
            # ИЗМЕНЕНО
            await interaction.followup.send(t("system.db_error", lang=lang))

    @app_commands.command(name="test", description="Отправить тестовое оповещение в Telegram")
    @app_commands.check(is_guild_owner_check)
    async def test(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (interaction.guild.id, "telegram_user_id"))
                    user_id_res = await cursor.fetchone()
                    await cursor.execute("SELECT config_value FROM guild_configs WHERE guild_id = %s AND config_key = %s", (interaction.guild.id, "telegram_bot_token_encrypted"))
                    token_res = await cursor.fetchone()
                        
                if not user_id_res or not token_res:
                    # ИЗМЕНЕНО
                    await interaction.followup.send(t("setup.telegram.not_configured", lang=lang))
                    return
                    
                user_id = user_id_res[0]
                token = crypto.decrypt_data(token_res[0])
                
                tg_bot = aiogram.Bot(token=token)
                try:
                    # ИЗМЕНЕНО
                    test_message = t("setup.telegram.test_message", lang=lang)
                    await tg_bot.send_message(chat_id=user_id, text=test_message)
                    # ИЗМЕНЕНО
                    await interaction.followup.send(t("setup.telegram.test_success", lang=lang))
                finally:
                    await tg_bot.session.close()
        except Exception as e:
            logger.error(f"Ошибка при отправке тестового сообщения в Telegram: {e}", exc_info=True)
            # ИЗМЕНЕНО
            await interaction.followup.send(t("setup.telegram.test_fail", lang=lang, error=str(e)))

    @app_commands.command(name="remove", description="Удалить настройки оповещений в Telegram")
    @app_commands.check(is_guild_owner_check)
    async def remove(self, interaction: discord.Interaction):
        lang = await self.bot.get_guild_language(interaction.guild_id)
        t = self.bot.translator.get
        
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            async with self.bot.db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(
                        "DELETE FROM guild_configs WHERE guild_id = %s AND config_key IN (%s, %s)", 
                        (interaction.guild.id, "telegram_user_id", "telegram_bot_token_encrypted")
                    )
            # ИЗМЕНЕНО
            await interaction.followup.send(t("setup.telegram.remove_success", lang=lang))
        except Exception as e:
            logger.error(f"Ошибка при удалении настроек Telegram: {e}", exc_info=True)
            # ИЗМЕНЕНО
            await interaction.followup.send(t("system.db_error", lang=lang))

# =========================================================================================
# >> ОСНОВНОЙ КЛАСС КОГА
# =========================================================================================
class TelegramSetupCog(commands.Cog):
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        # Находим головную группу /setup, которая была создана в cogs/setup.py
        setup_group = next((cmd for cmd in bot.tree.get_commands() if cmd.name == "setup"), None)
        
        if setup_group and isinstance(setup_group, app_commands.Group):
            # "Прикрепляем" нашу подгруппу к головной
            setup_group.add_command(TelegramSetupGroup(bot))
        else:
            # Эта ошибка может возникнуть, если cogs/setup.py не был загружен ПЕРЕД этим файлом.
            logger.error("Не удалось найти головную группу команд 'setup' для добавления подгруппы 'telegram'. Убедитесь, что ког 'setup' загружается раньше 'telegram_setup'.")

async def setup(bot: "SecurityBot"):
    await bot.add_cog(TelegramSetupCog(bot))