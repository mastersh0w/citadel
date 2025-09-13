import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cookie } from 'lucide-react';
import { PageProps } from '@/types';

export function CookiePolicy({ onNavigate }: PageProps) {
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
            <Cookie className="h-8 w-8 text-primary" />
            Политика использования Cookie
          </h1>
          <p className="text-muted-foreground">Последнее обновление: 29 августа 2025 г.</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Что такое файлы Cookie</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Файлы cookie (куки) — это небольшие текстовые файлы, которые веб-сайт может сохранить 
              на вашем устройстве при посещении сайта. Они позволяют сайту запомнить ваши действия 
              и предпочтения на определенный период времени.
            </p>
            <p className="mt-2">
              Мы используем cookie для улучшения функционирования веб-панели Citadel Warden 
              и обеспечения более персонализированного пользовательского опыта.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Типы используемых Cookie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                Необходимые Cookie 
                <Badge variant="destructive" className="text-xs">Обязательные</Badge>
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Эти cookie необходимы для базового функционирования сайта и не могут быть отключены.
              </p>
              <ul className="list-disc pl-6 mt-2 text-sm">
                <li><code>session_token</code> - сессия пользователя</li>
                <li><code>csrf_token</code> - защита от CSRF-атак</li>
                <li><code>auth_state</code> - состояние авторизации</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold flex items-center gap-2">
                Функциональные Cookie 
                <Badge variant="secondary" className="text-xs">Опциональные</Badge>
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Сохраняют ваши настройки и предпочтения для улучшения пользовательского опыта.
              </p>
              <ul className="list-disc pl-6 mt-2 text-sm">
                <li><code>theme_preference</code> - выбранная тема (светлая/темная)</li>
                <li><code>language_setting</code> - предпочитаемый язык</li>
                <li><code>sidebar_state</code> - состояние боковой панели</li>
                <li><code>dashboard_layout</code> - настройки компоновки панели</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold flex items-center gap-2">
                Аналитические Cookie 
                <Badge variant="outline" className="text-xs">Опциональные</Badge>
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Помогают понять, как пользователи взаимодействуют с сайтом для улучшения функционала.
              </p>
              <ul className="list-disc pl-6 mt-2 text-sm">
                <li><code>page_views</code> - статистика просмотров страниц</li>
                <li><code>feature_usage</code> - использование функций</li>
                <li><code>error_tracking</code> - отслеживание ошибок</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Срок хранения Cookie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">Сессионные Cookie</h4>
              <p className="text-sm text-muted-foreground">
                Удаляются при закрытии браузера. Используются для поддержания сессии 
                и обеспечения безопасности.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold">Постоянные Cookie</h4>
              <p className="text-sm text-muted-foreground">
                Сохраняются на определенный срок:
              </p>
              <ul className="list-disc pl-6 mt-2 text-sm">
                <li>Настройки темы и языка: 1 год</li>
                <li>Состояние интерфейса: 30 дней</li>
                <li>Аналитические данные: 90 дней</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Управление Cookie</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <h4 className="font-semibold">Настройки браузера:</h4>
            <p>
              Вы можете управлять cookie через настройки своего браузера. Большинство браузеров 
              позволяют просматривать, удалять и блокировать cookie.
            </p>
            
            <h4 className="font-semibold mt-4">Популярные браузеры:</h4>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Google Chrome:</strong> Настройки → Конфиденциальность и безопасность → Файлы cookie</li>
              <li><strong>Firefox:</strong> Настройки → Приватность и защита → Файлы cookie и данные сайтов</li>
              <li><strong>Safari:</strong> Настройки → Конфиденциальность → Управление данными веб-сайтов</li>
              <li><strong>Edge:</strong> Настройки → Файлы cookie и разрешения сайтов</li>
            </ul>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 mt-4">
              <p className="text-sm">
                <strong>Внимание:</strong> Отключение необходимых cookie может нарушить 
                функционирование панели управления.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Сторонние сервисы</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>Мы можем использовать следующие сторонние сервисы, которые устанавливают свои cookie:</p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Discord OAuth:</strong> для авторизации пользователей</li>
              <li><strong>CDN сервисы:</strong> для быстрой загрузки ресурсов</li>
              <li><strong>Мониторинг ошибок:</strong> для отслеживания и исправления проблем</li>
            </ul>
            <p className="mt-2">
              Каждый из этих сервисов имеет свою политику cookie, с которой вы можете ознакомиться 
              на их официальных сайтах.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Согласие на использование Cookie</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              При первом посещении нашего сайта мы запрашиваем ваше согласие на использование cookie. 
              Вы можете:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Принять все cookie</li>
              <li>Выбрать только необходимые</li>
              <li>Настроить использование по категориям</li>
              <li>Отозвать согласие в любое время</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Изменения в политике</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Мы можем обновлять данную Политику использования Cookie. При значительных изменениях 
              мы уведомим вас через баннер на сайте или другими способами. Продолжение использования 
              сайта после изменений означает согласие с обновленной политикой.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Контактная информация</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>Если у вас есть вопросы о нашем использовании cookie, обращайтесь:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Discord сервер: <code>https://discord.gg/citadel-warden</code></li>
              <li>Email: <code>privacy@citadel-warden.bot</code></li>
              <li>GitHub: <code>https://github.com/citadel-warden/privacy</code></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}