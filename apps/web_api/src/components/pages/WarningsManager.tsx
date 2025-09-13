import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  Search,
  Eye,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  User,
  Calendar,
  Info
} from 'lucide-react';
import { Warning } from '@/types';
import { api } from '@/utils/api';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { toast } from 'sonner@2.0.3';

export function WarningsManager() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [filteredWarnings, setFilteredWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    loadWarnings();
  }, []);

  useEffect(() => {
    filterWarnings();
  }, [warnings, searchTerm, statusFilter]);

  const loadWarnings = async () => {
    try {
      setLoading(true);
      const response = await api.moderation.getWarnings();
      if (response.success && response.data) {
        setWarnings(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки предупреждений:', error);
      toast.error('Не удалось загрузить список предупреждений');
    } finally {
      setLoading(false);
    }
  };

  const filterWarnings = () => {
    let filtered = warnings;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(warning => 
        warning.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warning.userId.includes(searchTerm) ||
        warning.incidentNumber.includes(searchTerm) ||
        warning.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(warning => warning.status === statusFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    setFilteredWarnings(filtered);
  };

  const revokeWarning = async (warningId: string) => {
    try {
      setRevoking(true);
      const response = await api.moderation.revokeWarning(warningId);
      if (response.success) {
        setWarnings(prev => prev.map(warning => 
          warning.id === warningId 
            ? { ...warning, status: 'revoked', revokedAt: new Date().toISOString(), revokedBy: 'Администратор' }
            : warning
        ));
        setShowWarningDialog(false);
        toast.success('Предупреждение аннулировано');
      }
    } catch (error) {
      toast.error('Ошибка при аннулировании предупреждения');
    } finally {
      setRevoking(false);
    }
  };

  const getStatusBadge = (status: Warning['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Активно
        </Badge>;
      case 'expired':
        return <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Истекло
        </Badge>;
      case 'revoked':
        return <Badge variant="secondary" className="gap-1">
          <Ban className="h-3 w-3" />
          Аннулировано
        </Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const getStatusIcon = (status: Warning['status']) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'revoked':
        return <Ban className="h-4 w-4 text-gray-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={`loading-${i}`} className="animate-pulse">
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
            <AlertTriangle className="h-8 w-8" />
            Журнал предупреждений
          </h1>
          <p className="text-muted-foreground">
            Управление предупреждениями пользователей
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadWarnings}
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
            <CardTitle className="text-sm font-medium">Всего предупреждений</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warnings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <CheckCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {warnings.filter(w => w.status === 'active' && !isExpired(w.expiresAt)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Истекшие</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warnings.filter(w => w.status === 'expired' || (w.status === 'active' && isExpired(w.expiresAt))).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Аннулированные</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warnings.filter(w => w.status === 'revoked').length}
            </div>
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по пользователю, ID или причине..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="expired">Истекшие</SelectItem>
                  <SelectItem value="revoked">Аннулированные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings List */}
      <Card>
        <CardHeader>
          <CardTitle>Список предупреждений</CardTitle>
          <CardDescription>
            Найдено предупреждений: {filteredWarnings.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWarnings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Инцидент</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата выдачи</TableHead>
                    <TableHead>Истекает</TableHead>
                    <TableHead className="w-20">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarnings.map((warning) => (
                    <TableRow key={warning.id}>
                      <TableCell className="font-medium">
                        #{warning.incidentNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={warning.userAvatar} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{warning.username}</div>
                            <div className="text-xs text-muted-foreground">{warning.userId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(warning.status)}
                          {getStatusBadge(warning.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{formatDate(warning.issuedAt, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(warning.issuedAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{formatDate(warning.expiresAt, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</div>
                          <div className="text-xs text-muted-foreground">
                            {isExpired(warning.expiresAt) ? 'Истекло' : formatRelativeTime(warning.expiresAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {warning.status === 'active' && (
                          <Dialog open={showWarningDialog && selectedWarning?.id === warning.id} onOpenChange={(open) => {
                            setShowWarningDialog(open);
                            if (open) setSelectedWarning(warning);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                  Предупреждение #{warning.incidentNumber}
                                </DialogTitle>
                                <DialogDescription>
                                  Подробная информация о предупреждении
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={warning.userAvatar} />
                                    <AvatarFallback>
                                      <User className="h-6 w-6" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{warning.username}</div>
                                    <div className="text-sm text-muted-foreground">{warning.userId}</div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium">Причина</label>
                                    <p className="text-sm text-muted-foreground mt-1">{warning.reason}</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Выдано</label>
                                      <p className="text-sm text-muted-foreground">
                                        {formatDate(warning.issuedAt, { 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Истекает</label>
                                      <p className="text-sm text-muted-foreground">
                                        {formatDate(warning.expiresAt, { 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium">Выдал</label>
                                    <p className="text-sm text-muted-foreground">{warning.issuedByName}</p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">Статус</label>
                                    {getStatusBadge(warning.status)}
                                  </div>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowWarningDialog(false)}
                                >
                                  Закрыть
                                </Button>
                                {warning.status === 'active' && (
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => revokeWarning(warning.id)}
                                    disabled={revoking}
                                    className="gap-2"
                                  >
                                    {revoking ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Ban className="h-4 w-4" />
                                    )}
                                    {revoking ? 'Аннулирование...' : 'Аннулировать'}
                                  </Button>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Предупреждения не найдены по заданным критериям' 
                  : 'Предупреждений нет'
                }
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Сбросить фильтры
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}