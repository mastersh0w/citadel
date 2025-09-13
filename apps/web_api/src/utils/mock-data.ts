// Mock data for the Discord bot dashboard

// Importing types from the main types file
import type {
  Guild,
  User,
  Member,
  Role,
  Channel,
  AuditLogEntry,
  AntiNukeSettings,
  ModerationSettings,
  UserRankingData,
  RankingSettings,
  NotificationSettings,
  BackupData,
  QuarantineEntry,
  WhitelistEntry,
  AccessControlEntry,
  AccessControlSettings,
  Warning
} from '../types';

// Mock data
export const mockGuild: Guild = {
  id: '123456789012345678',
  name: 'Citadel Server',
  icon: null,
  memberCount: 1247,
  region: 'russia',
  verificationLevel: 2
};

export const mockUser: User = {
  id: '987654321098765432',
  username: 'CitadelWarden',
  discriminator: '0001',
  avatar: null,
  bot: true,
  system: false,
  mfaEnabled: true,
  verified: true
};

export const mockAntiNukeSettings: AntiNukeSettings = {
  enabled: true,
  maxChannelDeletes: 5,
  maxRoleDeletes: 3,
  maxBans: 10,
  maxKicks: 8,
  timeWindow: 300, // 5 minutes in seconds
  logChannel: '666666666666666666',
  quarantineRoleId: '999999999999999998',
  instantLogRecovery: true,
  enabled_protections: {
    channel_create: true,
    channel_delete: true,
    channel_update: true,
    role_create: true,
    role_delete: true,
    role_update: true,
    member_ban: true,
    member_kick: true,
    member_update: true,
    guild_update: true,
    webhook_create: true,
    webhook_delete: true,
    webhook_update: true,
    emoji_create: false,
    emoji_delete: false,
    emoji_update: false
  }
};

export const mockModerationSettings: ModerationSettings = {
  automod: {
    enabled: true,
    badWords: ['плохоеслово1', 'плохоеслово2', 'плохоеслово3'],
    spamProtection: true,
    linkProtection: true,
    capsProtection: true,
    mentionSpamProtection: true,
    duplicateMessageProtection: true,
    zalgoProtection: false,
  },
  punishments: {
    warnings: {
      enabled: true,
      maxWarnings: 3,
      action: 'timeout',
      timeoutDuration: 3600, // 1 hour
      warningLifetime: 168, // 7 days in hours
    },
    autoDelete: true,
    logChannel: '666666666666666666',
  },
  filters: {
    profanity: true,
    links: true,
    invites: true,
    mentions: true,
    emojis: false,
    caps: true,
    spam: true,
  }
};

export const mockRankingSettings: RankingSettings = {
  enabled: true,
  experiencePerMessage: 15,
  experiencePerMinuteVoice: 10,
  levelUpMultiplier: 1.2,
  announcementChannel: '777777777777777777',
  announceOnLevelUp: true,
  noXpChannels: ['888888888888888888'],
  noXpRoles: ['999999999999999999'],
  roleRewards: [
    { level: 5, roleId: '111111111111111111', roleName: 'Новичок', removeOnHigher: false },
    { level: 10, roleId: '222222222222222222', roleName: 'Активный', removeOnHigher: true },
    { level: 20, roleId: '333333333333333333', roleName: 'Опытный', removeOnHigher: true },
    { level: 50, roleId: '444444444444444444', roleName: 'Эксперт', removeOnHigher: true },
    { level: 100, roleId: '555555555555555555', roleName: 'Мастер', removeOnHigher: true },
  ],
  customMessages: {
    levelUpMessage: 'Поздравляем {user}! Вы достигли {level} уровня!',
    rankCardMessage: '{user}, ваш ранг: {rank}',
  },
  cooldown: 60,
};

