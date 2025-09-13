# core/metrics.py
# -*- coding: utf-8 -*-

from prometheus_client import Counter, Gauge

# Определяем наши метрики. Это глобальные объекты.

# --- Counters (Счетчики, которые только растут) ---

# Счетчик обработанных слэш-команд.
# 'command' - это "label" (метка), которая позволит нам фильтровать
# данные по имени команды в Grafana.
COMMANDS_PROCESSED = Counter(
    'citadel_commands_processed_total',
    'Total number of slash commands processed',
    ['command_name']
)

# Счетчик срабатываний системы анти-нюка (когда кто-то попадает в карантин).
ANTI_NUKE_TRIGGERS = Counter(
    'citadel_antinuke_triggers_total',
    'Total times the anti-nuke system has quarantined a user',
    ['guild_id']
)

# Счетчик созданных бэкапов.
BACKUPS_CREATED = Counter(
    'citadel_backups_created_total',
    'Total number of server backups created',
    ['guild_id']
)

# --- Gauges (Датчики, которые могут расти и убывать) ---

# Текущее количество серверов, на которых находится бот.
GUILDS_COUNT = Gauge(
    'citadel_guilds_current',
    'Current number of guilds the bot is in'
)

# Текущее количество пользователей в карантине по всем серверам.
QUARANTINED_USERS_COUNT = Gauge(
    'citadel_quarantined_users_current',
    'Current number of users in quarantine across all guilds'
)