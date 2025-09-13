# core/crypto.py
# -*- coding: utf-8 -*-

import os
from cryptography.fernet import Fernet

# Загружаем ключ шифрования из переменных окружения
# Он должен быть постоянным для корректной дешифровки
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY не найден в .env файле! Сгенерируйте его и добавьте.")

# Создаем объект Fernet с нашим ключом
# Ключ должен быть в байтовом виде, поэтому кодируем его
f = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: str) -> str:
    """
    Шифрует строку и возвращает зашифрованную строку.
    """
    encrypted_data = f.encrypt(data.encode())
    return encrypted_data.decode()

def decrypt_data(encrypted_data: str) -> str:
    """
    Дешифрует строку и возвращает исходную.
    """
    decrypted_data = f.decrypt(encrypted_data.encode())
    return decrypted_data.decode()