export const mockUserRankings: UserRankingData[] = [
  {
    userId: '111111111111111111',
    guildId: '123456789012345678',
    experience: 25000,
    level: 23,
    messages: 1250,
    voiceTime: 450,
    lastActive: '2024-01-15T10:30:00Z',
    rank: 1
  },
  {
    userId: '222222222222222222',
    guildId: '123456789012345678',
    experience: 18500,
    level: 19,
    messages: 925,
    voiceTime: 380,
    lastActive: '2024-01-15T09:15:00Z',
    rank: 2
  },
  {
    userId: '333333333333333333',
    guildId: '123456789012345678',
    experience: 15200,
    level: 17,
    messages: 760,
    voiceTime: 320,
    lastActive: '2024-01-15T08:45:00Z',
    rank: 3
  },
  {
    userId: '444444444444444444',
    guildId: '123456789012345678',
    experience: 12800,
    level: 15,
    messages: 640,
    voiceTime: 280,
    lastActive: '2024-01-14T22:20:00Z',
    rank: 4
  },
  {
    userId: '555555555555555555',
    guildId: '123456789012345678',
    experience: 9500,
    level: 12,
    messages: 475,
    voiceTime: 190,
    lastActive: '2024-01-14T19:30:00Z',
    rank: 5
  }
];

export const mockNotificationSettings: NotificationSettings = {
  enabled: true,
  channels: {
    moderation: '666666666666666666',
    audit: '777777777777777777',
    welcome: '888888888888888888',
    leave: '999999999999999999',
    general: '111111111111111111'
  },
  events: {
    memberJoin: true,
    memberLeave: true,
    memberBan: true,
    memberUnban: true,
    memberKick: true,
    memberTimeout: true,
    memberUpdate: false,
    memberRoleAdd: true,
    memberRoleRemove: true,
    memberNicknameChange: false,
    channelCreate: true,
    channelDelete: true,
    channelUpdate: false,
    roleCreate: true,
    roleDelete: true,
    roleUpdate: false,
    messageDelete: false,
    messageEdit: false,
    messageBulkDelete: true,
    voiceChannelJoin: false,
    voiceChannelLeave: false,
    voiceChannelMove: false,
    voiceChannelMute: false,
    voiceChannelDeafen: false
  },
  customMessages: {
    welcome: 'Добро пожаловать на сервер, {user}! 🎉',
    leave: '{user} покинул сервер. До свидания! 👋',
    ban: '{user} был забанен модератором {moderator}.',
    unban: '{user} был разбанен.',
    kick: '{user} был исключен модератором {moderator}.',
    timeout: '{user} был отправлен в тайм-аут на {duration}.',
    memberUpdate: 'Информация участника {user} была обновлена.',
    memberRoleAdd: 'Участнику {user} была добавлена роль {role}.',
    memberRoleRemove: 'У участника {user} была удалена роль {role}.',
    memberNicknameChange: 'Участник {user} изменил никнейм на {newNick}.',
    channelCreate: 'Создан новый канал {channel}.',
    channelDelete: 'Удален канал {channel}.',
    channelUpdate: 'Канал {channel} был обновлен.',
    roleCreate: 'Создана новая роль {role}.',
    roleDelete: 'Удалена роль {role}.',
    roleUpdate: 'Роль {role} была обновлена.',
    messageDelete: 'Сообщение от {user} было удалено.',
    messageEdit: 'Сообщение от {user} было отредактировано.',
    messageBulkDelete: 'Было удалено {count} сообщений.',
    voiceChannelJoin: '{user} присоединился к голосовому каналу {channel}.',
    voiceChannelLeave: '{user} покинул голосовой канал {channel}.',
    voiceChannelMove: '{user} был перемещен в канал {channel}.',
    voiceChannelMute: '{user} был отключен в голосовом канале.',
    voiceChannelDeafen: '{user} был оглушен в голосовом канале.'
  }
};

export const mockBackups: BackupData[] = [
  {
    id: '1',
    name: 'Полное резервное копирование с сообщениями',
    createdAt: '2024-01-15T10:00:00Z',
    size: '84.7 МБ',
    channels: 45,
    roles: 12,
    members: 1247,
    messages: 15420,
    status: 'completed',
    autoBackup: true
  },
  {
    id: '2',
    name: 'Еженедельное резервное копирование',
    createdAt: '2024-01-14T03:00:00Z',
    size: '23.8 МБ',
    channels: 44,
    roles: 11,
    members: 1205,
    status: 'completed',
    autoBackup: true
  },
  {
    id: '3',
    name: 'Ручное резервное копирование с сообщениями',
    createdAt: '2024-01-13T15:30:00Z',
    size: '67.3 МБ',
    channels: 42,
    roles: 10,
    members: 1180,
    messages: 8950,
    status: 'completed',
    autoBackup: false
  },
  {
    id: '4',
    name: 'Экстренная резервная копия',
    createdAt: '2024-01-12T20:15:00Z',
    size: '21.5 МБ',
    channels: 41,
    roles: 10,
    members: 1175,
    status: 'completed',
    autoBackup: false
  }
];

