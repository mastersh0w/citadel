import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageEditor } from './MessageEditor';
import {
  ChevronDown,
  ChevronRight,
  Settings,
  MessageSquare,
  Bell,
  Hash,
  Users,
  Shield,
  Crown,
  Volume2,
  VolumeX,
  UserPlus,
  UserMinus,
  Ban,
  Gavel,
  User,
  MessageCircle,
  Edit,
  Trash2,
  FileText,
  X,
  Plus,
  Mail
} from 'lucide-react';

interface EventConfig {
  enabled: boolean;
  message: string;
  channel?: string;
  embedEnabled?: boolean;
  mentionRoles?: string[];
  cooldown?: number;
  dmParticipant?: boolean;
}

interface EventConfigCardProps {
  eventType: string;
  title: string;
  description: string;
  config: EventConfig;
  onChange: (config: EventConfig) => void;
  availableChannels?: Array<{ id: string; name: string }>;
  availableRoles?: Array<{ id: string; name: string; color?: number }>;
  supportsDM?: boolean;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  memberJoin: <UserPlus className="h-4 w-4 text-green-500" />,
  memberLeave: <UserMinus className="h-4 w-4 text-red-500" />,
  memberBan: <Ban className="h-4 w-4 text-red-600" />,
  memberUnban: <Shield className="h-4 w-4 text-green-600" />,
  memberKick: <Gavel className="h-4 w-4 text-orange-500" />,
  memberTimeout: <Shield className="h-4 w-4 text-yellow-500" />,
  memberUpdate: <User className="h-4 w-4 text-blue-500" />,
  memberRoleAdd: <Crown className="h-4 w-4 text-purple-500" />,
  memberRoleRemove: <Crown className="h-4 w-4 text-red-500" />,
  memberNicknameChange: <Edit className="h-4 w-4 text-blue-500" />,
  channelCreate: <Hash className="h-4 w-4 text-blue-500" />,
  channelDelete: <Hash className="h-4 w-4 text-red-500" />,
  channelUpdate: <Hash className="h-4 w-4 text-orange-500" />,
  roleCreate: <Crown className="h-4 w-4 text-purple-500" />,
  roleDelete: <Crown className="h-4 w-4 text-red-500" />,
  roleUpdate: <Crown className="h-4 w-4 text-orange-500" />,
  messageDelete: <Trash2 className="h-4 w-4 text-red-500" />,
  messageEdit: <Edit className="h-4 w-4 text-orange-500" />,
  messageBulkDelete: <Trash2 className="h-4 w-4 text-red-600" />,
  voiceChannelJoin: <Volume2 className="h-4 w-4 text-green-500" />,
  voiceChannelLeave: <VolumeX className="h-4 w-4 text-red-500" />,
  voiceChannelMove: <Volume2 className="h-4 w-4 text-blue-500" />,
  voiceChannelMute: <VolumeX className="h-4 w-4 text-orange-500" />,
  voiceChannelDeafen: <VolumeX className="h-4 w-4 text-red-500" />,
  default: <Bell className="h-4 w-4 text-muted-foreground" />
};

