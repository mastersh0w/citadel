// Constants for moderation system

// Punishment types
export const PUNISHMENT_TYPES = {
  WARN: 'warn',
  TIMEOUT: 'timeout',
  KICK: 'kick',
  BAN: 'ban',
  REMOVE_PERMISSIONS: 'remove_permissions'
} as const;

// Punishment durations in seconds
export const TIMEOUT_DURATIONS = {
  '1_MINUTE': 60,
  '5_MINUTES': 300,
  '10_MINUTES': 600,
  '1_HOUR': 3600,
  '1_DAY': 86400,
  '1_WEEK': 604800
} as const;

// Auto-moderation rule types
export const AUTOMOD_RULES = {
  PROFANITY: 'profanity',
  SPAM: 'spam',
  LINKS: 'links',
  INVITES: 'invites',
  MENTIONS: 'mentions',
  CAPS: 'caps',
  EMOJIS: 'emojis',
  DUPLICATE_MESSAGES: 'duplicate_messages'
} as const;

// Discord permissions
export const DISCORD_PERMISSIONS = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  PRIORITY_SPEAKER: 1n << 8n,
  STREAM: 1n << 9n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  VIEW_GUILD_INSIGHTS: 1n << 19n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
  CHANGE_NICKNAME: 1n << 26n,
  MANAGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  REQUEST_TO_SPEAK: 1n << 32n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 36n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,
  MODERATE_MEMBERS: 1n << 40n
} as const;

// Anti-nuke protection types
export const ANTI_NUKE_PROTECTIONS = {
  CHANNEL_CREATE: 'channel_create',
  CHANNEL_DELETE: 'channel_delete',
  CHANNEL_UPDATE: 'channel_update',
  ROLE_CREATE: 'role_create',
  ROLE_DELETE: 'role_delete',
  ROLE_UPDATE: 'role_update',
  MEMBER_BAN: 'member_ban',
  MEMBER_KICK: 'member_kick',
  MEMBER_UPDATE: 'member_update',
  GUILD_UPDATE: 'guild_update',
  WEBHOOK_CREATE: 'webhook_create',
  WEBHOOK_DELETE: 'webhook_delete',
  WEBHOOK_UPDATE: 'webhook_update',
  EMOJI_CREATE: 'emoji_create',
  EMOJI_DELETE: 'emoji_delete',
  EMOJI_UPDATE: 'emoji_update'
} as const;

// Default anti-nuke limits
export const DEFAULT_ANTI_NUKE_LIMITS = {
  MAX_CHANNEL_DELETES: 3,
  MAX_ROLE_DELETES: 2,
  MAX_BANS: 5,
  MAX_KICKS: 10,
  TIME_WINDOW: 60, // minutes
  MAX_WEBHOOKS: 3,
  MAX_EMOJI_DELETES: 5
} as const;

// Verification levels
export const VERIFICATION_LEVELS = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4
} as const;

// Channel types
export const CHANNEL_TYPES = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_ANNOUNCEMENT: 5,
  ANNOUNCEMENT_THREAD: 10,
  PUBLIC_THREAD: 11,
  PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15
} as const;

// Activity types for audit logs
export const ACTIVITY_TYPES = {
  MEMBER_JOIN: 'member_join',
  MEMBER_LEAVE: 'member_leave',
  MEMBER_BAN: 'member_ban',
  MEMBER_UNBAN: 'member_unban',
  MEMBER_KICK: 'member_kick',
  MEMBER_TIMEOUT: 'member_timeout',
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_EDIT: 'message_edit',
  CHANNEL_CREATE: 'channel_create',
  CHANNEL_DELETE: 'channel_delete',
  CHANNEL_UPDATE: 'channel_update',
  ROLE_CREATE: 'role_create',
  ROLE_DELETE: 'role_delete',
  ROLE_UPDATE: 'role_update',
  WEBHOOK_CREATE: 'webhook_create',
  WEBHOOK_DELETE: 'webhook_delete',
  EMOJI_CREATE: 'emoji_create',
  EMOJI_DELETE: 'emoji_delete',
  GUILD_UPDATE: 'guild_update',
  ANTI_NUKE_TRIGGER: 'anti_nuke_trigger',
  BACKUP_CREATE: 'backup_create',
  BACKUP_RESTORE: 'backup_restore'
} as const;

