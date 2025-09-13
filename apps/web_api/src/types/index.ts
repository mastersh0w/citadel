// TypeScript interfaces and types for the Discord bot dashboard

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot: boolean;
  system?: boolean;
  mfaEnabled?: boolean;
  locale?: string;
  verified?: boolean;
  email?: string;
  flags?: number;
  premiumType?: number;
  publicFlags?: number;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  region: string;
  verificationLevel: number;
}

export interface Role {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
  icon?: string;
  unicodeEmoji?: string;
}

export interface Channel {
  id: string;
  type: number;
  guildId?: string;
  position?: number;
  permissionOverwrites?: any[];
  name?: string;
  topic?: string;
  nsfw?: boolean;
  lastMessageId?: string;
  bitrate?: number;
  userLimit?: number;
  rateLimitPerUser?: number;
  recipients?: User[];
  icon?: string;
  ownerId?: string;
  applicationId?: string;
  parentId?: string;
  lastPinTimestamp?: string;
}

export interface Member {
  user: User;
  nick?: string;
  roles: string[];
  joinedAt: string;
  premiumSince?: string;
  deaf: boolean;
  mute: boolean;
  pending?: boolean;
  permissions?: string;
  communicationDisabledUntil?: string;
}

export interface AntiNukeSettings {
  enabled: boolean;
  maxChannelDeletes: number;
  maxRoleDeletes: number;
  maxBans: number;
  maxKicks: number;
  timeWindow: number;
  logChannel?: string;
  quarantineRoleId?: string; // ID роли карантина
  instantLogRecovery: boolean; // Мгновенное восстановление лог-канала
  enabled_protections: {
    channel_create: boolean;
    channel_delete: boolean;
    channel_update: boolean;
    role_create: boolean;
    role_delete: boolean;
    role_update: boolean;
    member_ban: boolean;
    member_kick: boolean;
    member_update: boolean;
    guild_update: boolean;
    webhook_create: boolean;
    webhook_delete: boolean;
    webhook_update: boolean;
    emoji_create: boolean;
    emoji_delete: boolean;
    emoji_update: boolean;
  };
}

export interface ModerationSettings {
  automod: {
    enabled: boolean;
    badWords: string[];
    spamProtection: boolean;
    linkProtection: boolean;
    capsProtection: boolean;
    mentionSpamProtection: boolean;
    duplicateMessageProtection: boolean;
    zalgoProtection: boolean;
  };
  punishments: {
    warnings: {
      enabled: boolean;
      maxWarnings: number;
      action: 'kick' | 'ban' | 'timeout';
      timeoutDuration: number;
      warningLifetime: number; // hours - время жизни варна
    };
    autoDelete: boolean;
    logChannel?: string;
  };
  filters: {
    profanity: boolean;
    links: boolean;
    invites: boolean;
    mentions: boolean;
    emojis: boolean;
    caps: boolean;
    spam: boolean;
  };
}

// Warning system types
export interface Warning {
  id: string;
  incidentNumber: string; // Уникальный номер инцидента
  userId: string;
  username: string;
  userAvatar?: string;
  reason: string;
  issuedBy: string;
  issuedByName: string;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
  revokedBy?: string;
  revokedAt?: string;
  guildId: string;
}

export interface RankingSettings {
  enabled: boolean;
  experiencePerMessage: number;
  experiencePerMinuteVoice: number;
  levelUpMultiplier: number;
  announcementChannel?: string;
  announceOnLevelUp: boolean;
  noXpChannels: string[];
  noXpRoles: string[];
  roleRewards: Array<{
    level: number;
    roleId: string;
    roleName: string;
    removeOnHigher: boolean;
  }>;
  customMessages: {
    levelUpMessage: string;
    rankCardMessage: string;
  };
  cooldown: number;
}

