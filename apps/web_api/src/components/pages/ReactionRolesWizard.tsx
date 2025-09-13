import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '../LanguageProvider';
import { useReactionRoles } from '../ReactionRolesProvider';
import { EmojiPicker } from '../EmojiPicker';
import { toast } from 'sonner@2.0.3';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Hash,
  Crown,
  Settings,
  Eye,
  EyeOff,
  Save,
  X,
  Info,
  Users,
  Smile,
  Copy,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  AlertTriangle,
  Home
} from 'lucide-react';

interface RoleMapping {
  id: string;
  emoji?: string;
  buttonText?: string;
  buttonColor?: 'gray' | 'blue' | 'green' | 'red';
  roleId: string;
  roleName: string;
  roleColor: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
}

interface ReactionRolesWizardProps {
  onNavigate: (page: string) => void;
  editingGroupId?: string;
}

const mockChannels: Channel[] = [
  { id: '1', name: 'правила', type: 'text' },
  { id: '2', name: 'роли', type: 'text' },
  { id: '3', name: 'общий', type: 'text' },
  { id: '4', name: 'объявления', type: 'text' },
  { id: '5', name: 'игры', type: 'text' }
];

const mockRoles: Role[] = [
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

export function ReactionRolesWizard({ onNavigate, editingGroupId }: ReactionRolesWizardProps) {
  const { t } = useLanguage();
  const { addRoleGroup, updateRoleGroup, getRoleGroup } = useReactionRoles();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Wizard form state
  const [wizardData, setWizardData] = useState({
    // Step 1
    channelId: '',
    existingMessageId: '',
    // Step 2
    messageTitle: '',
    messageDescription: '',
    messageColor: '#3b82f6',
    // Step 3
    type: 'reactions' as 'reactions' | 'buttons',
    roles: [] as RoleMapping[],
    // Step 4
    mode: 'multiple' as 'unique' | 'multiple' | 'toggle',
    requirements: [] as string[],
    ignoredRoles: [] as string[]
  });

  useEffect(() => {
    // If editing, load the group data
    if (editingGroupId) {
      loadGroupData(editingGroupId);
    }
  }, [editingGroupId]);

  const loadGroupData = async (groupId: string) => {
    try {
      setLoading(true);
      
      const group = getRoleGroup(groupId);
      if (group) {
        setWizardData({
          channelId: group.channelId,
          existingMessageId: group.messageId || '',
          messageTitle: group.messageContent.title,
          messageDescription: group.messageContent.description,
          messageColor: group.messageContent.color,
          type: group.type,
          roles: group.roles,
          mode: group.mode,
          requirements: group.requirements,
          ignoredRoles: group.ignoredRoles
        });
      } else {
        toast.error('Группа ролей не найдена');
        onNavigate('reaction-roles');
      }
    } catch (error) {
      console.error('Ошибка загрузки группы ролей:', error);
      toast.error('Не удалось загрузить данные группы');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addRole = () => {
    const newRole: RoleMapping = {
      id: `role_${Date.now()}`,
      emoji: wizardData.type === 'reactions' ? '🎭' : undefined,
      buttonText: wizardData.type === 'buttons' ? 'Новая кнопка' : undefined,
      buttonColor: wizardData.type === 'buttons' ? 'blue' : undefined,
      roleId: '',
      roleName: '',
      roleColor: '#6b7280'
    };
    setWizardData(prev => ({
      ...prev,
      roles: [...prev.roles, newRole]
    }));
  };

  const updateRole = (index: number, updates: Partial<RoleMapping>) => {
    setWizardData(prev => ({
      ...prev,
      roles: prev.roles.map((role, i) => {
        if (i === index) {
          const updatedRole = { ...role, ...updates };
          if (updates.roleId) {
            const selectedRole = mockRoles.find(r => r.id === updates.roleId);
            if (selectedRole) {
              updatedRole.roleName = selectedRole.name;
              updatedRole.roleColor = selectedRole.color;
            }
          }
          return updatedRole;
        }
        return role;
      })
    }));
  };

  const removeRole = (index: number) => {
    setWizardData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index)
    }));
  };

  const saveRoleGroup = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const channel = mockChannels.find(c => c.id === wizardData.channelId);
      
      if (editingGroupId) {
        // Update existing group
        updateRoleGroup(editingGroupId, {
          name: wizardData.messageTitle || 'Без названия',
          channelId: wizardData.channelId,
          channelName: channel?.name || 'Unknown',
          messageId: wizardData.existingMessageId || undefined,
          messageContent: {
            title: wizardData.messageTitle,
            description: wizardData.messageDescription,
            color: wizardData.messageColor
          },
          type: wizardData.type,
          mode: wizardData.mode,
          roles: wizardData.roles,
          requirements: wizardData.requirements,
          ignoredRoles: wizardData.ignoredRoles
        });
        toast.success('Группа ролей успешно обновлена!');
      } else {
        // Create new group
        const newGroup = {
          id: `group_${Date.now()}`,
          name: wizardData.messageTitle || 'Без названия',
          channelId: wizardData.channelId,
          channelName: channel?.name || 'Unknown',
          messageId: wizardData.existingMessageId || undefined,
          messageContent: {
            title: wizardData.messageTitle,
            description: wizardData.messageDescription,
            color: wizardData.messageColor
          },
          type: wizardData.type,
          mode: wizardData.mode,
          roles: wizardData.roles,
          requirements: wizardData.requirements,
          ignoredRoles: wizardData.ignoredRoles,
          enabled: true,
          createdAt: new Date().toISOString(),
          usageStats: { totalUses: 0, uniqueUsers: 0 }
        };
        
        addRoleGroup(newGroup);
        toast.success('Группа ролей создана и опубликована на сервере!');
      }
      
      // Navigate back to main page
      onNavigate('reaction-roles');
    } catch (error) {
      toast.error('Не удалось сохранить группу ролей');
    } finally {
      setLoading(false);
    }
  };

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1:
        return wizardData.channelId !== '';
      case 2:
        return wizardData.messageTitle.trim() !== '' && wizardData.messageDescription.trim() !== '';
      case 3:
        return wizardData.roles.length > 0 && wizardData.roles.every(role => 
          role.roleId !== '' && (
            (wizardData.type === 'reactions' && role.emoji) ||
            (wizardData.type === 'buttons' && role.buttonText?.trim())
          )
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderPreview = () => {
    if (currentStep < 2) return null;

    return (
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Предпросмотр сообщения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border-l-4 p-4 rounded bg-card"
            style={{ borderLeftColor: wizardData.messageColor }}
          >
            {wizardData.messageTitle && (
              <h3 className="font-semibold mb-2" style={{ color: wizardData.messageColor }}>
                {wizardData.messageTitle}
              </h3>
            )}
            {wizardData.messageDescription && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
                {wizardData.messageDescription}
              </p>
            )}
            
            {currentStep >= 3 && wizardData.roles.length > 0 && (
              <div className="space-y-2">
                {wizardData.type === 'reactions' ? (
                  <div className="flex flex-wrap gap-2">
                    {wizardData.roles.map((role, index) => (
                      <div key={index} className="flex items-center gap-1 text-sm">
                        <span className="text-lg">{role.emoji}</span>
                        <span className="text-muted-foreground">
                          {role.roleName || 'Выберите роль'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {wizardData.roles.map((role, index) => {
                      const colorClass = buttonColors.find(c => c.value === role.buttonColor)?.class || 'bg-blue-500';
                      return (
                        <button
                          key={index}
                          className={`px-3 py-1 rounded text-white text-sm ${colorClass}`}
                          disabled
                        >
                          {role.buttonText || 'Кнопка'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => onNavigate('reaction-roles')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад к группам ролей
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold">
                  {editingGroupId ? 'Редактировать группу ролей' : 'Создать новую группу ролей'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Шаг {currentStep} из 4
                </p>
              </div>
            </div>

            {/* Step Progress */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map(step => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step < currentStep
                      ? 'bg-success text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Form Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Channel and Message */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Шаг 1: Где будет размещено сообщение?
                  </CardTitle>
                  <CardDescription>
                    Выберите канал для размещения сообщения с ролями по реакциям
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Канал *</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Выберите текстовый канал, где будет размещено сообщение
                    </p>
                    <Select 
                      value={wizardData.channelId} 
                      onValueChange={(value) => setWizardData(prev => ({ ...prev, channelId: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Выберите канал" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockChannels.map(channel => (
                          <SelectItem key={channel.id} value={channel.id}>
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              {channel.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium">ID существующего сообщения (необязательно)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Если хотите добавить роли к уже существующему сообщению, укажите его ID
                    </p>
                    <Input
                      value={wizardData.existingMessageId}
                      onChange={(e) => setWizardData(prev => ({ ...prev, existingMessageId: e.target.value }))}
                      placeholder="Например: 1234567890123456789"
                      className="h-12"
                    />
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Если поле пустое, будет создано новое сообщение с указанным ниже содержимым
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Message Content */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Шаг 2: Настройте содержимое сообщения
                  </CardTitle>
                  <CardDescription>
                    Создайте красивое embed-сообщение для выбора ролей
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Заголовок Embed *</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Краткий и понятный заголовок для вашего сообщения
                    </p>
                    <Input
                      value={wizardData.messageTitle}
                      onChange={(e) => setWizardData(prev => ({ ...prev, messageTitle: e.target.value }))}
                      placeholder="Например: 🎭 Выберите свои роли"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Описание Embed *</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Подробное описание того, как работает система выбора ролей
                    </p>
                    <Textarea
                      value={wizardData.messageDescription}
                      onChange={(e) => setWizardData(prev => ({ ...prev, messageDescription: e.target.value }))}
                      placeholder="Нажмите на реакции ниже, чтобы получить соответствующие роли на сервере..."
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Поддерживается базовый Markdown: **жирный текст**, *курсив*, `код`
                    </p>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Цвет Embed</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Выберите цвет боковой полоски embed-сообщения
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="color"
                        value={wizardData.messageColor}
                        onChange={(e) => setWizardData(prev => ({ ...prev, messageColor: e.target.value }))}
                        className="w-16 h-12 p-1 border"
                      />
                      <Input
                        value={wizardData.messageColor}
                        onChange={(e) => setWizardData(prev => ({ ...prev, messageColor: e.target.value }))}
                        placeholder="#3b82f6"
                        className="font-mono h-12"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Roles and Reactions/Buttons */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Шаг 3: Свяжите эмодзи/кнопки с ролями
                  </CardTitle>
                  <CardDescription>
                    Настройте, какие роли будут выдаваться при нажатии на реакции или кнопки
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Тип взаимодействия</Label>
                    <RadioGroup 
                      value={wizardData.type} 
                      onValueChange={(value: 'reactions' | 'buttons') => setWizardData(prev => ({ ...prev, type: value }))}
                      className="flex gap-8 mt-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="reactions" id="reactions" />
                        <Label htmlFor="reactions" className="font-medium">
                          <div className="flex items-center gap-2">
                            <Smile className="h-4 w-4" />
                            Реакции
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="buttons" id="buttons" />
                        <Label htmlFor="buttons" className="font-medium">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Кнопки
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">
                          Пары {wizardData.type === 'reactions' ? 'Эмодзи' : 'Кнопка'} + Роль
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Создайте связи между {wizardData.type === 'reactions' ? 'эмодзи' : 'кнопками'} и ролями
                        </p>
                      </div>
                      <Button onClick={addRole} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Добавить роль
                      </Button>
                    </div>

                    {wizardData.roles.length === 0 ? (
                      <div className="text-center p-12 border-2 border-dashed rounded-lg bg-muted/50">
                        <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-2">
                          У вас пока нет настроенных ролей
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Нажмите "Добавить роль" чтобы создать первую связь
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {wizardData.roles.map((role, index) => (
                          <Card key={role.id}>
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4">
                                {wizardData.type === 'reactions' ? (
                                  <div className="flex-shrink-0">
                                    <Label className="text-sm">Эмодзи</Label>
                                    <EmojiPicker
                                      value={role.emoji}
                                      onChange={(emoji) => updateRole(index, { emoji })}
                                      placeholder="🎭"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex gap-3 flex-shrink-0">
                                    <div>
                                      <Label className="text-sm">Текст кнопки</Label>
                                      <Input
                                        value={role.buttonText || ''}
                                        onChange={(e) => updateRole(index, { buttonText: e.target.value })}
                                        placeholder="Текст кнопки"
                                        className="w-32 h-12"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm">Цвет</Label>
                                      <Select 
                                        value={role.buttonColor || 'blue'} 
                                        onValueChange={(value: any) => updateRole(index, { buttonColor: value })}
                                      >
                                        <SelectTrigger className="w-28 h-12">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {buttonColors.map(color => (
                                            <SelectItem key={color.value} value={color.value}>
                                              <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded ${color.class}`} />
                                                <span>{color.label}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex-1">
                                  <Label className="text-sm">Роль</Label>
                                  <Select 
                                    value={role.roleId} 
                                    onValueChange={(value) => updateRole(index, { roleId: value })}
                                  >
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Выберите роль" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mockRoles
                                        .sort((a, b) => b.position - a.position)
                                        .map(mockRole => (
                                          <SelectItem key={mockRole.id} value={mockRole.id}>
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: mockRole.color }}
                                              />
                                              {mockRole.name}
                                            </div>
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRole(index)}
                                  className="text-destructive hover:text-destructive flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Rules and Settings */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Шаг 4: Установите правила для этой группы
                  </CardTitle>
                  <CardDescription>
                    Настройте режим работы и ограничения для системы ролей
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <Label className="text-base font-medium">Режим выбора ролей</Label>
                    <RadioGroup 
                      value={wizardData.mode} 
                      onValueChange={(value: any) => setWizardData(prev => ({ ...prev, mode: value }))}
                      className="space-y-4 mt-4"
                    >
                      <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="multiple" id="multiple" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="multiple" className="font-medium text-base">Множественный</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Пользователь может выбрать любое количество ролей из этой группы
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="unique" id="unique" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="unique" className="font-medium text-base">Уникальный</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Пользователь может выбрать только одну роль из этой группы. При выборе новой старая снимается
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="toggle" id="toggle" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="toggle" className="font-medium text-base">Обратный</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Повторное нажатие на реакцию/кнопку снимает роль
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">Требования для получения роли</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Пользователь должен иметь одну из этих ролей, чтобы взаимодействовать с этим сообщением
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                      {mockRoles.map(role => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={wizardData.requirements.includes(role.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWizardData(prev => ({
                                  ...prev,
                                  requirements: [...prev.requirements, role.id]
                                }));
                              } else {
                                setWizardData(prev => ({
                                  ...prev,
                                  requirements: prev.requirements.filter(id => id !== role.id)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <Label className="flex items-center gap-2 text-sm cursor-pointer">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            {role.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Игнорируемые роли</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Пользователи с этими ролями не смогут получить роли из этой группы
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                      {mockRoles.map(role => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={wizardData.ignoredRoles.includes(role.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWizardData(prev => ({
                                  ...prev,
                                  ignoredRoles: [...prev.ignoredRoles, role.id]
                                }));
                              } else {
                                setWizardData(prev => ({
                                  ...prev,
                                  ignoredRoles: prev.ignoredRoles.filter(id => id !== role.id)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <Label className="flex items-center gap-2 text-sm cursor-pointer">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            {role.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Preview (1/3 width) */}
          <div className="lg:col-span-1">
            {renderPreview()}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="mt-8 bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button 
                  onClick={nextStep}
                  disabled={!canProceedFromStep(currentStep)}
                  className="gap-2"
                >
                  Далее
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={saveRoleGroup}
                  disabled={!canProceedFromStep(currentStep) || loading}
                  className="bg-success hover:bg-success/90 gap-2 min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Сохранить и опубликовать
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}