export const mockQuarantineEntries = [
  {
    id: '1',
    userId: '444444444444444444',
    username: 'ProblemUser#1234',
    avatar: 'https://cdn.discordapp.com/avatars/444444444444444444/avatar.png',
    reason: 'Массовое удаление каналов (5 каналов за 10 секунд)',
    addedBy: 'Система анти-нюк',
    addedAt: '2024-01-15T10:30:00Z',
    status: 'pending' as const,
    originalRoles: ['Модератор', 'Участник', 'Trusted'],
    notes: 'Пользователь удалил каналы #общение, #новости, #правила, #фан-арт, #мемы'
  },
  {
    id: '2', 
    userId: '555555555555555555',
    username: 'ToxicPlayer#9999',
    avatar: 'https://cdn.discordapp.com/avatars/555555555555555555/avatar.png',
    reason: 'Массовое изменение ролей (удаление разрешений у 8 ролей)',
    addedBy: 'Система анти-нюк',
    addedAt: '2024-01-14T15:45:00Z',
    status: 'banned' as const,
    originalRoles: ['Администратор'],
    notes: 'Пользователь удалил разрешения у всех ролей администрации',
    reviewedBy: 'Владелец#0000',
    reviewedAt: '2024-01-14T16:00:00Z'
  },
  {
    id: '3',
    userId: '666666666666666666',
    username: 'RuleBreaker#5678',
    avatar: null,
    reason: 'Удаление лог-канала',
    addedBy: 'Система анти-нюк',
    addedAt: '2024-01-10T09:15:00Z',
    status: 'restored' as const,
    originalRoles: ['Участник'],
    notes: 'Пользователь удалил канал #audit-logs. Канал был восстановлен автоматически.',
    reviewedBy: 'Владелец#0000',
    reviewedAt: '2024-01-10T09:30:00Z'
  },
  {
    id: '4',
    userId: '777777777777777777',
    username: 'SuspiciousBot#0000',
    avatar: 'https://cdn.discordapp.com/avatars/777777777777777777/avatar.png',
    reason: 'Массовые баны (15 участников за 5 секунд)',
    addedBy: 'Система анти-нюк',
    addedAt: '2024-01-12T20:00:00Z',
    status: 'ignored' as const,
    originalRoles: ['Бот'],
    notes: 'Компрометированный бот-аккаунт. Владелец решил игнорировать.',
    reviewedBy: 'Владелец#0000',
    reviewedAt: '2024-01-12T20:15:00Z'
  }
];

export const mockWhitelist: WhitelistEntry[] = [
  {
    id: '1',
    type: 'user',
    name: 'Админ#0001',
    identifier: '111111111111111111',
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-10T12:00:00Z'
  },
  {
    id: '2',
    type: 'role',
    name: 'Модераторы',
    identifier: '222222222222222222',
    addedBy: 'Админ#0001',
    addedAt: '2024-01-11T14:30:00Z'
  },
  {
    id: '3',
    type: 'channel',
    name: '#администрация',
    identifier: '333333333333333333',
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-12T09:15:00Z'
  },
  {
    id: '4',
    type: 'bot',
    name: 'MEE6',
    identifier: '159985870458322944',
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-13T16:20:00Z'
  },
  {
    id: '5',
    type: 'bot',
    name: 'Carl-bot',
    identifier: '235148962103951360',
    addedBy: 'Админ#0001',
    addedAt: '2024-01-14T11:45:00Z'
  },
  {
    id: '6',
    type: 'bot',
    name: 'Dyno',
    identifier: '155149108183695360',
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-15T08:30:00Z'
  },
  {
    id: '7',
    type: 'user',
    name: 'TopModerator',
    identifier: '777777777777777777',
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-16T10:15:00Z'
  },
  {
    id: '8',
    type: 'channel',
    name: '#важные-объявления',
    identifier: '888888888888888888',
    addedBy: 'Админ#0001',
    addedAt: '2024-01-16T14:30:00Z'
  }
];