export interface UserRankingData {
  userId: string;
  guildId: string;
  experience: number;
  level: number;
  messages: number;
  voiceTime: number;
  lastActive: string;
  rank: number;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: {
    moderation: string;
    audit: string;
    welcome: string;
    leave: string;
    general: string;
  };
  events: {
    // Участники
    memberJoin: boolean;
    memberLeave: boolean;
    memberBan: boolean;
    memberUnban: boolean;
    memberKick: boolean;
    memberTimeout: boolean;
    memberUpdate: boolean;
    memberRoleAdd: boolean;
    memberRoleRemove: boolean;
    memberNicknameChange: boolean;
    // Сервер
    channelCreate: boolean;
    channelDelete: boolean;
    channelUpdate: boolean;
    roleCreate: boolean;
    roleDelete: boolean;
    roleUpdate: boolean;
    messageDelete: boolean;
    messageEdit: boolean;
    messageBulkDelete: boolean;
    // Голосовые каналы
    voiceChannelJoin: boolean;
    voiceChannelLeave: boolean;
    voiceChannelMove: boolean;
    voiceChannelMute: boolean;
    voiceChannelDeafen: boolean;
  };
  customMessages: {
    welcome: string;
    leave: string;
    ban: string;
    unban: string;
    kick: string;
    timeout: string;
    memberUpdate: string;
    memberRoleAdd: string;
    memberRoleRemove: string;
    memberNicknameChange: string;
    channelCreate: string;
    channelDelete: string;
    channelUpdate: string;
    roleCreate: string;
    roleDelete: string;
    roleUpdate: string;
    messageDelete: string;
    messageEdit: string;
    messageBulkDelete: string;
    voiceChannelJoin: string;
    voiceChannelLeave: string;
    voiceChannelMove: string;
    voiceChannelMute: string;
    voiceChannelDeafen: string;
  };
}

// Extended notification settings with rich configuration per event
export interface ExtendedEventConfig {
  enabled: boolean;
  message: string;
  channel?: string;
  embedEnabled?: boolean;
  embedColor?: string;
  mentionRoles?: string[];
  cooldown?: number;
  includeTimestamp?: boolean;
  includeThumbnail?: boolean;
  dmParticipant?: boolean; // Отправлять копию в ЛС участнику
  customFields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

export interface ExtendedNotificationSettings extends Omit<NotificationSettings, 'events' | 'customMessages'> {
  events: Record<string, ExtendedEventConfig>;
  globalSettings: {
    defaultEmbedColor: string;
    enableTimestamps: boolean;
    enableThumbnails: boolean;
    defaultCooldown: number;
    maxEmbedFields: number;
  };
}

// Macro system for message templates
export interface MessageMacro {
  key: string;
  description: string;
  category: 'user' | 'server' | 'moderator' | 'datetime' | 'action';
  example?: string;
  conditions?: string[];
}

export interface MacroCategory {
  label: string;
  description: string;
  icon: React.ReactNode;
  variables: MessageMacro[];
}

export interface BackupData {
  id: string;
  name: string;
  createdAt: string;
  size: string;
  channels: number;
  roles: number;
  members: number;
  messages?: number; // Количество сообщений (только если бэкап с сообщениями)
  status: 'completed' | 'in_progress' | 'failed';
  autoBackup: boolean;
}

export interface QuarantineEntry {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  reason: string; // Причина помещения в карантин (действие анти-нюка)
  addedBy: string; // Всегда "Система анти-нюк"
  addedAt: string;
  status: 'pending' | 'banned' | 'restored' | 'ignored'; // pending - ожидает решения
  originalRoles: string[]; // Роли, которые были сняты
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface WhitelistEntry {
  id: string;
  type: 'user' | 'role' | 'channel' | 'bot';
  name: string; // Displayable name (bot/channel/role name or user nickname)
  identifier: string;
  addedBy: string;
  addedAt: string;
}

// Access Control System
export interface AccessControlEntry {
  id: string;
  type: 'user' | 'role';
  name: string;
  identifier: string;
  accessLevel: 'owner' | 'admin' | 'moderator' | 'ignored';
  restrictions: string[];
  exemptFeatures: string[];
  addedBy: string;
  addedAt: string;
  lastModified: string;
}

export interface AccessControlSettings {
  enabled: boolean;
  ownerOnlyFeatures: string[];
  adminOnlyFeatures: string[];
  moderatorOnlyFeatures: string[];
  defaultIgnoredRoles: string[];
  defaultIgnoredUsers: string[];
  bypassAllPermissions: string[];
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  targetId?: string;
  actionType: number;
  reason?: string;
  changes?: any[];
  options?: any;
  createdAt: string;
}

export interface DashboardStats {
  totalMembers: number;
  onlineMembers: number;
  totalChannels: number;
  totalRoles: number;
  messagesLastDay: number;
  voiceTimeLastDay: number;
  moderationActions: {
    bans: number;
    kicks: number;
    timeouts: number;
    warnings: number;
  };
  antiNukeEvents: {
    blocked: number;
    warnings: number;
  };
  backupInfo: {
    lastBackup: string;
    totalBackups: number;
    totalSize: string;
  };
}

export interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Navigation types
export type PageType = 
  | 'dashboard' 
  | 'anti-nuke' 
  | 'backups' 
  | 'whitelist' 
  | 'quarantine' 
  | 'moderation' 
  | 'user-ranking' 
  | 'role-system' 
  | 'banner-manager' 
  | 'audit-logs' 
  | 'notifications'
  | 'access-control'
  | 'settings'
  | 'terms'
  | 'privacy' 
  | 'cookies'
  | 'ticket-system'
  | 'cross-chat'
  | 'music-bot'
  | 'server-stats'
  | 'reaction-roles'
  | 'reaction-roles-wizard'
  | 'custom-commands'
  | 'social-notifications'
  | 'social-notifications-wizard'
  | 'warnings-manager';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Component props types
export interface PageProps {
  onNavigate?: (page: PageType | string) => void;
}

export interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType | string) => void;
  isMobile: boolean;
  isOpen: boolean;
}

