import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Ticket, 
  Archive, 
  MessageSquare, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  MessageCircle,
  UserCheck,
  Trash2,
  Edit3,
  Download,
  Star,
  Tag,
  Zap,
  Hash,
  Building,
  Bell,
  HelpCircle,
  Shield,
  Lightbulb,
  Users,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  PlayCircle,
  Wrench
} from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import { cn } from '@/components/ui/utils';
import { extendedApi } from '@/utils/api/extended';
import type { TicketSystemStatus, TicketConfig, Ticket as TicketType, TicketCategory } from '@/types';

const priorities = [
  { value: 'low', label: 'Низкий', color: 'bg-gray-500' },
  { value: 'medium', label: 'Средний', color: 'bg-blue-500' },
  { value: 'high', label: 'Высокий', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Критический', color: 'bg-red-500' }
];

const statuses = [
  { value: 'open', label: 'Открыт', color: 'bg-green-500' },
  { value: 'assigned', label: 'В работе', color: 'bg-blue-500' },
  { value: 'waiting', label: 'Ожидание', color: 'bg-yellow-500' },
  { value: 'closed', label: '��акрыт', color: 'bg-gray-500' },
  { value: 'archived', label: 'Архивирован', color: 'bg-purple-500' }
];

export function TicketSystem() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [systemStatus, setSystemStatus] = useState<TicketSystemStatus | null>(null);
  const [config, setConfig] = useState<TicketConfig | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [newTicket, setNewTicket] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium'
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    emoji: '❓',
    color: '#8b5cf6',
    autoResponse: '',
    supportRoles: [] as string[],
    requiredInfo: [] as string[],
    enabled: true
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusResponse, configResponse, ticketsResponse, rolesResponse, channelsResponse] = await Promise.all([
        extendedApi.getTicketSystemStatus(),
        extendedApi.getTicketConfig(),
        extendedApi.getTickets(),
        extendedApi.getRoles(),
        extendedApi.getChannels()
      ]);

      if (statusResponse.success) setSystemStatus(statusResponse.data);
      if (configResponse.success) setConfig(configResponse.data);
      if (ticketsResponse.success) setTickets(ticketsResponse.data);
      if (rolesResponse.success) setRoles(rolesResponse.data);
      if (channelsResponse.success) setChannels(channelsResponse.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicketSystem = async () => {
    setActionLoading(true);
    try {
      const response = await extendedApi.createTicketSystem();
      if (response.success) {
        setSystemStatus(response.data);
        toast.success('Тикет-система успешно создана!');
        loadData(); // Reload all data
      } else {
        toast.error(response.error || 'Ошибка создания тикет-системы');
      }
    } catch (error) {
      toast.error('Ошибка создания тикет-системы');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepairSystem = async (options: {
    createSupportCategory?: boolean;
    createArchiveCategory?: boolean;
    createSupportChannel?: boolean;
    repostMessage?: boolean;
  }) => {
    setActionLoading(true);
    try {
      const response = await extendedApi.repairTicketSystem(options);
      if (response.success) {
        setSystemStatus(response.data);
        toast.success('Тикет-система восстановлена!');
      } else {
        toast.error(response.error || 'Ошибка восстановления');
      }
    } catch (error) {
      toast.error('Ошибка восстановления тикет-системы');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedTo: string) => {
    try {
      const response = await extendedApi.assignTicket(ticketId, assignedTo);
      if (response.success) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId ? response.data : ticket
        ));
        toast.success('Тикет взят в работу');
      } else {
        toast.error(response.error || 'Ошибка назначения тикета');
      }
    } catch (error) {
      toast.error('Ошибка назначения тикета');
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const response = await extendedApi.closeTicket(ticketId);
      if (response.success) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId ? response.data : ticket
        ));
        toast.success('Тикет закрыт');
      } else {
        toast.error(response.error || 'Ошибка закрытия тикета');
      }
    } catch (error) {
      toast.error('Ошибка закрытия тикета');
    }
  };

  const handleArchiveTicket = async (ticketId: string) => {
    try {
      const response = await extendedApi.archiveTicket(ticketId);
      if (response.success) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId ? response.data : ticket
        ));
        toast.success('Тикет архивирован');
      } else {
        toast.error(response.error || 'Ошибка архивирования тикета');
      }
    } catch (error) {
      toast.error('Ошибка архивирования тикета');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.description) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const response = await extendedApi.addTicketCategory(newCategory);
      if (response.success && config) {
        setConfig({
          ...config,
          categories: [...config.categories, response.data]
        });
        setNewCategory({
          name: '',
          description: '',
          emoji: '❓',
          color: '#8b5cf6',
          autoResponse: '',
          supportRoles: [],
          requiredInfo: [],
          enabled: true
        });
        setIsCategoryDialogOpen(false);
        toast.success('Категория создана');
      } else {
        toast.error(response.error || 'Ошибка создания категории');
      }
    } catch (error) {
      toast.error('Ошибка создания категории');
    }
  };

  const handleUpdateConfig = async (updates: Partial<TicketConfig>) => {
    if (!config) return;

    try {
      const response = await extendedApi.updateTicketConfig({ ...config, ...updates });
      if (response.success) {
        setConfig(response.data);
        toast.success('Настройки сохранены');
      } else {
        toast.error(response.error || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      toast.error('Ошибка сохранения настроек');
    }
  };

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getStatusColor = (status: string) => {
    return statuses.find(s => s.value === status)?.color || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // System not setup view
  if (!systemStatus?.isSetup) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Система тикетов</h1>
            <p className="text-muted-foreground">
              Управление тикетами техподдержки
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Настройка тикет-системы
            </CardTitle>
            <CardDescription>
              Тикет-система еще не настроена. Для начала работы необходимо создать каналы и категории.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                При создании тикет-системы будут созданы:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Категория "ТЕХПОДДЕРЖКА"</strong> - для активных тикетов</li>
                  <li><strong>Категория "АРХИВ ТИКЕТОВ"</strong> - для закрытых тикетов</li>
                  <li><strong>Канал "создать-тикет"</strong> - с сообщением и кнопками</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleCreateTicketSystem}
              disabled={actionLoading}
              size="lg"
              className="w-full"
            >
              {actionLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Создать тикет-систему
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Система тикетов</h1>
          <p className="text-muted-foreground">
            Управление тикетами техподдержки
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Обновить
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {isMobile ? (
          // Mobile dropdown menu
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Раздел тикет-системы</Label>
                <Badge variant="outline" className="text-xs">
                  {activeTab === 'overview' && 'Обзор'}
                  {activeTab === 'tickets' && `${filteredTickets.length} тикетов`}
                  {activeTab === 'categories' && 'Категории'}
                  {activeTab === 'settings' && 'Настройки'}
                  {activeTab === 'analytics' && 'Аналитика'}
                </Badge>
              </div>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {activeTab === 'overview' && '📊 Обзор системы'}
                    {activeTab === 'tickets' && `🎫 Тикеты (${filteredTickets.length})`}
                    {activeTab === 'categories' && '📁 Категории тикетов'}
                    {activeTab === 'settings' && '⚙️ Настройки системы'}
                    {activeTab === 'analytics' && '📈 Аналитика и статистика'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">📊 Обзор системы</SelectItem>
                  <SelectItem value="tickets">
                    <div className="flex items-center justify-between w-full">
                      <span>🎫 Тикеты</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {filteredTickets.length}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="categories">📁 Категории тикетов</SelectItem>
                  <SelectItem value="settings">⚙️ Настройки системы</SelectItem>
                  <SelectItem value="analytics">📈 Аналитика и статистика</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
          </Card>
        ) : (
          // Desktop tabs
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="tickets">Тикеты ({filteredTickets.length})</TabsTrigger>
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="overview" className="space-y-4">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-500" />
                Статус системы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Категория техподдержки</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {systemStatus.supportCategoryName || 'Не настроено'}
                    </Badge>
                    {!systemStatus.supportCategoryId && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRepairSystem({ createSupportCategory: true })}
                        disabled={actionLoading}
                      >
                        Создать
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Категория архива</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {systemStatus.archiveCategoryName || 'Не настроено'}
                    </Badge>
                    {!systemStatus.archiveCategoryId && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRepairSystem({ createArchiveCategory: true })}
                        disabled={actionLoading}
                      >
                        Создать
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Канал создания тикетов</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {systemStatus.supportChannelName || 'Не настроено'}
                    </Badge>
                    {!systemStatus.supportChannelId && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRepairSystem({ createSupportChannel: true })}
                        disabled={actionLoading}
                      >
                        Создать
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Сообщение с кнопками</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {systemStatus.messageId ? 'Активно' : 'Не настроено'}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRepairSystem({ repostMessage: true })}
                      disabled={actionLoading}
                    >
                      {systemStatus.messageId ? 'Переотправить' : 'Отправить'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Следующий номер тикета</Label>
                <Badge variant="outline">#{systemStatus.nextTicketNumber?.toString().padStart(5, '0')}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Всего тикетов</p>
                    <p className="text-2xl font-bold">{tickets.length}</p>
                  </div>
                  <Ticket className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Открытых</p>
                    <p className="text-2xl font-bold">
                      {tickets.filter(t => t.status === 'open' || t.status === 'assigned').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Закрытых</p>
                    <p className="text-2xl font-bold">
                      {tickets.filter(t => t.status === 'closed').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Архивированных</p>
                    <p className="text-2xl font-bold">
                      {tickets.filter(t => t.status === 'archived').length}
                    </p>
                  </div>
                  <Archive className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Последние тикеты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets.slice(0, 5).map(ticket => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-white", getStatusColor(ticket.status))}>
                        {statuses.find(s => s.value === ticket.status)?.label}
                      </Badge>
                      <span className="font-medium">#{ticket.number}</span>
                      <span>{ticket.subject}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Поиск по тикетам..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все приоритеты</SelectItem>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <div className="grid gap-4">
            {filteredTickets.map(ticket => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("text-white", getStatusColor(ticket.status))}>
                          {statuses.find(s => s.value === ticket.status)?.label}
                        </Badge>
                        <Badge variant="secondary" className={cn("text-white", getPriorityColor(ticket.priority))}>
                          {priorities.find(p => p.value === ticket.priority)?.label}
                        </Badge>
                        <Badge variant="outline">#{ticket.number}</Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                      <p className="text-muted-foreground mb-2">{ticket.categoryName}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {ticket.username}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {ticket.messages} сообщений
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(ticket.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-white", getStatusColor(ticket.status))}>
                        {statuses.find(s => s.value === ticket.status)?.label}
                      </Badge>
                      <Badge variant="secondary" className={cn("text-white", getPriorityColor(ticket.priority))}>
                        {priorities.find(p => p.value === ticket.priority)?.label}
                      </Badge>
                      <Badge variant="outline">#{ticket.number}</Badge>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                      <p className="text-muted-foreground text-sm">{ticket.categoryName}</p>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {ticket.username}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {ticket.messages} сообщений
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(ticket.createdAt)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Просмотреть
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ответить
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
              <CardTitle>Настройки системы</CardTitle>
              <CardDescription>
                Основные настройки тикет-системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {config && (
                <>
                  <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                    {isMobile ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-base">Система включена</Label>
                          <Switch
                            checked={config.enabled}
                            onCheckedChange={(checked) => handleUpdateConfig({ enabled: checked })}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground pl-0">
                          Включить или отключить всю систему тикетов
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <Label className="text-base">Система включена</Label>
                          <div className="text-sm text-muted-foreground">
                            Включить или отключить всю систему тикетов
                          </div>
                        </div>
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(checked) => handleUpdateConfig({ enabled: checked })}
                        />
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                    {isMobile ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-base">Автозакрытие тикетов</Label>
                          <Switch
                            checked={config.autoClose}
                            onCheckedChange={(checked) => handleUpdateConfig({ autoClose: checked })}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground pl-0">
                          Автоматически закрывать неактивные тикеты через 7 дней
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <Label className="text-base">Автозакрытие тикетов</Label>
                          <div className="text-sm text-muted-foreground">
                            Автоматически закрывать неактивные тикеты через 7 дней
                          </div>
                        </div>
                        <Switch
                          checked={config.autoClose}
                          onCheckedChange={(checked) => handleUpdateConfig({ autoClose: checked })}
                        />
                      </>
                    )}
                  </div>

                  <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                    {isMobile ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-base">Уведомления о новых тикетах</Label>
                          <Switch
                            checked={config.notifications}
                            onCheckedChange={(checked) => handleUpdateConfig({ notifications: checked })}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground pl-0">
                          Отправлять уведомления персоналу о новых тикетах
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <Label className="text-base">Уведомления о новых тикетах</Label>
                          <div className="text-sm text-muted-foreground">
                            Отправлять уведомления персоналу о новых тикетах
                          </div>
                        </div>
                        <Switch
                          checked={config.notifications}
                          onCheckedChange={(checked) => handleUpdateConfig({ notifications: checked })}
                        />
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base">Роли персонала поддержки</Label>
                    <div className="grid gap-3">
                      {roles.map(role => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={config.supportRoles?.includes(role.id) || false}
                            onCheckedChange={(checked) => {
                              const currentRoles = config.supportRoles || [];
                              const updatedRoles = checked
                                ? [...currentRoles, role.id]
                                : currentRoles.filter(id => id !== role.id);
                              handleUpdateConfig({ supportRoles: updatedRoles });
                            }}
                          />
                          <label 
                            htmlFor={`role-${role.id}`}
                            className="text-sm cursor-pointer flex items-center gap-2"
                          >
                            {role.color && (
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: `#${role.color.toString(16).padStart(6, '0')}` }}
                              />
                            )}
                            {role.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            {/* Statistics by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Статистика по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {config?.categories.map(category => {
                    const categoryTickets = tickets.filter(t => t.categoryName === category.name);
                    return (
                      <div key={category.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{category.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium truncate">{category.name}</h4>
                            <p className="text-lg font-bold text-primary">
                              {categoryTickets.length} тикетов
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Последняя активность</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.slice(0, 10).map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{ticket.number}</Badge>
                        <span className="font-medium">{ticket.subject}</span>
                        <Badge className={cn("text-white text-xs", getStatusColor(ticket.status))}>
                          {statuses.find(s => s.value === ticket.status)?.label}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(ticket.updatedAt || ticket.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}