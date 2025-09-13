// Utility functions for formatting data in the Discord bot dashboard

/**
 * Format a timestamp to a localized date string
 */
export function formatDate(timestamp: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return date.toLocaleDateString('ru-RU', defaultOptions);
}

/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'только что';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} мин. назад`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ч. назад`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} дн. назад`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} мес. назад`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} г. назад`;
}

/**
 * Format a number to a string with thousands separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU');
}

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to a human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)} сек.`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} мин.`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} ч. ${remainingMinutes} мин.` : `${hours} ч.`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days} дн. ${remainingHours} ч.` : `${days} дн.`;
}

/**
 * Format voice time in minutes to a human-readable string
 */
export function formatVoiceTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.floor(minutes)} мин.`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}ч ${Math.floor(remainingMinutes)}м` : `${hours}ч`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}д ${remainingHours}ч` : `${days}д`;
}

/**
 * Format experience points to a human-readable string
 */
export function formatExperience(exp: number): string {
  if (exp < 1000) {
    return exp.toString();
  }
  
  if (exp < 1000000) {
    return (exp / 1000).toFixed(1) + 'К';
  }
  
  return (exp / 1000000).toFixed(1) + 'М';
}

/**
 * Calculate level from experience points
 */
export function calculateLevel(experience: number, multiplier: number = 1.2): number {
  if (experience === 0) return 1;
  return Math.floor(Math.log(experience / 100) / Math.log(multiplier)) + 1;
}

/**
 * Calculate experience needed for a specific level
 */
export function calculateExperienceForLevel(level: number, multiplier: number = 1.2): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(multiplier, level - 1));
}

/**
 * Calculate experience needed for next level
 */
export function calculateExperienceForNextLevel(currentExperience: number, multiplier: number = 1.2): number {
  const currentLevel = calculateLevel(currentExperience, multiplier);
  return calculateExperienceForLevel(currentLevel + 1, multiplier);
}

/**
 * Calculate progress to next level as a percentage
 */
export function calculateLevelProgress(currentExperience: number, multiplier: number = 1.2): number {
  const currentLevel = calculateLevel(currentExperience, multiplier);
  const currentLevelExp = calculateExperienceForLevel(currentLevel, multiplier);
  const nextLevelExp = calculateExperienceForLevel(currentLevel + 1, multiplier);
  const progressExp = currentExperience - currentLevelExp;
  const totalExp = nextLevelExp - currentLevelExp;
  
  return Math.min(100, Math.max(0, (progressExp / totalExp) * 100));
}

/**
 * Format Discord role color to hex string
 */