export interface HeaderProps {
  onNavigate: (page: PageType | string) => void;
  onToggleSidebar: () => void;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Settings types
export interface AppSettings {
  language: 'ru' | 'en';
  theme: Theme;
  notifications: boolean;
  autoSave: boolean;
  refreshInterval: number;
}

// Permissions
export enum Permission {
  ADMINISTRATOR = 'ADMINISTRATOR',
  MANAGE_GUILD = 'MANAGE_GUILD',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_CHANNELS = 'MANAGE_CHANNELS',
  KICK_MEMBERS = 'KICK_MEMBERS',
  BAN_MEMBERS = 'BAN_MEMBERS',
  CREATE_INSTANT_INVITE = 'CREATE_INSTANT_INVITE',
  CHANGE_NICKNAME = 'CHANGE_NICKNAME',
  MANAGE_NICKNAMES = 'MANAGE_NICKNAMES',
  MANAGE_EMOJIS = 'MANAGE_EMOJIS',
  MANAGE_WEBHOOKS = 'MANAGE_WEBHOOKS',
  VIEW_CHANNEL = 'VIEW_CHANNEL',
  SEND_MESSAGES = 'SEND_MESSAGES',
  SEND_TTS_MESSAGES = 'SEND_TTS_MESSAGES',
  MANAGE_MESSAGES = 'MANAGE_MESSAGES',
  EMBED_LINKS = 'EMBED_LINKS',
  ATTACH_FILES = 'ATTACH_FILES',
  READ_MESSAGE_HISTORY = 'READ_MESSAGE_HISTORY',
  MENTION_EVERYONE = 'MENTION_EVERYONE',
  USE_EXTERNAL_EMOJIS = 'USE_EXTERNAL_EMOJIS',
  ADD_REACTIONS = 'ADD_REACTIONS',
  CONNECT = 'CONNECT',
  SPEAK = 'SPEAK',
  MUTE_MEMBERS = 'MUTE_MEMBERS',
  DEAFEN_MEMBERS = 'DEAFEN_MEMBERS',
  MOVE_MEMBERS = 'MOVE_MEMBERS',
  USE_VAD = 'USE_VAD',
  PRIORITY_SPEAKER = 'PRIORITY_SPEAKER'
}

// Action types for audit logs
export enum AuditLogAction {
  GUILD_UPDATE = 1,
  CHANNEL_CREATE = 10,
  CHANNEL_UPDATE = 11,
  CHANNEL_DELETE = 12,
  CHANNEL_OVERWRITE_CREATE = 13,
  CHANNEL_OVERWRITE_UPDATE = 14,
  CHANNEL_OVERWRITE_DELETE = 15,
  MEMBER_KICK = 20,
  MEMBER_PRUNE = 21,
  MEMBER_BAN_ADD = 22,
  MEMBER_BAN_REMOVE = 23,
  MEMBER_UPDATE = 24,
  MEMBER_ROLE_UPDATE = 25,
  MEMBER_MOVE = 26,
  MEMBER_DISCONNECT = 27,
  BOT_ADD = 28,
  ROLE_CREATE = 30,
  ROLE_UPDATE = 31,
  ROLE_DELETE = 32,
  INVITE_CREATE = 40,
  INVITE_UPDATE = 41,
  INVITE_DELETE = 42,
  WEBHOOK_CREATE = 50,
  WEBHOOK_UPDATE = 51,
  WEBHOOK_DELETE = 52,
  EMOJI_CREATE = 60,
  EMOJI_UPDATE = 61,
  EMOJI_DELETE = 62,
  MESSAGE_DELETE = 72,
  MESSAGE_BULK_DELETE = 73,
  MESSAGE_PIN = 74,
  MESSAGE_UNPIN = 75,
  INTEGRATION_CREATE = 80,
  INTEGRATION_UPDATE = 81,
  INTEGRATION_DELETE = 82
}

// Channel types
export enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_NEWS = 5,
  GUILD_STORE = 6,
  GUILD_NEWS_THREAD = 10,
  GUILD_PUBLIC_THREAD = 11,
  GUILD_PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13
}

