import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '../LanguageProvider';
import { useSocialNotifications } from '../SocialNotificationsProvider';
import { toast } from 'sonner@2.0.3';
import {
  Rss,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  AlertTriangle,
  Home,
  Eye,
  Hash,
  Save,
  X,
  Play,
  Youtube,
  Twitch,
  Radio,
  Info,
  MessageSquare,
  Bell,
  Settings,
  Zap
} from 'lucide-react';

interface SocialNotificationsWizardProps {
  onNavigate: (page: string) => void;
  editingNotificationId?: string;
}

interface WizardData {
  platform: 'twitch' | 'youtube' | 'trovo' | 'kick';
  username: string;
  displayName: string;
  channelId: string;
  notificationType: 'stream' | 'video' | 'post';
  message: string;
  mentionRole: string;
  enabled: boolean;
}

const mockChannels = [
  { id: '1', name: 'стримы', type: 'text' },
  { id: '2', name: 'youtube', type: 'text' },
  { id: '3', name: 'уведомления', type: 'text' },
  { id: '4', name: 'общий', type: 'text' },
  { id: '5', name: 'контент', type: 'text' }
];

const mockRoles = [
  { id: '1', name: '@everyone', color: '#99aab5' },
  { id: '2', name: 'Стримеры', color: '#9146ff' },
  { id: '3', name: 'Уведомления', color: '#3b82f6' },
  { id: '4', name: 'VIP', color: '#f59e0b' },
  { id: '5', name: 'Участник', color: '#22c55e' }
];

const notificationTypes = [
  { id: 'stream', name: 'Стримы', description: 'Уведомления о начале стрима' },
  { id: 'video', name: 'Видео', description: 'Уведомления о новых видео' },
  { id: 'post', name: 'Посты', description: 'Уведомления о новых постах' }
];

const platformIcons = {
  twitch: Twitch,
  youtube: Youtube,
  trovo: Radio,
  kick: Play
};

