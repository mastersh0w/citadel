import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '../LanguageProvider';
import { toast } from 'sonner@2.0.3';
import {
  Command,
  Plus,
  Edit,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Save,
  X,
  Info,
  Users,
  Copy,
  Play,
  Code,
  Hash,
  MessageSquare,
  Zap,
  Clock,
  Star
} from 'lucide-react';

interface CustomCommand {
  id: string;
  name: string;
  description: string;
  trigger: string;
  response: string;
  responseType: 'text' | 'embed';
  embedData?: {
    title?: string;
    description?: string;
    color?: string;
    thumbnail?: string;
    image?: string;
    footer?: string;
  };
  enabled: boolean;
  permissions: string[];
  channels: string[];
  cooldown: number;
  usageCount: number;
  createdAt: string;
  lastUsed?: string;
}

interface CommandSettings {
  prefix: string;
  caseSensitive: boolean;
  deleteInvocation: boolean;
  enableInDMs: boolean;
  logUsage: boolean;
}

const mockChannels = [
  { id: '1', name: 'общий', type: 'text' },
  { id: '2', name: 'команды', type: 'text' },
  { id: '3', name: 'боты', type: 'text' },
  { id: '4', name: 'тестирование', type: 'text' }
];

const mockRoles = [
  { id: '1', name: 'Администратор', color: '#ef4444' },
  { id: '2', name: 'Модератор', color: '#3b82f6' },
  { id: '3', name: 'VIP', color: '#f59e0b' },
  { id: '4', name: 'Участник', color: '#22c55e' }
];

const mockCommands: CustomCommand[] = [
  {
    id: '1',
    name: 'Правила сервера',
    description: 'Показывает основные правила сервера',
    trigger: 'правила',
    response: 'Вот основные правила нашего сервера:\n\n1. Уважайте других участников\n2. Не спамьте\n3. Используйте соответствующие каналы\n4. Запрещены оскорбления',
    responseType: 'text',
    enabled: true,
    permissions: [],
    channels: [],
    cooldown: 10,
    usageCount: 45,
    createdAt: '2024-01-10T14:30:00Z',
    lastUsed: '2024-01-20T16:45:00Z'
  },
  {
    id: '2',
    name: 'Информация о сервере',
    description: 'Эмбед с информацией о сервере',
    trigger: 'сервер',
    response: '',
    responseType: 'embed',
    embedData: {
      title: '🏰 Информация о сервере',
      description: 'Добро пожаловать на наш сервер! Здесь вы найдете единомышленников и интересное общение.',
      color: '#3b82f6',
      thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      footer: 'Создан в 2024 году'
    },
    enabled: true,
    permissions: [],
    channels: ['1', '2'],
    cooldown: 30,
    usageCount: 23,
    createdAt: '2024-01-12T09:15:00Z',
    lastUsed: '2024-01-20T12:30:00Z'
  },
  {
    id: '3',
    name: 'Помощь модераторам',
    description: 'Команда только для модераторов',
    trigger: 'модпомощь',
    response: 'Команды модерации:\n\n!kick @user - кикнуть пользователя\n!ban @user - забанить пользователя\n!mute @user - замутить пользователя',
    responseType: 'text',
    enabled: true,
    permissions: ['2'], // Модератор
    channels: [],
    cooldown: 0,
    usageCount: 12,
    createdAt: '2024-01-15T11:20:00Z',
    lastUsed: '2024-01-19T15:10:00Z'
  }
];

const defaultSettings: CommandSettings = {
  prefix: '!',
  caseSensitive: false,
  deleteInvocation: false,
  enableInDMs: false,
  logUsage: true
};