export function formatRoleColor(color: number): string {
  if (color === 0) return '#99aab5'; // Default Discord role color
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Format Discord permissions to readable strings
 */
export function formatPermissions(permissions: string): string[] {
  const permissionsList: { [key: string]: string } = {
    '8': 'Администратор',
    '268435456': 'Управление сервером',
    '134217728': 'Управление ролями',
    '16': 'Управление каналами',
    '2': 'Исключение участников',
    '4': 'Блокировка участников',
    '1': 'Создание приглашений',
    '67108864': 'Изменение никнейма',
    '134217728': 'Управление никнеймами',
    '1073741824': 'Управление эмодзи',
    '536870912': 'Управление вебхуками',
    '1024': 'Просмотр каналов',
    '2048': 'Отправка сообщений',
    '4096': 'Отправка TTS сообщений',
    '8192': 'Управление сообщениями',
    '16384': 'Встраивание ссылок',
    '32768': 'Прикрепление файлов',
    '65536': 'Чтение истории сообщений',
    '131072': 'Упоминание всех',
    '262144': 'Внешние эмодзи',
    '64': 'Добавление реакций',
    '1048576': 'Подключение к голосовым каналам',
    '2097152': 'Говорить в голосовых каналах',
    '4194304': 'Отключение микрофона участников',
    '8388608': 'Отключение звука участников',
    '16777216': 'Перемещение участников',
    '33554432': 'Использование активации по голосу'
  };
  
  const permBigInt = BigInt(permissions);
  const result: string[] = [];
  
  for (const [perm, name] of Object.entries(permissionsList)) {
    if ((permBigInt & BigInt(perm)) === BigInt(perm)) {
      result.push(name);
    }
  }
  
  return result;
}

/**
 * Format audit log action type to readable string
 */
export function formatAuditLogAction(actionType: number): string {
  const actions: { [key: number]: string } = {
    1: 'Обновление сервера',
    10: 'Создание канала',
    11: 'Обновление канала',
    12: 'Удаление канала',
    13: 'Создание разрешения канала',
    14: 'Обновление разрешения канала',
    15: 'Удаление разрешения канала',
    20: 'Исключение участника',
    21: 'Очистка участников',
    22: 'Блокировка участника',
    23: 'Разблокировка участника',
    24: 'Обновление участника',
    25: 'Обновление ролей участника',
    26: 'Перемещение участника',
    27: 'Отключение участника',
    28: 'Добавление бота',
    30: 'Создание роли',
    31: 'Обновление роли',
    32: 'Удаление роли',
    40: 'Создание приглашения',
    41: 'Обновление приглашения',
    42: 'Удаление приглашения',
    50: 'Создание вебхука',
    51: 'Обновление вебхука',
    52: 'Удаление вебхука',
    60: 'Создание эмодзи',
    61: 'Обновление эмодзи',
    62: 'Удаление эмодзи',
    72: 'Удаление сообщения',
    73: 'Массовое удаление сообщений',
    74: 'Закрепление сообщения',
    75: 'Открепление сообщения',
    80: 'Создание интеграции',
    81: 'Обновление интеграции',
    82: 'Удаление интеграции'
  };
  
  return actions[actionType] || `Неизвестное действие (${actionType})`;
}

/**
 * Format Discord channel type to readable string
 */
export function formatChannelType(type: number): string {
  const types: { [key: number]: string } = {
    0: 'Текстовый канал',
    1: 'Личные сообщения',
    2: 'Голосовой канал',
    3: 'Групповые сообщения',
    4: 'Категория',
    5: 'Канал новостей',
    6: 'Магазин',
    10: 'Новостная ветка',
    11: 'Публичная ветка',
    12: 'Приватная ветка',
    13: 'Трибуна'
  };
  
  return types[type] || `Неизвестный тип (${type})`;
}

/**
 * Format verification level to readable string
 */
export function formatVerificationLevel(level: number): string {
  const levels: { [key: number]: string } = {
    0: 'Отсутствует',
    1: 'Низкий',
    2: 'Средний',
    3: 'Высокий',
    4: 'Очень высокий'
  };
  
  return levels[level] || `Неизвестный уровень (${level})`;
}

/**
 * Truncate string to specified length with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Generate a random color for charts/graphs
 */
export function generateRandomColor(): string {
  const colors = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Validate Discord ID format
 */
export function isValidDiscordId(id: string): boolean {
  return /^\d{17,19}$/.test(id);
}

/**
 * Format Discord mention
 */
export function formatMention(id: string, type: 'user' | 'role' | 'channel' = 'user'): string {
  switch (type) {
    case 'user':
      return `<@${id}>`;
    case 'role':
      return `<@&${id}>`;
    case 'channel':
      return `<#${id}>`;
    default:
      return id;
  }
}

/**
 * Parse Discord mention to get ID
 */
export function parseMention(mention: string): { type: 'user' | 'role' | 'channel' | null; id: string | null } {
  const userMatch = mention.match(/^<@!?(\d+)>$/);
  if (userMatch) {
    return { type: 'user', id: userMatch[1] };
  }
  
  const roleMatch = mention.match(/^<@&(\d+)>$/);
  if (roleMatch) {
    return { type: 'role', id: roleMatch[1] };
  }
  
  const channelMatch = mention.match(/^<#(\d+)>$/);
  if (channelMatch) {
    return { type: 'channel', id: channelMatch[1] };
  }
  
  return { type: null, id: null };
}