export function SocialNotificationsWizard({ onNavigate, editingNotificationId }: SocialNotificationsWizardProps) {
  const { t } = useLanguage();
  const { addNotification, updateNotification, getNotification, platforms } = useSocialNotifications();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [wizardData, setWizardData] = useState<WizardData>({
    platform: 'twitch',
    username: '',
    displayName: '',
    channelId: '',
    notificationType: 'stream',
    message: '',
    mentionRole: 'none',
    enabled: true
  });

  useEffect(() => {
    // If editing, load the notification data
    if (editingNotificationId) {
      loadNotificationData(editingNotificationId);
    } else {
      // Set default message for new notification
      setWizardData(prev => ({
        ...prev,
        message: getDefaultMessage(prev.platform, prev.notificationType)
      }));
    }
  }, [editingNotificationId]);

  const loadNotificationData = async (notificationId: string) => {
    try {
      setLoading(true);
      
      const notification = getNotification(notificationId);
      if (notification) {
        setWizardData({
          platform: notification.platform,
          username: notification.username,
          displayName: notification.displayName,
          channelId: notification.channelId,
          notificationType: notification.notificationType,
          message: notification.message,
          mentionRole: notification.mentionRole || 'none',
          enabled: notification.enabled
        });
      } else {
        toast.error('Уведомление не найдено');
        onNavigate('social-notifications');
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомления:', error);
      toast.error('Не удалось загрузить данные уведомления');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultMessage = (platform: string, type: string): string => {
    const templates = {
      twitch: {
        stream: '🎮 **{displayName}** начал стрим!\n\n**{title}**\n{game}\n\n{url}'
      },
      youtube: {
        stream: '📺 **{displayName}** начал стрим на YouTube!\n\n**{title}**\n\n{url}',
        video: '📺 Новое видео от **{displayName}**!\n\n**{title}**\n\n{url}'
      },
      trovo: {
        stream: '⚡ **{displayName}** в эфире на Trovo!\n\n**{title}**\n\n{url}'
      },
      kick: {
        stream: '🚀 **{displayName}** начал стрим на Kick!\n\n**{title}**\n\n{url}'
      }
    };

    return templates[platform]?.[type] || '🔔 Новое уведомление от **{displayName}**!\n\n{url}';
  };

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!wizardData.platform;
      case 2:
        return !!wizardData.username && !!wizardData.channelId;
      case 3:
        return !!wizardData.message;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const saveNotification = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const channel = mockChannels.find(c => c.id === wizardData.channelId);
      
      if (editingNotificationId) {
        // Update existing notification
        updateNotification(editingNotificationId, {
          platform: wizardData.platform,
          username: wizardData.username,
          displayName: wizardData.displayName || wizardData.username,
          channelId: wizardData.channelId,
          channelName: channel?.name || 'Unknown',
          notificationType: wizardData.notificationType,
          message: wizardData.message,
          mentionRole: wizardData.mentionRole === 'none' ? undefined : wizardData.mentionRole,
          enabled: wizardData.enabled
        });
        toast.success('Уведомление успешно обновлено!');
      } else {
        // Create new notification
        const newNotification = {
          id: `notif_${Date.now()}`,
          platform: wizardData.platform,
          username: wizardData.username,
          displayName: wizardData.displayName || wizardData.username,
          channelId: wizardData.channelId,
          channelName: channel?.name || 'Unknown',
          notificationType: wizardData.notificationType,
          message: wizardData.message,
          mentionRole: wizardData.mentionRole === 'none' ? undefined : wizardData.mentionRole,
          enabled: wizardData.enabled,
          createdAt: new Date().toISOString(),
          notificationCount: 0
        };
        
        addNotification(newNotification);
        toast.success('Уведомление создано и настроено!');
      }
      
      // Navigate back to main page
      onNavigate('social-notifications');
    } catch (error) {
      toast.error('Не удалось сохранить уведомление');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setWizardData({
      platform: 'twitch',
      username: '',
      displayName: '',
      channelId: '',
      notificationType: 'stream',
      message: getDefaultMessage('twitch', 'stream'),
      mentionRole: 'none',
      enabled: true
    });
    setCurrentStep(1);
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, title: 'Платформа', icon: Rss },
      { num: 2, title: 'Настройки', icon: Settings },
      { num: 3, title: 'Сообщение', icon: MessageSquare },
      { num: 4, title: 'Подтверждение', icon: Check }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            const isAccessible = validateStep(step.num - 1) || step.num === 1;
            
            return (
              <React.Fragment key={step.num}>
                <button
                  onClick={() => isAccessible && goToStep(step.num)}
                  disabled={!isAccessible}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'bg-success text-white' 
                        : isAccessible
                          ? 'bg-muted hover:bg-muted/80 cursor-pointer'
                          : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                  <Badge variant={isActive ? "secondary" : "outline"} className="ml-1">
                    {step.num}
                  </Badge>
                </button>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rss className="h-5 w-5 text-primary" />
          Выберите платформу
        </CardTitle>
        <CardDescription>
          Выберите социальную платформу для отслеживания контента
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const IconComponent = platformIcons[platform.id];
            const isSelected = wizardData.platform === platform.id;
            
            return (
              <button
                key={platform.id}
                onClick={() => {
                  updateWizardData({ 
                    platform: platform.id as any,
                    notificationType: platform.supportedTypes[0] as any,
                    message: getDefaultMessage(platform.id, platform.supportedTypes[0])
                  });
                }}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <IconComponent 
                      className="h-6 w-6" 
                      style={{ color: platform.color }} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {platform.supportedTypes.map(type => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {notificationTypes.find(t => t.id === type)?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Поддерживаемые платформы</AlertTitle>
          <AlertDescription>
            Бот автоматически отслеживает активность на выбранной платформе и отправляет уведомления при появлении нового контента.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Основные настройки
        </CardTitle>
        <CardDescription>
          Укажите пользователя и канал для уведомлений
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Имя пользователя *</Label>
              <Input
                value={wizardData.username}
                onChange={(e) => updateWizardData({ username: e.target.value })}
                placeholder="username"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Имя пользователя на платформе (без @)
              </p>
            </div>

            <div>
              <Label>Отображаемое имя</Label>
              <Input
                value={wizardData.displayName}
                onChange={(e) => updateWizardData({ displayName: e.target.value })}
                placeholder="Отображаемое имя (опционально)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Оставьте пустым для автоматического определения
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Канал для уведомлений *</Label>
              <Select value={wizardData.channelId} onValueChange={(value) => updateWizardData({ channelId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите канал" />
                </SelectTrigger>
                <SelectContent>
                  {mockChannels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        {channel.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Тип уведомления</Label>
              <Select 
                value={wizardData.notificationType} 
                onValueChange={(value: any) => updateWizardData({ 
                  notificationType: value,
                  message: getDefaultMessage(wizardData.platform, value)
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes
                    .filter(type => platforms.find(p => p.id === wizardData.platform)?.supportedTypes.includes(type.id))
                    .map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div>
                          <div>{type.name}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <Label>Упоминание роли (опционально)</Label>
          <Select value={wizardData.mentionRole} onValueChange={(value) => updateWizardData({ mentionRole: value === 'none' ? '' : value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите роль для упоминания" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без упоминания</SelectItem>
              {mockRoles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: role.color }}
                    />
                    {role.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={wizardData.enabled}
            onCheckedChange={(checked) => updateWizardData({ enabled: checked })}
          />
          <Label>Включить уведомления сразу после создания</Label>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Настройка сообщения
        </CardTitle>
        <CardDescription>
          Создайте шаблон сообщения для уведомлений
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Шаблон сообщения</Label>
          <Textarea
            value={wizardData.message}
            onChange={(e) => updateWizardData({ message: e.target.value })}
            placeholder="Введите сообщение..."
            rows={8}
            className="font-mono"
          />
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Доступные переменные</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              <code className="bg-muted px-1 rounded">{'{{displayName}}'}</code> - Отображаемое имя
              <br />
              <code className="bg-muted px-1 rounded">{'{{username}}'}</code> - Имя пользователя
              <br />
              <code className="bg-muted px-1 rounded">{'{{title}}'}</code> - Название стрима/видео
              <br />
              <code className="bg-muted px-1 rounded">{'{{game}}'}</code> - Игра/категория (только для стримов)
              <br />
              <code className="bg-muted px-1 rounded">{'{{url}}'}</code> - Ссылка на контент
            </div>
          </AlertDescription>
        </Alert>

        <div>
          <Label>Предпросмотр сообщения</Label>
          <div className="p-4 bg-muted rounded-lg">
            <div className="whitespace-pre-wrap">
              {wizardData.message
                .replace(/{displayName}/g, wizardData.displayName || wizardData.username || 'Имя пользователя')
                .replace(/{username}/g, wizardData.username || 'username')
                .replace(/{title}/g, 'Название стрима/видео')
                .replace(/{game}/g, 'Игра/Категория')
                .replace(/{url}/g, 'https://platform.com/user/stream')
              }
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => updateWizardData({ message: getDefaultMessage(wizardData.platform, wizardData.notificationType) })}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Сбросить к шаблону
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => {
    const platform = platforms.find(p => p.id === wizardData.platform);
    const channel = mockChannels.find(c => c.id === wizardData.channelId);
    const role = wizardData.mentionRole !== 'none' ? mockRoles.find(r => r.id === wizardData.mentionRole) : null;
    const notificationType = notificationTypes.find(t => t.id === wizardData.notificationType);
    const IconComponent = platformIcons[wizardData.platform];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            Подтверждение настроек
          </CardTitle>
          <CardDescription>
            Проверьте все настройки перед сохранением
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Платформа</Label>
                <div className="flex items-center gap-2 mt-1">
                  <IconComponent className="h-5 w-5" style={{ color: platform?.color }} />
                  <span>{platform?.name}</span>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Пользователь</Label>
                <p className="mt-1">{wizardData.displayName || wizardData.username} (@{wizardData.username})</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Канал</Label>
                <p className="mt-1">#{channel?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Тип уведомления</Label>
                <p className="mt-1">{notificationType?.name}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Упоминание роли</Label>
                <p className="mt-1">{role && wizardData.mentionRole !== 'none' ? role.name : 'Без упоминания'}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Статус</Label>
                <Badge variant={wizardData.enabled ? "default" : "secondary"} className="mt-1">
                  {wizardData.enabled ? 'Включено' : 'Отключено'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Шаблон сообщения</Label>
            <div className="p-4 bg-muted rounded-lg mt-2">
              <pre className="whitespace-pre-wrap text-sm">{wizardData.message}</pre>
            </div>
          </div>

          <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>Готово к сохранению</AlertTitle>
            <AlertDescription>
              {editingNotificationId 
                ? 'Уведомление будет обновлено с новыми настройками.'
                : 'Новое уведомление будет создано и сразу начнет работать (если включено).'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">
            {editingNotificationId ? 'Загрузка данных уведомления...' : 'Инициализация мастера...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('social-notifications')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
              <div>
                <h1 className="flex items-center gap-2">
                  <Rss className="h-6 w-6 text-primary" />
                  {editingNotificationId ? 'Редактирование уведомления' : 'Создание уведомления'}
                </h1>
                <p className="text-muted-foreground">
                  {editingNotificationId ? 'Измените настройки существующего уведомления' : 'Настройте новое уведомление о социальных сетях'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={resetWizard}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Сброс
              </Button>
              <Button variant="ghost" onClick={() => onNavigate('dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                На главную
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        {renderStepIndicator()}

        <div className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>

          <div className="text-sm text-muted-foreground">
            Шаг {currentStep} из 4
          </div>

          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
            >
              Далее
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={saveNotification}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editingNotificationId ? 'Обновить' : 'Создать'} уведомление
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}