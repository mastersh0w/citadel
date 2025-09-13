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
import { 
  CrossChatConfig,
  CrossChatInstance,
  CrossChatConnection,
  CrossChatKey,
  Channel,
  Role 
} from '@/types';
import { mockChannels, mockRoles } from '@/utils/mock-data';
import { toast } from 'sonner@2.0.3';
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Key,
  Users,
  Globe,
  Link,
  Unlink,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  RefreshCw,
  Crown,
  UserMinus,
  Filter,
  Search,
  Eye,
  EyeOff,
  Server,
  Hash,
  Clock,
  Activity,
  Network,
  Home,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';

const mockChatInstances: CrossChatInstance[] = [
  {
    id: '1',
    name: 'Главная сеть',
    description: 'Основная межсерверная сеть для общения',
    role: 'host',
    channelId: '1234567890',
    channelName: 'cross-chat',
    networkId: 'network-1',
    networkName: 'Citadel Network',
    status: 'active',
    connectedChannels: [
      {
        id: '1',
        guildId: '123456789',
        guildName: 'Gaming Community',
        channelId: '987654321',
        channelName: 'general-chat',
        memberCount: 1250,
        status: 'connected',
        connectedAt: '2024-01-15T10:30:00Z',
        lastActivity: '2024-01-20T14:22:00Z',
        messageCount: 4567
      },
      {
        id: '2',
        guildId: '234567890',
        guildName: 'Art & Design Hub',
        channelId: '876543210',
        channelName: 'cross-chat',
        memberCount: 890,
        status: 'connected',
        connectedAt: '2024-01-18T16:45:00Z',
        lastActivity: '2024-01-20T13:15:00Z',
        messageCount: 2341
      }
    ],
    settings: {
      allowedRoles: ['123456789', '987654321'],
      blockedUsers: [],
      messageFilters: {
        profanity: true,
        links: false,
        invites: true,
        images: true,
        embeds: true
      },
      autoJoin: true,
      maxConnections: 50
    },
    stats: {
      totalMessages: 15432,
      activeConnections: 2,
      totalMembers: 2140,
      uptime: 345600
    },
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-20T14:22:00Z',
    createdBy: 'user123'
  },
  {
    id: '2',
    name: 'Модераторская сеть',
    description: 'Приватная сеть для координации модераторов',
    role: 'member',
    channelId: '2345678901',
    channelName: 'mod-chat',
    networkId: 'network-2',
    networkName: 'Moderator Alliance',
    status: 'active',
    connectedChannels: [],
    settings: {
      allowedRoles: ['mod-role-id'],
      blockedUsers: [],
      messageFilters: {
        profanity: false,
        links: true,
        invites: false,
        images: true,
        embeds: true
      },
      autoJoin: true
    },
    stats: {
      totalMessages: 892,
      activeConnections: 5,
      totalMembers: 45,
      uptime: 123400
    },
    createdAt: '2024-01-12T15:30:00Z',
    updatedAt: '2024-01-20T12:15:00Z',
    createdBy: 'user123'
  },
  {
    id: '3',
    name: 'Тестовый чат',
    description: 'Экспериментальный чат для тестирования',
    role: 'host',
    channelId: '3456789012',
    channelName: 'test-cross',
    networkId: 'network-3',
    networkName: 'Test Network',
    status: 'inactive',
    connectedChannels: [],
    settings: {
      allowedRoles: [],
      blockedUsers: [],
      messageFilters: {
        profanity: false,
        links: false,
        invites: false,
        images: false,
        embeds: false
      },
      autoJoin: false,
      maxConnections: 10
    },
    stats: {
      totalMessages: 23,
      activeConnections: 0,
      totalMembers: 0,
      uptime: 0
    },
    createdAt: '2024-01-19T09:00:00Z',
    updatedAt: '2024-01-19T09:00:00Z',
    createdBy: 'user123'
  }
];