// Ticket System Types
export interface TicketSystemStatus {
  isSetup: boolean;
  supportCategoryId?: string;
  supportCategoryName?: string;
  archiveCategoryId?: string;
  archiveCategoryName?: string;
  supportChannelId?: string;
  supportChannelName?: string;
  messageId?: string;
  nextTicketNumber: number;
}

export interface TicketConfig {
  enabled: boolean;
  setupComplete: boolean;
  supportCategoryId?: string;
  archiveCategoryId?: string;
  supportChannelId?: string;
  messageTemplate: string;
  maxTicketsPerUser: number;
  autoCloseAfter: number; // hours
  transcriptEnabled: boolean;
  archiveClosedTickets: boolean;
  supportRoles: string[];
  categories: TicketCategory[];
  autoResponses: {
    ticketCreated: string;
    ticketAssigned: string;
    ticketClosed: string;
  };
}

export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  autoResponse: string;
  supportRoles: string[];
  requiredInfo: string[];
  enabled: boolean;
}

export interface Ticket {
  id: string;
  number: string; // 5-значный номер тикета
  channelId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  category: string;
  categoryName: string;
  subject: string;
  status: 'open' | 'assigned' | 'waiting' | 'closed' | 'archived';
  assignedTo?: string;
  assignedName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  lastActivity: string;
  closedAt?: string;
  closedBy?: string;
  archivedAt?: string;
  messages: number;
  tags: string[];
  metadata: {
    firstResponseTime?: number; // minutes
    totalResponseTime?: number; // minutes
    satisfaction?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
    feedback?: string;
  };
}

// Cross-Server Chat Types
export interface CrossChatConfig {
  enabled: boolean;
  chats: CrossChatInstance[];
  globalSettings: {
    allowedRoles: string[];
    blockedUsers: string[];
    messageFilters: {
      profanity: boolean;
      links: boolean;
      invites: boolean;
      images: boolean;
      embeds: boolean;
    };
    logChannelId?: string;
  };
}

