import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Crown,
  Plus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit,
  Users,
  Settings,
  Palette,
  Shield,
  Search
} from 'lucide-react';
import { Role } from '@/types';
import { api } from '@/utils/api';
import { formatRoleColor, formatPermissions } from '@/utils/formatters';
import { toast } from 'sonner';

export function RoleSystem() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    color: 0,
    hoist: false,
    mentionable: false
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.guild.getRoles();
      if (response.success && response.data) {
        setRoles(response.data.sort((a, b) => b.position - a.position));
      }
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
      toast.error('Не удалось загрузить список ролей');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('Введите название роли');
      return;
    }

    try {
      // Simulate role creation
      const newRoleData: Role = {
        id: Date.now().toString(),
        name: newRole.name.trim(),
        color: newRole.color,
        hoist: newRole.hoist,
        position: roles.length + 1,
        permissions: '0',
        managed: false,
        mentionable: newRole.mentionable
      };
      
      setRoles(prev => [newRoleData, ...prev]);
      setNewRole({ name: '', color: 0, hoist: false, mentionable: false });
      setShowCreateDialog(false);
      toast.success('Роль создана успешно');
    } catch (error) {
      toast.error('Ошибка при создании роли');
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      setRoles(prev => prev.filter(role => role.id !== roleId));
      toast.success('Роль удалена');
    } catch (error) {
      toast.error('Ошибка при удалении роли');
    }
  };

  const updateRole = async () => {
    if (!editingRole) return;

    try {
      setRoles(prev => prev.map(role => 
        role.id === editingRole.id ? editingRole : role
      ));
      setEditingRole(null);
      toast.success('Роль обновлена');
    } catch (error) {
      toast.error('Ошибка при обновлении роли');
    }
  };

  const getRoleBadge = (role: Role) => {
    if (role.managed) {
      return <Badge variant="secondary" className="text-xs">Управляемая</Badge>;
    }
    if (role.hoist) {
      return <Badge variant="default" className="text-xs">Отображается отдельно</Badge>;
    }
    return null;
  };

  const getMemberCount = (roleId: string) => {
    // Mock member count
    return Math.floor(Math.random() * 50) + 1;
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRoles = roles.length;
  const managedRoles = roles.filter(r => r.managed).length;
  const hoistedRoles = roles.filter(r => r.hoist).length;
  const mentionableRoles = roles.filter(r => r.mentionable).length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Crown className="h-8 w-8 animate-pulse" />
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
            <Crown className="h-8 w-8" />
            Система ролей
          </h1>
          <p className="text-muted-foreground">
            Управление ролями и разрешениями на сервере
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadRoles}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Создать роль
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создание новой роли</DialogTitle>
                <DialogDescription>
                  Создайте новую роль с базовыми настройками
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Название роли</label>
                  <Input
                    placeholder="Введите название роли"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Цвет роли</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formatRoleColor(newRole.color)}
                      onChange={(e) => setNewRole(prev => ({ 
                        ...prev, 
                        color: parseInt(e.target.value.substring(1), 16) 
                      }))}
                      className="w-10 h-8 rounded border"
                    />
                    <Input
                      placeholder="#FFFFFF"
                      value={formatRoleColor(newRole.color)}
                      onChange={(e) => {
                        const hex = e.target.value.replace('#', '');
                        const color = parseInt(hex, 16) || 0;
                        setNewRole(prev => ({ ...prev, color }));
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hoist"
                      checked={newRole.hoist}
                      onChange={(e) => setNewRole(prev => ({ ...prev, hoist: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="hoist" className="text-sm">
                      Отображать участников отдельно
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mentionable"
                      checked={newRole.mentionable}
                      onChange={(e) => setNewRole(prev => ({ ...prev, mentionable: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="mentionable" className="text-sm">
                      Разрешить упоминание роли
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  setNewRole({ name: '', color: 0, hoist: false, mentionable: false });
                }}>
                  Отмена
                </Button>
                <Button onClick={createRole} disabled={!newRole.name.trim()}>
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего ролей</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              на сервере
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Управляемые</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{managedRoles}</div>
            <p className="text-xs text-muted-foreground">
              ролей ботов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отображаемые</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{hoistedRoles}</div>
            <p className="text-xs text-muted-foreground">
              отдельно в списке
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Упоминаемые</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{mentionableRoles}</div>
            <p className="text-xs text-muted-foreground">
              можно упоминать
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск ролей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию роли..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Список ролей</CardTitle>
          <CardDescription>
            {filteredRoles.length} из {totalRoles} ролей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRoles.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Роль</TableHead>
                      <TableHead>Цвет</TableHead>
                      <TableHead>Позиция</TableHead>
                      <TableHead>Участники</TableHead>
                      <TableHead>Настройки</TableHead>
                      <TableHead>Разрешения</TableHead>
                      <TableHead className="w-20">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border flex-shrink-0" 
                              style={{ backgroundColor: formatRoleColor(role.color) }}
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{role.name}</div>
                              <div className="text-xs text-muted-foreground font-mono truncate">
                                {role.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {formatRoleColor(role.color)}
                            </span>
                            <Palette className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            #{role.position}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{getMemberCount(role.id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getRoleBadge(role)}
                            {role.mentionable && (
                              <Badge variant="outline" className="text-xs">
                                Упоминаемая
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatPermissions(role.permissions).length} разр.
                            </span>
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
                              <DropdownMenuItem onClick={() => setEditingRole(role)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                              {!role.managed && (
                                <DropdownMenuItem 
                                  onClick={() => deleteRole(role.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Удалить
                                </DropdownMenuItem>
                              )}
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
                {filteredRoles.map((role) => (
                  <Card key={role.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div 
                            className="w-6 h-6 rounded-full border flex-shrink-0" 
                            style={{ backgroundColor: formatRoleColor(role.color) }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{role.name}</div>
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              {role.id}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingRole(role)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            {!role.managed && (
                              <DropdownMenuItem 
                                onClick={() => deleteRole(role.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Удалить
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Цвет:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {formatRoleColor(role.color)}
                            </span>
                            <Palette className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Позиция:</span>
                          <Badge variant="outline" className="text-xs">
                            #{role.position}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Участники:</span>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{getMemberCount(role.id)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Разрешения:</span>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatPermissions(role.permissions).length} разр.
                            </span>
                          </div>
                        </div>

                        {(getRoleBadge(role) || role.mentionable) && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Настройки:</span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {getRoleBadge(role)}
                              {role.mentionable && (
                                <Badge variant="outline" className="text-xs">
                                  Упоминаемая
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              {searchTerm ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Роли не найдены</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Попробуйте изменить поисковый запрос
                  </p>
                </>
              ) : (
                <>
                  <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Нет ролей на сервере</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Создать первую роль
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование роли</DialogTitle>
            <DialogDescription>
              Изменение настроек роли {editingRole?.name}
            </DialogDescription>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Название роли</label>
                <Input
                  value={editingRole.name}
                  onChange={(e) => setEditingRole(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Цвет роли</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formatRoleColor(editingRole.color)}
                    onChange={(e) => setEditingRole(prev => prev ? { 
                      ...prev, 
                      color: parseInt(e.target.value.substring(1), 16) 
                    } : null)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={formatRoleColor(editingRole.color)}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '');
                      const color = parseInt(hex, 16) || 0;
                      setEditingRole(prev => prev ? { ...prev, color } : null);
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-hoist"
                    checked={editingRole.hoist}
                    onChange={(e) => setEditingRole(prev => prev ? { ...prev, hoist: e.target.checked } : null)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="edit-hoist" className="text-sm">
                    Отображать участников отдельно
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-mentionable"
                    checked={editingRole.mentionable}
                    onChange={(e) => setEditingRole(prev => prev ? { ...prev, mentionable: e.target.checked } : null)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="edit-mentionable" className="text-sm">
                    Разрешить упоминание роли
                  </label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Отмена
            </Button>
            <Button onClick={updateRole}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}