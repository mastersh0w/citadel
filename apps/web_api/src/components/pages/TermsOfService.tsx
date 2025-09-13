import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { PageProps } from '@/types';

export function TermsOfService({ onNavigate }: PageProps) {
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
            <FileText className="h-8 w-8 text-primary" />
            Условия использования
          </h1>
          <p className="text-muted-foreground">Последнее обновление: 29 августа 2025 г.</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Принятие условий</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Используя Citadel Warden ("Сервис"), вы соглашаетесь с настоящими Условиями использования. 
              Если вы не согласны с любой частью этих условий, вы не можете использовать наш Сервис.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Описание сервиса</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Citadel Warden - это Discord-бот, предназначенный для модерации и защиты Discord-серверов. 
              Сервис включает в себя:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Системы анти-нюк защиты</li>
              <li>Автоматическую модерацию контента</li>
              <li>Систему рейтинга пользователей</li>
              <li>Резервное копирование сервера</li>
              <li>Управление ролями и разрешениями</li>
              <li>Аудит действий и логирование</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Права и обязанности пользователей</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <h4 className="font-semibold">Права пользователей:</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Использовать все функции бота в соответствии с документацией</li>
              <li>Получать техническую поддержку</li>
              <li>Настраивать параметры бота под нужды своего сервера</li>
            </ul>

            <h4 className="font-semibold mt-4">Обязанности пользователей:</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Не использовать бот для нарушения правил Discord</li>
              <li>Не пытаться обойти защитные механизмы бота</li>
              <li>Не злоупотреблять функциями бота для вреда другим пользователям</li>
              <li>Соблюдать применимое законодательство</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Ограничения использования</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>Запрещается:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Попытки взлома или обратного инжиниринга бота</li>
              <li>Массовая рассылка спама через функции бота</li>
              <li>Использование бота для преследования или травли</li>
              <li>Продажа или передача доступа к боту третьим лицам</li>
              <li>Создание копий или аналогов бота без разрешения</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Конфиденциальность и данные</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Мы собираем минимально необходимую информацию для функционирования бота. 
              Подробная информация о обработке данных доступна в нашей 
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal underline"
                onClick={() => onNavigate?.('privacy')}
              >
                Политике конфиденциальности
              </Button>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Ответственность и гарантии</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Сервис предоставляется "как есть". Мы не несем ответственности за:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Временные сбои в работе бота</li>
              <li>Потерю данных вследствие технических проблем</li>
              <li>Действия пользователей с использованием бота</li>
              <li>Косвенные убытки от использования сервиса</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Изменения условий</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Мы оставляем за собой право изменять данные Условия использования в любое время. 
              Пользователи будут уведомлены об изменениях через Discord-сервер поддержки 
              или другие доступные каналы связи.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Контактная информация</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>По вопросам, связанным с данными Условиями использования, обращайтесь:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Discord сервер поддержки: <code>https://discord.gg/citadel-warden</code></li>
              <li>Email: <code>support@citadel-warden.bot</code></li>
              <li>GitHub: <code>https://github.com/citadel-warden</code></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}