export const mockAccessControlEntries: AccessControlEntry[] = [
  {
    id: '1',
    type: 'user',
    name: 'Владелец#0000',
    identifier: '123456789012345678',
    accessLevel: 'owner',
    restrictions: [],
    exemptFeatures: [],
    addedBy: 'System',
    addedAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    type: 'role',
    name: '@everyone',
    identifier: '999999999999999999',
    accessLevel: 'ignored',
    restrictions: ['whitelist', 'anti-nuke', 'backups', 'access-control'],
    exemptFeatures: [],
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-05T12:00:00Z',
    lastModified: '2024-01-10T15:30:00Z'
  },
  {
    id: '3',
    type: 'role',
    name: 'Администрация',
    identifier: '222222222222222222',
    accessLevel: 'admin',
    restrictions: [],
    exemptFeatures: ['access-control'],
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-07T09:15:00Z',
    lastModified: '2024-01-12T11:20:00Z'
  },
  {
    id: '4',
    type: 'role',
    name: 'Модераторы',
    identifier: '333333333333333333',
    accessLevel: 'moderator',
    restrictions: ['anti-nuke', 'backups', 'access-control'],
    exemptFeatures: [],
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-08T14:45:00Z',
    lastModified: '2024-01-13T16:10:00Z'
  },
  {
    id: '5',
    type: 'user',
    name: 'ProblemUser#1234',
    identifier: '444444444444444444',
    accessLevel: 'ignored',
    restrictions: ['whitelist', 'anti-nuke', 'moderation', 'user-ranking', 'role-system', 'banner-manager', 'audit-logs', 'notifications'],
    exemptFeatures: [],
    addedBy: 'Владелец#0000',
    addedAt: '2024-01-14T10:20:00Z',
    lastModified: '2024-01-14T10:20:00Z'
  }
];

export const mockAccessControlSettings: AccessControlSettings = {
  enabled: true,
  ownerOnlyFeatures: ['access-control', 'backups'],
  adminOnlyFeatures: ['anti-nuke', 'whitelist', 'role-system'],
  moderatorOnlyFeatures: ['moderation', 'quarantine', 'audit-logs'],
  defaultIgnoredRoles: ['999999999999999999'], // @everyone
  defaultIgnoredUsers: [],
  bypassAllPermissions: ['123456789012345678'] // Owner ID
};

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    userId: '111111111111111111',
    targetId: '222222222222222222',
    actionType: 1, // Member kick
    reason: 'Нарушение правил сервера',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    userId: '333333333333333333',
    targetId: '444444444444444444',
    actionType: 2, // Member ban
    reason: 'Спам',
    createdAt: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    userId: '555555555555555555',
    actionType: 10, // Channel create
    reason: 'Создание нового канала',
    createdAt: '2024-01-15T08:45:00Z'
  }
];

export const mockRoles: Role[] = [
  {
    id: '111111111111111111',
    name: 'Владелец',
    color: 0xFF0000,
    hoist: true,
    position: 10,
    permissions: '8',
    managed: false,
    mentionable: false
  },
  {
    id: '222222222222222222',
    name: 'Администрация',
    color: 0x00FF00,
    hoist: true,
    position: 9,
    permissions: '8',
    managed: false,
    mentionable: true
  },
  {
    id: '333333333333333333',
    name: 'Модераторы',
    color: 0x0000FF,
    hoist: true,
    position: 8,
    permissions: '268435456',
    managed: false,
    mentionable: true
  },
  {
    id: '444444444444444444',
    name: 'Участники',
    color: 0x999999,
    hoist: false,
    position: 1,
    permissions: '104189504',
    managed: false,
    mentionable: false
  }
];

export const mockChannels: Channel[] = [
  {
    id: '111111111111111111',
    type: 0, // Text channel
    name: 'общение',
    topic: 'Основной канал для общения',
    position: 0,
    parentId: '555555555555555555'
  },
  {
    id: '222222222222222222',
    type: 0, // Text channel
    name: 'правила',
    topic: 'Правила сервера',
    position: 1,
    parentId: '555555555555555555'
  },
  {
    id: '333333333333333333',
    type: 2, // Voice channel
    name: 'Голосовой чат',
    bitrate: 64000,
    userLimit: 10,
    position: 0,
    parentId: '666666666666666666'
  },
  {
    id: '444444444444444444',
    type: 4, // Category
    name: 'ОСНОВНЫЕ',
    position: 0
  },
  {
    id: '555555555555555555',
    type: 4, // Category
    name: 'ТЕКСТОВЫЕ',
    position: 1
  },
  {
    id: '666666666666666666',
    type: 4, // Category
    name: 'ГОЛОСОВЫЕ',
    position: 2
  }
];

