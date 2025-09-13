# core/translator.py
# -*- coding: utf-8 -*-

import os
import yaml
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class Translator:
    """
    Усовершенствованный класс для управления локализацией.
    Теперь он загружает все доступные языки и может предоставлять переводы
    для любого из них по запросу.
    """
    def __init__(self):
        self.strings: Dict[str, Dict[str, Any]] = {}
        self.default_lang = os.getenv("BOT_LANGUAGE", "en").lower()
        self._load_strings()

    def _load_strings(self):
        """
        Сканирует директорию /locales, находит все .yml файлы,
        и загружает их содержимое в словарь self.strings.
        """
        locales_dir = "locales"
        
        if not os.path.isdir(locales_dir):
            logger.critical(f"Директория локализации '{locales_dir}' не найдена! Бот не может работать без текстов.")
            raise FileNotFoundError(f"Directory not found: {locales_dir}")

        for filename in os.listdir(locales_dir):
            if filename.endswith(".yml"):
                lang_code = filename[:-4].lower()
                filepath = os.path.join(locales_dir, filename)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        self.strings[lang_code] = yaml.safe_load(f)
                    logger.info(f"Успешно загружен языковой файл: {filepath} для языка '{lang_code}'")
                except yaml.YAMLError as e:
                    logger.critical(f"Ошибка парсинга YAML в файле {filepath}: {e}")
                except Exception as e:
                    logger.critical(f"Не удалось загрузить или прочитать файл {filepath}: {e}")
        
        if self.default_lang not in self.strings:
            logger.critical(f"Язык по умолчанию '{self.default_lang}', указанный в .env, не был найден в директории /locales!")

    # --- ИЗМЕНЕННЫЙ МЕТОД ---
    def get(self, key: str, lang: str, **kwargs) -> Any:
        """
        Получает строку перевода для указанного языка, поддерживая вложенные ключи.
        Если ключ не найден, пытается найти его в языке по умолчанию.

        :param key: Ключ строки (например, 'system.permissions').
        :param lang: Код языка (например, 'ru' или 'en').
        :param kwargs: Аргументы для форматирования строки.
        :return: Отформатированную строку, словарь или строку с ошибкой.
        """
        lang = lang.lower()
        
        def _find_key(data_dict: Dict, key_path: str):
            """Вспомогательная функция для поиска вложенного ключа."""
            keys = key_path.split('.')
            current_level = data_dict
            for k in keys:
                if not isinstance(current_level, dict) or k not in current_level:
                    raise KeyError(key_path)
                current_level = current_level[k]
            return current_level

        try:
            # Сначала пытаемся найти ключ в запрошенном языке
            template = _find_key(self.strings.get(lang, {}), key)
        except KeyError:
            try:
                # Если не нашли, пытаемся найти в языке по умолчанию (фоллбэк)
                logger.warning(f"Ключ '{key}' не найден для языка '{lang}'. Используется язык по умолчанию '{self.default_lang}'.")
                template = _find_key(self.strings[self.default_lang], key)
            except KeyError:
                # Если и там нет, возвращаем строку-ошибку
                logger.warning(f"Ключ локализации не найден ни для '{lang}', ни по умолчанию: '{key}'")
                return f"MISSING_TRANSLATION_FOR_{key.upper()}"
        
        if isinstance(template, dict):
            return template
            
        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.error(f"Ошибка форматирования для ключа '{key}': отсутствует аргумент {e}")
            return f"FORMATTING_ERROR_{key.upper()}_MISSING_{str(e).upper()}"
        except Exception as e:
            logger.error(f"Неизвестная ошибка при форматировании строки для ключа '{key}': {e}")
            return f"FORMATTING_ERROR_FOR_{key.upper()}"