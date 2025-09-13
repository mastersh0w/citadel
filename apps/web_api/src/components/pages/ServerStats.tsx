import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '../ColorPicker';
import { Channel, Role } from '@/types';
import { mockChannels, mockRoles } from '@/utils/mock-data';
import { toast } from 'sonner@2.0.3';
import {
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  Clock,
  Activity,
  TrendingUp,
  Eye,
  Settings,
  Plus,
  Edit,
  Trash2,
  Hash,
  Volume2,
  Gamepad2,
  Crown,
  Shield,
  Zap,
  Globe,
  Palette,
  Monitor,
  Smartphone,
  Bot,
  Star,
  Heart,
  Award,
  Target,
  PieChart,
  LineChart,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';

interface StatsChannel {
  id: string;
  name: string;
  channelId: string;
  type: 'member-count' | 'channel-count' | 'role-count' | 'boost-count' | 'online-count' | 'bot-count' | 'human-count' | 'text-channels' | 'voice-channels' | 'categories' | 'custom';
  template: string;
  refreshRate: number; // in minutes
  enabled: boolean;
  customValue?: string;
  color?: string;
}

interface StatsPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  channels: Omit<StatsChannel, 'id' | 'channelId'>[];
}

interface StatsConfig {
  enabled: boolean;
  updateInterval: number;
  timezone: string;
  embedColor: string;
  showTimestamps: boolean;
  compactMode: boolean;
  allowPublicAccess: boolean;
  logChannelId?: string;
  categoryId?: string; // Category where stats channels will be created
}

const mockStatsChannels: StatsChannel[] = [
  {
    id: '1',
    name: 'Участников',
    channelId: '123456789',
    type: 'member-count',
    template: 'Участников: {count}',
    refreshRate: 5,
    enabled: true,
    color: '#3b82f6'
  },
  {
    id: '2',
    name: 'Онлайн',
    channelId: '987654321',
    type: 'online-count',
    template: 'Онлайн: {count}',
    refreshRate: 1,
    enabled: true,
    color: '#22c55e'
  },
  {
    id: '3',
    name: 'Бустов',
    channelId: '456789123',
    type: 'boost-count',
    template: '🚀 Бустов: {count}',
    refreshRate: 10,
    enabled: true,
    color: '#f59e0b'
  }
];

