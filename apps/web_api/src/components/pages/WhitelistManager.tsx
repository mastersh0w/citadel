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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Plus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit,
  User,
  Crown,
  Hash,
  Shield,
  Search,
  Bot,
  AlertTriangle
} from 'lucide-react';
import { WhitelistEntry } from '@/types';
import { api } from '@/utils/api';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { toast } from 'sonner@2.0.3';

export function WhitelistManager() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'role' | 'channel' | 'bot'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WhitelistEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    type: 'user' as 'user' | 'role' | 'channel' | 'bot',
    identifier: ''
  });
  const [previewName, setPreviewName] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  // Preview name resolution when identifier changes
  useEffect(() => {
    if (newEntry.identifier.trim()) {
      // Simulate name resolution for preview
      const resolvePreviewName = () => {
        const mockNames: { [key: string]: { [id: string]: string } } = {
          user: {
            '111111111111111111': 'Админ#0001',
            '222222222222222222': 'Модератор#1234',
            '777777777777777777': 'TopModerator',
            '444444444444444444': 'ProblemUser#1234',
            '123456789012345678': 'Владелец#0000'
          },
          role: {
            '222222222222222222': 'Модераторы',
            '333333333333333333': 'Администрация',
            '444444444444444444': 'Участники',
            '999999999999999999': '@everyone'
          },
          channel: {
            '333333333333333333': '#администрация',
            '888888888888888888': '#важные-объявления',
            '111111111111111111': '#общение',
            '555555555555555555': '#правила'
          },
          bot: {
            '159985870458322944': 'MEE6',
            '235148962103951360': 'Carl-bot',
            '155149108183695360': 'Dyno',
            '987654321098765432': 'CitadelWarden'
          }
        };

        const resolved = mockNames[newEntry.type]?.[newEntry.identifier] || 
          `${newEntry.type === 'user' ? 'Пользователь' : newEntry.type === 'role' ? 'Роль' : newEntry.type === 'channel' ? 'Канал' : 'Бот'}#${newEntry.identifier.slice(-4)}`;
        setPreviewName(resolved);
      };

      const timeoutId = setTimeout(resolvePreviewName, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setPreviewName('');
    }
  }, [newEntry.identifier, newEntry.type]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await api.whitelist.getEntries();
      if (response.success && response.data) {
        setEntries(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки белого списка:', error);
      toast.error('Не удалось загрузить белый список');
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newEntry.identifier.trim()) {
      toast.error('Введите ID');
      return;
    }

    try {
      const response = await api.whitelist.addEntry({
        type: newEntry.type,
        identifier: newEntry.identifier.trim()
      });
      if (response.success && response.data) {
        setEntries(prev => [response.data!, ...prev]);
        setNewEntry({ type: 'user', identifier: '' });
        setPreviewName('');
        setShowAddDialog(false);
        toast.success('Запись добавлена в белый список');
      }
    } catch (error) {
      toast.error('Ошибка при добавлении записи');
    }
  };

  const updateEntry = async () => {
    if (!editingEntry) return;

    try {
      // Only send the identifier for update, name will be resolved automatically
      const response = await api.whitelist.updateEntry(editingEntry.id, {
        identifier: editingEntry.identifier
      });
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
    try {
      const response = await api.whitelist.removeEntry(entryId);
      if (response.success) {
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
        toast.success('Запись удалена из белого списка');
      }
    } catch (error) {
      toast.error('Ошибка при удалении записи');
    }
  };

  const getTypeIcon = (type: WhitelistEntry['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'role':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'channel':
        return <Hash className="h-4 w-4 text-green-500" />;
      case 'bot':
        return <Bot className="h-4 w-4 text-orange-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: WhitelistEntry['type']) => {
    switch (type) {
      case 'user':
        return <Badge variant="default" className="text-xs">Пользователь</Badge>;
      case 'role':
        return <Badge variant="secondary" className="text-xs">Роль</Badge>;
      case 'channel':
        return <Badge variant="outline" className="text-xs">Канал</Badge>;
      case 'bot':
        return <Badge variant="destructive" className="text-xs">Бот</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Неизвестно</Badge>;
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.identifier.includes(searchTerm) ||
                         entry.addedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const userEntries = entries.filter(e => e.type === 'user').length;
  const roleEntries = entries.filter(e => e.type === 'role').length;
  const channelEntries = entries.filter(e => e.type === 'channel').length;
  const botEntries = entries.filter(e => e.type === 'bot').length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 animate-pulse" />
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
            <Users className="h-8 w-8" />
            Белый список
          </h1>
          <p className="text-muted-foreground">
            Управление доверенными пользователями, ролями, каналами и ботами
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadEntries}
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Добавление в белый список</DialogTitle>
                <DialogDescription>
                  Выберите тип и введите ID. Наименование определится автоматически.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="entry-type">Тип записи</Label>
                  <Select
                    value={newEntry.type}
                    onValueChange={(value: 'user' | 'role' | 'channel' | 'bot') => 
                      setNewEntry(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Пользователь</SelectItem>
                      <SelectItem value="role">Роль</SelectItem>
                      <SelectItem value="channel">Канал</SelectItem>
                      <SelectItem value="bot">Бот</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  
                <div className="space-y-2">
                  <Label htmlFor="entry-id">ID</Label>
                  <Input
                    id="entry-id"
                    placeholder={`ID ${newEntry.type === 'user' ? 'пользователя' : newEntry.type === 'role' ? 'роли' : newEntry.type === 'channel' ? 'канала' : 'бота'}`}
                    value={newEntry.identifier}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, identifier: e.target.value }))}
                  />
                  {previewName && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getTypeIcon(newEntry.type)}
                        <span>Будет добавлено как: <span className="font-medium">{previewName}</span></span>
                      </div>
                      {newEntry.type === 'user' && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Предупреждение:</strong> Добавление пользователей в белый спис��к несет определенную опасность. 
                            Убедитесь, что этот пользователь абсолютно доверенный.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Наименование будет определено автоматически по ID
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  setNewEntry({ type: 'user', identifier: '' });
                  setPreviewName('');
                }}>
                  Отмена
                </Button>
                <Button onClick={addEntry} disabled={!newEntry.identifier.trim()}>
                  Добавить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
              в белом списке
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{userEntries}</div>
            <p className="text-xs text-muted-foreground">
              доверенных пользователей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Роли</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{roleEntries}</div>
            <p className="text-xs text-muted-foreground">
              доверенных ролей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Каналы</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{channelEntries}</div>
            <p className="text-xs text-muted-foreground">
              доверенных каналов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Боты</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{botEntries}</div>
            <p className="text-xs text-muted-foreground">
              доверенных ботов
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
                  placeholder="Поиск по наименованию, ID или добавившему..."
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
                  <SelectItem value="channel">Каналы</SelectItem>
                  <SelectItem value="bot">Боты</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Записи белого списка</CardTitle>
          <CardDescription>
            {filteredEntries.length} из {entries.length} записей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Наименование</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Идентификатор</TableHead>
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
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(entry.type)}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{entry.identifier}</span>
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
                              <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => removeEntry(entry.id)}
                                className="text-destructive"
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
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredEntries.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getTypeIcon(entry.type)}
                          <span className="font-medium truncate">{entry.name}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => removeEntry(entry.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Тип:</span>
                          {getTypeBadge(entry.type)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">ID:</span>
                          <span className="font-mono text-sm text-right truncate max-w-32">{entry.identifier}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Добавлен:</span>
                          <span className="text-sm text-right">{entry.addedBy}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Дата:</span>
                          <div className="text-right">
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
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              {searchTerm || typeFilter !== 'all' ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Записи не найдены</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Попробуйте изменить критерии поиска
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Белы�� список пуст</p>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактирование записи</DialogTitle>
            <DialogDescription>
              Изменение настроек записи белого списка
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Наименование</Label>
                <Input
                  value={editingEntry.name}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Наименование определяется автоматически по ID
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={editingEntry.identifier}
                  onChange={(e) => setEditingEntry(prev => prev ? { ...prev, identifier: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Отмена
            </Button>
            <Button onClick={updateEntry}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}