const DEFAULT_MESSAGES: Record<string, string> = {
  memberJoin: '🎉 Добро пожаловать на сервер **{server}**, {user.mention}!\\n\\nТы стал **{server.members}**-м участником нашего сообщества.',
  memberLeave: '👋 **{user}** покинул сервер **{server}**.\\n\\nОсталось участников: **{server.members}**',
  memberBan: '🔨 **{user}** был заблокирован модератором {moderator.mention}\\n\\n**Причина:** {reason}',
  memberUnban: '✅ **{user}** был разблокирован модератором {moderator.mention}',
  memberKick: '🥾 **{user}** был исключен модератором {moderator.mention}\\n\\n**Причина:** {reason}',
  memberTimeout: '🔇 **{user}** получил таймаут от {moderator.mention}\\n\\n**Причина:** {reason}\\n**Длительность:** {duration}',
  memberUpdate: '👤 **{user}** был обновлен модератором {moderator.mention}',
  memberRoleAdd: '➕ **{user}** получил роль **{role}** от {moderator.mention}',
  memberRoleRemove: '➖ У **{user}** была удалена роль **{role}** модератором {moderator.mention}',
  memberNicknameChange: '🏷️ **{user}** сменил никнейм с **{old_nickname}** на **{new_nickname}**',
  channelCreate: '📝 Создан новый канал: {channel}\\n\\n**Создал:** {moderator.mention}',
  channelDelete: '🗑️ Удален канал: **{channel}**\\n\\n**Удалил:** {moderator.mention}',
  channelUpdate: '✏️ Канал {channel} был изменен модератором {moderator.mention}',
  roleCreate: '👑 Создана новая роль: **{role}**\\n\\n**Создал:** {moderator.mention}',
  roleDelete: '🗑️ Удалена роль: **{role}**\\n\\n**Удалил:** {moderator.mention}',
  roleUpdate: '👑 Роль **{role}** была изменена модератором {moderator.mention}',
  messageDelete: '🗑️ Сообщение от **{user}** было удалено в {channel}\\n\\n**Содержание:** {content}',
  messageEdit: '✏️ **{user}** отредактировал сообщение в {channel}',
  messageBulkDelete: '🗑️ Массово удалено **{count}** сообщений в {channel} модератором {moderator.mention}',
  voiceChannelJoin: '🔊 **{user}** присоединился к голосовому каналу **{channel}**',
  voiceChannelLeave: '🔇 **{user}** покинул голосовой канал **{channel}**',
  voiceChannelMove: '🔀 **{user}** переместился из **{old_channel}** в **{new_channel}**',
  voiceChannelMute: '🔇 **{user}** был заглушен в **{channel}** модератором {moderator.mention}',
  voiceChannelDeafen: '🔇 **{user}** был отключен от звука в **{channel}** модератором {moderator.mention}'
};

