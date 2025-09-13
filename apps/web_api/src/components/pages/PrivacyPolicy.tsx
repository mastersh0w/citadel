import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { PageProps } from '@/types';

export function PrivacyPolicy({ onNavigate }: PageProps) {
  const handleBackClick = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Политика конфиденциальности
          </h1>
          <p className="text-muted-foreground">Последнее обновление: 29 августа 2025 г.</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Общая информация</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Данная Политика конфиденциальности описывает, как Citadel Warden собирает, 
              использует и защищает вашу личную информацию при использовании нашего Discord-бота 
              и связанных с ним сервисов.
            </p>
            <p className="mt-2">
              Мы серьезно относимся к защите вашей конфиденциальности и обязуемся обеспечить 
              прозрачность в вопросах сбора и использования данных.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Какие данные мы собираем</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <h4 className="font-semibold">Автоматически собираемые данные:</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>ID пользователя Discord</li>
              <li>ID сервера (гильдии)</li>
              <li>Имя пользователя и дискриминатор</li>
              <li>Роли пользователя на сервере</li>
              <li>Время присоединения к серверу</li>
              <li>Активность в голосовых каналах (время)</li>
              <li>Количество отправленных сообщений</li>
            </ul>

            <h4 className="font-semibold mt-4">Данные настроек:</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Конфигурации модерации</li>
              <li>Настройки анти-нюк защиты</li>
              <li>Пользовательские команды и префиксы</li>
              <li>Настройки автороли и системы уровней</li>
              <li>Логи модерации (предупреждения, баны, кики)</li>
            </ul>

            <h4 className="font-semibold mt-4">Данные, которые мы НЕ собираем:</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Содержимое личных сообщений</li>
              <li>Пароли или токены доступа</li>
              <li>Личную информацию (адрес, телефон, email)</li>
              <li>Финансовую информацию</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Как мы используем данные</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>Собранные данные используются исключительно для:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Обеспечения функционирования основных возможностей бота</li>
              <li>Модерации сервера и предотвращения нарушений</li>
              <li>Ведения системы рейтинга и уровней пользователей</li>
              <li>Создания резервных копий настроек сервера</li>
              <li>Генерации статистики и аналитики для администраторов</li>
              <li>Улучшения функционала и исправления ошибок</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Хранение и защита данных</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <h4 className="font-semibold">Безопасность:</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Все данные шифруются при передаче (TLS/SSL)</li>
              <li>Доступ к данным имеют только авторизованные разработчики</li>
              <li>Используются современные методы защиты баз данных</li>
              <li>Регулярные бэкапы и мониторинг безопасности</li>
            </ul>

            <h4 className="font-semibold mt-4">Срок хранения:</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Данные активности: 90 дней</li>
              <li>Логи модерации: 1 год</li>
              <li>Настройки сервера: пока бот присутствует на сервере</li>
              <li>Статистика пользователей: пока пользователь на сервере</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Передача данных третьим лицам</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>Мы НЕ продаем, НЕ сдаем в аренду и НЕ передаем ваши данные третьим лицам, за исключением:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Требований правоохранительных органов (при наличии судебного предписания)</li>
              <li>Защиты прав и безопасности пользователей</li>
              <li>Соблюдения условий использования Discord</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Ваши права</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>Вы имеете право:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Запросить информацию о том, какие данные мы храним о вас</li>
              <li>Потребовать исправления неточных данных</li>
              <li>Запросить удаление ваших данных</li>
              <li>Ограничить обработку ваших данных</li>
              <li>Отозвать согласие на обработку данных</li>
            </ul>
            <p className="mt-2">
              Для реализации этих прав обращайтесь на наш сервер поддержки или по email.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Файлы Cookie</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Наш веб-интерфейс использует файлы cookie для обеспечения функционирования 
              и улучшения пользовательского опыта. Подробнее в нашей{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal underline"
                onClick={() => onNavigate?.('cookies')}
              >
                Политике использования Cookie
              </Button>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Изменения в политике</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Мы можем обновлять данную Политику конфиденциальности время от времени. 
              О существенных изменениях мы уведомим через Discord-сервер поддержки. 
              Дата последнего обновления указана в начале документа.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Контакты</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>По вопросам конфиденциальности обращайтесь:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Discord: <code>https://discord.gg/citadel-warden</code></li>
              <li>Email: <code>privacy@citadel-warden.bot</code></li>
              <li>GitHub: <code>https://github.com/citadel-warden/privacy</code></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}