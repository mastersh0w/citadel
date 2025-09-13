import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventConfigCard } from '../EventConfigCard';
import {
  Bell,
  MessageSquare,
  Users,
  Settings,
  Save,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hash,
  Crown,
  Volume2,
  VolumeX,
  Filter,
  Search,
  UserPlus,
  UserMinus,
  UserCheck,
  Edit,
  Trash2,
  FileText,
  Shield,
  Ban,
  Gavel,
  User,
  MessageCircle
} from 'lucide-react';
import { NotificationSettings, Channel, Role } from '@/types';
import { mockChannels, mockRoles } from '@/utils/mock-data';
import { api } from '@/utils/api';
import { toast } from 'sonner@2.0.3';

interface ExtendedEventConfig {
  enabled: boolean;
  message: string;
  channel?: string;
  embedEnabled?: boolean;
  mentionRoles?: string[];
  cooldown?: number;
  dmParticipant?: boolean; // Новая опция для отправки в ЛС участнику
}

interface ExtendedNotificationSettings extends Omit<NotificationSettings, 'events'> {
  events: Record<string, ExtendedEventConfig>;
}

const EVENT_CATEGORIES = {
  members: {
    title: 'События участников',
    icon: <Users className="h-5 w-5" />,
    events: [
      {
        key: 'memberJoin',
        title: 'Присоединение к серверу',
        description: 'Уведомления о новых участниках'
      },
      {
        key: 'memberLeave',
        title: 'Выход с сервера',
        description: 'Уведомления о покинувших участниках'
      },
      {
        key: 'memberBan',
        title: 'Блокировка участника',
        description: 'Уведомления о банах',
        supportsDM: true
      },
      {
        key: 'memberUnban',
        title: 'Разблокировка участника', 
        description: 'Уведомления о разбанах',
        supportsDM: true
      },
      {
        key: 'memberKick',
        title: 'Исключение участника',
        description: 'Уведомления о киках',
        supportsDM: true
      },
      {
        key: 'memberTimeout',
        title: 'Таймаут участника',
        description: 'Уведомления о временных ограничениях',
        supportsDM: true
      },
      {
        key: 'memberUpdate',
        title: 'Изменение участника',
        description: 'Изменение ролей, никнейма и другой информации'
      },
      {
        key: 'memberRoleAdd',
        title: 'Добавление роли участнику',
        description: 'Уведомления о добавлении ролей пользователю'
      },
      {
        key: 'memberRoleRemove',
        title: 'Удаление роли у участника',
        description: 'Уведомления об удалении ролей у пользователя'
      },
      {
        key: 'memberNicknameChange',
        title: 'Смена никнейма',
        description: 'Уведомления о смене никнейма участника'
      }
    ]
  },
  server: {
    title: 'События сервера',
    icon: <Settings className="h-5 w-5" />,
    events: [
      {
        key: 'channelCreate',
        title: 'Создание каналов',
        description: 'Уведомления о новых каналах'
      },
      {
        key: 'channelDelete',
        title: 'Удаление каналов',
        description: 'Уведомления об удаленных каналах'
      },
      {
        key: 'channelUpdate',
        title: 'Изменение каналов',
        description: 'Изменение названия, темы или настроек канала'
      },
      {
        key: 'roleCreate',
        title: 'Создание ролей',
        description: 'Уведомления о новых ролях'
      },
      {
        key: 'roleDelete',
        title: 'Удаление ролей',
        description: 'Уведомления об удаленных ролях'
      },
      {
        key: 'roleUpdate',
        title: 'Изменение ролей',
        description: 'Изменение названия, цвета, разрешений роли'
      },
      {
        key: 'messageDelete',
        title: 'Удаление сообщений',
        description: 'Уведомления об удаленных сообщениях'
      },
      {
        key: 'messageEdit',
        title: 'Редактирование сообщений',
        description: 'Уведомления о отредактированных сообщениях'
      },
      {
        key: 'messageBulkDelete',
        title: 'Массовое удаление сообщений',
        description: 'Уведомления о массовом удалении сообщений'
      }
    ]
  },
  voice: {
    title: 'Голосовые каналы',
    icon: <Volume2 className="h-5 w-5" />,
    events: [
      {
        key: 'voiceChannelJoin',
        title: 'Подключение к голосовому каналу',
        description: 'Уведомления о входе в войс'
      },
      {
        key: 'voiceChannelLeave',
        title: 'Отключение от голосового канала',
        description: 'Уведомления о выходе из войса'
      },
      {
        key: 'voiceChannelMove',
        title: 'Перемещение между голосовыми каналами',
        description: 'Уведомления о смене голосового канала'
      },
      {
        key: 'voiceChannelMute',
        title: 'Заглушение в войсе',
        description: 'Уведомления о заглушении участника'
      },
      {
        key: 'voiceChannelDeafen',
        title: 'Отключение звука в войсе',
        description: 'Уведомления об отключении звука участника'
      }
    ]
  }
};

