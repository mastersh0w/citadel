// apps/web_api/src/types.ts
export interface PageProps {
  onNavigate?: (page: string) => void;
}
export interface DashboardStats {
  totalMembers: number; onlineMembers: number; messagesLastDay: number;
  totalChannels: number; totalRoles: number;
  antiNukeEvents: { blocked: number; };
  moderationActions: { bans: number; kicks: number; timeouts: number; warnings: number; };
  backupInfo: { lastBackup: string; totalBackups: number; totalSize: string; };
}
export interface ActivityEntry {
  id: string; type: string; description: string; user: string; timestamp: string;
}