export interface CrossChatInstance {
  id: string;
  name: string;
  description: string;
  role: 'host' | 'member';
  channelId: string;
  channelName: string;
  networkId?: string; // ID сети (для участников)
  networkName?: string; // Название сети
  status: 'active' | 'inactive' | 'pending' | 'error';
  connectedChannels: CrossChatConnection[];
  settings: {
    allowedRoles: string[];
    blockedUsers: string[];
    messageFilters: {
      profanity: boolean;
      links: boolean;
      invites: boolean;
      images: boolean;
      embeds: boolean;
    };
    autoJoin: boolean; // Автоматически подключаться при старте бота
    maxConnections?: number; // Только для хоста
  };
  stats: {
    totalMessages: number;
    activeConnections: number;
    totalMembers: number;
    uptime: number; // seconds
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CrossChatConnection {
  id: string;
  guildId: string;
  guildName: string;
  channelId: string;
  channelName: string;
  memberCount: number;
  status: 'connected' | 'disconnected' | 'pending';
  connectedAt: string;
  lastActivity: string;
  messageCount: number;
  hostChatId?: string; // ID чата-хоста
}

export interface CrossChatKey {
  key: string;
  networkId: string;
  networkName: string;
  hostChatId: string;
  createdAt: string;
  expiresAt: string;
  usedBy?: string;
  used: boolean;
  maxUses?: number;
  currentUses: number;
}

// Music Bot Types
export interface MusicConfig {
  enabled: boolean;
  djRoles: string[];
  voiceChannels: string[];
  maxSongLength: number; // seconds
  maxQueueSize: number;
  defaultVolume: number;
  allowPlaylists: boolean;
  allowedSources: string[];
  voteskipThreshold: number; // percentage
  autoLeave: boolean;
  autoLeaveTimeout: number; // minutes
  logChannelId?: string;
}

export interface MusicQueue {
  guildId: string;
  channelId: string;
  voiceChannelId: string;
  currentSong?: Song;
  queue: Song[];
  volume: number;
  loop: 'none' | 'song' | 'queue';
  shuffle: boolean;
  paused: boolean;
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  url: string;
  thumbnail: string;
  source: 'youtube' | 'spotify' | 'soundcloud' | 'apple-music' | 'deezer' | 'file';
  requestedBy: string;
  requestedByName: string;
  addedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  songs: Song[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  plays: number;
}

// Reaction Roles Types
export interface ReactionRole {
  id: string;
  roleId: string;
  roleName: string;
  roleColor: string;
  emoji: string;
  emojiId?: string;
  emojiName?: string;
  isCustom?: boolean;
  description?: string;
}

export interface ReactionRoleGroup {
  id: string;
  name: string;
  description: string;
  channelId: string;
  channelName: string;
  messageId?: string;
  messageContent: string;
  embedEnabled: boolean;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  maxRoles: number;
  removeOnReactionRemove: boolean;
  requireAllRoles: boolean;
  allowedRoles: string[];
  blockedRoles: string[];
  allowedUsers: string[];
  blockedUsers: string[];
  roles: ReactionRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Social Notifications Types
export interface SocialNotification {
  id: string;
  platform: 'twitch' | 'youtube' | 'kick' | 'tiktok' | 'instagram';
  username: string;
  displayName: string;
  channelId: string;
  channelName: string;
  enabled: boolean;
  events: {
    live: boolean;
    offline: boolean;
    upload: boolean;
    premiere: boolean;
    update: boolean;
  };
  liveMessage: string;
  offlineMessage: string;
  uploadMessage: string;
  premiereMessage: string;
  updateMessage: string;
  embedEnabled: boolean;
  embedColor: string;
  mentionRoles: string[];
  mentionEveryone: boolean;
  deleteOfflineMessage: boolean;
  cooldown: number; // minutes
  isVerified: boolean;
  lastChecked: string;
  lastStatus: 'live' | 'offline' | 'unknown';
  createdAt: string;
  updatedAt: string;
  stats: {
    totalNotifications: number;
    lastNotification?: string;
    averageViewers: number;
    followerCount: number;
  };
}