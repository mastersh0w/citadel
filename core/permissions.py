# core/permissions.py
# -*- coding: utf-8 -*-

import discord

async def is_guild_owner_check(interaction: discord.Interaction) -> bool:
    """
    Централизованная проверка для слэш-команд, которая возвращает True,
    если автор взаимодействия является владельцем сервера.
    В случае неудачи эта проверка сама отправит пользователю сообщение об ошибке.
    """
    # Проверка, что команда используется на сервере
    if not interaction.guild:
        # Эта проверка не должна сработать, т.к. команды помечены как @app_commands.guild_only(),
        # но лучше перестраховаться.
        if not interaction.response.is_done():
            await interaction.response.send_message("Эта команда может быть использована только на сервере.", ephemeral=True)
        return False

    # Основная проверка на владельца
    is_owner = interaction.user.id == interaction.guild.owner_id

    # Если проверка не пройдена, информируем пользователя
    if not is_owner:
        # Сообщение об ошибке будет отправлено из глобального обработчика ошибок,
        # чтобы использовать текст из локализации. Просто возвращаем False.
        return False

    return True