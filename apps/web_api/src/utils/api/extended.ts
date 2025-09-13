// Extended API endpoints for additional features

import { ApiResponse, createMockResponse, createMockError } from './base';
import { 
  RankingSettings,
  UserRankingData,
  NotificationSettings,
  BackupData,
  QuarantineEntry,
  WhitelistEntry,
  AccessControlEntry,
  AccessControlSettings,
  AuditLogEntry,
  Role,
  Channel,
  TicketSystemStatus,
  TicketConfig,
  Ticket,
  TicketCategory,
  Warning
} from '@/types';

class ExtendedApi {
  // User Ranking System
  async getRankingSettings(): Promise<ApiResponse<RankingSettings>> {
    const { mockRankingSettings } = await import('@/utils/mock-data');
    return createMockResponse(mockRankingSettings);
  }

  async updateRankingSettings(settings: Partial<RankingSettings>): Promise<ApiResponse<RankingSettings>> {
    const { mockRankingSettings } = await import('@/utils/mock-data');
    const updated = { ...mockRankingSettings, ...settings };
    return createMockResponse(updated);
  }

  async getUserRankings(limit = 10): Promise<ApiResponse<UserRankingData[]>> {
    const { mockUserRankings } = await import('@/utils/mock-data');
    return createMockResponse(mockUserRankings.slice(0, limit));
  }

  async resetUserExperience(userId: string): Promise<ApiResponse<boolean>> {
    // Simulate resetting user experience
    return createMockResponse(true);
  }

  async addRoleReward(level: number, roleId: string, roleName: string): Promise<ApiResponse<any[]>> {
    const { mockRankingSettings } = await import('@/utils/mock-data');
    const newReward = { level, roleId, roleName, removeOnHigher: false };
    const updated = [...mockRankingSettings.roleRewards, newReward];
    return createMockResponse(updated);
  }

  async removeRoleReward(level: number): Promise<ApiResponse<any[]>> {
    const { mockRankingSettings } = await import('@/utils/mock-data');
    const updated = mockRankingSettings.roleRewards.filter(reward => reward.level !== level);
    return createMockResponse(updated);
  }

  // Notification System
  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    const { mockNotificationSettings } = await import('@/utils/mock-data');
    return createMockResponse(mockNotificationSettings);
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> {
    const { mockNotificationSettings } = await import('@/utils/mock-data');
    const updated = { ...mockNotificationSettings, ...settings };
    return createMockResponse(updated);
  }

  async testNotification(type: string, channelId: string): Promise<ApiResponse<boolean>> {
    // Simulate sending test notification
    return createMockResponse(true, 1000);
  }

  // Backup System
  async getBackups(): Promise<ApiResponse<BackupData[]>> {
    const { mockBackups } = await import('@/utils/mock-data');
    return createMockResponse(mockBackups);
  }