// Mock data for Ticket System
export const mockTicketSystemStatus = {
  isSetup: true,
  supportCategoryId: '999999999999999998',
  supportCategoryName: 'ТЕХПОДДЕРЖКА',
  archiveCategoryId: '999999999999999997',
  archiveCategoryName: 'АРХИВ ТИКЕТОВ',
  supportChannelId: '1234567890123456789',
  supportChannelName: 'создать-тикет',
  messageId: '9999999999999999999',
  nextTicketNumber: 12
};

export const mockTicketConfig = {
  enabled: true,
  setupComplete: true,
  supportCategoryId: '999999999999999998',
  archiveCategoryId: '999999999999999997',
  supportChannelId: '1234567890123456789',
  messageTemplate: `🎫 **Система поддержки сервера**

Выберите подходящую категорию для создания тикета:

🔧 **Техническая поддержка** - Проблемы с ботом
⚠️ **Жалобы на пользователей** - Нарушения правил
💡 **Предложения** - Идеи по улучшению
❓ **Другое** - Прочие вопросы

После создания тикета опишите вашу проблему подробно.`,
  maxTicketsPerUser: 3,
  autoCloseAfter: 48, // hours
  transcriptEnabled: true,
  archiveClosedTickets: true,
  supportRoles: ['222222222222222222', '333333333333333333'],
  categories: [
    {
      id: '1',
      name: 'Техническая поддержка',
      description: 'Проблемы с ботом и техническими вопросами',
      emoji: '🔧',
      color: '#3b82f6',
      autoResponse: 'Спасибо за обращение! Наша техническая поддержка рассмотрит ваш запрос в ближайшее время.',
      supportRoles: ['222222222222222222', '333333333333333333'],
      requiredInfo: ['Описание проблемы', 'Действия для воспроизведения'],
      enabled: true
    },
    {
      id: '2',
      name: 'Жалобы на пользователей',
      description: 'Нарушения правил и жалобы на других участников',
      emoji: '⚠️',
      color: '#ef4444',
      autoResponse: 'Ваша жалоба принята. Модерация проверит указанного пользователя.',
      supportRoles: ['333333333333333333'],
      requiredInfo: ['ID нарушителя', 'Описание нарушения', 'Доказательства'],
      enabled: true
    },
    {
      id: '3',
      name: 'Предложения',
      description: 'Идеи по улучшению сервера',
      emoji: '💡',
      color: '#22c55e',
      autoResponse: 'Благодарим за предложение! Администрация рассмотрит вашу идею.',
      supportRoles: ['222222222222222222'],
      requiredInfo: ['Описание предложения', 'Ожидаемый результат'],
      enabled: true
    },
    {
      id: '4',
      name: 'Другое',
      description: 'Прочие вопросы',
      emoji: '❓',
      color: '#8b5cf6',
      autoResponse: 'Спасибо за обращение! Мы ответим вам как можно скорее.',
      supportRoles: ['222222222222222222', '333333333333333333'],
      requiredInfo: ['Описание вопроса'],
      enabled: true
    }
  ],
  autoResponses: {
    ticketCreated: 'Ваш тикет был создан! Пожалуйста, опишите вашу проблему подробно.',
    ticketAssigned: 'Ваш тикет был взят в работу модератором {moderator}.',
    ticketClosed: 'Тикет закрыт. Спасибо за обращение!'
  }
};