export function CustomCommands() {
  const { t } = useLanguage();
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [settings, setSettings] = useState<CommandSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCommand, setEditingCommand] = useState<CustomCommand | null>(null);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [activeTab, setActiveTab] = useState('commands');

  // Form states
  const [newCommand, setNewCommand] = useState({
    name: '',
    description: '',
    trigger: '',
    response: '',
    responseType: 'text' as 'text' | 'embed',
    embedData: {
      title: '',
      description: '',
      color: '#3b82f6',
      thumbnail: '',
      image: '',
      footer: ''
    },
    enabled: true,
    permissions: [] as string[],
    channels: [] as string[],
    cooldown: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCommands(mockCommands);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Ошибка загрузки команд:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const createCommand = async () => {
    if (!newCommand.name || !newCommand.trigger) {
      toast.error('Заполните обязательные поля');
      return;
    }

    if (commands.some(cmd => cmd.trigger.toLowerCase() === newCommand.trigger.toLowerCase())) {
      toast.error('Команда с таким триггером уже существует');
      return;
    }

    try {
      const command: CustomCommand = {
        id: `cmd_${Date.now()}`,
        name: newCommand.name,
        description: newCommand.description,
        trigger: newCommand.trigger,
        response: newCommand.response,
        responseType: newCommand.responseType,
        embedData: newCommand.responseType === 'embed' ? newCommand.embedData : undefined,
        enabled: newCommand.enabled,
        permissions: newCommand.permissions,
        channels: newCommand.channels,
        cooldown: newCommand.cooldown,
        usageCount: 0,
        createdAt: new Date().toISOString()
      };

      setCommands(prev => [...prev, command]);
      resetForm();
      setShowCreateDialog(false);
      toast.success('Команда создана');
    } catch (error) {
      toast.error('Не удалось создать команду');
    }
  };

  const updateCommand = async () => {
    if (!editingCommand || !newCommand.name || !newCommand.trigger) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      setCommands(prev => prev.map(cmd => 
        cmd.id === editingCommand.id 
          ? {
              ...cmd,
              name: newCommand.name,
              description: newCommand.description,
              trigger: newCommand.trigger,
              response: newCommand.response,
              responseType: newCommand.responseType,
              embedData: newCommand.responseType === 'embed' ? newCommand.embedData : undefined,
              enabled: newCommand.enabled,
              permissions: newCommand.permissions,
              channels: newCommand.channels,
              cooldown: newCommand.cooldown
            }
          : cmd
      ));

      setEditingCommand(null);
      resetForm();
      setShowCreateDialog(false);
      toast.success('Команда обновлена');
    } catch (error) {
      toast.error('Не удалось обновить команду');
    }
  };

  const deleteCommand = async (id: string) => {
    try {
      setCommands(prev => prev.filter(cmd => cmd.id !== id));
      toast.success('Команда удалена');
    } catch (error) {
      toast.error('Не удалось удалить команду');
    }
  };

  const toggleCommand = async (id: string) => {
    try {
      setCommands(prev => prev.map(cmd => 
        cmd.id === id ? { ...cmd, enabled: !cmd.enabled } : cmd
      ));
      toast.success('Статус команды изменен');
    } catch (error) {
      toast.error('Не удалось изменить статус');
    }
  };

  const saveSettings = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error('Не удалось сохранить настройки');
    }
  };

  const resetForm = () => {
    setNewCommand({
      name: '',
      description: '',
      trigger: '',
      response: '',
      responseType: 'text',
      embedData: {
        title: '',
        description: '',
        color: '#3b82f6',
        thumbnail: '',
        image: '',
        footer: ''
      },
      enabled: true,
      permissions: [],
      channels: [],
      cooldown: 0
    });
  };

  const editCommand = (command: CustomCommand) => {
    setEditingCommand(command);
    setNewCommand({
      name: command.name,
      description: command.description,
      trigger: command.trigger,
      response: command.response,
      responseType: command.responseType,
      embedData: command.embedData || {
        title: '',
        description: '',
        color: '#3b82f6',
        thumbnail: '',
        image: '',
        footer: ''
      },
      enabled: command.enabled,
      permissions: command.permissions,
      channels: command.channels,
      cooldown: command.cooldown
    });
    setShowCreateDialog(true);
  };

  const testCommand = (command: CustomCommand) => {
    toast.success(`Тестирование команды: ${settings.prefix}${command.trigger}`);
  };

  const filteredCommands = commands.filter(cmd => {
    if (filter === 'enabled') return cmd.enabled;
    if (filter === 'disabled') return !cmd.enabled;
    return true;
  });

  const totalUsage = commands.reduce((sum, cmd) => sum + cmd.usageCount, 0);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2">
            <Command className="h-6 w-6 text-primary" />
            Кастомные команды
          </h1>
          <p className="text-muted-foreground">
            Создавайте собственные команды для бота с настраиваемыми ответами
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingCommand(null); setShowCreateDialog(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Создать команду
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Command className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего команд</p>
                <p className="text-2xl">{commands.length}</p>
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
                <p className="text-2xl">{commands.filter(c => c.enabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Zap className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Использований</p>
                <p className="text-2xl">{totalUsage}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-1/10 rounded-lg">
                <Settings className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Префикс</p>
                <p className="text-2xl font-mono">{settings.prefix}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Desktop Tabs */}
        <TabsList className="hidden md:flex">
          <TabsTrigger value="commands">Команды</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        {/* Mobile Dropdown */}
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commands">Команды</SelectItem>
              <SelectItem value="settings">Настройки</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="commands" className="space-y-6">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Label>Фильтр:</Label>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все команды</SelectItem>
                <SelectItem value="enabled">Только активные</SelectItem>
                <SelectItem value="disabled">Только отключенные</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Commands List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredCommands.map(command => (
              <Card key={command.id}>
                <CardHeader>
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        <Code className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{command.name}</span>
                        <Badge variant={command.enabled ? "default" : "secondary"} className="flex-shrink-0">
                          {command.enabled ? 'Активна' : 'Отключена'}
                        </Badge>
                        {command.permissions.length > 0 && (
                          <Badge variant="outline" className="flex-shrink-0">Ограничена</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="break-words">{command.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testCommand(command)}
                        className="gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Тест
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editCommand(command)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={command.enabled}
                        onCheckedChange={() => toggleCommand(command.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCommand(command.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Code className="h-5 w-5 flex-shrink-0" />
                        <CardTitle className="truncate flex-1">{command.name}</CardTitle>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant={command.enabled ? "default" : "secondary"}>
                          {command.enabled ? 'Активна' : 'Отключена'}
                        </Badge>
                        <Switch
                          checked={command.enabled}
                          onCheckedChange={() => toggleCommand(command.id)}
                        />
                      </div>
                      
                      {command.description && (
                        <CardDescription className="break-words">{command.description}</CardDescription>
                      )}
                      
                      {command.permissions.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Ограничена
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testCommand(command)}
                        className="w-full gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Тестировать команду
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editCommand(command)}
                          className="flex-1 gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCommand(command.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Триггер</Label>
                      <p className="font-mono break-all">{settings.prefix}{command.trigger}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Использований</Label>
                      <p>{command.usageCount}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Кулдаун</Label>
                      <p>{command.cooldown > 0 ? `${command.cooldown}с` : 'Нет'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Последнее использование</Label>
                      <p className="break-words">{command.lastUsed ? new Date(command.lastUsed).toLocaleString('ru-RU') : 'Не использовалась'}</p>
                    </div>
                  </div>

                  {command.permissions.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Разрешенные роли</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {command.permissions.map(roleId => {
                          const role = mockRoles.find(r => r.id === roleId);
                          return role ? (
                            <Badge key={roleId} variant="outline" style={{ borderColor: role.color }}>
                              {role.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {command.channels.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Разрешенные каналы</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {command.channels.map(channelId => {
                          const channel = mockChannels.find(c => c.id === channelId);
                          return channel ? (
                            <Badge key={channelId} variant="outline">
                              #{channel.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-muted-foreground">Предпросмотр ответа</Label>
                    {command.responseType === 'text' ? (
                      <p className="mt-1 whitespace-pre-wrap break-words">{command.response}</p>
                    ) : (
                      <div className="mt-2 p-3 border rounded bg-background">
                        <h4 className="font-medium break-words" style={{ color: command.embedData?.color }}>
                          {command.embedData?.title}
                        </h4>
                        {command.embedData?.description && (
                          <p className="text-sm text-muted-foreground mt-1 break-words">
                            {command.embedData.description}
                          </p>
                        )}
                        {command.embedData?.footer && (
                          <p className="text-xs text-muted-foreground mt-2 break-words">
                            {command.embedData.footer}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCommands.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Command className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Нет команд</h3>
                <p className="text-muted-foreground mb-4">
                  Создайте первую кастомную команду для вашего бота
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать команду
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основные настройки</CardTitle>
              <CardDescription>
                Настройте общие параметры работы кастомных команд
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Префикс команд</Label>
                  <Input
                    value={settings.prefix}
                    onChange={(e) => setSettings(prev => ({ ...prev, prefix: e.target.value }))}
                    placeholder="!"
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Символ, который должен стоять перед командой
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Чувствительность к регистру</Label>
                    <p className="text-sm text-muted-foreground">
                      Учитывать регистр букв в командах
                    </p>
                  </div>
                  <Switch
                    checked={settings.caseSensitive}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, caseSensitive: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Удалять сообщение команды</Label>
                    <p className="text-sm text-muted-foreground">
                      Автоматически удалять сообщение пользователя с командой
                    </p>
                  </div>
                  <Switch
                    checked={settings.deleteInvocation}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, deleteInvocation: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Работа в ЛС</Label>
                    <p className="text-sm text-muted-foreground">
                      Разрешить использование команд в личных сообщениях
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableInDMs}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableInDMs: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Логирование использования</Label>
                    <p className="text-sm text-muted-foreground">
                      Записывать использование команд в логи
                    </p>
                  </div>
                  <Switch
                    checked={settings.logUsage}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, logUsage: checked }))}
                  />
                </div>
              </div>

              <Button onClick={saveSettings} className="gap-2">
                <Save className="h-4 w-4" />
                Сохранить настройки
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCommand ? 'Редактировать команду' : 'Создать команду'}
            </DialogTitle>
            <DialogDescription>
              Настройте параметры кастомной команды
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Основное</TabsTrigger>
              <TabsTrigger value="response">Ответ</TabsTrigger>
              <TabsTrigger value="permissions">Права доступа</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Название команды *</Label>
                  <Input
                    value={newCommand.name}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Название команды"
                  />
                </div>
                <div>
                  <Label>Триггер *</Label>
                  <div className="flex">
                    <div className="px-3 py-2 bg-muted border border-r-0 rounded-l-md font-mono">
                      {settings.prefix}
                    </div>
                    <Input
                      value={newCommand.trigger}
                      onChange={(e) => setNewCommand(prev => ({ ...prev, trigger: e.target.value.replace(/\s/g, '') }))}
                      placeholder="триггер"
                      className="rounded-l-none font-mono"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Описание</Label>
                <Input
                  value={newCommand.description}
                  onChange={(e) => setNewCommand(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Описание команды"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Кулдаун (секунды)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newCommand.cooldown}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, cooldown: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={newCommand.enabled}
                    onCheckedChange={(checked) => setNewCommand(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label>Активна</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              <div>
                <Label>Тип ответа</Label>
                <Select value={newCommand.responseType} onValueChange={(value: any) => setNewCommand(prev => ({ ...prev, responseType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Текстовое сообщение</SelectItem>
                    <SelectItem value="embed">Эмбед</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCommand.responseType === 'text' ? (
                <div>
                  <Label>Текст ответа</Label>
                  <Textarea
                    value={newCommand.response}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, response: e.target.value }))}
                    placeholder="Введите текст ответа..."
                    rows={6}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Заголовок</Label>
                      <Input
                        value={newCommand.embedData.title}
                        onChange={(e) => setNewCommand(prev => ({ 
                          ...prev, 
                          embedData: { ...prev.embedData, title: e.target.value }
                        }))}
                        placeholder="Заголовок эмбеда"
                      />
                    </div>
                    <div>
                      <Label>Цвет</Label>
                      <Input
                        type="color"
                        value={newCommand.embedData.color}
                        onChange={(e) => setNewCommand(prev => ({ 
                          ...prev, 
                          embedData: { ...prev.embedData, color: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Описание</Label>
                    <Textarea
                      value={newCommand.embedData.description}
                      onChange={(e) => setNewCommand(prev => ({ 
                        ...prev, 
                        embedData: { ...prev.embedData, description: e.target.value }
                      }))}
                      placeholder="Описание эмбеда..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>URL миниатюры</Label>
                      <Input
                        value={newCommand.embedData.thumbnail}
                        onChange={(e) => setNewCommand(prev => ({ 
                          ...prev, 
                          embedData: { ...prev.embedData, thumbnail: e.target.value }
                        }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>URL изображения</Label>
                      <Input
                        value={newCommand.embedData.image}
                        onChange={(e) => setNewCommand(prev => ({ 
                          ...prev, 
                          embedData: { ...prev.embedData, image: e.target.value }
                        }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Подпись</Label>
                    <Input
                      value={newCommand.embedData.footer}
                      onChange={(e) => setNewCommand(prev => ({ 
                        ...prev, 
                        embedData: { ...prev.embedData, footer: e.target.value }
                      }))}
                      placeholder="Текст подписи"
                    />
                  </div>

                  {/* Preview */}
                  <div>
                    <Label>Предпросмотр</Label>
                    <div className="mt-2 p-4 border rounded bg-background">
                      {newCommand.embedData.title && (
                        <h4 className="font-medium" style={{ color: newCommand.embedData.color }}>
                          {newCommand.embedData.title}
                        </h4>
                      )}
                      {newCommand.embedData.description && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {newCommand.embedData.description}
                        </p>
                      )}
                      {newCommand.embedData.footer && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {newCommand.embedData.footer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div>
                <Label>Разрешенные роли</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Оставьте пустым для доступа всем пользователям
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {mockRoles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newCommand.permissions.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCommand(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, role.id]
                            }));
                          } else {
                            setNewCommand(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(id => id !== role.id)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <Label className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Разрешенные каналы</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Оставьте пустым для работы во всех каналах
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {mockChannels.map(channel => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newCommand.channels.includes(channel.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCommand(prev => ({
                              ...prev,
                              channels: [...prev.channels, channel.id]
                            }));
                          } else {
                            setNewCommand(prev => ({
                              ...prev,
                              channels: prev.channels.filter(id => id !== channel.id)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <Label className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        {channel.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={editingCommand ? updateCommand : createCommand} 
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingCommand ? 'Обновить' : 'Создать'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { setShowCreateDialog(false); setEditingCommand(null); resetForm(); }}
            >
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}