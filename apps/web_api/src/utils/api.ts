// apps/web_api/src/utils/api.ts

// --- ОСНОВНАЯ ЧАСТЬ: Базовый клиент для всех запросов к нашему FastAPI бэкенду ---
const API_BASE_URL = 'http://localhost:8001/api';

// !!! ВАЖНО: Замените 'YOUR_GUILD_ID' на реальный ID вашего Discord сервера !!!
// На следующих этапах мы сделаем это значение динамическим, после авторизации.
const GUILD_ID = '1302945292772966460'; 

/**
 * Тип для стандартизированного ответа от нашего API.
 * Фронтенд ожидает, что ответ всегда будет объектом
 * с полями `success` и `data` (или `error`).
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Вспомогательная функция для выполнения всех запросов к нашему API.
 * Она автоматически добавляет базовый URL, заголовки и обрабатывает ошибки.
 * @param endpoint - Путь к API эндпоинту (например, `/guilds/ID/dashboard-stats`)
 * @param options - Стандартные опции для fetch (method, body и т.д.)
 * @returns Промис, который разрешается в объект ApiResponse.
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        // Если ответ сервера - не 2xx, выбрасываем ошибку
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
            throw new Error(errorData.detail || `Network error: ${response.status}`);
        }
        
        const data = await response.json();
        return { success: true, data };

    } catch (error: any) {
        console.error(`API Error fetching ${endpoint}:`, error);
        // В случае любой ошибки возвращаем стандартизированный объект ошибки
        return { success: false, data: null as any, error: error.message };
    }
}
// --- КОНЕЦ ОСНОВНОЙ ЧАСТИ ---


// --- РЕАЛИЗАЦИЯ API-МОДУЛЕЙ ---
// Мы реализуем только те функции, которые нам нужны сейчас,
// остальные оставим как "заглушки", которые возвращают пустые данные.
// Это позволит фронтенду работать без ошибок.

const dashboardApi = {
  // ЭТО РАБОЧАЯ ФУНКЦИЯ, КОТОРАЯ ОБРАЩАЕТСЯ К НАШЕМУ FASTAPI
  getStatistics: () => fetchApi(`/guilds/${GUILD_ID}/dashboard-stats`),
  // Это заглушки. Они будут возвращать пустые данные, пока мы не реализуем их на бэкенде.
  getRecentActivity: async (): Promise<ApiResponse<any[]>> => {
      console.warn("API call to getRecentActivity is not implemented yet.");
      return Promise.resolve({ success: true, data: [] });
  },
  getSystemStatus: async (): Promise<ApiResponse<any>> => {
       console.warn("API call to getSystemStatus is not implemented yet.");
       return Promise.resolve({ success: true, data: { telegramIntegration: { enabled: false, configured: false } } });
  }
};

const quarantineApi = {
  checkRole: async (): Promise<ApiResponse<any>> => {
      console.warn("API call to quarantine.checkRole is not implemented yet.");
      return Promise.resolve({ success: true, data: { exists: true, name: '🚫 Карантин', id: '12345' } }); // Возвращаем заглушку
  },
  // Добавляем пустые заглушки для других функций, чтобы избежать ошибок "is not a function"
  getEntries: async () => Promise.resolve({ success: true, data: [] }),
  reviewEntry: async () => Promise.resolve({ success: true, data: {} })
};


// Пустые заглушки для всех остальных модулей API
const antiNukeApi = {};
const moderationApi = {};
const rankingApi = {};
const notificationsApi = {};
const backupApi = {};
const whitelistApi = {};
const auditApi = {};
const guildApi = {};
const bannerApi = {};
const accessControlApi = {};
const ticketApi = {};


// Экспортируем главный API объект, который используется во всем приложении
export const api = {
  antiNuke: antiNukeApi,
  moderation: moderationApi,
  ranking: rankingApi,
  notifications: notificationsApi,
  backup: backupApi,
  quarantine: quarantineApi,
  whitelist: whitelistApi,
  audit: auditApi,
  guild: guildApi,
  dashboard: dashboardApi,
  banner: bannerApi,
  accessControl: accessControlApi,
  ticket: ticketApi
};