const statsPresets: StatsPreset[] = [
  {
    id: 'basic',
    name: 'Базовая статистика',
    description: 'Участники, онлайн и бусты',
    icon: <Users className="h-5 w-5" />,
    channels: [
      {
        name: 'Участников',
        type: 'member-count',
        template: '👥 Участников: {count}',
        refreshRate: 5,
        enabled: true,
        color: '#3b82f6'
      },
      {
        name: 'Онлайн',
        type: 'online-count',
        template: '🟢 Онлайн: {count}',
        refreshRate: 1,
        enabled: true,
        color: '#22c55e'
      },
      {
        name: 'Бустов',
        type: 'boost-count',
        template: '🚀 Бустов: {count}',
        refreshRate: 10,
        enabled: true,
        color: '#f59e0b'
      }
    ]
  },
  {
    id: 'detailed',
    name: 'Подробная статистика',
    description: 'Полная информация о сервере',
    icon: <BarChart3 className="h-5 w-5" />,
    channels: [
      {
        name: 'Участников',
        type: 'member-count',
        template: '👥 Участников: {count}',
        refreshRate: 5,
        enabled: true,
        color: '#3b82f6'
      },
      {
        name: 'Людей',
        type: 'human-count',
        template: '👤 Людей: {count}',
        refreshRate: 5,
        enabled: true,
        color: '#22c55e'
      },
      {
        name: 'Ботов',
        type: 'bot-count',
        template: '🤖 Ботов: {count}',
        refreshRate: 5,
        enabled: true,
        color: '#8b5cf6'
      },
      {
        name: 'Онлайн',
        type: 'online-count',
        template: '🟢 Онлайн: {count}',
        refreshRate: 1,
        enabled: true,
        color: '#f59e0b'
      },
      {
        name: 'Каналов',
        type: 'channel-count',
        template: '📂 Каналов: {count}',
        refreshRate: 10,
        enabled: true,
        color: '#ef4444'
      },
      {
        name: 'Бустов',
        type: 'boost-count',
        template: '🚀 Бустов: {count}',
        refreshRate: 10,
        enabled: true,
        color: '#ec4899'
      }
    ]
  },
  {
    id: 'channels',
    name: 'Статистика каналов',
    description: 'Информация о каналах сервера',
    icon: <Hash className="h-5 w-5" />,
    channels: [
      {
        name: 'Всего каналов',
        type: 'channel-count',
        template: '📂 Каналов: {count}',
        refreshRate: 10,
        enabled: true,
        color: '#3b82f6'
      },
      {
        name: 'Текстовых',
        type: 'text-channels',
        template: '💬 Текстовых: {count}',
        refreshRate: 10,
        enabled: true,
        color: '#22c55e'
      },
      {
        name: 'Голосовых',
        type: 'voice-channels',
        template: '🔊 Голосовых: {count}',
        refreshRate: 10,
        enabled: true,
        color: '#f59e0b'
      },
      {
        name: 'Категорий',
        type: 'categories',
        template: '📋 Категорий: {count}',
        refreshRate: 10,
        enabled: true,
        color: '#8b5cf6'
      }
    ]
  },
  {
    id: 'minimal',
    name: 'Минимальная',
    description: 'Только участники и онлайн',
    icon: <Activity className="h-5 w-5" />,
    channels: [
      {
        name: 'Участников',
        type: 'member-count',
        template: '👥 {count}',
        refreshRate: 5,
        enabled: true,
        color: '#3b82f6'
      },
      {
        name: 'Онлайн',
        type: 'online-count',
        template: '🟢 {count}',
        refreshRate: 1,
        enabled: true,
        color: '#22c55e'
      }
    ]
  }
];

