import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Activity,
  Users,
  Shield,
  MessageSquare,
  Crown,
  Hash,
  Calendar,
  Clock
} from 'lucide-react';
import { AuditLogEntry } from '@/types';
import { api } from '@/utils/api';
import { formatDate, formatRelativeTime, formatAuditLogAction } from '@/utils/formatters';
import { toast } from 'sonner';

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<number | 'all'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.audit.getLogs(100);
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки логов аудита:', error);
      toast.error('Не удалось загрузить логи аудита');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      'Дата,Действие,Пользователь,Цель,Причина',
      ...logs.map(log => [
        formatDate(log.createdAt),
        formatAuditLogAction(log.actionType),
        log.userId,
        log.targetId || '',
        log.reason || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Логи экспортированы');
  };

  const getActionIcon = (actionType: number) => {
    if (actionType >= 10 && actionType <= 15) return <Hash className="h-4 w-4 text-blue-500" />;
    if (actionType >= 20 && actionType <= 28) return <Users className="h-4 w-4 text-orange-500" />;
    if (actionType >= 30 && actionType <= 32) return <Crown className="h-4 w-4 text-purple-500" />;
    if (actionType >= 40 && actionType <= 42) return <MessageSquare className="h-4 w-4 text-green-500" />;
    if (actionType >= 50 && actionType <= 52) return <Shield className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getActionColor = (actionType: number) => {
    if (actionType >= 10 && actionType <= 15) return 'text-blue-600 dark:text-blue-400';
    if (actionType >= 20 && actionType <= 28) return 'text-orange-600 dark:text-orange-400';
    if (actionType >= 30 && actionType <= 32) return 'text-purple-600 dark:text-purple-400';
    if (actionType >= 40 && actionType <= 42) return 'text-green-600 dark:text-green-400';
    if (actionType >= 50 && actionType <= 52) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userId.includes(searchTerm) ||
                         (log.targetId && log.targetId.includes(searchTerm)) ||
                         (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;
    
    const matchesDate = (() => {
      if (dateRange === 'all') return true;
      const logDate = new Date(log.createdAt);
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          return logDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesAction && matchesDate;
  });

  const actionTypes = [
    { value: 1, label: 'Обновление сервера' },
    { value: 10, label: 'Создание канала' },
    { value: 11, label: 'Обновление канала' },
    { value: 12, label: 'Удаление канала' },
    { value: 20, label: 'Исключение участника' },
    { value: 22, label: 'Блокировка участника' },
    { value: 23, label: 'Разблокировка участника' },
    { value: 30, label: 'Создание роли' },
    { value: 31, label: 'Обновление роли' },
    { value: 32, label: 'Удаление роли' },
    { value: 72, label: 'Удаление сообщения' }
  ];

  const todayLogs = logs.filter(log => new Date(log.createdAt).toDateString() === new Date().toDateString()).length;
  const weekLogs = logs.filter(log => new Date(log.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const moderationActions = logs.filter(log => [20, 22, 23].includes(log.actionType)).length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 animate-pulse" />
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
            <FileText className="h-8 w-8" />
            Логи аудита
          </h1>
          <p className="text-muted-foreground">
            История всех действий на сервере и в боте
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={exportLogs}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
          <Button 
            variant="outline" 
            onClick={loadLogs}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">
              событий в логах
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayLogs}</div>
            <p className="text-xs text-muted-foreground">
              событий за день
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">За неделю</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{weekLogs}</div>
            <p className="text-xs text-muted-foreground">
              событий за неделю
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Модерация</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{moderationActions}</div>
            <p className="text-xs text-muted-foreground">
              действий модерации
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ID пользователя, причина..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Тип действия</label>
              <Select value={actionFilter.toString()} onValueChange={(value) => setActionFilter(value === 'all' ? 'all' : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все действия</SelectItem>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value.toString()}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Период</label>
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все время</SelectItem>
                  <SelectItem value="today">Сегодня</SelectItem>
                  <SelectItem value="week">Последние 7 дней</SelectItem>
                  <SelectItem value="month">Последние 30 дней</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Результаты</label>
              <div className="text-sm text-muted-foreground pt-2">
                Найдено: {filteredLogs.length} из {logs.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Журнал событий</CardTitle>
          <CardDescription>
            Хронологический список всех действий на сервере
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Время</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Цель</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Детали</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {formatDate(log.createdAt, { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.actionType)}
                        <span className={`text-sm font-medium ${getActionColor(log.actionType)}`}>
                          {formatAuditLogAction(log.actionType)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://cdn.discordapp.com/avatars/${log.userId}/avatar.png`} />
                          <AvatarFallback className="text-xs">
                            {log.userId.slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-mono text-xs">{log.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.targetId ? (
                        <span className="font-mono text-xs">{log.targetId}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.reason ? (
                        <span className="text-sm">{log.reason}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Не указано</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              {searchTerm || actionFilter !== 'all' || dateRange !== 'all' ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Логи не найдены</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Попробуйте изменить критерии поиска
                  </p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Нет записей в логах</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Логи появятся после первых действий на сервере
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}