const mockKeys: CrossChatKey[] = [
  {
    key: 'cc-a1b2c3d4e5f6',
    networkId: 'network-1',
    networkName: 'Citradel Network',
    hostChatId: '1',
    createdAt: '2024-01-20T12:00:00Z',
    expiresAt: '2024-01-20T18:00:00Z',
    used: false,
    maxUses: 5,
    currentUses: 0
  },
  {
    key: 'cc-x9y8z7w6v5u4',
    networkId: 'network-1',
    networkName: 'Citradel Network',
    hostChatId: '1',
    createdAt: '2024-01-20T10:30:00Z',
    expiresAt: '2024-01-20T16:30:00Z',
    usedBy: 'Gaming Community',
    used: true,
    maxUses: 3,
    currentUses: 2
  }
];

export function CrossChat() {
  const [channels] = useState<Channel[]>(mockChannels);
  const [roles] = useState<Role[]>(mockRoles);
  const [chatInstances, setChatInstances] = useState<CrossChatInstance[]>(mockChatInstances);
  const [keys, setKeys] = useState<CrossChatKey[]>(mockKeys);
  const [config, setConfig] = useState<CrossChatConfig>({
    enabled: true,
    chats: mockChatInstances,
    globalSettings: {
      allowedRoles: [],
      blockedUsers: [],
      messageFilters: {
        profanity: true,
        links: false,
        invites: true,
        images: true,
        embeds: true
      },
      logChannelId: '9876543210'
    }
  });
  
  const [selectedChat, setSelectedChat] = useState<CrossChatInstance | null>(null);
  const [joinKey, setJoinKey] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('chats');
  const [isMobile, setIsMobile] = useState(false);

  // New chat creation form
  const [newChatForm, setNewChatForm] = useState({
    name: '',
    description: '',
    role: 'host' as 'host' | 'member',
    channelId: '',
    networkName: '',
    joinKey: '',
    maxConnections: 50,
    autoJoin: true
  });

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredChats = chatInstances.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.networkName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    const matchesRole = roleFilter === 'all' || chat.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getGlobalStats = () => {
    const totalChats = chatInstances.length;
    const activeChats = chatInstances.filter(c => c.status === 'active').length;
    const hostChats = chatInstances.filter(c => c.role === 'host').length;
    const memberChats = chatInstances.filter(c => c.role === 'member').length;
    const totalConnections = chatInstances.reduce((sum, c) => sum + c.stats.activeConnections, 0);
    const totalMessages = chatInstances.reduce((sum, c) => sum + c.stats.totalMessages, 0);
    const activeKeys = keys.filter(k => !k.used && new Date(k.expiresAt) > new Date()).length;
    
    return { totalChats, activeChats, hostChats, memberChats, totalConnections, totalMessages, activeKeys };
  };

  const stats = getGlobalStats();

  const handleCreateChat = () => {
    if (!newChatForm.name.trim() || !newChatForm.channelId) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (newChatForm.role === 'member' && !newChatForm.joinKey.trim()) {
      toast.error('Для подключения к сети введите ключ');
      return;
    }

    const newChat: CrossChatInstance = {
      id: Date.now().toString(),
      name: newChatForm.name,
      description: newChatForm.description,
      role: newChatForm.role,
      channelId: newChatForm.channelId,
      channelName: channels.find(c => c.id === newChatForm.channelId)?.name || 'unknown',
      networkId: newChatForm.role === 'host' ? `network-${Date.now()}` : undefined,
      networkName: newChatForm.role === 'host' ? newChatForm.networkName : undefined,
      status: 'inactive',
      connectedChannels: [],
      settings: {
        allowedRoles: [],
        blockedUsers: [],
        messageFilters: {
          profanity: true,
          links: false,
          invites: true,
          images: true,
          embeds: true
        },
        autoJoin: newChatForm.autoJoin,
        maxConnections: newChatForm.role === 'host' ? newChatForm.maxConnections : undefined
      },
      stats: {
        totalMessages: 0,
        activeConnections: 0,
        totalMembers: 0,
        uptime: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user'
    };

    setChatInstances(prev => [...prev, newChat]);
    setConfig(prev => ({ ...prev, chats: [...prev.chats, newChat] }));
    
    setNewChatForm({
      name: '',
      description: '',
      role: 'host',
      channelId: '',
      networkName: '',
      joinKey: '',
      maxConnections: 50,
      autoJoin: true
    });
    
    setShowCreateDialog(false);
    toast.success(`Чат "${newChat.name}" создан`);
  };

  const toggleChatStatus = (chatId: string) => {
    setChatInstances(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, status: chat.status === 'active' ? 'inactive' : 'active' }
        : chat
    ));
    
    const chat = chatInstances.find(c => c.id === chatId);
    toast.success(`Чат "${chat?.name}" ${chat?.status === 'active' ? 'остановлен' : 'запущен'}`);
  };

  const deleteChat = (chatId: string) => {
    const chat = chatInstances.find(c => c.id === chatId);
    setChatInstances(prev => prev.filter(c => c.id !== chatId));
    setConfig(prev => ({ ...prev, chats: prev.chats.filter(c => c.id !== chatId) }));
    toast.success(`Чат "${chat?.name}" удален`);
  };

  const generateNewKey = (chatId: string) => {
    const chat = chatInstances.find(c => c.id === chatId);
    if (!chat || chat.role !== 'host') {
      toast.error('Ключи может создавать только хост');
      return;
    }

    const newKey: CrossChatKey = {
      key: `cc-${Math.random().toString(36).substr(2, 12)}`,
      networkId: chat.networkId!,
      networkName: chat.networkName!,
      hostChatId: chatId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
      used: false,
      maxUses: 5,
      currentUses: 0
    };
    
    setKeys(prev => [newKey, ...prev]);
    toast.success('Новый ключ создан');
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Ключ скопирован в буфер обмена');
  };

  const revokeKey = (keyToRevoke: string) => {
    setKeys(prev => prev.filter(k => k.key !== keyToRevoke));
    toast.success('Ключ отозван');
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return `${Math.floor(diffInMinutes / 1440)} д назад`;
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return 'Неактивен';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}д ${hours}ч`;
    if (hours > 0) return `${hours}ч ${mins}м`;
    return `${mins}м`;
  };

  const isKeyExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Межсерверный чат</h2>
          <p className="text-muted-foreground">
            Управление множественными межсерверными чатами
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {config.enabled ? 'Активен' : 'Неактивен'}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {stats.totalChats} чатов
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Всего чатов</p>
                <p className="text-2xl font-semibold">{stats.totalChats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-2xl font-semibold">{stats.activeChats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Хостов</p>
                <p className="text-2xl font-semibold">{stats.hostChats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Участников</p>
                <p className="text-2xl font-semibold">{stats.memberChats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Подключений</p>
                <p className="text-2xl font-semibold">{stats.totalConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-sm text-muted-foreground">Сообщений</p>
                <p className="text-2xl font-semibold">{stats.totalMessages.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ключей</p>
                <p className="text-2xl font-semibold">{stats.activeKeys}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {isMobile ? (
          // Mobile dropdown menu
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Раздел межсерверного чата</Label>
                <Badge variant="outline" className="text-xs">
                  {activeTab === 'chats' && `${stats.totalChats} чатов`}
                  {activeTab === 'keys' && `${stats.activeKeys} ключей`}
                  {activeTab === 'settings' && 'Конфигурация'}
                </Badge>
              </div>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {activeTab === 'chats' && '💬 Мои чаты'}
                    {activeTab === 'keys' && '🔑 Ключи подключения'}
                    {activeTab === 'settings' && '⚙️ Глобальные настройки'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chats">
                    <div className="flex items-center justify-between w-full">
                      <span>💬 Мои чаты</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {stats.totalChats}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="keys">
                    <div className="flex items-center justify-between w-full">
                      <span>🔑 Ключи подключения</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {stats.activeKeys}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="settings">⚙️ Глобальные настройки</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
          </Card>
        ) : (
          // Desktop tabs
          <TabsList>
            <TabsTrigger value="chats">Мои чаты</TabsTrigger>
            <TabsTrigger value="keys">Ключи</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="chats" className="space-y-6">
          {/* Chat Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Управление чатами</CardTitle>
                  <CardDescription>
                    Создавайте и управляйте множественными межсерверными чатами
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Создать чат
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Создание нового чата</DialogTitle>
                        <DialogDescription>
                          Создайте новый межсерверный чат или подключитесь к существующему
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Название чата</Label>
                          <Input
                            value={newChatForm.name}
                            onChange={(e) => setNewChatForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Например: Главный чат"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Описание</Label>
                          <Textarea
                            value={newChatForm.description}
                            onChange={(e) => setNewChatForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Краткое описание чата"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Канал</Label>
                          <Select 
                            value={newChatForm.channelId} 
                            onValueChange={(value) => setNewChatForm(prev => ({ ...prev, channelId: value }))}
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
                          <Label>Роль чата</Label>
                          <Select 
                            value={newChatForm.role} 
                            onValueChange={(value: 'host' | 'member') => setNewChatForm(prev => ({ ...prev, role: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="host">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                  Хост (создать сеть)
                                </div>
                              </SelectItem>
                              <SelectItem value="member">
                                <div className="flex items-center gap-2">
                                  <Link className="h-4 w-4 text-blue-500" />
                                  Участник (подключиться)
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {newChatForm.role === 'host' && (
                          <>
                            <div className="space-y-2">
                              <Label>Название сети</Label>
                              <Input
                                value={newChatForm.networkName}
                                onChange={(e) => setNewChatForm(prev => ({ ...prev, networkName: e.target.value }))}
                                placeholder="Например: My Network"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Максимум подключений</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={newChatForm.maxConnections}
                                onChange={(e) => setNewChatForm(prev => ({ ...prev, maxConnections: parseInt(e.target.value) || 50 }))}
                              />
                            </div>
                          </>
                        )}

                        {newChatForm.role === 'member' && (
                          <div className="space-y-2">
                            <Label>Ключ подключения</Label>
                            <Input
                              value={newChatForm.joinKey}
                              onChange={(e) => setNewChatForm(prev => ({ ...prev, joinKey: e.target.value }))}
                              placeholder="cc-a1b2c3d4e5f6"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Label>Автозапуск при старте бота</Label>
                          <Switch
                            checked={newChatForm.autoJoin}
                            onCheckedChange={(checked) => setNewChatForm(prev => ({ ...prev, autoJoin: checked }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Отмена
                        </Button>
                        <Button onClick={handleCreateChat}>
                          Создать
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск по названию чата или сети..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="inactive">Неактивные</SelectItem>
                      <SelectItem value="pending">Ожидают</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все роли</SelectItem>
                      <SelectItem value="host">Хосты</SelectItem>
                      <SelectItem value="member">Участники</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Chat List */}
                {filteredChats.length === 0 ? (
                  <div className="text-center py-12">
                    <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Нет чатов</h3>
                    <p className="text-muted-foreground mb-4">
                      Создайте свой первый межсерверный чат
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Создать чат
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredChats.map((chat) => (
                      <Card key={chat.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {chat.role === 'host' ? (
                              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                <Crown className="h-6 w-6 text-yellow-500" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Link className="h-6 w-6 text-blue-500" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium truncate">{chat.name}</h3>
                                  <Badge 
                                    variant={chat.status === 'active' ? 'default' : 'secondary'}
                                    className="flex-shrink-0"
                                  >
                                    {chat.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {chat.status === 'inactive' && <XCircle className="h-3 w-3 mr-1" />}
                                    {chat.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                    {chat.status === 'active' ? 'Активен' : 
                                     chat.status === 'inactive' ? 'Неактивен' : 
                                     chat.status === 'pending' ? 'Ожидает' : 'Ошибка'}
                                  </Badge>
                                  <Badge variant="outline" className="flex-shrink-0">
                                    {chat.role === 'host' ? 'Хост' : 'Участник'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{chat.description}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    {chat.channelName}
                                  </span>
                                  {chat.networkName && (
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {chat.networkName}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Server className="h-3 w-3" />
                                    {chat.stats.activeConnections}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {chat.stats.totalMessages.toLocaleString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatUptime(chat.stats.uptime)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleChatStatus(chat.id)}
                                  className="gap-1"
                                >
                                  {chat.status === 'active' ? (
                                    <>
                                      <Pause className="h-3 w-3" />
                                      Стоп
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-3 w-3" />
                                      Старт
                                    </>
                                  )}
                                </Button>
                                
                                {chat.role === 'host' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => generateNewKey(chat.id)}
                                    className="gap-1"
                                  >
                                    <Key className="h-3 w-3" />
                                    Ключ
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedChat(chat)}
                                  className="gap-1"
                                >
                                  <Settings className="h-3 w-3" />
                                  Настройки
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteChat(chat.id)}
                                  className="gap-1 text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keys" className="space-y-6">
          {/* Keys Management */}
          <Card>
            <CardHeader>
              <CardTitle>Ключи подключения</CardTitle>
              <CardDescription>
                Управление ключами для подключения к вашим хост-чатам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Нет созданных ключей</p>
                    <p className="text-sm text-muted-foreground">
                      Создайте хост-чат, чтобы генерировать ключи подключения
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ключ</TableHead>
                          <TableHead>Сеть</TableHead>
                          <TableHead>Использований</TableHead>
                          <TableHead>Создан</TableHead>
                          <TableHead>Истекает</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keys.map((key) => (
                          <TableRow key={key.key}>
                            <TableCell className="font-mono text-sm">
                              {key.key}
                            </TableCell>
                            <TableCell>{key.networkName}</TableCell>
                            <TableCell>
                              {key.currentUses}/{key.maxUses || '∞'}
                            </TableCell>
                            <TableCell>{formatTimeAgo(key.createdAt)}</TableCell>
                            <TableCell>{formatTimeAgo(key.expiresAt)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={isKeyExpired(key.expiresAt) ? 'destructive' : 
                                        key.used && key.currentUses >= (key.maxUses || Infinity) ? 'secondary' : 'default'}
                              >
                                {isKeyExpired(key.expiresAt) ? 'Истек' :
                                 key.used && key.currentUses >= (key.maxUses || Infinity) ? 'Исчерпан' : 'Активен'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyKey(key.key)}
                                  className="gap-1"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => revokeKey(key.key)}
                                  className="gap-1 text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Глобальные настройки</CardTitle>
              <CardDescription>
                Общие настройки для всех межсерверных чатов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                {isMobile ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Включить межсерверный чат</Label>
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground pl-0">
                      Главный переключатель для всех чатов
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <Label>Включить межсерверный чат</Label>
                      <div className="text-sm text-muted-foreground">
                        Главный переключатель для всех чатов
                      </div>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                    />
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Канал для логов</Label>
                <Select 
                  value={config.globalSettings.logChannelId} 
                  onValueChange={(value) => setConfig(prev => ({
                    ...prev,
                    globalSettings: { ...prev.globalSettings, logChannelId: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите канал для логов" />
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

              <Separator />

              <div className="space-y-4">
                <Label>Глобальные фильтры сообщений</Label>
                <div className={isMobile ? "space-y-6" : "grid gap-4 md:grid-cols-2"}>
                  {Object.entries(config.globalSettings.messageFilters).map(([key, value]) => (
                    <div key={key} className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                      {isMobile ? (
                        <>
                          <div className="flex items-center justify-between">
                            <Label>
                              {key === 'profanity' ? 'Нецензурная лексика' :
                               key === 'links' ? 'Ссылки' :
                               key === 'invites' ? 'Приглашения Discord' :
                               key === 'images' ? 'Изображения' :
                               key === 'embeds' ? 'Встроенные сообщения' : key}
                            </Label>
                            <Switch
                              checked={value}
                              onCheckedChange={(checked) => setConfig(prev => ({
                                ...prev,
                                globalSettings: {
                                  ...prev.globalSettings,
                                  messageFilters: {
                                    ...prev.globalSettings.messageFilters,
                                    [key]: checked
                                  }
                                }
                              }))}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <Label>
                            {key === 'profanity' ? 'Нецензурная лексика' :
                             key === 'links' ? 'Ссылки' :
                             key === 'invites' ? 'Приглашения Discord' :
                             key === 'images' ? 'Изображения' :
                             key === 'embeds' ? 'Встроенные сообщения' : key}
                          </Label>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => setConfig(prev => ({
                              ...prev,
                              globalSettings: {
                                ...prev.globalSettings,
                                messageFilters: {
                                  ...prev.globalSettings.messageFilters,
                                  [key]: checked
                                }
                              }
                            }))}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}