export function ServerStats() {
  const [channels] = useState<Channel[]>(mockChannels);
  const [roles] = useState<Role[]>(mockRoles);
  const [statsChannels, setStatsChannels] = useState<StatsChannel[]>(mockStatsChannels);
  const [config, setConfig] = useState<StatsConfig>({
    enabled: false, // По умолчанию отключено
    updateInterval: 5,
    timezone: 'Europe/Moscow',
    embedColor: '#3b82f6',
    showTimestamps: true,
    compactMode: false,
    allowPublicAccess: false,
    logChannelId: '111222333',
    categoryId: undefined
  });

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingChannel, setEditingChannel] = useState<StatsChannel | null>(null);
  const [newStatsChannel, setNewStatsChannel] = useState<Partial<StatsChannel>>({
    name: '',
    channelId: '',
    type: 'member-count',
    template: 'Участников: {count}',
    refreshRate: 5,
    enabled: true,
    color: '#3b82f6'
  });
  const [activeTab, setActiveTab] = useState('channels');
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

  const getStatsOverview = () => {
    const totalChannels = statsChannels.length;
    const activeChannels = statsChannels.filter(c => c.enabled).length;
    
    return { totalChannels, activeChannels };
  };

  const stats = getStatsOverview();

  const handleConfigChange = (key: keyof StatsConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    toast.success('Настройки сохранены');
  };

  const handleActivateStats = () => {
    if (!selectedPreset || !selectedCategory) {
      toast.error('Выберите набор статистики и категорию');
      return;
    }

    const preset = statsPresets.find(p => p.id === selectedPreset);
    if (!preset) return;

    // Создаем каналы из пресета
    const newChannels: StatsChannel[] = preset.channels.map((channelTemplate, index) => ({
      ...channelTemplate,
      id: Date.now().toString() + index,
      channelId: `new-channel-${Date.now()}-${index}` // В реальном приложении здесь будет создаваться настоящий канал
    }));

    setStatsChannels(newChannels);
    setConfig(prev => ({
      ...prev,
      enabled: true,
      categoryId: selectedCategory
    }));

    setShowActivation(false);
    setSelectedPreset('');
    setSelectedCategory('');
    
    toast.success(`Статистика активирована! Создано ${newChannels.length} каналов в выбранной категории.`);
  };

  const handleDeactivateStats = () => {
    setConfig(prev => ({ ...prev, enabled: false }));
    setStatsChannels([]);
    toast.success('Статистика деактивирована. Все каналы статистики удалены.');
  };

  const handleCreateStatsChannel = () => {
    if (!newStatsChannel.name?.trim()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const channel: StatsChannel = {
      id: Date.now().toString(),
      name: newStatsChannel.name,
      channelId: `manual-channel-${Date.now()}`, // В реальном приложении здесь будет создаваться настоящий канал
      type: newStatsChannel.type || 'member-count',
      template: newStatsChannel.template || 'Значение: {count}',
      refreshRate: newStatsChannel.refreshRate || 5,
      enabled: newStatsChannel.enabled ?? true,
      color: newStatsChannel.color || '#3b82f6'
    };

    setStatsChannels(prev => [channel, ...prev]);
    setNewStatsChannel({
      name: '',
      channelId: '',
      type: 'member-count',
      template: 'Участников: {count}',
      refreshRate: 5,
      enabled: true,
      color: '#3b82f6'
    });
    setShowCreateChannel(false);
    toast.success('Канал статистики создан');
  };

  const handleDeleteStatsChannel = (id: string) => {
    setStatsChannels(prev => prev.filter(c => c.id !== id));
    toast.success('Канал статистики удален');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'member-count':
        return <Users className="h-4 w-4" />;
      case 'human-count':
        return <User className="h-4 w-4" />;
      case 'bot-count':
        return <Bot className="h-4 w-4" />;
      case 'online-count':
        return <Activity className="h-4 w-4" />;
      case 'channel-count':
        return <Hash className="h-4 w-4" />;
      case 'role-count':
        return <Shield className="h-4 w-4" />;
      case 'boost-count':
        return <Zap className="h-4 w-4" />;
      case 'voice-channels':
        return <Volume2 className="h-4 w-4" />;
      case 'text-channels':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'member-count': 'Участники',
      'human-count': 'Люди',
      'bot-count': 'Боты',
      'online-count': 'Онлайн',
      'channel-count': 'Каналы',
      'role-count': 'Роли',
      'boost-count': 'Бусты',
      'text-channels': 'Текстовые каналы',
      'voice-channels': 'Голосовые каналы',
      'categories': 'Категории',
      'custom': 'Пользовательский'
    };
    return labels[type] || type;
  };

  const getMockValue = (type: string) => {
    const values: Record<string, number> = {
      'member-count': 1234,
      'human-count': 1156,
      'bot-count': 78,
      'online-count': 456,
      'channel-count': 42,
      'role-count': 15,
      'boost-count': 12,
      'text-channels': 28,
      'voice-channels': 8,
      'categories': 6
    };
    return values[type] || 0;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Статистика сервера</h2>
          <p className="text-muted-foreground">
            Автоматическое отображение статистики в названиях голосовых каналов
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {config.enabled ? 'Активна' : 'Неактивна'}
          </Badge>
          {config.enabled && (
            <Badge variant="outline" className="text-sm bg-blue-500/10 text-blue-700 dark:text-blue-400">
              <BarChart3 className="h-3 w-3 mr-1" />
              {stats.activeChannels} каналов
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Каналы статистики</p>
                <p className="text-2xl font-semibold">{stats.activeChannels}/{stats.totalChannels}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Интервал обновления</p>
                <p className="text-2xl font-semibold">{config.updateInterval}м</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Публичный доступ</p>
                <p className="text-2xl font-semibold">{config.allowPublicAccess ? 'Да' : 'Нет'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Категория</p>
                <p className="text-2xl font-semibold">{config.categoryId ? 'Настроена' : 'Не выбрана'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Activation Section */}
      {!config.enabled ? (
        <Card className="border-2 border-dashed border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Активировать отображение статистики</CardTitle>
            <CardDescription>
              Выберите готовый набор каналов статистики для автоматического создания и обновления
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Dialog open={showActivation} onOpenChange={setShowActivation}>
              <DialogTrigger asChild>
                <Button size="lg" className="px-8">
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Настроить статистику
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Активация статистики сервера</DialogTitle>
                  <DialogDescription>
                    Выберите набор каналов статистики и категорию для их размещения
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Preset Selection */}
                  <div className="space-y-3">
                    <Label>Выберите набор статистики</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {statsPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedPreset === preset.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPreset(preset.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded bg-primary/10 text-primary">
                              {preset.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{preset.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{preset.description}</p>
                              <div className="text-xs text-muted-foreground">
                                Каналов: {preset.channels.length}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label>Категория для размещения каналов</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.filter(c => c.type === 4).map((category) => ( // Category type
                          <SelectItem key={category.id} value={category.id}>
                            📁 {category.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="create-new">
                          ➕ Создать новую категорию "📊 Статистика"
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Каналы будут созданы как голосовые с закрытым доступом для подключения, но видимые всем
                    </p>
                  </div>

                  {/* Preview */}
                  {selectedPreset && (
                    <div className="space-y-2">
                      <Label>Предварительный просмотр каналов</Label>
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="space-y-2">
                          {statsPresets.find(p => p.id === selectedPreset)?.channels.map((channel, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Volume2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono">
                                {channel.template.replace('{count}', getMockValue(channel.type).toLocaleString())}
                              </span>
                              <Badge variant="outline" className="text-xs" style={{ color: channel.color }}>
                                {getTypeLabel(channel.type)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowActivation(false)}>
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleActivateStats}
                    disabled={!selectedPreset || !selectedCategory}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Активировать статистику
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {isMobile ? (
            // Mobile dropdown menu
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Раздел статистики сервера</Label>
                  <Badge variant="outline" className="text-xs">
                    {activeTab === 'channels' && `${stats.activeChannels} каналов`}
                    {activeTab === 'settings' && 'Конфигурация'}
                  </Badge>
                </div>
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {activeTab === 'channels' && '📊 Каналы статистики'}
                      {activeTab === 'settings' && '⚙️ Настройки системы'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channels">
                      <div className="flex items-center justify-between w-full">
                        <span>📊 Каналы статистики</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {stats.activeChannels}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="settings">⚙️ Настройки системы</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
            </Card>
          ) : (
            // Desktop tabs
            <TabsList>
              <TabsTrigger value="channels">Каналы статистики</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="channels" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Каналы статистики</h3>
                <p className="text-sm text-muted-foreground">Управление каналами с автоматическим обновлением</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить канал
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Новый канал статистики</DialogTitle>
                      <DialogDescription>
                        Создайте дополнительный канал с автоматически обновляемым названием
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="channelName">Название*</Label>
                          <Input
                            id="channelName"
                            value={newStatsChannel.name || ''}
                            onChange={(e) => setNewStatsChannel(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Участники"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="statType">Тип статистики</Label>
                          <Select 
                            value={newStatsChannel.type} 
                            onValueChange={(value: any) => setNewStatsChannel(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member-count">Участники</SelectItem>
                              <SelectItem value="human-count">Люди</SelectItem>
                              <SelectItem value="bot-count">Боты</SelectItem>
                              <SelectItem value="online-count">Онлайн</SelectItem>
                              <SelectItem value="channel-count">Каналы</SelectItem>
                              <SelectItem value="role-count">Роли</SelectItem>
                              <SelectItem value="boost-count">Бусты</SelectItem>
                              <SelectItem value="text-channels">Текстовые каналы</SelectItem>
                              <SelectItem value="voice-channels">Голосовые каналы</SelectItem>
                              <SelectItem value="categories">Категории</SelectItem>
                              <SelectItem value="custom">Пользовательский</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template">Шаблон названия</Label>
                        <Input
                          id="template"
                          value={newStatsChannel.template || ''}
                          onChange={(e) => setNewStatsChannel(prev => ({ ...prev, template: e.target.value }))}
                          placeholder="Участников: {count}"
                        />
                        <p className="text-xs text-muted-foreground">
                          Используйте {'{count}'} для вставки значения
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="refreshRate">Интервал обновления (мин)</Label>
                          <Input
                            id="refreshRate"
                            type="number"
                            value={newStatsChannel.refreshRate || 5}
                            onChange={(e) => setNewStatsChannel(prev => ({ ...prev, refreshRate: parseInt(e.target.value) }))}
                            min={1}
                            max={1440}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="channelColor">Цвет</Label>
                          <Input
                            id="channelColor"
                            type="color"
                            value={newStatsChannel.color || '#3b82f6'}
                            onChange={(e) => setNewStatsChannel(prev => ({ ...prev, color: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="channelEnabled">Включен</Label>
                          <p className="text-sm text-muted-foreground">
                            Автоматически обновлять название канала
                          </p>
                        </div>
                        <Switch
                          id="channelEnabled"
                          checked={newStatsChannel.enabled ?? true}
                          onCheckedChange={(checked) => setNewStatsChannel(prev => ({ ...prev, enabled: checked }))}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleCreateStatsChannel}>
                        Создать
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button variant="destructive" onClick={handleDeactivateStats}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Деактивировать
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statsChannels.map((channel) => (
                <Card key={channel.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(channel.type)}
                        <div>
                          <CardTitle className="text-base">{channel.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {getTypeLabel(channel.type)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={channel.enabled ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          {channel.enabled ? 'Активен' : 'Отключен'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Текущее название:</p>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded text-center text-sm font-mono">
                          <Volume2 className="h-3 w-3 text-muted-foreground" />
                          {channel.template.replace('{count}', getMockValue(channel.type).toLocaleString())}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Обновление: {channel.refreshRate}м</span>
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: channel.color }}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Изменить
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteStatsChannel(channel.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Настройки статистики</CardTitle>
                <CardDescription>
                  Конфигурация системы автоматического обновления
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="updateInterval">Интервал об��овления (мин)</Label>
                    <Input
                      id="updateInterval"
                      type="number"
                      value={config.updateInterval}
                      onChange={(e) => handleConfigChange('updateInterval', parseInt(e.target.value))}
                      min={1}
                      max={1440}
                    />
                    <p className="text-xs text-muted-foreground">
                      Частота обновления каналов статистики
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Часовой пояс</Label>
                    <Select 
                      value={config.timezone} 
                      onValueChange={(value) => handleConfigChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Moscow">Москва (GMT+3)</SelectItem>
                        <SelectItem value="Europe/London">Лондон (GMT+0)</SelectItem>
                        <SelectItem value="America/New_York">Нью-Йорк (GMT-5)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Токио (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logChannel">Канал логов</Label>
                    <Select 
                      value={config.logChannelId || ''} 
                      onValueChange={(value) => handleConfigChange('logChannelId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите канал" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.filter(c => c.type === 0).map((channel) => ( // Text channel type
                          <SelectItem key={channel.id} value={channel.id}>
                            # {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Категория каналов</Label>
                    <Select 
                      value={config.categoryId || ''} 
                      onValueChange={(value) => handleConfigChange('categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.filter(c => c.type === 4).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            📁 {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Показывать временные метки</Label>
                      <p className="text-sm text-muted-foreground">
                        Отображать время последнего обновления в логах
                      </p>
                    </div>
                    <Switch
                      checked={config.showTimestamps}
                      onCheckedChange={(checked) => handleConfigChange('showTimestamps', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Компактный режим</Label>
                      <p className="text-sm text-muted-foreground">
                        Использовать сокращенные названия
                      </p>
                    </div>
                    <Switch
                      checked={config.compactMode}
                      onCheckedChange={(checked) => handleConfigChange('compactMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Публичный доступ</Label>
                      <p className="text-sm text-muted-foreground">
                        Разрешить просмотр статистики через веб-интерфейс
                      </p>
                    </div>
                    <Switch
                      checked={config.allowPublicAccess}
                      onCheckedChange={(checked) => handleConfigChange('allowPublicAccess', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}