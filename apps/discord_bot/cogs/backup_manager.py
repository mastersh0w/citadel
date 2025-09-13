# cogs/backup_manager.py
# -*- coding: utf-8 -*-

import logging
import discord
from discord import app_commands
from discord.ext import commands, tasks
import datetime
from typing import TYPE_CHECKING, Optional, Tuple
import os
import subprocess
import zipfile
import shutil
from pathlib import Path
import asyncio
import io
import traceback

# Импорты для работы с Google API
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

if TYPE_CHECKING:
    from main import SecurityBot

logger = logging.getLogger(__name__)

def is_bot_owner_classic():
    """
    Проверка для классических команд, является ли автор сообщения
    владельцем бота.
    """
    async def predicate(ctx: commands.Context) -> bool:
        owner_id = os.getenv("OWNER_DISCORD_ID")
        if not owner_id:
            return False
        try:
            return ctx.author.id == int(owner_id)
        except ValueError:
            return False
    return commands.check(predicate)


class BackupManagerCog(commands.Cog, name="Менеджер Бэкапов"):
    """
    Этот ког отвечает за автоматическое и ручное резервное копирование
    данных и кода бота в облачное хранилище Google Drive.
    """
    def __init__(self, bot: "SecurityBot"):
        self.bot = bot
        self.t = self.bot.translator.get
        
        # --- Настройки ---
        self.CWD = Path.cwd()
        self.BOT_PATH = self.CWD
        self.LOCAL_BACKUP_PATH = self.CWD / "backups_system" / "local"
        self.CREDENTIALS_FILE = self.CWD / "credentials.json"
        self.TOKEN_FILE = self.CWD / "token.json"
        
        self.DB_USER = os.getenv("DB_USER")
        self.DB_PASS = os.getenv("DB_PASSWORD")
        self.DB_NAME = os.getenv("DB_NAME")
        self.MYSQLDUMP_PATH = Path("C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqldump.exe")
        
        self.GDRIVE_FOLDER_NAME = "BotBackups"
        self.SCOPES = ["https://www.googleapis.com/auth/drive.file"]
        
        self.DATA_RETENTION_DAYS = 30
        self.CODE_RETENTION_DAYS = 90
        self.CODE_BACKUP_DAY = 6 # 0=Пн, 6=Вс
        
        self._is_task_running = False
        
        self.backup_task.start()

    def cog_unload(self):
        """Останавливает фоновую задачу при выгрузке кога."""
        self.backup_task.cancel()
    
    # --- GOOGLE DRIVE HELPERS ---
    async def get_gdrive_service(self):
        """Аутентифицируется через OAuth 2.0 и возвращает объект сервиса Google Drive."""
        creds = None
        if self.TOKEN_FILE.exists():
            creds = Credentials.from_authorized_user_file(str(self.TOKEN_FILE), self.SCOPES)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                await self.bot.loop.run_in_executor(None, creds.refresh, Request())
            else:
                logger.error("КРИТИЧЕСКАЯ ОШИБКА: Отсутствует token.json. Требуется ручная авторизация.")
                return None
            
            with open(self.TOKEN_FILE, "w") as token:
                token.write(creds.to_json())
        
        return build("drive", "v3", credentials=creds)

    async def find_or_create_folder(self, service, folder_name, parent_id=None):
        """Находит папку по имени или создает ее, если она не существует."""
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        
        response = await self.bot.loop.run_in_executor(None, lambda:
            service.files().list(q=query, spaces="drive", fields="files(id, name)").execute()
        )
        files = response.get("files", [])
        
        if files:
            return files[0].get("id")
        else:
            logger.info(f"Папка '{folder_name}' не найдена, создаю новую...")
            file_metadata = {'name': folder_name, 'mimeType': 'application/vnd.google-apps.folder'}
            if parent_id:
                file_metadata['parents'] = [parent_id]
            folder = await self.bot.loop.run_in_executor(None, lambda:
                service.files().create(body=file_metadata, fields="id").execute()
            )
            return folder.get("id")

    async def upload_file(self, service, file_path, folder_id):
        """Асинхронно загружает файл в указанную папку на Google Drive."""
        file_metadata = {'name': file_path.name, 'parents': [folder_id]}
        media = MediaFileUpload(str(file_path), mimetype='application/zip', resumable=True)
        try:
            await self.bot.loop.run_in_executor(None, lambda:
                service.files().create(body=file_metadata, media_body=media, fields="id").execute()
            )
            logger.info(f"Файл '{file_path.name}' успешно загружен в папку ID: {folder_id}.")
            return True
        except HttpError as error:
            logger.error(f"Произошла ошибка при загрузке файла: {error}")
            return False

    async def cleanup_old_files(self, service, folder_id, days_to_keep):
        """Асинхронно удаляет файлы в папке, которые старше указанного количества дней."""
        if days_to_keep <= 0: return
        
        cutoff_date = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days_to_keep)).isoformat()
        query = f"'{folder_id}' in parents and createdTime < '{cutoff_date}' and trashed=false"
        
        response = await self.bot.loop.run_in_executor(None, lambda:
            service.files().list(q=query, spaces="drive", fields="files(id, name)").execute()
        )
        files_to_delete = response.get("files", [])
        
        for file in files_to_delete:
            try:
                await self.bot.loop.run_in_executor(None, lambda:
                    service.files().delete(fileId=file.get("id")).execute()
                )
                logger.info(f"Удален старый облачный бэкап: {file.get('name')}")
            except HttpError as error:
                logger.error(f"Не удалось удалить старый файл '{file.get('name')}': {error}")

    # --- BACKUP LOGIC HELPERS ---
    async def run_subprocess(self, command, **kwargs):
        """Асинхронно запускает процесс в командной строке."""
        process = await asyncio.create_subprocess_exec(*command, **kwargs)
        await process.wait()
        return process

    async def backup_database(self, temp_dir):
        """Создает дамп базы данных с помощью mysqldump."""
        logger.info("Создание дампа базы данных...")
        dump_file = temp_dir / f"{self.DB_NAME}.sql"
        command = [str(self.MYSQLDUMP_PATH), f"-u{self.DB_USER}", f"-p{self.DB_PASS}", "--routines", "--triggers", self.DB_NAME]
        
        try:
            with open(dump_file, "w", encoding='utf-8') as f:
                process = await self.run_subprocess(command, stdout=f)
                if process.returncode != 0:
                    raise Exception(f"mysqldump завершился с кодом {process.returncode}")
            logger.info("Дамп базы данных успешно создан.")
            return True
        except FileNotFoundError:
            logger.error(f"ОШИБКА: mysqldump.exe не найден по пути '{self.MYSQLDUMP_PATH}'")
            return False
        except Exception as e:
            logger.error(f"ОШИБКА при создании дампа БД: {e}")
            return False

    async def create_archive(self, archive_path, source_dir):
        """Создает zip-архив из содержимого папки."""
        logger.info(f"Создание архива '{archive_path.name}'...")
        try:
            await self.bot.loop.run_in_executor(None, lambda:
                shutil.make_archive(str(archive_path.with_suffix('')), 'zip', str(source_dir))
            )
            logger.info("Архив успешно создан.")
            return True
        except Exception as e:
            logger.error(f"ОШИБКА при создании архива: {e}")
            return False

    async def backup_code(self, final_archive_path):
        """Архивирует код проекта, исключая ненужные папки."""
        logger.info(f"Создание архива кода '{final_archive_path.name}'...")
        exclude_dirs = {'.git', '__pycache__', 'backups_system', 'backups', '.venv', 'logs'}
        try:
            def zip_code():
                with zipfile.ZipFile(final_archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_path in self.BOT_PATH.rglob('*'):
                        if not any(excluded in file_path.parts for excluded in exclude_dirs):
                            zipf.write(file_path, file_path.relative_to(self.BOT_PATH))
            
            await self.bot.loop.run_in_executor(None, zip_code)
            logger.info("Архив кода успешно создан.")
            return True
        except Exception as e:
            logger.error(f"ОШИБКА при архивации кода: {e}")
            return False

    # --- ОСНОВНОЙ МЕТОД, ВЫНЕСЕННЫЙ В ОТДЕЛЬНУЮ ФУНКЦИЮ ---
    async def _run_backup_process(self, manual_run: bool = False) -> Tuple[dict, Optional[str]]:
        if self._is_task_running:
            logger.warning("Попытка запустить бэкап, когда он уже выполняется.")
            return None, None
        
        self._is_task_running = True
        report = {"data_archive": {"status": "не выполнялся", "name": "N/A"},"code_archive": {"status": "не выполнялся", "name": "N/A"}}
        
        logger.info("=== НАЧАЛО ЗАДАЧИ РЕЗЕРВНОГО КОПИРОВАНИЯ ===")
        
        if not self.MYSQLDUMP_PATH.exists():
            logger.critical("Бэкап невозможен: mysqldump.exe не найден.")
            self._is_task_running = False
            report["data_archive"]["status"] = "ошибка"
            error_text = f"mysqldump.exe не найден по пути: {self.MYSQLDUMP_PATH}"
            return report, error_text

        now = datetime.datetime.now()
        datestamp = now.strftime("%Y-%m-%d_%H-%M")
        temp_dir = self.LOCAL_BACKUP_PATH / f"temp_{now.timestamp()}"
        temp_dir.mkdir(parents=True, exist_ok=True)
        bot_folder_name = self.BOT_PATH.name
        error_details = None

        try:
            gdrive_service = await self.get_gdrive_service()
            if not gdrive_service:
                raise Exception("Не удалось получить сервис Google Drive. Возможно, требуется ручная авторизация.")
            
            main_folder_id = await self.find_or_create_folder(gdrive_service, self.GDRIVE_FOLDER_NAME)
            month_year_str = now.strftime("%m-%Y")
            month_folder_id = await self.find_or_create_folder(gdrive_service, month_year_str, parent_id=main_folder_id)
            
            manual_folder_id = None
            weekly_folder_id = None
            
            # --- Бэкап данных ---
            data_prefix = "MANUAL_DATA" if manual_run else "DAILY_DATA"
            logger.info(f"--- Начинаю бэкап данных ({data_prefix}) ---")
            data_archive_name = f"{data_prefix}_{bot_folder_name}_{datestamp}.zip"
            
            report["data_archive"]["name"] = data_archive_name
            if await self.backup_database(temp_dir):
                server_backups_path = self.BOT_PATH / "backups"
                if server_backups_path.exists():
                    await self.bot.loop.run_in_executor(None, lambda: shutil.copytree(server_backups_path, temp_dir / "backups"))

                local_data_save_path = self.LOCAL_BACKUP_PATH / month_year_str
                if manual_run:
                    local_data_save_path /= "Manual"
                local_data_save_path.mkdir(parents=True, exist_ok=True)
                data_archive_path = local_data_save_path / data_archive_name

                if await self.create_archive(data_archive_path, temp_dir):
                    data_upload_folder_id = month_folder_id
                    if manual_run:
                        manual_folder_id = await self.find_or_create_folder(gdrive_service, "Manual", parent_id=month_folder_id)
                        data_upload_folder_id = manual_folder_id
                    
                    if await self.upload_file(gdrive_service, data_archive_path, data_upload_folder_id):
                        report["data_archive"]["status"] = "успешно"
                        await self.cleanup_old_files(gdrive_service, data_upload_folder_id, self.DATA_RETENTION_DAYS)
                    else:
                        report["data_archive"]["status"] = "ошибка"
                else:
                    report["data_archive"]["status"] = "ошибка"
            else:
                report["data_archive"]["status"] = "ошибка"

            # --- Бэкап кода ---
            if manual_run or now.weekday() == self.CODE_BACKUP_DAY:
                code_prefix = "MANUAL_CODE" if manual_run else "WEEKLY_CODE"
                logger.info(f"--- Начинаю бэкап кода ({code_prefix}) ---")
                code_archive_name = f"{code_prefix}_{bot_folder_name}_{datestamp}.zip"
                
                report["code_archive"]["name"] = code_archive_name
                
                local_code_save_path = self.LOCAL_BACKUP_PATH / month_year_str
                if manual_run:
                    local_code_save_path /= "Manual"
                else:
                    local_code_save_path /= "Weekly"
                local_code_save_path.mkdir(parents=True, exist_ok=True)
                code_archive_path = local_code_save_path / code_archive_name
                
                if await self.backup_code(code_archive_path):
                    code_upload_folder_id = None
                    if manual_run:
                        if not manual_folder_id:
                            manual_folder_id = await self.find_or_create_folder(gdrive_service, "Manual", parent_id=month_folder_id)
                        code_upload_folder_id = manual_folder_id
                    else:
                        weekly_folder_id = await self.find_or_create_folder(gdrive_service, "Weekly", parent_id=month_folder_id)
                        code_upload_folder_id = weekly_folder_id

                    if await self.upload_file(gdrive_service, code_archive_path, code_upload_folder_id):
                        report["code_archive"]["status"] = "успешно"
                        await self.cleanup_old_files(gdrive_service, code_upload_folder_id, self.CODE_RETENTION_DAYS)
                    else:
                        report["code_archive"]["status"] = "ошибка"
                else:
                    report["code_archive"]["status"] = "ошибка"
            else:
                report["code_archive"]["status"] = "пропущено"
        
        except Exception as e:
            error_details = traceback.format_exc()
            logger.critical(f"КРИТИЧЕСКАЯ ОШИБКА в задаче бэкапа: {e}", exc_info=True)
            report["data_archive"]["status"] = "ошибка"
            report["code_archive"]["status"] = "ошибка"
        finally:
            if temp_dir.exists():
                await self.bot.loop.run_in_executor(None, lambda: shutil.rmtree(temp_dir))
            
            for f in self.LOCAL_BACKUP_PATH.rglob('*.zip'):
                if (now - datetime.datetime.fromtimestamp(f.stat().st_ctime)).days > 2:
                    logger.info(f"Удаление старого локального бэкапа: {f.name}")
                    f.unlink()
            logger.info("=== ЗАДАЧА РЕЗЕРВНОГО КОПИРОВАНИЯ ЗАВЕРШЕНА ===")
            self._is_task_running = False
            return report, error_details

    async def _send_backup_report(self, report: dict, recipient: discord.User, error_details: Optional[str] = None):
        """Форматирует и отправляет отчет о бэкапе в ЛС."""
        if not report: return
        try:
            lang = self.bot.default_language
            status_map = {
                "успешно": self.t("backup.system.report.status_success", lang=lang),
                "ошибка": self.t("backup.system.report.status_failed", lang=lang),
                "пропущено": self.t("backup.system.report.status_skipped", lang=lang),
                "не выполнялся": "N/A"
            }
            embed = discord.Embed(title=self.t("backup.system.report.title", lang=lang), color=discord.Color.blue(), timestamp=discord.utils.utcnow())
            embed.add_field(name=self.t("backup.system.report.data_archive_field", lang=lang), value=f"`{report['data_archive']['name']}`\nСтатус: {status_map.get(report['data_archive']['status'])}", inline=False)
            embed.add_field(name=self.t("backup.system.report.code_archive_field", lang=lang), value=f"`{report['code_archive']['name']}`\nСтатус: {status_map.get(report['code_archive']['status'])}", inline=False)
            if self.bot.guilds:
                embed.set_footer(text=self.t("backup.system.report.footer", lang=lang, guild_name=self.bot.guilds[0].name))
            
            error_file = None
            if error_details:
                buffer = io.StringIO(error_details)
                error_file = discord.File(buffer, filename="backup_error_log.txt")
                embed.color = discord.Color.red()
                embed.add_field(name="🚨 Детали ошибки", value="Полный лог ошибки прикреплен к этому сообщению.", inline=False)

            await recipient.send(embed=embed, file=error_file)
        except Exception as e:
            logger.error(f"Не удалось отправить отчет о бэкапе владельцу: {e}")

    # --- АВТОМАТИЧЕСКАЯ ЗАДАЧА ---
    @tasks.loop(hours=24)
    async def backup_task(self):
        report, error_details = await self._run_backup_process(manual_run=False)
        owner_id_str = os.getenv("OWNER_DISCORD_ID")
        if owner_id_str and report:
            try:
                owner = await self.bot.fetch_user(int(owner_id_str))
                await self._send_backup_report(report, owner, error_details)
            except Exception as e:
                logger.error(f"Не удалось найти владельца ({owner_id_str}) для отправки отчета: {e}")

    @backup_task.before_loop
    async def before_backup_task(self):
        await self.bot.wait_until_ready()
        now = datetime.datetime.now().astimezone()
        target_time = now.replace(hour=3, minute=0, second=0, microsecond=0)
        if now > target_time:
            target_time += datetime.timedelta(days=1)
        seconds_until_target = (target_time - now).total_seconds()
        logger.info(f"Следующий автоматический бэкап через {seconds_until_target / 3600:.2f} часов.")
        await asyncio.sleep(seconds_until_target)

    # --- Префиксные команды для управления ---
    @commands.command(name="backup-now", help="[Владелец] Немедленно запустить полный процесс бэкапа")
    @is_bot_owner_classic()
    async def backup_now_classic(self, ctx: commands.Context):
        lang = self.bot.default_language
        
        if self._is_task_running:
            await ctx.author.send(self.t("backup.system.task_already_running", lang=lang))
            return
            
        await ctx.author.send(self.t("backup.system.now_started", lang=lang))
        
        if ctx.guild:
            try: await ctx.message.delete()
            except discord.Forbidden: pass

        async def run_and_report():
            report, error_details = await self._run_backup_process(manual_run=True)
            await self._send_backup_report(report, ctx.author, error_details)
        self.bot.loop.create_task(run_and_report())

    @commands.command(name="backup-status", help="[Владелец] Показать время до следующего автоматического бэкапа")
    @is_bot_owner_classic()
    async def backup_status_classic(self, ctx: commands.Context):
        lang = self.bot.default_language
        next_run = self.backup_task.next_iteration
        
        if not next_run:
            await ctx.author.send("Задача бэкапа не запущена.")
            return
            
        delta = next_run - discord.utils.utcnow()
        hours, remainder = divmod(int(delta.total_seconds()), 3600)
        minutes, _ = divmod(remainder, 60)
        
        await ctx.author.send(self.t("backup.system.status_message", lang=lang, hours=hours, minutes=minutes))
        
        if ctx.guild:
            try: await ctx.message.delete()
            except discord.Forbidden: pass

async def setup(bot: "SecurityBot"):
    await bot.add_cog(BackupManagerCog(bot))