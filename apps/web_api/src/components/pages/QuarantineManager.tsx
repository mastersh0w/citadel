import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner@2.0.3';
import { Shield, UserX, Clock, UserCheck, Search, RefreshCw, Ban, RotateCcw, AlertTriangle, Plus } from 'lucide-react';
import { api } from '@/utils/api';
import { useLanguage } from '../LanguageProvider';

interface QuarantineEntry {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  reason: string;
  addedBy: string;
  addedAt: string;
  status: 'pending' | 'banned' | 'restored';
  originalRoles: string[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export function QuarantineManager() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<QuarantineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'banned' | 'restored'>('all');
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [reviewingEntry, setReviewingEntry] = useState<{ entry: QuarantineEntry; action: 'ban' | 'restore' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [quarantineRole, setQuarantineRole] = useState<{ exists: boolean; name?: string; id?: string }>({ exists: false });

  useEffect(() => {
    loadEntries();
    checkQuarantineRole();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await api.quarantine.getEntries();
      if (response.success && response.data) {
        setEntries(response.data);
      }
    } catch (error) {
      console.error('Error loading quarantine entries:', error);
      toast.error('Ошибка при загрузке записей карантина');
    } finally {
      setLoading(false);
    }
  };

  const checkQuarantineRole = async () => {
    try {
      const response = await api.quarantine.checkRole();
      if (response.success && response.data) {
        setQuarantineRole({
          exists: response.data.exists,
          name: response.data.name,
          id: response.data.id
        });
      }
    } catch (error) {
      console.error('Error checking quarantine role:', error);
    }
  };

  const reviewEntry = async (action: 'ban' | 'restore') => {
    if (!reviewingEntry) return;

    try {
      const response = await api.quarantine.reviewEntry(
        reviewingEntry.entry.id, 
        action, 
        reviewNotes.trim() || undefined
      );
      
      if (response.success && response.data) {
        setEntries(prev => prev.map(entry => 
          entry.id === reviewingEntry.entry.id ? response.data! : entry
        ));
        setReviewingEntry(null);
        setReviewNotes('');
        
        const actionText = action === 'ban' ? 'забанен' : 'восстановлен';
        toast.success(`Пользователь ${actionText}`);
      }
    } catch (error) {
      toast.error('Ошибка при обработке записи');
    }
  };

  const createQuarantineRole = async () => {
    try {
      const response = await api.quarantine.createRole();
      if (response.success && response.data) {
        toast.success(`Роль "${response.data.name}" создана успешно`);
        setShowCreateRoleDialog(false);
        setQuarantineRole({
          exists: true,
          name: response.data.name,
          id: response.data.id
        });
      }
    } catch (error) {
      toast.error('Ошибка при создании роли карантина');
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && entry.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive" className="flex items-center gap-1 text-xs whitespace-nowrap"><Clock className="w-3 h-3" />Ожидает решения</Badge>;
      case 'banned':
        return <Badge variant="destructive" className="flex items-center gap-1 text-xs whitespace-nowrap"><Ban className="w-3 h-3" />Забанен</Badge>;
      case 'restored':
        return <Badge variant="outline" className="flex items-center gap-1 text-xs whitespace-nowrap"><UserCheck className="w-3 h-3" />Восстановлен</Badge>;

      default:
        return <Badge className="text-xs whitespace-nowrap">Неизвестно</Badge>;
    }
  };

  const getActionButton = (entry: QuarantineEntry, action: 'ban' | 'restore') => {
    const config = {
      ban: { icon: Ban, text: 'Забанить', variant: 'destructive' as const },
      restore: { icon: RotateCcw, text: 'Восстановить', variant: 'outline' as const }
    };
    
    const { icon: Icon, text, variant } = config[action];
    
    return (
      <Button
        variant={variant}
        size="sm"
        onClick={() => setReviewingEntry({ entry, action })}
        className="w-full md:w-auto flex items-center justify-center gap-2"
      >
        <Icon className="w-4 h-4" />
        {text}
      </Button>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6" />
            Управление карантином
          </h1>
          <p className="text-muted-foreground">
            Рассмотрение пользователей, помещенных в карантин системой анти-нюк
          </p>
        </div>
        
        <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Создать роль карантина
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создание роли карантина</DialogTitle>
              <DialogDescription>
                Создать роль "Карантин" с ограниченными разрешениями для системы анти-нюк
              </DialogDescription>
            </DialogHeader>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Внимание</AlertTitle>
              <AlertDescription>
                Роль карантина будет создана с минимальными разрешениями: только чтение сообщений и отправка сообщений в разрешенных каналах.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>
                Отмена
              </Button>
              <Button onClick={createQuarantineRole}>
                Создать роль
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Статус роли карантина */}
      {!quarantineRole.exists ? (
        <Alert className="mb-6 border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Роль карантина не создана!</AlertTitle>
          <AlertDescription className="text-destructive">
            <strong>СРОЧНО И ОБЯЗАТЕЛЬНО:</strong> Для корректной работы системы анти-нюк необходимо создать роль карантина. 
            Без этой роли пользователи не смогут быть помещены в карантин. 
            <br />
            <span className="text-destructive font-medium">
              Нажмите кнопку "Создать роль карантина" выше для создания роли.
            </span>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">Роль карантина настроена</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            <div className="space-y-2">
              <p>
                <strong>Название роли:</strong> {quarantineRole.name}
                <br />
                <strong>ID роли:</strong> <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded text-xs">{quarantineRole.id}</code>
              </p>
              <p className="font-medium">
                ⚠️ <strong>Важно:</strong> Разместите эту роль выше всех остальных ролей сервера, 
                но ниже роли нашего бота в настройках сервера для корректной работы системы.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Информационное сообщение */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Автоматическая система</AlertTitle>
        <AlertDescription>
          Пользователи помещаются в карантин автоматически системой анти-нюк при подозрительной активности. 
          Ручное добавление недоступно. Необходимо принять решение: забанить или восстановить пользователя.
        </AlertDescription>
      </Alert>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ожидают решения</p>
                <p className="font-medium text-red-600">
                  {entries.filter(e => e.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Забанено</p>
                <p className="font-medium text-destructive">
                  {entries.filter(e => e.status === 'banned').length}
                </p>
              </div>
              <Ban className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Восстановлено</p>
                <p className="font-medium text-green-600">
                  {entries.filter(e => e.status === 'restored').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Фильтры */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или причине..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все записи</SelectItem>
            <SelectItem value="pending">Ожидают решения</SelectItem>
            <SelectItem value="banned">Забанены</SelectItem>
            <SelectItem value="restored">Восстановлены</SelectItem>

          </SelectContent>
        </Select>
      </div>

      {/* Список записей */}
      <Card>
        <CardHeader>
          <CardTitle>Записи карантина ({filteredEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Записи не найдены</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg">
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-start justify-between p-4">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback>
                          <UserX className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{entry.username}</span>
                          <div className="flex-shrink-0">
                            {getStatusBadge(entry.status)}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm"><strong>Причина:</strong> {entry.reason}</p>
                          <p className="text-sm"><strong>Сохраненные роли:</strong> {entry.originalRoles.join(', ')}</p>
                          {entry.notes && (
                            <p className="text-sm"><strong>Примечания:</strong> {entry.notes}</p>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Добавлен: {entry.addedBy} • {formatDate(entry.addedAt)}
                          {entry.reviewedBy && entry.reviewedAt && (
                            <> • Рассмотрен: {entry.reviewedBy} • {formatDate(entry.reviewedAt)}</>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {entry.status === 'pending' && (
                      <div className="flex space-x-2 flex-shrink-0 ml-4">
                        {getActionButton(entry, 'ban')}
                        {getActionButton(entry, 'restore')}
                      </div>
                    )}
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden p-4 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback>
                          <UserX className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{entry.username}</div>
                        <div className="mt-1">
                          {getStatusBadge(entry.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Причина:</span>
                        <p className="text-sm break-words">{entry.reason}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">Сохраненные роли:</span>
                        <p className="text-sm break-words">{entry.originalRoles.join(', ')}</p>
                      </div>
                      
                      {entry.notes && (
                        <div>
                          <span className="text-sm font-medium">Примечания:</span>
                          <p className="text-sm break-words">{entry.notes}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Добавлен: {entry.addedBy}</div>
                        <div>{formatDate(entry.addedAt)}</div>
                        {entry.reviewedBy && entry.reviewedAt && (
                          <>
                            <div>Рассмотрен: {entry.reviewedBy}</div>
                            <div>{formatDate(entry.reviewedAt)}</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {entry.status === 'pending' && (
                      <div className="flex flex-col space-y-2 pt-2 border-t">
                        {getActionButton(entry, 'ban')}
                        {getActionButton(entry, 'restore')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог рассмотрения записи */}
      <Dialog open={!!reviewingEntry} onOpenChange={() => setReviewingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewingEntry?.action === 'ban' && 'Забанить пользователя'}
              {reviewingEntry?.action === 'restore' && 'Восстановить пользователя'}
            </DialogTitle>
            <DialogDescription>
              {reviewingEntry?.action === 'ban' && 'Пользователь будет окончательно заба��ен на сервере'}
              {reviewingEntry?.action === 'restore' && 'Пользователю будут возвращены все первоначальные роли'}
            </DialogDescription>
          </DialogHeader>
          
          {reviewingEntry && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p><strong>Пользователь:</strong> {reviewingEntry.entry.username}</p>
                <p><strong>Причина карантина:</strong> {reviewingEntry.entry.reason}</p>
                <p><strong>Роли для восстановления:</strong> {reviewingEntry.entry.originalRoles.join(', ')}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="review-notes">Примечание (опционально)</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Дополнительные примечания к решению..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setReviewingEntry(null)}>
              Отмена
            </Button>
            <Button 
              onClick={() => reviewEntry(reviewingEntry!.action)}
              variant={reviewingEntry?.action === 'ban' ? 'destructive' : 'default'}
            >
              Подтвердить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}