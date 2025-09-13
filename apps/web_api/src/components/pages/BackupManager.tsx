import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Archive,
  Download,
  Upload,
  Trash2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  HardDrive,
  Server,
  Users,
  Settings,
  Crown,
  MessageSquare
} from 'lucide-react';
import { BackupData } from '@/types';
import { api } from '@/utils/api';
import { formatDate, formatFileSize, formatRelativeTime } from '@/utils/formatters';
import { toast } from 'sonner';

export function BackupManager() {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBackupName, setNewBackupName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [includeMessages, setIncludeMessages] = useState(false);
  const [backupSettings, setBackupSettings] = useState({
    maxMessagesPerChannel: 100,
    autoBackupEnabled: true,
    autoBackupInterval: 7 // days
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await api.backup.getBackups();
      if (response.success && response.data) {
        setBackups(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки резервных копий:', error);
      toast.error('Не удалось загрузить список бэкапов');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!newBackupName.trim()) {
      toast.error('Введите название резервной копии');
      return;
    }

    try {
      setCreating(true);
      const response = await api.backup.createBackup(newBackupName.trim(), includeMessages);
      if (response.success && response.data) {
        setBackups(prev => [response.data!, ...prev]);
        setNewBackupName('');
        setIncludeMessages(false);
        setShowCreateDialog(false);
        toast.success('Резервная копия создана успешно');
      }
    } catch (error) {
      toast.error('Ошибка при создании резервной копии');
    } finally {
      setCreating(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const response = await api.backup.deleteBackup(backupId);
      if (response.success) {
        setBackups(prev => prev.filter(backup => backup.id !== backupId));
        toast.success('Резервная копия удалена');
      }
    } catch (error) {
      toast.error('Ошибка при удалении резервной копии');
    }
  };

  const restoreBackup = async (backupId: string) => {
    try {
      const response = await api.backup.restoreBackup(backupId);
      if (response.success) {
        toast.success('Восстановлени�� из резервной копии запущено');
      }
    } catch (error) {
      toast.error('Ошибка при восстановлении из резервной копии');
    }
  };

  const downloadBackup = (backup: BackupData) => {
    // Simulate download
    toast.success(`Загрузка резервной копии "${backup.name}" начата`);
  };

  const saveBackupSettings = async () => {
    try {
      setSavingSettings(true);
      const response = await api.backup.updateSettings(backupSettings);
      if (response.success) {
        toast.success('Настройки бэкапа сохранены');
      }
    } catch (error) {
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSavingSettings(false);
    }
  };

  const getStatusIcon = (status: BackupData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: BackupData['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="text-xs">Завершено</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="text-xs">В процессе</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Ошибка</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Неизвестно</Badge>;
    }
  };

  const totalSize = backups.reduce((sum, backup) => {
    const sizeInMB = parseFloat(backup.size.replace(' МБ', ''));
    return sum + sizeInMB;
  }, 0);

  const completedBackups = backups.filter(b => b.status === 'completed');
  const autoBackups = backups.filter(b => b.autoBackup);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Archive className="h-8 w-8 animate-pulse" />
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
            <Archive className="h-8 w-8" />
            Резервные копии
          </h1>
          <p className="text-muted-foreground">
            Управление резервными копиями сервера Discord
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadBackups}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Создать бэкап
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Создание новой резервной копии
                </DialogTitle>
                <DialogDescription>
                  Создайте полную резервную копию вашего сервера Discord
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">Название резервной копии</Label>
                  <Input
                    id="backup-name"
                    placeholder="Введите название бэкапа"
                    value={newBackupName}
                    onChange={(e) => setNewBackupName(e.target.value)}
                    disabled={creating}
                    className="h-12"
                  />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-messages" className="text-sm font-medium">
                      Добавить бэкап сообщений
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Сохранить сообщения согласно настройкам лимитов
                    </p>
                  </div>
                  <Switch
                    id="include-messages"
                    checked={includeMessages}
                    onCheckedChange={setIncludeMessages}
                    disabled={creating}
                  />
                </div>

                <Alert>
                  <Archive className="h-4 w-4" />
                  <AlertDescription>
                    Резервная копия включает все каналы, роли, настройки бота и список участников. 
                    {includeMessages && 'Также будут сохранены сообщения согласно настройкам. '}
                    Процесс может занять несколько минут.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewBackupName('');
                      setIncludeMessages(false);
                    }}
                    disabled={creating}
                  >
                    Отмена
                  </Button>
                  <Button 
                    onClick={createBackup} 
                    disabled={creating || !newBackupName.trim()}
                    className="gap-2"
                  >
                    {creating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {creating ? 'Создание...' : 'Создать бэкап'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего резервных копий</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedBackups.length} завершенных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий размер</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSize.toFixed(1)} МБ</div>
            <p className="text-xs text-muted-foreground">
              Использовано {Math.round((totalSize / 500) * 100)}% лимита
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Автоматические</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoBackups.length}</div>
            <p className="text-xs text-muted-foreground">
              По расписанию
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Последний бэкап</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups.length > 0 ? formatRelativeTime(backups[0].createdAt) : 'Никогда'}
            </div>
            <p className="text-xs text-muted-foreground">
              Статус: {backups[0]?.status || 'н/д'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Настройки бэкапов
          </CardTitle>
          <CardDescription>
            Конфигурация параметров создания резервных копий
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="max-messages">Максимум сообщений на канал</Label>
            <Select 
              value={backupSettings.maxMessagesPerChannel.toString()} 
              onValueChange={(value) => setBackupSettings(prev => ({ 
                ...prev, 
                maxMessagesPerChannel: parseInt(value) 
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 сообщений</SelectItem>
                <SelectItem value="100">100 сообщений</SelectItem>
                <SelectItem value="250">250 сообщений</SelectItem>
                <SelectItem value="500">500 сообщений</SelectItem>
                <SelectItem value="1000">1000 сообщений</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Количество сообщений для сохранения из каждого канала при создании бэкапа с сообщениями
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Автоматические бэкапы</Label>
              <div className="text-sm text-muted-foreground">
                Создавать резервные копии по расписанию
              </div>
            </div>
            <Switch
              checked={backupSettings.autoBackupEnabled}
              onCheckedChange={(checked) => setBackupSettings(prev => ({ 
                ...prev, 
                autoBackupEnabled: checked 
              }))}
            />
          </div>

          {backupSettings.autoBackupEnabled && (
            <div className="space-y-2">
              <Label htmlFor="backup-interval">Интервал автобэкапов</Label>
              <Select 
                value={backupSettings.autoBackupInterval.toString()} 
                onValueChange={(value) => setBackupSettings(prev => ({ 
                  ...prev, 
                  autoBackupInterval: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Каждый день</SelectItem>
                  <SelectItem value="3">Каждые 3 дня</SelectItem>
                  <SelectItem value="7">Каждую неделю</SelectItem>
                  <SelectItem value="14">Каждые 2 недели</SelectItem>
                  <SelectItem value="30">Каждый месяц</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4">
            <Button 
              onClick={saveBackupSettings}
              disabled={savingSettings}
              className="gap-2"
            >
              {savingSettings ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {savingSettings ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Использование хранилища
          </CardTitle>
          <CardDescription>
            Текущее использование дискового пространства
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Использовано</span>
              <span>{totalSize.toFixed(1)} МБ из 500 МБ</span>
            </div>
            <Progress value={(totalSize / 500) * 100} className="h-2" />
            {totalSize > 400 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Хранилище почти заполнено. Рекомендуется удалить старые резервные копии.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Список резервных копий</CardTitle>
          <CardDescription>
            Все созданные резервные копии сервера
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Содержимое</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="w-20">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{formatDate(backup.createdAt, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(backup.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {backup.channels} каналов
                        </div>
                        <div className="flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          {backup.roles} ролей
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {backup.members} участников
                        </div>
                        {backup.messages && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {backup.messages.toLocaleString()} сообщений
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backup.status)}
                        {getStatusBadge(backup.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {backup.autoBackup ? (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Авто
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Ручной
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {backup.status === 'completed' && (
                            <>
                              <DropdownMenuItem onClick={() => downloadBackup(backup)}>
                                <Download className="h-4 w-4 mr-2" />
                                Скачать
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => restoreBackup(backup.id)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Восстановить
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteBackup(backup.id)}
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
          ) : (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Нет созданных резервных копий</p>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Создать первую резервную копию
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      Создание новой резервной копии
                    </DialogTitle>
                    <DialogDescription>
                      Создайте полную резервную копию вашего сервера Discord
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="backup-name">Название резервной копии</Label>
                      <Input
                        id="backup-name"
                        placeholder="Введите название бэкапа"
                        value={newBackupName}
                        onChange={(e) => setNewBackupName(e.target.value)}
                        disabled={creating}
                        className="h-12"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="include-messages-2" className="text-sm font-medium">
                          Добавить бэкап сообщений
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Сохранить сообщения согласно настройкам лимитов
                        </p>
                      </div>
                      <Switch
                        id="include-messages-2"
                        checked={includeMessages}
                        onCheckedChange={setIncludeMessages}
                        disabled={creating}
                      />
                    </div>

                    <Alert>
                      <Archive className="h-4 w-4" />
                      <AlertDescription>
                        Резервная копия включает все каналы, роли, настройки бота и список участников. 
                        {includeMessages && 'Также будут сохранены сообщения согласно настройкам. '}
                        Процесс может занять несколько минут.
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowCreateDialog(false);
                          setNewBackupName('');
                          setIncludeMessages(false);
                        }}
                        disabled={creating}
                      >
                        Отмена
                      </Button>
                      <Button 
                        onClick={createBackup} 
                        disabled={creating || !newBackupName.trim()}
                        className="gap-2"
                      >
                        {creating ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {creating ? 'Создание...' : 'Создать бэкап'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}