export function EventConfigCard({ 
  eventType, 
  title, 
  description, 
  config, 
  onChange,
  availableChannels = [],
  availableRoles = [],
  supportsDM = false
}: EventConfigCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [showRoleAdd, setShowRoleAdd] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateConfig = (updates: Partial<EventConfig>) => {
    onChange({ ...config, ...updates });
  };

  const resetToDefault = () => {
    updateConfig({
      message: DEFAULT_MESSAGES[eventType] || ''
    });
  };

  const handleAddRole = (roleId: string) => {
    const currentRoles = config.mentionRoles || [];
    if (!currentRoles.includes(roleId)) {
      updateConfig({
        mentionRoles: [...currentRoles, roleId]
      });
    }
    setShowRoleAdd(false);
  };

  const handleRemoveRole = (roleId: string) => {
    const currentRoles = config.mentionRoles || [];
    updateConfig({
      mentionRoles: currentRoles.filter(id => id !== roleId)
    });
  };

  const getSelectedRoles = () => {
    const selectedRoleIds = config.mentionRoles || [];
    return availableRoles.filter(role => selectedRoleIds.includes(role.id));
  };

  const getAvailableRoles = () => {
    const selectedRoleIds = config.mentionRoles || [];
    return availableRoles.filter(role => !selectedRoleIds.includes(role.id));
  };

  const eventIcon = EVENT_ICONS[eventType] || EVENT_ICONS.default;

  // Определяем, какие события нуждаются в выборе канала и упоминании ролей
  const needsChannelSelection = ['memberBan', 'memberKick', 'memberTimeout', 'memberUnban'].includes(eventType) ||
                               eventType.startsWith('voice') ||
                               eventType.startsWith('channel') ||
                               eventType.startsWith('role') ||
                               eventType.startsWith('message');
  
  const needsRoleMention = ['memberBan', 'memberKick', 'memberTimeout', 'memberUnban'].includes(eventType) ||
                          eventType.startsWith('channel') ||
                          eventType.startsWith('role') ||
                          eventType.startsWith('message');

  return (
    <Card className={`transition-all duration-200 ${config.enabled ? 'ring-1 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {eventIcon}
            <div className="flex-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {config.enabled && (
                <Badge variant="default" className="text-xs">
                  Активно
                </Badge>
              )}
              {supportsDM && config.dmParticipant && (
                <Badge variant="secondary" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  ЛС
                </Badge>
              )}
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => updateConfig({ enabled: checked })}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      {config.enabled && (
        <CardContent className="pt-0">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Настройки уведомления</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4">
              <Separator />
              
              {/* Channel Selection */}
              {needsChannelSelection && (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Канал для уведомлений
                    </Label>
                    <Select
                      value={config.channel || 'default'}
                      onValueChange={(value) => updateConfig({ channel: value === 'default' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Канал по умолчанию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Использовать канал по умолчанию</SelectItem>
                        {availableChannels.map(channel => (
                          <SelectItem key={channel.id} value={channel.id}>
                            # {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Если не выбрано, будет использован канал из основных настроек
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Role Mentions */}
              {needsRoleMention && availableRoles.length > 0 && (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Упоминать роли
                    </Label>
                    
                    {/* Selected Roles */}
                    {getSelectedRoles().length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {getSelectedRoles().map(role => (
                          <Badge
                            key={role.id}
                            variant="secondary"
                            className="gap-1"
                            style={{ 
                              backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}20` : undefined,
                              borderColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}40` : undefined
                            }}
                          >
                            {role.name}
                            <button
                              onClick={() => handleRemoveRole(role.id)}
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Add Role */}
                    {!showRoleAdd ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRoleAdd(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Добавить роль
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Select
                          value={undefined}
                          onValueChange={(value) => {
                            if (value) {
                              handleAddRole(value);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите роль для упоминания" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableRoles().map(role => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ 
                                      backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#99aab5'
                                    }}
                                  />
                                  {role.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRoleAdd(false)}
                        >
                          Отмена
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Выбранные роли будут упомянуты в уведомлении
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* DM Option for supported events */}
              {supportsDM && (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Личные сообщения
                    </Label>
                    
                    <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                      {isMobile ? (
                        <>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Дублировать в ЛС участнику</Label>
                            <Switch
                              checked={config.dmParticipant || false}
                              onCheckedChange={(dmParticipant) => updateConfig({ dmParticipant })}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground pl-0">
                            Отправить копию уведомления в личные сообщения участнику
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-0.5">
                            <Label className="text-sm">Дублировать в ЛС участнику</Label>
                            <div className="text-xs text-muted-foreground">
                              Отправить копию уведомления в личные сообщения участнику
                            </div>
                          </div>
                          <Switch
                            checked={config.dmParticipant || false}
                            onCheckedChange={(dmParticipant) => updateConfig({ dmParticipant })}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Message Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Текст уведомления
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefault}
                    className="text-xs"
                  >
                    Сбросить
                  </Button>
                </div>
                
                <MessageEditor
                  value={config.message}
                  onChange={(message) => updateConfig({ message })}
                  placeholder={DEFAULT_MESSAGES[eventType] || 'Введите текст уведомления...'}
                  eventType={eventType}
                />
              </div>

              <Separator />

              {/* Additional Settings */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Embed Settings */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Дополнительные настройки</Label>
                  
                  <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                    {isMobile ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Rich Embed</Label>
                          <Switch
                            checked={config.embedEnabled || false}
                            onCheckedChange={(embedEnabled) => updateConfig({ embedEnabled })}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground pl-0">
                          Отправлять как красивое встроенное сообщение
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <Label className="text-sm">Rich Embed</Label>
                          <div className="text-xs text-muted-foreground">
                            Отправлять как красивое встроенное сообщение
                          </div>
                        </div>
                        <Switch
                          checked={config.embedEnabled || false}
                          onCheckedChange={(embedEnabled) => updateConfig({ embedEnabled })}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Cooldown Settings */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Ограничения</Label>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Кулдаун (секунды)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="3600"
                      value={config.cooldown || 0}
                      onChange={(e) => updateConfig({ cooldown: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <div className="text-xs text-muted-foreground">
                      Минимальный интервал между уведомлениями (0 = без ограничений)
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  );
}