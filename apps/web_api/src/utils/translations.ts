type Language = 'ru' | 'en';

type TranslationKeys = {
  // Header
  'header.toggleMenu': string;
  'header.toggleTheme': string;
  'header.notifications': string;
  'header.settings': string;
  'header.online': string;
  'header.serverName': string;
  'header.members': string;
  'header.botName': string;
  'header.botDescription': string;
  'header.newNotifications': string;
  
  // Navigation
  'nav.dashboard': string;
  'nav.antiNuke': string;
  'nav.backups': string;
  'nav.whitelist': string;
  'nav.quarantine': string;
  'nav.moderation': string;
  'nav.userRanking': string;
  'nav.roleSystem': string;
  'nav.bannerManager': string;
  'nav.auditLogs': string;
  'nav.notifications': string;
  'nav.accessControl': string;
  'nav.settings': string;
  'nav.ticketSystem': string;
  'nav.crossChat': string;
  'nav.musicBot': string;
  'nav.serverStats': string;
  
  // Common
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.add': string;
  'common.enabled': string;
  'common.disabled': string;
  'common.loading': string;
  'common.success': string;
  'common.error': string;
};

const translations: Record<Language, TranslationKeys> = {
  ru: {
    // Header
    'header.toggleMenu': 'Открыть меню',
    'header.toggleTheme': 'Переключить тему',
    'header.notifications': 'Уведомления',
    'header.settings': 'Настройки',
    'header.online': 'Онлайн',
    'header.serverName': 'Citadel Server',
    'header.members': 'участников',
    'header.botName': 'Citadel Warden',
    'header.botDescription': 'Discord Bot Dashboard',
    'header.newNotifications': 'новых уведомления',
    
    // Navigation
    'nav.dashboard': 'Панель управления',
    'nav.antiNuke': 'Анти-нюк',
    'nav.backups': 'Резервные копии',
    'nav.whitelist': 'Белый список',
    'nav.quarantine': 'Карантин',
    'nav.moderation': 'Модерация',
    'nav.userRanking': 'Рейтинг пользователей',
    'nav.roleSystem': 'Система ролей',
    'nav.bannerManager': 'Баннер сервера',
    'nav.auditLogs': 'Аудит',
    'nav.notifications': 'Оповещения',
    'nav.accessControl': 'Управление доступом',
    'nav.settings': 'Настройки',
    'nav.ticketSystem': 'Система тикетов',
    'nav.crossChat': 'Межсерверный чат',
    'nav.musicBot': 'Музыкальный бот',
    'nav.serverStats': 'Статистика сервера',
    
    // Common
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.add': 'Добавить',
    'common.enabled': 'Включено',
    'common.disabled': 'Отключено',
    'common.loading': 'Загрузка...',
    'common.success': 'Успешно',
    'common.error': 'Ошибка',
  },
  en: {
    // Header
    'header.toggleMenu': 'Open menu',
    'header.toggleTheme': 'Toggle theme',
    'header.notifications': 'Notifications',
    'header.settings': 'Settings',
    'header.online': 'Online',
    'header.serverName': 'Citadel Server',
    'header.members': 'members',
    'header.botName': 'Citadel Warden',
    'header.botDescription': 'Discord Bot Dashboard',
    'header.newNotifications': 'new notifications',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.antiNuke': 'Anti-Nuke',
    'nav.backups': 'Backups',
    'nav.whitelist': 'Whitelist',
    'nav.quarantine': 'Quarantine',
    'nav.moderation': 'Moderation',
    'nav.userRanking': 'User Ranking',
    'nav.roleSystem': 'Role System',
    'nav.bannerManager': 'Server Banner',
    'nav.auditLogs': 'Audit Logs',
    'nav.notifications': 'Notifications',
    'nav.accessControl': 'Access Control',
    'nav.settings': 'Settings',
    'nav.ticketSystem': 'Ticket System',
    'nav.crossChat': 'Cross-Server Chat',
    'nav.musicBot': 'Music Bot',
    'nav.serverStats': 'Server Statistics',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.enabled': 'Enabled',
    'common.disabled': 'Disabled',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
  }
};

export function useTranslations(language: Language) {
  return (key: keyof TranslationKeys) => translations[language][key];
}

export type { TranslationKeys };
export { translations };