// Default role colors
export const DEFAULT_ROLE_COLORS = {
  DEFAULT: 0x99aab5,
  AQUA: 0x1abc9c,
  DARK_AQUA: 0x11806a,
  GREEN: 0x57f287,
  DARK_GREEN: 0x1f8b4c,
  BLUE: 0x3498db,
  DARK_BLUE: 0x206694,
  PURPLE: 0x9b59b6,
  DARK_PURPLE: 0x71368a,
  LUMINOUS_VIVID_PINK: 0xe91e63,
  DARK_VIVID_PINK: 0xad1457,
  GOLD: 0xf1c40f,
  DARK_GOLD: 0xc27c0e,
  ORANGE: 0xe67e22,
  DARK_ORANGE: 0xa84300,
  RED: 0xe74c3c,
  DARK_RED: 0x992d22,
  GREY: 0x95a5a6,
  DARK_GREY: 0x607d8b,
  DARKER_GREY: 0x546e7a,
  LIGHT_GREY: 0xbcc0c0,
  NAVY: 0x34495e,
  DARK_NAVY: 0x2c3e50,
  YELLOW: 0xffff00
} as const;

// Ranking system constants
export const RANKING_CONSTANTS = {
  DEFAULT_EXP_PER_MESSAGE: 15,
  DEFAULT_EXP_PER_VOICE_MINUTE: 10,
  DEFAULT_LEVEL_MULTIPLIER: 1.2,
  DEFAULT_COOLDOWN: 60, // seconds
  MIN_MESSAGE_LENGTH: 5,
  MAX_EXP_PER_MESSAGE: 100,
  MAX_EXP_PER_VOICE_MINUTE: 50
} as const;

// Badge types for user ranking
export const BADGE_TYPES = {
  NEWCOMER: 'newcomer',
  ACTIVE: 'active',
  VETERAN: 'veteran',
  EXPERT: 'expert',
  MASTER: 'master',
  LEGEND: 'legend',
  VOICE_MASTER: 'voice_master',
  MESSAGE_KING: 'message_king',
  EARLY_BIRD: 'early_bird',
  NIGHT_OWL: 'night_owl'
} as const;

// Notification event types
export const NOTIFICATION_EVENTS = {
  MEMBER_JOIN: 'member_join',
  MEMBER_LEAVE: 'member_leave',
  MEMBER_BAN: 'member_ban',
  MEMBER_UNBAN: 'member_unban',
  MEMBER_KICK: 'member_kick',
  MEMBER_UPDATE: 'member_update',
  ROLE_CREATE: 'role_create',
  ROLE_DELETE: 'role_delete',
  CHANNEL_CREATE: 'channel_create',
  CHANNEL_DELETE: 'channel_delete',
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_EDIT: 'message_edit',
  VOICE_CHANNEL_JOIN: 'voice_channel_join',
  VOICE_CHANNEL_LEAVE: 'voice_channel_leave',
  LEVEL_UP: 'level_up'
} as const;

// Default notification messages
export const DEFAULT_NOTIFICATION_MESSAGES = {
  WELCOME: 'Добро пожаловать на сервер, {user}! 🎉',
  LEAVE: '{user} покинул сервер. До свидания! 👋',
  BAN: '{user} был забанен модератором {moderator}.',
  UNBAN: '{user} был разбанен.',
  KICK: '{user} был исключен модератором {moderator}.',
  LEVEL_UP: 'Поздравляем {user}! Вы достигли {level} уровня!',
  RANK_CARD: '{user}, ваш ранг: {rank}'
} as const;

// Quarantine reasons
export const QUARANTINE_REASONS = [
  'Спам в каналах',
  'Нарушение правил сервера',
  'Токсичное поведение',
  'Оскорбления других участников',
  'Реклама без разрешения',
  'NSFW контент в неподходящих каналах',
  'Использование ботов',
  'Обход блокировки',
  'Подозрительная активность',
  'Другое'
] as const;

// Backup types
export const BACKUP_TYPES = {
  FULL: 'full',
  CHANNELS_ONLY: 'channels_only',
  ROLES_ONLY: 'roles_only',
  SETTINGS_ONLY: 'settings_only'
} as const;

// File size limits
export const FILE_SIZE_LIMITS = {
  AVATAR: 8 * 1024 * 1024, // 8MB
  BANNER: 8 * 1024 * 1024, // 8MB
  EMOJI: 256 * 1024, // 256KB
  BACKUP: 100 * 1024 * 1024 // 100MB
} as const;

// Rate limits (requests per minute)
export const RATE_LIMITS = {
  MESSAGE_CREATE: 10,
  MESSAGE_DELETE: 30,
  CHANNEL_CREATE: 10,
  CHANNEL_DELETE: 10,
  ROLE_CREATE: 10,
  ROLE_DELETE: 10,
  MEMBER_BAN: 5,
  MEMBER_KICK: 10,
  WEBHOOK_CREATE: 5,
  EMOJI_CREATE: 10
} as const;