// Mock Warnings Data
export const mockWarnings: Warning[] = [
  {
    id: '1',
    incidentNumber: 'WRN-2024-001',
    userId: '444444444444444444',
    username: 'ProblemUser#1234',
    userAvatar: 'https://cdn.discordapp.com/avatars/444444444444444444/avatar.png',
    reason: 'Нарушение правил чата - использование нецензурной лексики',
    issuedBy: '333333333333333333',
    issuedByName: 'Модератор123',
    issuedAt: '2024-01-20T10:30:00Z',
    expiresAt: '2024-01-27T10:30:00Z', // 7 days later
    status: 'active',
    guildId: '123456789012345678'
  },
  {
    id: '2',
    incidentNumber: 'WRN-2024-002',
    userId: '555555555555555555',
    username: 'ToxicPlayer#9999',
    userAvatar: 'https://cdn.discordapp.com/avatars/555555555555555555/avatar.png',
    reason: 'Спам в чате - отправка одинаковых сообщений',
    issuedBy: '222222222222222222',
    issuedByName: 'Админ456',
    issuedAt: '2024-01-19T15:45:00Z',
    expiresAt: '2024-01-26T15:45:00Z',
    status: 'active',
    guildId: '123456789012345678'
  },
  {
    id: '3',
    incidentNumber: 'WRN-2024-003',
    userId: '666666666666666666',
    username: 'RuleBreaker#5678',
    userAvatar: null,
    reason: 'Неуважительное поведение к участникам сервера',
    issuedBy: '333333333333333333',
    issuedByName: 'Модератор123',
    issuedAt: '2024-01-18T12:20:00Z',
    expiresAt: '2024-01-25T12:20:00Z',
    status: 'active',
    guildId: '123456789012345678'
  },
  {
    id: '4',
    incidentNumber: 'WRN-2024-004',
    userId: '777777777777777777',
    username: 'OldOffender#1111',
    userAvatar: 'https://cdn.discordapp.com/avatars/777777777777777777/avatar.png',
    reason: 'Флуд в голосовом канале',
    issuedBy: '222222222222222222',
    issuedByName: 'Админ456',
    issuedAt: '2024-01-10T09:15:00Z',
    expiresAt: '2024-01-17T09:15:00Z',
    status: 'expired',
    guildId: '123456789012345678'
  },
  {
    id: '5',
    incidentNumber: 'WRN-2024-005',
    userId: '888888888888888888',
    username: 'ReformedUser#2222',
    userAvatar: null,
    reason: 'Попытка обхода фильтра слов',
    issuedBy: '333333333333333333',
    issuedByName: 'Модератор123',
    issuedAt: '2024-01-15T16:30:00Z',
    expiresAt: '2024-01-22T16:30:00Z',
    status: 'revoked',
    revokedBy: '222222222222222222',
    revokedAt: '2024-01-16T10:00:00Z',
    guildId: '123456789012345678'
  },
  {
    id: '6',
    incidentNumber: 'WRN-2024-006',
    userId: '999999999999999999',
    username: 'WarningTest#3333',
    userAvatar: 'https://cdn.discordapp.com/avatars/999999999999999999/avatar.png',
    reason: 'Использование caps lock в большом количестве сообщений',
    issuedBy: '333333333333333333',
    issuedByName: 'Модератор123',
    issuedAt: '2024-01-12T14:45:00Z',
    expiresAt: '2024-01-19T14:45:00Z',
    status: 'expired',
    guildId: '123456789012345678'
  },
  {
    id: '7',
    incidentNumber: 'WRN-2024-007',
    userId: '111111111111111111',
    username: 'NewUser#4444',
    userAvatar: 'https://cdn.discordapp.com/avatars/111111111111111111/avatar.png',
    reason: 'Размещение ссылок без разрешения модерации',
    issuedBy: '222222222222222222',
    issuedByName: 'Админ456',
    issuedAt: '2024-01-21T08:15:00Z',
    expiresAt: '2024-01-28T08:15:00Z',
    status: 'active',
    guildId: '123456789012345678'
  },
  {
    id: '8',
    incidentNumber: 'WRN-2024-008',
    userId: '222222222222222223',
    username: 'Repeater#5555',
    userAvatar: null,
    reason: 'Отправка дублирующихся сообщений несколько раз подряд',
    issuedBy: '333333333333333333',
    issuedByName: 'Модератор123',
    issuedAt: '2024-01-20T20:10:00Z',
    expiresAt: '2024-01-27T20:10:00Z',
    status: 'active',
    guildId: '123456789012345678'
  }
];

