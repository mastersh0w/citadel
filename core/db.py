# core/db.py
# -*- coding: utf-8 -*-

import os
import logging
import aiomysql

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.db_host = os.getenv("DB_HOST")
        self.db_port = int(os.getenv("DB_PORT", 3306))
        self.db_user = os.getenv("DB_USER")
        self.db_password = os.getenv("DB_PASSWORD")
        self.db_name = os.getenv("DB_NAME")
        if not all([self.db_host, self.db_user, self.db_password, self.db_name]):
            raise ValueError("Одна или несколько переменных для подключения к БД не установлены в .env")

    async def create_pool(self) -> aiomysql.Pool:
        try:
            pool = await aiomysql.create_pool(
                host=self.db_host, 
                port=self.db_port, 
                user=self.db_user, 
                password=self.db_password, 
                db=self.db_name, 
                autocommit=True
            )
            logger.info("Пул соединений с MySQL успешно создан.")
            return pool
        except Exception as e:
            logger.error(f"Не удалось создать пул соединений с MySQL: {e}")
            raise

    async def initialize_tables(self, pool: aiomysql.Pool):
        """
        Проверяет наличие всех необходимых таблиц при запуске бота
        и создает их, если они отсутствуют.
        """
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                logger.info("Проверка и создание таблиц в базе данных...")
                
                # Таблица 'allowed_bots'
                await cursor.execute("SHOW TABLES LIKE 'allowed_bots'")
                if not await cursor.fetchone():
                    logger.info("Таблица 'allowed_bots' не найдена, создаю новую...")
                    await cursor.execute("""
                        CREATE TABLE allowed_bots (
                            guild_id BIGINT NOT NULL, 
                            bot_id BIGINT NOT NULL, 
                            PRIMARY KEY (guild_id, bot_id)
                        )
                    """)
                    logger.info("Таблица 'allowed_bots' успешно создана.")
                
                # Таблица 'guilds'
                await cursor.execute("SHOW TABLES LIKE 'guilds'")
                if not await cursor.fetchone():
                    logger.info("Таблица 'guilds' не найдена, создаю новую...")
                    await cursor.execute("""
                        CREATE TABLE guilds (
                            guild_id BIGINT PRIMARY KEY, 
                            guild_name VARCHAR(255), 
                            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    logger.info("Таблица 'guilds' успешно создана.")

                # Таблица 'guild_configs'
                await cursor.execute("SHOW TABLES LIKE 'guild_configs'")
                if not await cursor.fetchone():
                    logger.info("Таблица 'guild_configs' не найдена, создаю новую...")
                    await cursor.execute("""
                        CREATE TABLE guild_configs (
                            guild_id BIGINT NOT NULL, 
                            config_key VARCHAR(50) NOT NULL, 
                            config_value TEXT NOT NULL, 
                            PRIMARY KEY (guild_id, config_key)
                        )
                    """)
                    logger.info("Таблица 'guild_configs' успешно создана.")

                # --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
                # Таблица 'quarantined_users'
                await cursor.execute("SHOW TABLES LIKE 'quarantined_users'")
                if not await cursor.fetchone():
                    logger.info("Таблица 'quarantined_users' не найдена, создаю новую...")
                    await cursor.execute("""
                        CREATE TABLE quarantined_users (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id BIGINT NOT NULL, 
                            guild_id BIGINT NOT NULL, 
                            roles_json TEXT NOT NULL, 
                            reason TEXT,
                            status VARCHAR(20) DEFAULT 'active',
                            quarantined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE KEY (user_id, guild_id)
                        )
                    """)
                    logger.info("Таблица 'quarantined_users' успешно создана.")
                    
                # Таблица 'action_permissions'
                await cursor.execute("SHOW TABLES LIKE 'action_permissions'")
                if not await cursor.fetchone():
                    logger.info("Таблица 'action_permissions' не найдена, создаю новую...")
                    await cursor.execute("""
                        CREATE TABLE action_permissions (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            guild_id BIGINT NOT NULL,
                            user_id BIGINT NOT NULL,
                            action_type VARCHAR(50) NOT NULL,
                            expires_at TIMESTAMP NOT NULL,
                            is_used BOOLEAN DEFAULT FALSE
                        )
                    """)
                    logger.info("Таблица 'action_permissions' успешно создана.")

                # Таблица 'backups'
                await cursor.execute("SHOW TABLES LIKE 'backups'")
                if not await cursor.fetchone():
                    logger.info("Таблица 'backups' не найдена, создаю новую...")
                    await cursor.execute("""
                        CREATE TABLE backups (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            guild_id BIGINT NOT NULL,
                            user_id BIGINT NOT NULL,
                            backup_name VARCHAR(100) NOT NULL,
                            file_name VARCHAR(255) NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            options_json TEXT, 
                            UNIQUE KEY (guild_id, backup_name)
                        )
                    """)
                    logger.info("Таблица 'backups' успешно создана.")

                # Таблица 'mutes' (заменяет active_mutes)
                await cursor.execute("SHOW TABLES LIKE 'mutes'")
                if not await cursor.fetchone():
                    logger.info("Таблица 'mutes' не найдена, создаю...")
                    await cursor.execute("""
                        CREATE TABLE mutes (
                            mute_id INT AUTO_INCREMENT PRIMARY KEY,
                            guild_id BIGINT NOT NULL,
                            user_id BIGINT NOT NULL,
                            moderator_id BIGINT NOT NULL,
                            reason TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            end_timestamp TIMESTAMP,
                            status VARCHAR(20) DEFAULT 'active'
                        )
                    """)
                    logger.info("Таблица 'mutes' успешно создана.")

                # Таблица 'warnings'
                await cursor.execute("SHOW TABLES LIKE 'warnings'")
                if not await cursor.fetchone():
                    logger.info("Таблица 'warnings' не найдена, создаю новую...")
                    await cursor.execute("""
                        CREATE TABLE warnings (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            guild_id BIGINT NOT NULL,
                            user_id BIGINT NOT NULL,
                            moderator_id BIGINT NOT NULL,
                            reason TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            status VARCHAR(10) NOT NULL DEFAULT 'active',
                            punishment_id INT NULL DEFAULT NULL
                        )
                    """)
                    logger.info("Таблица 'warnings' успешно создана.")

                logger.info("Проверка таблиц завершена.")