export function Notifications() {
  const [channels] = useState<Channel[]>(mockChannels);
  const [roles] = useState<Role[]>(mockRoles);
  const [settings, setSettings] = useState<ExtendedNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testChannel, setTestChannel] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('events');
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.getSettings();
      if (response.success && response.data) {
        // Convert old format to new extended format
        const extendedSettings: ExtendedNotificationSettings = {
          ...response.data,
          events: {}
        };

        // Initialize all events with extended config
        Object.values(EVENT_CATEGORIES).forEach(category => {
          category.events.forEach(event => {
            extendedSettings.events[event.key] = {
              enabled: (response.data.events as any)[event.key] || false,
              message: response.data.customMessages?.[event.key] || '',
              embedEnabled: false,
              cooldown: 0,
              dmParticipant: false
            };
          });
        });

        setSettings(extendedSettings);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (updates: Partial<ExtendedNotificationSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
    setHasChanges(true);
  };

  const updateChannels = (updates: Partial<NotificationSettings['channels']>) => {
    if (!settings) return;
    updateSettings({
      channels: { ...settings.channels, ...updates }
    });
  };

  const updateEventConfig = (eventKey: string, config: ExtendedEventConfig) => {
    if (!settings) return;
    updateSettings({
      events: { ...settings.events, [eventKey]: config }
    });
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      
      // Convert back to old format for API
      const apiSettings: NotificationSettings = {
        enabled: settings.enabled,
        channels: settings.channels,
        events: Object.fromEntries(
          Object.entries(settings.events).map(([key, config]) => [key, config.enabled])
        ) as any,
        customMessages: Object.fromEntries(
          Object.entries(settings.events).map(([key, config]) => [key, config.message])
        ) as any
      };

      const response = await api.notifications.updateSettings(apiSettings);
      if (response.success) {
        setHasChanges(false);
        toast.success('Настройки уведомлений сохранены');
      }
    } catch (error) {
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (type: string) => {
    if (!testChannel.trim()) {
      toast.error('Укажите ID канала для теста');
      return;
    }

    try {
      const response = await api.notifications.testNotification(type, testChannel.trim());
      if (response.success) {
        toast.success(`Тестовое уведомление отправлено в канал ${testChannel}`);
      }
    } catch (error) {
      toast.error('Ошибка при отправке тестового уведомления');
    }
  };

  const getFilteredEvents = () => {
    const allEvents = Object.values(EVENT_CATEGORIES).flatMap(category => 
      category.events.map(event => ({ ...event, category: category.title }))
    );

    return allEvents.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || 
                             Object.keys(EVENT_CATEGORIES).find(key => 
                               EVENT_CATEGORIES[key as keyof typeof EVENT_CATEGORIES].title === event.category
                             ) === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const getEnabledEventsCount = () => {
    if (!settings) return 0;
    return Object.values(settings.events).filter(config => config.enabled).length;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="h-8 w-8 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Не удалось загрузить настройки уведомлений</p>
              <Button onClick={loadSettings} className="mt-4">
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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Система уведомлений
          </h1>
          <p className="text-muted-foreground">
            Настройка автоматических уведомлений о событиях на сервере
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={settings.enabled ? "default" : "secondary"} className="gap-1">
            {settings.enabled ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Активно ({getEnabledEventsCount()})
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Отключено
              </>
            )}
          </Badge>
          {hasChanges && (
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Несохранено
            </Badge>
          )}
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {!settings.enabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Система уведомлений отключена. Включите её для получения уведомлений о событиях.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {isMobile ? (
          // Mobile dropdown menu
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Раздел настроек</Label>
                <Badge variant="outline" className="text-xs">
                  {activeTab === 'events' && `${getEnabledEventsCount()} событий`}
                  {activeTab === 'channels' && 'Каналы'}
                  {activeTab === 'settings' && 'Система'}
                  {activeTab === 'test' && 'Тестирование'}
                </Badge>
              </div>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {activeTab === 'events' && '📋 События сервера'}
                    {activeTab === 'channels' && '📢 Настройка каналов'}
                    {activeTab === 'settings' && '⚙️ Дополнительные наст��ойки'}
                    {activeTab === 'test' && '🧪 Тестирование системы'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="events">
                    <div className="flex items-center justify-between w-full">
                      <span>📋 События сервера</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {getEnabledEventsCount()}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="channels">📢 Настройка каналов</SelectItem>
                  <SelectItem value="settings">⚙️ Дополнительные настройки</SelectItem>
                  <SelectItem value="test">🧪 Тестирование системы</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
          </Card>
        ) : (
          // Desktop tabs
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">События</TabsTrigger>
            <TabsTrigger value="channels">Каналы</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="test">Тестирование</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="events" className="space-y-6">


          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Фильтры событий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск событий..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md min-w-[200px]"
                >
                  <option value="all">Все категории</option>
                  {Object.entries(EVENT_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>{category.title}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Events by Category */}
          {Object.entries(EVENT_CATEGORIES).map(([categoryKey, category]) => {
            const categoryEvents = category.events.filter(event => {
              const matchesSearch = searchFilter === '' || 
                event.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                event.description.toLowerCase().includes(searchFilter.toLowerCase());
              const matchesCategory = categoryFilter === 'all' || categoryFilter === categoryKey;
              return matchesSearch && matchesCategory;
            });

            if (categoryEvents.length === 0) return null;

            return (
              <Card key={categoryKey}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                  <CardDescription>
                    Настройка событий категории "{category.title.toLowerCase()}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryEvents.map(event => (
                      <EventConfigCard
                        key={event.key}
                        eventType={event.key}
                        title={event.title}
                        description={event.description}
                        config={settings.events[event.key] || {
                          enabled: false,
                          message: '',
                          embedEnabled: false,
                          cooldown: 0,
                          dmParticipant: false
                        }}
                        onChange={(config) => updateEventConfig(event.key, config)}
                        availableChannels={channels.filter(ch => ch.type === 0).map(ch => ({
                          id: ch.id,
                          name: ch.name || 'Неизвестный канал'
                        }))}
                        availableRoles={roles.map(role => ({
                          id: role.id,
                          name: role.name,
                          color: role.color
                        }))}
                        supportsDM={event.supportsDM || false}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">


          {/* Main Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Основные настройки
              </CardTitle>
              <CardDescription>
                Глобальные настройки системы уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                {isMobile ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Включить уведомления</Label>
                      <Switch
                        checked={settings.enabled}
                        onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground pl-0">
                      Основной переключатель системы уведомлений
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <Label className="text-base">Включить уведомления</Label>
                      <div className="text-sm text-muted-foreground">
                        Основной переключатель системы уведомлений
                      </div>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Каналы для уведомлений по умолчанию
              </CardTitle>
              <CardDescription>
                Настройка каналов для различных типов уведомлений (можно переопределить для каждого события)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="moderation-channel">Канал модерации</Label>
                  <Select 
                    value={settings.channels.moderation} 
                    onValueChange={(value) => updateChannels({ moderation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите канал" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.filter(ch => ch.type === 0).map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          # {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audit-channel">Канал аудита</Label>
                  <Select 
                    value={settings.channels.audit} 
                    onValueChange={(value) => updateChannels({ audit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите канал" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.filter(ch => ch.type === 0).map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          # {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-channel">Канал приветствий</Label>
                  <Select 
                    value={settings.channels.welcome} 
                    onValueChange={(value) => updateChannels({ welcome: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите канал" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.filter(ch => ch.type === 0).map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          # {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leave-channel">Канал прощаний</Label>
                  <Select 
                    value={settings.channels.leave} 
                    onValueChange={(value) => updateChannels({ leave: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите канал" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.filter(ch => ch.type === 0).map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          # {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="general-channel">Общий канал</Label>
                  <Select 
                    value={settings.channels.general} 
                    onValueChange={(value) => updateChannels({ general: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите канал" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.filter(ch => ch.type === 0).map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          # {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">


          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Глобальные настройки
              </CardTitle>
              <CardDescription>
                Общие настройки системы уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  Здесь будут добавлены дополнительные глобальные настройки системы уведомлений в будущих обновлениях.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">


          {/* Test Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Тестирование уведомлений
              </CardTitle>
              <CardDescription>
                Отправьте тестовые уведомления для проверки настроек
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="test-channel">Канал для тестирования</Label>
                <Select value={testChannel} onValueChange={setTestChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите канал" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.filter(ch => ch.type === 0).map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {Object.values(EVENT_CATEGORIES).flatMap(category => 
                  category.events.map(event => (
                    <Button 
                      key={event.key}
                      variant="outline" 
                      onClick={() => testNotification(event.key)}
                      className="gap-2 justify-start h-auto py-3 px-4 text-left whitespace-normal min-h-[48px]"
                      disabled={!settings.events[event.key]?.enabled}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {EVENT_CATEGORIES.members.events.find(e => e.key === event.key) && <Users className="h-4 w-4" />}
                        {EVENT_CATEGORIES.server.events.find(e => e.key === event.key) && <Settings className="h-4 w-4" />}
                        {EVENT_CATEGORIES.voice.events.find(e => e.key === event.key) && <Volume2 className="h-4 w-4" />}
                      </div>
                      <span className="truncate">Тест: {event.title}</span>
                    </Button>
                  ))
                )}
              </div>

              <Alert>
                <Send className="h-4 w-4" />
                <AlertDescription>
                  Тестовые уведомления отправляются в указанный канал для проверки форматирования и настроек. 
                  Доступны только включенные события.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}