export const mockTickets = [
  {
    id: '1',
    number: '00008',
    channelId: '1001001001001001001',
    userId: '444444444444444444',
    username: 'TechUser',
    userAvatar: 'https://cdn.discordapp.com/avatars/444444444444444444/avatar.png',
    category: '1',
    categoryName: 'Техническая поддержка',
    subject: 'Бот не отвечает на команды',
    status: 'open' as const,
    priority: 'high' as const,
    createdAt: '2024-01-20T10:30:00Z',
    lastActivity: '2024-01-20T14:15:00Z',
    messages: 8,
    tags: ['bug', 'commands'],
    metadata: {
      firstResponseTime: 15,
      totalResponseTime: 45
    }
  },
  {
    id: '2',
    number: '00009',
    channelId: '1002002002002002002',
    userId: '555555555555555555',
    username: 'ComplainUser',
    userAvatar: null,
    category: '2',
    categoryName: 'Жалобы на пользователей',
    subject: 'Пользователь спамит в чате',
    status: 'assigned' as const,
    assignedTo: '333333333333333333',
    assignedName: 'Модератор123',
    priority: 'medium' as const,
    createdAt: '2024-01-20T09:45:00Z',
    lastActivity: '2024-01-20T13:20:00Z',
    messages: 5,
    tags: ['spam', 'moderation'],
    metadata: {
      firstResponseTime: 8,
      totalResponseTime: 25
    }
  },
  {
    id: '3',
    number: '00010',
    channelId: '1003003003003003003',
    userId: '666666666666666666',
    username: 'IdeaUser',
    userAvatar: 'https://cdn.discordapp.com/avatars/666666666666666666/avatar.png',
    category: '3',
    categoryName: 'Предложения',
    subject: 'Добавить новый канал для игр',
    status: 'waiting' as const,
    assignedTo: '222222222222222222',
    assignedName: 'Админ456',
    priority: 'low' as const,
    createdAt: '2024-01-19T16:20:00Z',
    lastActivity: '2024-01-20T11:30:00Z',
    messages: 12,
    tags: ['suggestion', 'channels'],
    metadata: {
      firstResponseTime: 30,
      totalResponseTime: 120
    }
  },
  {
    id: '4',
    number: '00011',
    channelId: '1004004004004004004',
    userId: '777777777777777777',
    username: 'UrgentUser',
    userAvatar: 'https://cdn.discordapp.com/avatars/777777777777777777/avatar.png',
    category: '4',
    categoryName: 'Другое',
    subject: 'Потерял доступ к аккаунту',
    status: 'open' as const,
    priority: 'urgent' as const,
    createdAt: '2024-01-20T14:00:00Z',
    lastActivity: '2024-01-20T14:30:00Z',
    messages: 3,
    tags: ['account', 'urgent'],
    metadata: {}
  },
  {
    id: '5',
    number: '00005',
    channelId: '1005005005005005005',
    userId: '888888888888888888',
    username: 'ResolvedUser',
    userAvatar: null,
    category: '1',
    categoryName: 'Техническая поддержка',
    subject: 'Проблема с ролями',
    status: 'closed' as const,
    assignedTo: '222222222222222222',
    assignedName: 'Админ456',
    priority: 'medium' as const,
    createdAt: '2024-01-18T12:00:00Z',
    lastActivity: '2024-01-19T09:30:00Z',
    closedAt: '2024-01-19T09:30:00Z',
    closedBy: 'Админ456',
    messages: 15,
    tags: ['roles', 'resolved'],
    metadata: {
      firstResponseTime: 12,
      totalResponseTime: 60,
      satisfaction: 'good' as const,
      feedback: 'Проблема решена быстро, спасибо!'
    }
  },
  {
    id: '6',
    number: '00003',
    channelId: '1006006006006006006',
    userId: '999999999999999999',
    username: 'ArchivedUser',
    userAvatar: 'https://cdn.discordapp.com/avatars/999999999999999999/avatar.png',
    category: '2',
    categoryName: 'Жалобы на пользователей',
    subject: 'Неадекватное поведение в голосовом чате',
    status: 'archived' as const,
    assignedTo: '333333333333333333',
    assignedName: 'Модератор123',
    priority: 'high' as const,
    createdAt: '2024-01-15T08:20:00Z',
    lastActivity: '2024-01-16T14:45:00Z',
    closedAt: '2024-01-16T14:45:00Z',
    closedBy: 'Модератор123',
    archivedAt: '2024-01-17T00:00:00Z',
    messages: 7,
    tags: ['voice', 'behavior', 'resolved'],
    metadata: {
      firstResponseTime: 20,
      totalResponseTime: 85,
      satisfaction: 'very_good' as const,
      feedback: 'Модерация отработала отлично!'
    }
  }
];