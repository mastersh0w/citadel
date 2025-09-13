// Core API endpoints for essential bot functionality

import { ApiResponse, createMockResponse, createMockError } from './base';
import { 
  AntiNukeSettings, 
  ModerationSettings,
  Guild,
  DashboardStats,
  ActivityEntry
} from '@/types';

class CoreApi {
  // Guild Management
  async getGuildInfo(): Promise<ApiResponse<Guild>> {
    const mockGuild: Guild = {
      id: '123456789012345678',
      name: 'Citadel Server',
      icon: null,
      memberCount: 1247,
      region: 'russia',
      verificationLevel: 2
    };
    return createMockResponse(mockGuild);
  }

  async updateGuildSettings(settings: Partial<Guild>): Promise<ApiResponse<Guild>> {
    const { mockGuild } = await import('@/utils/mock-data');
    const updated = { ...mockGuild, ...settings };
    return createMockResponse(updated);
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const stats: DashboardStats = {
      totalMembers: 1247,
      onlineMembers: 324,
      totalChannels: 45,
      totalRoles: 12,
      messagesLastDay: 2850,
      voiceTimeLastDay: 1440,
      moderationActions: {
        bans: 3,
        kicks: 7,
        timeouts: 15,
        warnings: 23
      },
      antiNukeEvents: {
        blocked: 12,
        warnings: 5
      },
      backupInfo: {
        lastBackup: '2024-01-15T10:00:00Z',
        totalBackups: 15,
        totalSize: '387.4 МБ'
      }
    };
    return createMockResponse(stats);
  }

  async getRecentActivity(): Promise<ApiResponse<ActivityEntry[]>> {
    const activities: ActivityEntry[] = [
      {
        id: '1',
        type: 'member_join',
        description: 'Новый участник присоединился к серверу',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        user: 'НовыйУчастник#1234'
      },
      {
        id: '2',
        type: 'moderation_action',
        description: 'Участник получил предупреждение',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
        user: 'НарушительПравил#5678'
      },
      {
        id: '3',
        type: 'channel_create',
        description: 'Создан новый канал #новый-канал',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        user: 'Администратор#0001'
      },
      {
        id: '4',
        type: 'backup_create',
        description: 'Создана резервная копия сервера',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        user: 'Система'
      },
      {
        id: '5',
        type: 'anti_nuke_trigger',
        description: 'Заблокирована попытка массового удаления каналов',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        user: 'ПодозрительныйПользователь#9999'
      }
    ];
    return createMockResponse(activities);
  }

  // Anti-Nuke System
  async getAntiNukeSettings(): Promise<ApiResponse<AntiNukeSettings>> {
    const { mockAntiNukeSettings } = await import('@/utils/mock-data');
    return createMockResponse(mockAntiNukeSettings);
  }

  async updateAntiNukeSettings(settings: Partial<AntiNukeSettings>): Promise<ApiResponse<AntiNukeSettings>> {
    const { mockAntiNukeSettings } = await import('@/utils/mock-data');
    const updated = { ...mockAntiNukeSettings, ...settings };
    return createMockResponse(updated);
  }

  async addAntiNukeWhitelistUser(userId: string): Promise<ApiResponse<string[]>> {
    // Deprecated - use whitelist API instead
    return createMockError('Используйте API белого списка');
  }

  async removeAntiNukeWhitelistUser(userId: string): Promise<ApiResponse<string[]>> {
    // Deprecated - use whitelist API instead
    return createMockError('Используйте API белого списка');
  }

  // Moderation System
  async getModerationSettings(): Promise<ApiResponse<ModerationSettings>> {
    const { mockModerationSettings } = await import('@/utils/mock-data');
    return createMockResponse(mockModerationSettings);
  }

  async updateModerationSettings(settings: Partial<ModerationSettings>): Promise<ApiResponse<ModerationSettings>> {
    const { mockModerationSettings } = await import('@/utils/mock-data');
    const updated = { ...mockModerationSettings, ...settings };
    return createMockResponse(updated);
  }

  async addBadWord(word: string): Promise<ApiResponse<string[]>> {
    const { mockModerationSettings } = await import('@/utils/mock-data');
    if (mockModerationSettings.automod.badWords.includes(word)) {
      return createMockError('Слово уже в списке');
    }
    const updated = [...mockModerationSettings.automod.badWords, word];
    return createMockResponse(updated);
  }

  async removeBadWord(word: string): Promise<ApiResponse<string[]>> {
    const { mockModerationSettings } = await import('@/utils/mock-data');
    const updated = mockModerationSettings.automod.badWords.filter(w => w !== word);
    return createMockResponse(updated);
  }

  // Bot Status
  async getBotStatus(): Promise<ApiResponse<{ online: boolean; ping: number; uptime: number }>> {
    const status = {
      online: true,
      ping: Math.floor(Math.random() * 100) + 20, // 20-120ms
      uptime: Date.now() - (Math.random() * 86400000 * 7) // Random uptime up to 7 days
    };
    return createMockResponse(status);
  }

  async restartBot(): Promise<ApiResponse<boolean>> {
    // Simulate bot restart
    return createMockResponse(true, 2000);
  }
}

export const coreApi = new CoreApi();