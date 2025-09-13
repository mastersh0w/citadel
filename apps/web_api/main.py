# apps/web_api/main.py
# -*- coding: utf-8 -*-

import sys
import os
import logging
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, project_root)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random # Для генерации фейковых данных

load_dotenv()
logger = logging.getLogger(__name__)

app = FastAPI(title="Citadel Warden API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=int(os.getenv("REDIS_DB", 0)),
    password=os.getenv("REDIS_PASSWORD") or None,
    decode_responses=True
)

@app.on_event("startup")
async def startup_event():
    try:
        await redis_client.ping()
        print("Успешное подключение к Redis из FastAPI.")
    except Exception as e:
        logger.error(f"Не удалось подключиться к Redis из FastAPI: {e}")

@app.get("/api/guilds/{guild_id}/dashboard-stats")
async def get_dashboard_stats(guild_id: int):
    stats = await redis_client.hgetall(f"stats:{guild_id}")
    if not stats:
        raise HTTPException(status_code=404, detail="Статистика для этого сервера не найдена.")
    
    # --- ИЗМЕНЕНИЕ: Формируем ответ в структуре, которую ожидает фронтенд ---
    # Добавляем заглушки для данных, которых у нас пока нет
    return {
        "totalMembers": int(stats.get("memberCount", 0)),
        "onlineMembers": int(stats.get("onlineCount", 0)),
        "messagesLastDay": random.randint(1000, 5000), # Фейковые данные
        "totalChannels": int(stats.get("textChannelCount", 0)) + int(stats.get("voiceChannelCount", 0)),
        "totalRoles": int(stats.get("roleCount", 0)),
        "antiNukeEvents": {
            "blocked": random.randint(0, 10) # Фейковые данные
        },
        "moderationActions": {
            "bans": random.randint(0, 5),
            "kicks": random.randint(0, 10),
            "timeouts": random.randint(5, 20),
            "warnings": random.randint(10, 50)
        },
        "backupInfo": {
            "lastBackup": (datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat(),
            "totalBackups": random.randint(1, 10),
            "totalSize": f"{random.randint(50, 500)} MB"
        }
    }