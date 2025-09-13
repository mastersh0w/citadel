import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Plus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit,
  User,
  Crown,
  UserX,
  Settings,
  Search,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';
import { AccessControlEntry, AccessControlSettings } from '@/types';
import { api } from '@/utils/api';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { toast } from 'sonner';

export function AccessControl() {
  const [entries, setEntries] = useState<AccessControlEntry[]>([]);
  const [settings, setSettings] = useState<AccessControlSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'role'>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'owner' | 'admin' | 'moderator' | 'ignored'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccessControlEntry | null>(null);
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

  const [newEntry, setNewEntry] = useState({
    type: 'user' as 'user' | 'role',
    name: '',
    identifier: '',
    accessLevel: 'moderator' as 'owner' | 'admin' | 'moderator' | 'ignored',
    restrictions: [] as string[],
    exemptFeatures: [] as string[]
  });

  const availableFeatures = [
    { id: 'dashboard', name: 'Панель управления' },
    { id: 'anti-nuke', name: 'Анти-Нюк' },
    { id: 'backups', name: 'Резервные копии' },
    { id: 'whitelist', name: 'Белый список' },
    { id: 'quarantine', name: 'Карантин' },
    { id: 'moderation', name: 'Модерация' },
    { id: 'user-ranking', name: 'Рейтинг пользователей' },
    { id: 'role-system', name: 'Система ролей' },
    { id: 'banner-manager', name: 'Управление баннером' },
    { id: 'audit-logs', name: 'Журнал аудита' },
    { id: 'notifications', name: 'Уведомления' },
    { id: 'settings', name: 'Настройки' },
    { id: 'access-control', name: 'Управление доступом' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesResponse, settingsResponse] = await Promise.all([
        api.accessControl.getEntries(),
        api.accessControl.getSettings()
      ]);
      
      if (entriesResponse.success && entriesResponse.data) {
        setEntries(entriesResponse.data);
      }
      
      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных управления доступом:', error);
      toast.error('Не удалось загрузить данные управления доступом');
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newEntry.name.trim() || !newEntry.identifier.trim()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (newEntry.accessLevel === 'owner') {
      toast.error('Нельзя назначить уровень доступа "Владелец" другим пользователям');
      return;
    }

    try {
      const response = await api.accessControl.addEntry({
        type: newEntry.type,
        name: newEntry.name.trim(),
        identifier: newEntry.identifier.trim(),
        accessLevel: newEntry.accessLevel,
        restrictions: newEntry.restrictions,
        exemptFeatures: newEntry.exemptFeatures
      });
      
      if (response.success && response.data) {
        setEntries(prev => [response.data!, ...prev]);
        setNewEntry({ 
          type: 'user', 
          name: '', 
          identifier: '', 
          accessLevel: 'moderator', 
          restrictions: [], 
          exemptFeatures: [] 
        });
        setShowAddDialog(false);
        toast.success('Запись управления доступом добавлена');
      }
    } catch (error) {
      toast.error('Ошибка при добавлении записи');
    }
  };

  const updateEntry = async () => {
    if (!editingEntry) return;

    try {
      const response = await api.accessControl.updateEntry(editingEntry.id, editingEntry);
      if (response.success && response.data) {
        setEntries(prev => prev.map(entry => 
          entry.id === editingEntry.id ? response.data! : entry
        ));
        setEditingEntry(null);
        toast.success('Запись обновлена');
      }
    } catch (error) {
      toast.error('Ошибка при обновлении записи');
    }
  };

  const removeEntry = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry?.accessLevel === 'owner') {
      toast.error('Нельзя удалить запись владельца');
      return;
    }

    try {
      const response = await api.accessControl.removeEntry(entryId);
      if (response.success) {
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
        toast.success('Запись удалена');
      }
    } catch (error) {
      toast.error('Ошибка при удалении записи');
    }
  };

  const updateSettings = async (newSettings: Partial<AccessControlSettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      const response = await api.accessControl.updateSettings(updatedSettings);
      if (response.success) {
        setSettings(updatedSettings);
        toast.success('Настройки обновлены');
      }
    } catch (error) {
      toast.error('Ошибка при обновлении настроек');
    }
  };

  const getTypeIcon = (type: AccessControlEntry['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'role':
        return <Crown className="h-4 w-4 text-purple-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAccessLevelBadge = (level: AccessControlEntry['accessLevel']) => {
    switch (level) {
      case 'owner':
        return <Badge variant="destructive" className="text-xs">Владелец</Badge>;
      case 'admin':
        return <Badge variant="default" className="text-xs">Админ</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs">Модератор</Badge>;
      case 'ignored':
        return <Badge variant="outline" className="text-xs">Игнорируется</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Неизвестно</Badge>;
    }
  };

  const toggleRestriction = (feature: string, isEditing = false) => {
    if (isEditing && editingEntry) {
      const restrictions = editingEntry.restrictions.includes(feature)
        ? editingEntry.restrictions.filter(f => f !== feature)
        : [...editingEntry.restrictions, feature];
      setEditingEntry({ ...editingEntry, restrictions });
    } else {
      const restrictions = newEntry.restrictions.includes(feature)
        ? newEntry.restrictions.filter(f => f !== feature)
        : [...newEntry.restrictions, feature];
      setNewEntry({ ...newEntry, restrictions });
    }
  };

  const toggleExemption = (feature: string, isEditing = false) => {
    if (isEditing && editingEntry) {
      const exemptFeatures = editingEntry.exemptFeatures.includes(feature)
        ? editingEntry.exemptFeatures.filter(f => f !== feature)
        : [...editingEntry.exemptFeatures, feature];
      setEditingEntry({ ...editingEntry, exemptFeatures });
    } else {
      const exemptFeatures = newEntry.exemptFeatures.includes(feature)
        ? newEntry.exemptFeatures.filter(f => f !== feature)
        : [...newEntry.exemptFeatures, feature];
      setNewEntry({ ...newEntry, exemptFeatures });
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.identifier.includes(searchTerm) ||
                         entry.addedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    const matchesAccess = accessFilter === 'all' || entry.accessLevel === accessFilter;
    return matchesSearch && matchesType && matchesAccess;
  });

  const ownerEntries = entries.filter(e => e.accessLevel === 'owner').length;
  const adminEntries = entries.filter(e => e.accessLevel === 'admin').length;
  const moderatorEntries = entries.filter(e => e.accessLevel === 'moderator').length;
  const ignoredEntries = entries.filter(e => e.accessLevel === 'ignored').length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 animate-pulse" />
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Управление доступом
          </h1>
          <p className="text-muted-foreground">
            Контроль доступа к функциям панели управления для пользователей и ролей
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить запись
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Добавление записи управления доступом</DialogTitle>
                <DialogDescription>
                  Настройка доступа к функциям панели для пользователя или роли
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="entry-type">Тип записи</Label>
                    <Select
                      value={newEntry.type}
                      onValueChange={(value: 'user' | 'role') => 
                        setNewEntry(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Пользователь</SelectItem>
                        <SelectItem value="role">Роль</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="access-level">Уровень доступа</Label>
                    <Select
                      value={newEntry.accessLevel}
                      onValueChange={(value: 'admin' | 'moderator' | 'ignored') => 
                        setNewEntry(prev => ({ ...prev, accessLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="moderator">Модератор</SelectItem>
                        <SelectItem value="ignored">Игнорируется</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="entry-name">Название</Label>
                    <Input
                      id="entry-name"
                      placeholder="Отображаемое название"
                      value={newEntry.name}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="entry-id">ID</Label>
                    <Input
                      id="entry-id"
                      placeholder={`ID ${newEntry.type === 'user' ? 'пользователя' : 'роли'}`}
                      value={newEntry.identifier}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, identifier: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Ограниченные функции</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {availableFeatures.map((feature) => (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`restriction-${feature.id}`}
                          checked={newEntry.restrictions.includes(feature.id)}
                          onChange={() => toggleRestriction(feature.id)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`restriction-${feature.id}`} className="text-sm">
                          {feature.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  setNewEntry({ 
                    type: 'user', 
                    name: '', 
                    identifier: '', 
                    accessLevel: 'moderator', 
                    restrictions: [], 
                    exemptFeatures: [] 
                  });
                }}>
                  Отмена
                </Button>
                <Button onClick={addEntry} disabled={!newEntry.name.trim() || !newEntry.identifier.trim()}>
                  Добавить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Information Alert */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <strong>Принцип работы:</strong> Добавленные пользователи и роли получают доступ ко всем разделам панели управления, 
          за исключением владельческих разделов (Анти-нюк, Белый список, Карантин, Резервные копии), которые доступны только владельцу сервера.
        </AlertDescription>
      </Alert>

      {/* System Settings */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Системные настройки
            </CardTitle>
            <CardDescription>
              Основные настройки системы управления доступом
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Включить систему управления доступом</p>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground pl-0">
                    Активировать ограничения доступа к функциям панели
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium">Включить систему управления доступом</p>
                    <p className="text-sm text-muted-foreground">
                      Активировать ограничения доступа к функциям панели
                    </p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                  />
                </>
              )}
            </div>
            
            {!settings.enabled && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Система управления доступом отключена. Все пользователи имеют полный доступ к панели.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">
              записей контроля доступа
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Владельцы</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{ownerEntries}</div>
            <p className="text-xs text-muted-foreground">
              владельцев сервера
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Админы</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{adminEntries}</div>
            <p className="text-xs text-muted-foreground">
              администраторов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Модераторы</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{moderatorEntries}</div>
            <p className="text-xs text-muted-foreground">
              модераторов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Игнорируются</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{ignoredEntries}</div>
            <p className="text-xs text-muted-foreground">
              игнорируемых записей
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск и фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию, ID или добавившему..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="user">Пользователи</SelectItem>
                  <SelectItem value="role">Роли</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select value={accessFilter} onValueChange={(value: any) => setAccessFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все уровни</SelectItem>
                  <SelectItem value="owner">Владельцы</SelectItem>
                  <SelectItem value="admin">Админы</SelectItem>
                  <SelectItem value="moderator">Модераторы</SelectItem>
                  <SelectItem value="ignored">Игнорируются</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Записи управления доступом</CardTitle>
          <CardDescription>
            {filteredEntries.length} из {entries.length} записей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Уровень доступа</TableHead>
                  <TableHead>Ограничения</TableHead>
                  <TableHead>Добавлен</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-20">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(entry.type)}
                        <span className="font-medium">{entry.name}</span>
                        {entry.accessLevel === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.type === 'user' ? 'Пользователь' : 'Роль'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getAccessLevelBadge(entry.accessLevel)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.restrictions.length > 0 ? (
                          <>
                            {entry.restrictions.slice(0, 2).map((restriction) => {
                              const feature = availableFeatures.find(f => f.id === restriction);
                              return (
                                <Badge key={restriction} variant="secondary" className="text-xs">
                                  {feature ? feature.name : restriction}
                                </Badge>
                              );
                            })}
                            {entry.restrictions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.restrictions.length - 2}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Нет ограничений</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{entry.addedBy}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {formatDate(entry.addedAt, { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(entry.addedAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setEditingEntry(entry)}
                            disabled={entry.accessLevel === 'owner'}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => removeEntry(entry.id)}
                            className="text-destructive"
                            disabled={entry.accessLevel === 'owner'}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              {searchTerm || typeFilter !== 'all' || accessFilter !== 'all' ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Записи не найдены</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Попробуйте изменить критерии поиска
                  </p>
                </>
              ) : (
                <>
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Записи управления доступом отсутствуют</p>
                  <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Добавить первую запись
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактирование записи управления доступом</DialogTitle>
            <DialogDescription>
              Изменение настроек доступа к функциям панели
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={editingEntry.name}
                    onChange={(e) => setEditingEntry(prev => prev ? { ...prev, name: e.target.value } : null)}
                    disabled={editingEntry.accessLevel === 'owner'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Уровень доступа</Label>
                  <Select
                    value={editingEntry.accessLevel}
                    onValueChange={(value: any) => setEditingEntry(prev => prev ? { ...prev, accessLevel: value } : null)}
                    disabled={editingEntry.accessLevel === 'owner'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="moderator">Модератор</SelectItem>
                      <SelectItem value="ignored">Игнорируется</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Ограниченные функции</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {availableFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-restriction-${feature.id}`}
                        checked={editingEntry.restrictions.includes(feature.id)}
                        onChange={() => toggleRestriction(feature.id, true)}
                        className="rounded border-gray-300"
                        disabled={editingEntry.accessLevel === 'owner'}
                      />
                      <Label htmlFor={`edit-restriction-${feature.id}`} className="text-sm">
                        {feature.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Отмена
            </Button>
            <Button onClick={updateEntry} disabled={editingEntry?.accessLevel === 'owner'}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}