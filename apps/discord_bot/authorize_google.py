# authorize_google.py
import os
from google_auth_oauthlib.flow import InstalledAppFlow

# Убедись, что файл credentials.json находится в той же папке
CREDENTIALS_FILE = "credentials.json"
SCOPES = ["https://www.googleapis.com/auth/drive.file"]

def main():
    """Запускает процесс аутентификации и создает token.json."""
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"Ошибка: Файл '{CREDENTIALS_FILE}' не найден.")
        print("Пожалуйста, убедитесь, что вы скачали его из Google Cloud Console и положили в эту папку.")
        return

    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    
    print("\nСейчас в вашем браузере откроется страница для входа в аккаунт Google.")
    print("Пожалуйста, выберите тот же аккаунт, который вы использовали для создания проекта в Google Cloud.")
    print("Вам может потребоваться нажать 'Дополнительные настройки' -> 'Перейти на страницу (небезопасно)'. Это нормально для тестовых приложений.\n")
    
    creds = flow.run_local_server(port=0)

    # Сохраняем учетные данные для дальнейшего использования
    with open("token.json", "w") as token:
        token.write(creds.to_json())
    
    print("\n✅ Успешно! Файл 'token.json' был создан в этой папке.")
    print("Теперь загрузите этот файл в корневую директорию вашего бота на сервере.")

if __name__ == "__main__":
    main()