  async createBackup(name: string, includeMessages: boolean = false): Promise<ApiResponse<BackupData>> {
    const channels = Math.floor(Math.random() * 10) + 40;
    const messagesCount = includeMessages ? Math.floor(Math.random() * 10000) + 5000 : undefined;
    
    const newBackup: BackupData = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      size: `${(Math.random() * 10 + (includeMessages ? 50 : 15)).toFixed(1)} МБ`,
      channels,
      roles: Math.floor(Math.random() * 5) + 10,
      members: Math.floor(Math.random() * 200) + 1000,
      messages: messagesCount,
      status: 'completed',
      autoBackup: false
    };
    return createMockResponse(newBackup, includeMessages ? 3000 : 2000); // Longer delay for backup with messages
  }

  async deleteBackup(backupId: string): Promise<ApiResponse<boolean>> {
    return createMockResponse(true);
  }

  async restoreBackup(backupId: string): Promise<ApiResponse<boolean>> {
    // Simulate backup restoration
    return createMockResponse(true, 3000);
  }

  async updateBackupSettings(settings: any): Promise<ApiResponse<any>> {
    // Simulate updating backup settings
    return createMockResponse(settings, 1000);
  }

  // Quarantine System
  async getQuarantineEntries(): Promise<ApiResponse<any[]>> {
    const { mockQuarantineEntries } = await import('@/utils/mock-data');
    return createMockResponse(mockQuarantineEntries);
  }

  async reviewQuarantineEntry(entryId: string, action: 'ban' | 'restore' | 'ignore', notes?: string): Promise<ApiResponse<any>> {
    const { mockQuarantineEntries } = await import('@/utils/mock-data');
    const entry = mockQuarantineEntries.find(e => e.id === entryId);
    if (!entry) {
      return createMockError('Запись не найдена');
    }

    const actionMap = {
      ban: 'banned',
      restore: 'restored', 
      ignore: 'ignored'
    };

    const updatedEntry = {
      ...entry,
      status: actionMap[action],
      notes: notes || entry.notes,
      reviewedBy: 'Владелец#0000',
      reviewedAt: new Date().toISOString()
    };

    return createMockResponse(updatedEntry);
  }

  async createQuarantineRole(): Promise<ApiResponse<{ id: string; name: string }>> {
    // Create quarantine role with restricted permissions
    const quarantineRole = {
      id: Date.now().toString(),
      name: 'Карантин'
    };
    return createMockResponse(quarantineRole);
  }

  async checkQuarantineRole(): Promise<ApiResponse<{ exists: boolean; name?: string; id?: string }>> {
    // Simulate checking if quarantine role exists
    // By default, we'll return that it doesn't exist, but users can create it
    const roleExists = Math.random() > 0.7; // 30% chance it exists for demo purposes
    
    if (roleExists) {
      return createMockResponse({
        exists: true,
        name: 'Карантин',
        id: '987654321098765432'
      });
    } else {
      return createMockResponse({
        exists: false
      });
    }
  }

  // Entity Resolution
  private async resolveEntityName(type: 'user' | 'role' | 'channel' | 'bot', identifier: string): Promise<string> {
    // Simulate API calls to Discord to get entity names
    const mockNames: { [key: string]: { [id: string]: string } } = {
      user: {
        '111111111111111111': 'Админ#0001',
        '222222222222222222': 'Модератор#1234',
        '777777777777777777': 'TopModerator',
        '444444444444444444': 'ProblemUser#1234',
        '123456789012345678': 'Владелец#0000'
      },
      role: {
        '222222222222222222': 'Модераторы',
        '333333333333333333': 'Администрация',
        '444444444444444444': 'Участники',
        '999999999999999999': '@everyone'
      },
      channel: {
        '333333333333333333': '#администрация',
        '888888888888888888': '#важные-объявления',
        '111111111111111111': '#общение',
        '555555555555555555': '#правила'
      },
      bot: {
        '159985870458322944': 'MEE6',
        '235148962103951360': 'Carl-bot',
        '155149108183695360': 'Dyno',
        '987654321098765432': 'CitadelWarden'
      }
    };

    return mockNames[type]?.[identifier] || `${type === 'user' ? 'Пользователь' : type === 'role' ? 'Роль' : type === 'channel' ? 'Канал' : 'Бот'}#${identifier.slice(-4)}`;
  }

  // Whitelist System
  async getWhitelistEntries(): Promise<ApiResponse<WhitelistEntry[]>> {
    const { mockWhitelist } = await import('@/utils/mock-data');
    return createMockResponse(mockWhitelist);
  }

  async addWhitelistEntry(entry: { type: 'user' | 'role' | 'channel' | 'bot'; identifier: string; }): Promise<ApiResponse<WhitelistEntry>> {
    // Auto-resolve entity name by ID
    const resolvedName = await this.resolveEntityName(entry.type, entry.identifier);
    
    const newEntry: WhitelistEntry = {
      type: entry.type,
      name: resolvedName,
      identifier: entry.identifier,
      id: Date.now().toString(),
      addedBy: 'Текущий пользователь#0001',
      addedAt: new Date().toISOString()
    };
    return createMockResponse(newEntry);
  }

  async removeWhitelistEntry(entryId: string): Promise<ApiResponse<boolean>> {
    return createMockResponse(true);
  }

  async updateWhitelistEntry(entryId: string, updates: { identifier?: string }): Promise<ApiResponse<WhitelistEntry>> {
    const { mockWhitelist } = await import('@/utils/mock-data');
    const existingEntry = mockWhitelist.find(e => e.id === entryId);
    if (!existingEntry) {
      return createMockError('Запись не найдена');
    }
    
    let updatedEntry = { ...existingEntry };
    
    // If identifier is being updated, resolve the new name
    if (updates.identifier && updates.identifier !== existingEntry.identifier) {
      const resolvedName = await this.resolveEntityName(existingEntry.type, updates.identifier);
      updatedEntry = {
        ...existingEntry,
        identifier: updates.identifier,
        name: resolvedName
      };
    }
    
    return createMockResponse(updatedEntry);
  }

  // Audit Logs
  async getAuditLogs(limit = 50): Promise<ApiResponse<AuditLogEntry[]>> {
    const { mockAuditLogs } = await import('@/utils/mock-data');
    return createMockResponse(mockAuditLogs.slice(0, limit));
  }

  async getAuditLogsByUser(userId: string): Promise<ApiResponse<AuditLogEntry[]>> {
    const { mockAuditLogs } = await import('@/utils/mock-data');
    const userLogs = mockAuditLogs.filter(log => log.userId === userId);
    return createMockResponse(userLogs);
  }

  async getAuditLogsByAction(actionType: number): Promise<ApiResponse<AuditLogEntry[]>> {
    const { mockAuditLogs } = await import('@/utils/mock-data');
    const actionLogs = mockAuditLogs.filter(log => log.actionType === actionType);
    return createMockResponse(actionLogs);
  }

  // Role Management
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const { mockRoles } = await import('@/utils/mock-data');
    return createMockResponse(mockRoles);
  }

  async createRole(role: Omit<Role, 'id' | 'position' | 'managed'>): Promise<ApiResponse<Role>> {
    const newRole: Role = {
      ...role,
      id: Date.now().toString(),
      position: Math.floor(Math.random() * 10) + 1,
      managed: false
    };
    return createMockResponse(newRole);
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<ApiResponse<Role>> {
    const { mockRoles } = await import('@/utils/mock-data');
    const existingRole = mockRoles.find(r => r.id === roleId);
    if (!existingRole) {
      return createMockError('Роль не найдена');
    }
    const updatedRole = { ...existingRole, ...updates };
    return createMockResponse(updatedRole);
  }

  async deleteRole(roleId: string): Promise<ApiResponse<boolean>> {
    return createMockResponse(true);
  }

  // Channel Management
  async getChannels(): Promise<ApiResponse<Channel[]>> {
    const { mockChannels } = await import('@/utils/mock-data');
    return createMockResponse(mockChannels);
  }

  // Banner Management
  async getCurrentBanner(): Promise<ApiResponse<string | null>> {
    // Return null for no banner, or a URL for existing banner
    return createMockResponse(null);
  }

  async uploadBanner(bannerFile: File): Promise<ApiResponse<string>> {
    // Simulate banner upload - return a mock URL as confirmation
    const mockBannerUrl = URL.createObjectURL(bannerFile);
    return createMockResponse(mockBannerUrl, 2000);
  }

  async removeBanner(): Promise<ApiResponse<boolean>> {
    return createMockResponse(true);
  }

  async getBannerSettings(): Promise<ApiResponse<any>> {
    // Return mock banner settings
    const mockBannerSettings = {
      showParameters: false,
      selectedParameters: [],
      position: 'bottom-left',
      textSize: 'medium'
    };
    return createMockResponse(mockBannerSettings);
  }

  async saveBannerSettings(settings: any): Promise<ApiResponse<any>> {
    // Simulate saving banner settings
    return createMockResponse(settings, 1000);
  }

  async updateParameterStatus(parameterId: string, enabled: boolean): Promise<ApiResponse<boolean>> {
    // Simulate updating parameter status
    return createMockResponse(true, 500);
  }

  async generatePreview(bannerSettings: any): Promise<ApiResponse<string>> {
    // Simulate generating banner preview
    const previewUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARCAGQAeADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6/ooooAKKKKACiiigAooooAKKKKACiiigAooooA==';
    return createMockResponse(previewUrl, 1500);
  }

  // Access Control System
  async getAccessControlEntries(): Promise<ApiResponse<AccessControlEntry[]>> {
    const { mockAccessControlEntries } = await import('@/utils/mock-data');
    return createMockResponse(mockAccessControlEntries);
  }

  async getAccessControlSettings(): Promise<ApiResponse<AccessControlSettings>> {
    const { mockAccessControlSettings } = await import('@/utils/mock-data');
    return createMockResponse(mockAccessControlSettings);
  }

  async addAccessControlEntry(entry: Omit<AccessControlEntry, 'id' | 'addedBy' | 'addedAt' | 'lastModified'>): Promise<ApiResponse<AccessControlEntry>> {
    const newEntry: AccessControlEntry = {
      ...entry,
      id: Date.now().toString(),
      addedBy: 'Текущий пользователь#0001',
      addedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    return createMockResponse(newEntry);
  }

  async updateAccessControlEntry(entryId: string, updates: Partial<AccessControlEntry>): Promise<ApiResponse<AccessControlEntry>> {
    const { mockAccessControlEntries } = await import('@/utils/mock-data');
    const existingEntry = mockAccessControlEntries.find(e => e.id === entryId);
    if (!existingEntry) {
      return createMockError('Запись не найдена');
    }
    const updatedEntry = { 
      ...existingEntry, 
      ...updates, 
      lastModified: new Date().toISOString() 
    };
    return createMockResponse(updatedEntry);
  }

  async removeAccessControlEntry(entryId: string): Promise<ApiResponse<boolean>> {
    return createMockResponse(true);
  }

  async updateAccessControlSettings(settings: AccessControlSettings): Promise<ApiResponse<AccessControlSettings>> {
    return createMockResponse(settings);
  }

  // Ticket System
  async getTicketSystemStatus(): Promise<ApiResponse<TicketSystemStatus>> {
    const { mockTicketSystemStatus } = await import('@/utils/mock-data');
    return createMockResponse(mockTicketSystemStatus);
  }

  async getTicketConfig(): Promise<ApiResponse<TicketConfig>> {
    const { mockTicketConfig } = await import('@/utils/mock-data');
    return createMockResponse(mockTicketConfig);
  }

  async updateTicketConfig(config: Partial<TicketConfig>): Promise<ApiResponse<TicketConfig>> {
    const { mockTicketConfig } = await import('@/utils/mock-data');
    const updated = { ...mockTicketConfig, ...config };
    return createMockResponse(updated);
  }

  async createTicketSystem(): Promise<ApiResponse<TicketSystemStatus>> {
    // Simulate creating ticket system (categories and channels)
    const newStatus: TicketSystemStatus = {
      isSetup: true,
      supportCategoryId: Date.now().toString() + '1',
      supportCategoryName: 'ТЕХПОДДЕРЖКА',
      archiveCategoryId: Date.now().toString() + '2',
      archiveCategoryName: 'АРХИВ ТИКЕТОВ',
      supportChannelId: Date.now().toString() + '3',
      supportChannelName: 'создать-тикет',
      messageId: Date.now().toString() + '4',
      nextTicketNumber: 1
    };
    return createMockResponse(newStatus, 3000); // Longer delay for setup
  }

  async repairTicketSystem(options: {
    createSupportCategory?: boolean;
    createArchiveCategory?: boolean;
    createSupportChannel?: boolean;
    repostMessage?: boolean;
  }): Promise<ApiResponse<TicketSystemStatus>> {
    // Simulate repairing missing components
    const { mockTicketSystemStatus } = await import('@/utils/mock-data');
    const repaired = { ...mockTicketSystemStatus };
    
    if (options.createSupportCategory) {
      repaired.supportCategoryId = Date.now().toString() + '1';
      repaired.supportCategoryName = 'ТЕХПОДДЕРЖКА';
    }
    if (options.createArchiveCategory) {
      repaired.archiveCategoryId = Date.now().toString() + '2';
      repaired.archiveCategoryName = 'АРХИВ ТИКЕТОВ';
    }
    if (options.createSupportChannel) {
      repaired.supportChannelId = Date.now().toString() + '3';
      repaired.supportChannelName = 'создать-тикет';
    }
    if (options.repostMessage) {
      repaired.messageId = Date.now().toString() + '4';
    }
    
    return createMockResponse(repaired, 2000);
  }

  async getTickets(status?: string): Promise<ApiResponse<Ticket[]>> {
    const { mockTickets } = await import('@/utils/mock-data');
    let filtered = mockTickets;
    
    if (status && status !== 'all') {
      filtered = mockTickets.filter(ticket => ticket.status === status);
    }
    
    return createMockResponse(filtered);
  }

  async createTicket(userId: string, category: string, subject: string): Promise<ApiResponse<Ticket>> {
    const { mockTicketSystemStatus } = await import('@/utils/mock-data');
    const ticketNumber = mockTicketSystemStatus.nextTicketNumber.toString().padStart(5, '0');
    
    const newTicket: Ticket = {
      id: Date.now().toString(),
      number: ticketNumber,
      channelId: Date.now().toString() + '_channel',
      userId,
      username: 'NewUser',
      userAvatar: null,
      category,
      categoryName: 'Техническая поддержка',
      subject,
      status: 'open',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messages: 1,
      tags: [],
      metadata: {}
    };
    
    return createMockResponse(newTicket, 2000);
  }

  async assignTicket(ticketId: string, assignedTo: string): Promise<ApiResponse<Ticket>> {
    const { mockTickets } = await import('@/utils/mock-data');
    const ticket = mockTickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return createMockError('Тикет не найден');
    }
    
    const updated = {
      ...ticket,
      status: 'assigned' as const,
      assignedTo,
      assignedName: 'Модератор',
      lastActivity: new Date().toISOString()
    };
    
    return createMockResponse(updated);
  }

  async closeTicket(ticketId: string, reason?: string): Promise<ApiResponse<Ticket>> {
    const { mockTickets } = await import('@/utils/mock-data');
    const ticket = mockTickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return createMockError('Тикет не найден');
    }
    
    const updated = {
      ...ticket,
      status: 'closed' as const,
      closedAt: new Date().toISOString(),
      closedBy: 'Модератор',
      lastActivity: new Date().toISOString()
    };
    
    return createMockResponse(updated, 1500);
  }

  async archiveTicket(ticketId: string): Promise<ApiResponse<Ticket>> {
    const { mockTickets } = await import('@/utils/mock-data');
    const ticket = mockTickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return createMockError('Тикет не найден');
    }
    
    const updated = {
      ...ticket,
      status: 'archived' as const,
      archivedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    return createMockResponse(updated, 1000);
  }

  async updateTicketPriority(ticketId: string, priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<ApiResponse<Ticket>> {
    const { mockTickets } = await import('@/utils/mock-data');
    const ticket = mockTickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return createMockError('Тикет не найден');
    }
    
    const updated = {
      ...ticket,
      priority,
      lastActivity: new Date().toISOString()
    };
    
    return createMockResponse(updated);
  }

  async addTicketCategory(category: Omit<TicketCategory, 'id'>): Promise<ApiResponse<TicketCategory>> {
    const newCategory: TicketCategory = {
      ...category,
      id: Date.now().toString()
    };
    
    return createMockResponse(newCategory);
  }

  async updateTicketCategory(categoryId: string, updates: Partial<TicketCategory>): Promise<ApiResponse<TicketCategory>> {
    const { mockTicketConfig } = await import('@/utils/mock-data');
    const category = mockTicketConfig.categories.find(c => c.id === categoryId);
    
    if (!category) {
      return createMockError('Категория не найдена');
    }
    
    const updated = { ...category, ...updates };
    return createMockResponse(updated);
  }

  async removeTicketCategory(categoryId: string): Promise<ApiResponse<boolean>> {
    return createMockResponse(true);
  }

  // Warning System
  async getWarnings(): Promise<ApiResponse<Warning[]>> {
    const { mockWarnings } = await import('@/utils/mock-data');
    return createMockResponse(mockWarnings);
  }

  async revokeWarning(warningId: string): Promise<ApiResponse<boolean>> {
    // Simulate revoking a warning
    return createMockResponse(true, 1000);
  }

  // System Status for Dashboard
  async getSystemStatus(): Promise<ApiResponse<{
    telegramIntegration: {
      enabled: boolean;
      configured: boolean;
      userId?: string;
      botTokenSet?: boolean;
    };
    ticketSystem: {
      enabled: boolean;
      setup: boolean;
      openTickets: number;
    };
  }>> {
    // Simulate getting system status - returns random configuration status for demo
    const telegramConfigured = Math.random() > 0.3; // 70% chance it's configured
    const telegramEnabled = telegramConfigured ? Math.random() > 0.2 : false; // 80% chance it's enabled if configured
    
    const { mockTicketSystemStatus, mockTickets } = await import('@/utils/mock-data');
    const openTickets = mockTickets.filter(t => t.status === 'open' || t.status === 'assigned').length;
    
    return createMockResponse({
      telegramIntegration: {
        enabled: telegramEnabled,
        configured: telegramConfigured,
        userId: telegramConfigured ? '123456789' : undefined,
        botTokenSet: telegramConfigured
      },
      ticketSystem: {
        enabled: mockTicketSystemStatus.isSetup,
        setup: mockTicketSystemStatus.isSetup,
        openTickets
      }
    });
  }
}

export const extendedApi = new ExtendedApi();