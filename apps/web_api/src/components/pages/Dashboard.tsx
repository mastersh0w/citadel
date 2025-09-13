// apps/web_api/src/components/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
// --- ИСПРАВЛЕНИЕ ИМПОРТОВ: Используем абсолютные пути с '@' ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Users,
  MessageSquare,
  Shield,
  Archive,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Settings,
  MessageCircle
} from 'lucide-react';
import { PageProps, DashboardStats, ActivityEntry } from '@/types';
import { api } from '@/utils/api';
import { formatNumber, formatRelativeTime } from '@/utils/formatters';
import { toast } from 'sonner';

export function Dashboard({ onNavigate }: PageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<{
    quarantineRole: { exists: boolean; name?: string; id?: string };
    telegramIntegration: { enabled: boolean; configured: boolean; userId?: string; botTokenSet?: boolean };
  } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse, quarantineRoleResponse, settingsResponse] = await Promise.allSettled([
        api.dashboard.getStatistics(),
        api.dashboard.getRecentActivity(),
        api.quarantine.checkRole(),
        api.dashboard.getSystemStatus()
      ]);

      if (statsResponse.status === 'fulfilled' && statsResponse.value.success && statsResponse.value.data) {
        setStats(statsResponse.value.data);
      } else {
        throw new Error(statsResponse.status === 'rejected' ? statsResponse.reason.message : "Не удалось загрузить статистику");
      }

      if (activityResponse.status === 'fulfilled' && activityResponse.value.success && activityResponse.value.data) {
        setRecentActivity(activityResponse.value.data);
      }

      const quarantineData = quarantineRoleResponse.status === 'fulfilled' && quarantineRoleResponse.value.success 
        ? quarantineRoleResponse.value.data 
        : { exists: false };
      const telegramData = settingsResponse.status === 'fulfilled' && settingsResponse.value.success 
        ? settingsResponse.value.data?.telegramIntegration 
        : { enabled: false, configured: false };
      
      setSystemStatus({
        quarantineRole: quarantineData || { exists: false },
        telegramIntegration: telegramData || { enabled: false, configured: false }
      });

    } catch (error: any) {
      console.error('Ошибка загрузки данных дашборда:', error);
      toast.error(error.message || 'Не удалось загрузить данные дашборда');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_join':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'moderation_action':
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'channel_create':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'backup_create':
        return <Archive className="h-4 w-4 text-purple-500" />;
      case 'anti_nuke_trigger':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'member_join':
        return 'text-green-600 dark:text-green-400';
      case 'moderation_action':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'channel_create':
        return 'text-blue-600 dark:text-blue-400';
      case 'backup_create':
        return 'text-purple-600 dark:text-purple-400';
      case 'anti_nuke_trigger':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Не удалось загрузить данные дашборда</p>
              <Button onClick={loadDashboardData} className="mt-4">
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Панель управления</h1>
          <p className="text-muted-foreground">
            Обзор состояния вашего Discord сервера
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Badge variant="outline" className="gap-1 justify-center">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="hidden sm:inline">Все системы работают</span>
            <span className="sm:hidden">Онлайн</span>
          </Badge>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            Обновить
          </Button>
        </div>
      </div>

      {systemStatus && (
        <div className="grid gap-4 md:grid-cols-2">
          {!systemStatus.quarantineRole.exists ? (
            <Alert className="border-destructive bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive">Роль карантина не создана</AlertTitle>
              <AlertDescription className="text-destructive">
                <div className="space-y-2">
                  <p>Для корректной работы системы анти-нюк необходимо создать роль карантина.</p>
                  <Button size="sm" variant="destructive" onClick={() => onNavigate && onNavigate('quarantine')} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Настроить роль
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Роль карантина настроена</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="space-y-1">
                  <p>Роль "{systemStatus.quarantineRole.name}" успешно создана.</p>
                  <p className="text-xs">ID: {systemStatus.quarantineRole.id}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!systemStatus.telegramIntegration.configured ? (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <MessageCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800 dark:text-orange-200">Telegram не настроен</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                <div className="space-y-2">
                  <p>Настройте интеграцию с Telegram для дублирования уведомлений.</p>
                  <Button size="sm" variant="outline" onClick={() => onNavigate && onNavigate('settings')} className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30">
                    <Settings className="h-4 w-4" />
                    Настроить Telegram
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Telegram интеграция {systemStatus.telegramIntegration.enabled ? 'активна' : 'настроена'}
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="space-y-1">
                  <p>{systemStatus.telegramIntegration.enabled ? 'Уведомления дублируются в Telegram' : 'Интеграция настроена, но отключена'}</p>
                  {systemStatus.telegramIntegration.userId && (<p className="text-xs">User ID: {systemStatus.telegramIntegration.userId}</p>)}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Участники</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatNumber(stats.totalMembers)}</div><p className="text-xs text-muted-foreground"><span className="text-green-600">{formatNumber(stats.onlineMembers)}</span> онлайн</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Сообщения за сутки</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatNumber(stats.messagesLastDay)}</div><p className="text-xs text-muted-foreground"><TrendingUp className="h-3 w-3 inline mr-1" />+12% от вчера</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Каналы</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalChannels}</div><p className="text-xs text-muted-foreground">{stats.totalRoles} ролей</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Анти-Нюк</CardTitle><Shield className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.antiNukeEvents.blocked}</div><p className="text-xs text-muted-foreground">атак заблокировано</p></CardContent></Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" />Модерация за сутки</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Блокировки</span><Badge variant="destructive">{stats.moderationActions.bans}</Badge></div><div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Исключения</span><Badge variant="secondary">{stats.moderationActions.kicks}</Badge></div><div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Таймауты</span><Badge variant="outline">{stats.moderationActions.timeouts}</Badge></div><div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Предупреждения</span><Badge variant="outline">{stats.moderationActions.warnings}</Badge></div><Button variant="outline" size="sm" className="w-full mt-4" onClick={() => onNavigate && onNavigate('moderation')}>Настроить модерацию</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Archive className="h-5 w-5" />Резервные копии</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Последний бэкап:</span><span>{formatRelativeTime(stats.backupInfo.lastBackup)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Всего копий:</span><span>{stats.backupInfo.totalBackups}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Общий размер:</span><span>{stats.backupInfo.totalSize}</span></div></div><Progress value={75} className="h-2" /><p className="text-xs text-muted-foreground">Использовано 75% от лимита хранилища</p><Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate && onNavigate('backups')}>Управление бэкапами</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5" />Быстрые действия</CardTitle></CardHeader><CardContent className="space-y-3"><Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onNavigate && onNavigate('anti-nuke')}><Shield className="h-4 w-4 mr-2" />Настройки Анти-Нюк</Button><Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onNavigate && onNavigate('user-ranking')}><TrendingUp className="h-4 w-4 mr-2" />Рейтинг пользователей</Button><Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onNavigate && onNavigate('quarantine')}><AlertTriangle className="h-4 w-4 mr-2" />Карантин</Button><Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onNavigate && onNavigate('audit-logs')}><Eye className="h-4 w-4 mr-2" />Аудит логи</Button></CardContent></Card>
      </div>
      
      <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-lg">Последняя активность</CardTitle><CardDescription>Недавние события на сервере</CardDescription></div><Button variant="outline" size="sm" onClick={() => onNavigate && onNavigate('audit-logs')}><Eye className="h-4 w-4 mr-2" />Все логи</Button></CardHeader><CardContent><div className="space-y-4">{recentActivity.length > 0 ? (recentActivity.map((activity) => (<div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border"><div className="mt-1 flex-shrink-0">{getActivityIcon(activity.type)}</div><div className="flex-1 min-w-0"><p className="text-sm"><span className={getActivityColor(activity.type)}>{activity.description}</span></p><div className="flex items-center gap-2 mt-1 flex-wrap"><span className="text-xs text-muted-foreground truncate">{activity.user}</span><span className="text-xs text-muted-foreground">•</span><span className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</span></div></div><Button variant="ghost" size="sm" className="flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></div>))) : (<div className="text-center py-8"><Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Нет недавней активности</p></div>)}</div></CardContent></Card>
    </div>
  );
}