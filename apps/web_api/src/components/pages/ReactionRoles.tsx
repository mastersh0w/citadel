import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '../LanguageProvider';
import { useReactionRoles } from '../ReactionRolesProvider';
import { toast } from 'sonner@2.0.3';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Crown,
  Users,
  Smile
} from 'lucide-react';

interface ReactionRolesProps {
  onNavigate: (page: string) => void;
}

// Remove mock data since we're using context now

const mockRoles = [
  { id: '1', name: 'Администратор', color: '#ef4444', position: 10 },
  { id: '2', name: 'Модератор', color: '#3b82f6', position: 9 },
  { id: '3', name: 'VIP', color: '#f59e0b', position: 8 },
  { id: '4', name: 'Участник', color: '#22c55e', position: 7 },
  { id: '5', name: 'Gamer', color: '#8b5cf6', position: 6 },
  { id: '6', name: 'Artist', color: '#ec4899', position: 5 },
  { id: '7', name: 'Developer', color: '#10b981', position: 4 },
  { id: '8', name: 'Music Lover', color: '#f97316', position: 3 },
  { id: '9', name: 'Student', color: '#06b6d4', position: 2 },
  { id: '10', name: 'Новичок', color: '#84cc16', position: 1 }
];

const buttonColors = [
  { value: 'gray', label: 'Серый', class: 'bg-gray-500' },
  { value: 'blue', label: 'Синий', class: 'bg-blue-500' },
  { value: 'green', label: 'Зеленый', class: 'bg-green-500' },
  { value: 'red', label: 'Красный', class: 'bg-red-500' }
];

export function ReactionRoles({ onNavigate }: ReactionRolesProps) {
  const { t } = useLanguage();
  const { roleGroups, loading, deleteRoleGroup: deleteGroup, updateRoleGroup } = useReactionRoles();

  const startWizard = (group?: RoleGroup) => {
    if (group) {
      // Navigate to wizard with editing data
      onNavigate(`reaction-roles-wizard?edit=${group.id}`);
    } else {
      // Navigate to wizard for creating new group
      onNavigate('reaction-roles-wizard');
    }
  };

  const handleDeleteRoleGroup = async (id: string) => {
    try {
      deleteGroup(id);
      toast.success('Группа ролей удалена');
    } catch (error) {
      toast.error('Не удалось удалить группу ролей');
    }
  };

  const toggleRoleGroup = async (id: string) => {
    try {
      const group = roleGroups.find(g => g.id === id);
      if (group) {
        updateRoleGroup(id, { enabled: !group.enabled });
        toast.success('Статус группы изменен');
      }
    } catch (error) {
      toast.error('Не удалось изменить статус');
    }
  };



  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Роли по реакциям
          </h1>
          <p className="text-muted-foreground mt-2">
            Позвольте участникам самостоятельно выбирать роли, нажимая на реакции или кнопки
          </p>
        </div>
        
        <Button 
          onClick={() => startWizard()} 
          size="lg"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Создать новую группу ролей
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Активных групп</p>
                <p className="text-2xl">{roleGroups.filter(g => g.enabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Crown className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ролей настроено</p>
                <p className="text-2xl">
                  {roleGroups.reduce((sum, group) => sum + group.roles.length, 0)}
                </p>
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
                <p className="text-2xl">
                  {roleGroups.reduce((sum, group) => sum + group.usageStats.totalUses, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Groups List */}
      <div className="space-y-4">
        {roleGroups.length > 0 ? (
          roleGroups.map(group => (
            <Card key={group.id}>
              <CardHeader>
                {/* Desktop Layout */}
                <div className="hidden md:flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      {group.type === 'reactions' ? <Smile className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                      <span className="truncate">{group.name}</span>
                      <Badge variant={group.enabled ? "default" : "secondary"} className="flex-shrink-0">
                        {group.enabled ? 'Активна' : 'Отключена'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="break-words">
                      Канал: #{group.channelName} • 
                      {group.messageId ? ` ID: ${group.messageId.slice(0, 8)}...` : ' Новое сообщение'} • 
                      Тип: {group.type === 'reactions' ? 'Реакции' : 'Кнопки'} • 
                      Режим: {
                        group.mode === 'unique' ? 'Уникальный (1 роль)' :
                        group.mode === 'multiple' ? 'Множественный' : 'Переключение'
                      }
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startWizard(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={group.enabled}
                      onCheckedChange={() => toggleRoleGroup(group.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRoleGroup(group.id)}
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
                      {group.type === 'reactions' ? <Smile className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                      <CardTitle className="truncate flex-1">{group.name}</CardTitle>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={group.enabled ? "default" : "secondary"}>
                        {group.enabled ? 'Активна' : 'Отключена'}
                      </Badge>
                      <Switch
                        checked={group.enabled}
                        onCheckedChange={() => toggleRoleGroup(group.id)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Канал:</span> #{group.channelName}
                    </div>
                    <div>
                      <span className="font-medium">Тип:</span> {group.type === 'reactions' ? 'Реакции' : 'Кнопки'}
                    </div>
                    <div>
                      <span className="font-medium">Режим:</span> {
                        group.mode === 'unique' ? 'Уникальный (1 роль)' :
                        group.mode === 'multiple' ? 'Множественный' : 'Переключение'
                      }
                    </div>
                    {group.messageId && (
                      <div>
                        <span className="font-medium">ID сообщения:</span> {group.messageId.slice(0, 8)}...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startWizard(group)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRoleGroup(group.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Ролей настроено</Label>
                    <p>{group.roles.length}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Использований</Label>
                    <p>{group.usageStats.totalUses}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Уникальных пользователей</Label>
                    <p>{group.usageStats.uniqueUsers}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Настроенные роли</Label>
                  <div className="flex flex-wrap gap-2">
                    {group.roles.map((role, index) => (
                      <div key={index} className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm">
                        {group.type === 'reactions' ? (
                          <span>{role.emoji}</span>
                        ) : (
                          <div className={`w-3 h-3 rounded ${buttonColors.find(c => c.value === role.buttonColor)?.class}`} />
                        )}
                        <span style={{ color: role.roleColor }}>{role.roleName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {(group.requirements.length > 0 || group.ignoredRoles.length > 0) && (
                  <div className="text-sm space-y-1">
                    {group.requirements.length > 0 && (
                      <p>
                        <span className="text-muted-foreground">Требования: </span>
                        {group.requirements.map(reqId => {
                          const role = mockRoles.find(r => r.id === reqId);
                          return role?.name;
                        }).filter(Boolean).join(', ')}
                      </p>
                    )}
                    {group.ignoredRoles.length > 0 && (
                      <p>
                        <span className="text-muted-foreground">Игнорируемые роли: </span>
                        {group.ignoredRoles.map(ignoreId => {
                          const role = mockRoles.find(r => r.id === ignoreId);
                          return role?.name;
                        }).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">У вас пока нет ни одной группы ролей</h3>
              <p className="text-muted-foreground mb-4">
                Нажмите кнопку выше, чтобы создать первую!
              </p>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
}