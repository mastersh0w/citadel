import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '../LanguageProvider';
import { useSocialNotifications } from '../SocialNotificationsProvider';
import { toast } from 'sonner@2.0.3';
import {
  Rss,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  Globe,
  Users,
  TrendingUp,
  Play,
  Youtube,
  Twitch,
  Radio,
  RefreshCw,
  Info,
  Hash
} from 'lucide-react';

interface SocialNotificationsProps {
  onNavigate: (page: string) => void;
}

const platformIcons = {
  twitch: Twitch,
  youtube: Youtube,
  trovo: Radio,
  kick: Play
};

const notificationTypes = [
  { id: 'stream', name: 'Стримы', description: 'Уведомления о начале стрима' },
  { id: 'video', name: 'Видео', description: 'Уведомления о новых видео' },
  { id: 'post', name: 'Посты', description: 'Уведомления о новых постах' }
];

const mockRoles = [
  { id: '1', name: '@everyone', color: '#99aab5' },
  { id: '2', name: 'Стримеры', color: '#9146ff' },
  { id: '3', name: 'Уведомления', color: '#3b82f6' },
  { id: '4', name: 'VIP', color: '#f59e0b' },
  { id: '5', name: 'Участник', color: '#22c55e' }
];

export function SocialNotifications({ onNavigate }: SocialNotificationsProps) {
  const { t } = useLanguage();
  const { 
    notifications, 
    loading, 
    deleteNotification: deleteNotif, 
    updateNotification,
    platforms 
  } = useSocialNotifications();
  
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const startWizard = (notification?: any) => {
    if (notification) {
      // Navigate to wizard with editing data
      onNavigate(`social-notifications-wizard?edit=${notification.id}`);
    } else {
      // Navigate to wizard for creating new notification
      onNavigate('social-notifications-wizard');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      deleteNotif(id);
      toast.success('Уведомление удалено');
    } catch (error) {
      toast.error('Не удалось удалить уведомление');
    }
  };

  const toggleNotification = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        updateNotification(id, { enabled: !notification.enabled });
        toast.success('Статус уведомления изменен');
      }
    } catch (error) {
      toast.error('Не удалось изменить статус');
    }
  };

  const testConnection = async (notification: any) => {
    setTestingConnection(notification.id);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Подключение к ${notification.platform} проверено успешно`);
    } catch (error) {
      toast.error('Ошибка при тестировании подключения');
    } finally {
      setTestingConnection(null);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'enabled' && !notification.enabled) return false;
    if (filter === 'disabled' && notification.enabled) return false;
    if (platformFilter !== 'all' && notification.platform !== platformFilter) return false;
    return true;
  });

  const totalNotifications = notifications.reduce((sum, n) => sum + n.notificationCount, 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="flex items-center justify-center gap-2">
            <Rss className="h-6 w-6 text-primary" />
            Оповещения соцсетей
          </h1>
          <p className="text-muted-foreground mt-2">
            Настройте уведомления о стримах и новом контенте с различных платформ
          </p>
        </div>
        
        <Button 
          onClick={() => startWizard()} 
          size="lg"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Создать новое уведомление
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Rss className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего настроено</p>
                <p className="text-2xl">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Eye className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-2xl">{notifications.filter(n => n.enabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Отправлено</p>
                <p className="text-2xl">{totalNotifications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <Globe className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Платформ</p>
                <p className="text-2xl">{platforms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Как работают оповещения</AlertTitle>
        <AlertDescription>
          Бот автоматически проверяет активность на указанных платформах и отправляет уведомления в Discord при начале стримов или публикации нового контента.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Ст��тус:</Label>
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уведомления</SelectItem>
              <SelectItem value="enabled">Только активные</SelectItem>
              <SelectItem value="disabled">Только отключенные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label>Платформа:</Label>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все платформы</SelectItem>
              {platforms.map(platform => {
                const IconComponent = platformIcons[platform.id];
                return (
                  <SelectItem key={platform.id} value={platform.id}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" style={{ color: platform.color }} />
                      {platform.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Platforms Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map(platform => {
          const platformNotifications = notifications.filter(n => n.platform === platform.id);
          const activeCount = platformNotifications.filter(n => n.enabled).length;
          const IconComponent = platformIcons[platform.id];
          
          return (
            <Card key={platform.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${platform.color}20` }}>
                    <IconComponent className="h-5 w-5" style={{ color: platform.color }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{platform.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {activeCount} из {platformNotifications.length} активны
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => {
            const platform = platforms.find(p => p.id === notification.platform);
            const role = mockRoles.find(r => r.id === notification.mentionRole);
            const IconComponent = platformIcons[notification.platform];
            
            return (
              <Card key={notification.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {IconComponent && <IconComponent className="h-5 w-5" style={{ color: platform?.color }} />}
                        {notification.displayName}
                        <Badge variant={notification.enabled ? "default" : "secondary"}>
                          {notification.enabled ? 'Активно' : 'Отключено'}
                        </Badge>
                        <Badge variant="outline">
                          {notificationTypes.find(t => t.id === notification.notificationType)?.name}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        @{notification.username} • #{notification.channelName}
                        {role && (
                          <span className="ml-2">
                            • Упоминает <Badge variant="outline" style={{ borderColor: role.color }}>
                              {role.name}
                            </Badge>
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testConnection(notification)}
                        disabled={testingConnection === notification.id}
                        className="gap-2"
                      >
                        {testingConnection === notification.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Тест
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startWizard(notification)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={notification.enabled}
                        onCheckedChange={() => toggleNotification(notification.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Уведомлений отправлено</Label>
                      <p>{notification.notificationCount}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Последнее уведомление</Label>
                      <p>{notification.lastNotification ? new Date(notification.lastNotification).toLocaleString('ru-RU') : 'Не отправлялось'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Создано</Label>
                      <p>{new Date(notification.createdAt).toLocaleString('ru-RU')}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-muted-foreground">Шаблон сообщения</Label>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{notification.message}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {filter === 'all' ? 'У вас пока нет ни одного уведомления' : 'Нет уведомлений с такими фильтрами'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Настройте первое уведомление для отслеживания контента'
                  : 'Попробуйте изменить фильтры или создайте новое уведомление'
                }
              </p>
              <Button onClick={() => startWizard()}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить уведомление
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}