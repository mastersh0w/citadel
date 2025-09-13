import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Settings as SettingsIcon,
  Bell,
  Palette,
  Database,
  Shield,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Globe,
  Clock,
  Users,
  Crown,
  User,
  Plus,
  X,
  UserX,
  MessageCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { toast } from 'sonner';

interface AppSettings {
  language: 'ru' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoSave: boolean;
  refreshInterval: number;
  compactMode: boolean;
  showBadges: boolean;
  enableSounds: boolean;
  autoBackup: boolean;
  backupInterval: number;
  maxBackups: number;
  debugMode: boolean;
  analyticsEnabled: boolean;
  customPrefix: string;
  timezone: string;
  // Telegram integration settings
  telegramIntegration: {
    enabled: boolean;
    configured: boolean;
    userId: string;
    botTokenSet: boolean;
  };
  // Access control settings
  ownerOnlyFeatures: string[];
  dashboardAccess: {
    allowedRoles: string[];
    allowedUsers: string[];
    blockedUsers: string[];
  };
}

interface AccessEntry {
  id: string;
  type: 'role' | 'user';
  name: string;
  identifier: string;
  permissions: string[];
  addedAt: string;
  addedBy: string;
}

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [settings, setSettings] = useState<AppSettings>({
    language: 'ru',
    theme: theme as 'light' | 'dark' | 'system',
    notifications: true,
    autoSave: true,
    refreshInterval: 30,
    compactMode: false,
    showBadges: true,
    enableSounds: false,
    autoBackup: true,
    backupInterval: 24,
    maxBackups: 10,
    debugMode: false,
    analyticsEnabled: true,
    customPrefix: '!',
    timezone: 'Europe/Moscow',
    telegramIntegration: {
      enabled: false,
      configured: Math.random() > 0.5, // Random for demo
      userId: '',
      botTokenSet: Math.random() > 0.5 // Random for demo
    },
    ownerOnlyFeatures: [
      'anti_nuke_settings',
      'backup_management',
      'bot_settings',
      'server_settings',
      'role_system_advanced'
    ],
    dashboardAccess: {
      allowedRoles: [],
      allowedUsers: [],
      blockedUsers: []
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Access control state
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessType, setAccessType] = useState<'allow' | 'block'>('allow');
  const [newAccessEntry, setNewAccessEntry] = useState({
    type: 'role' as 'role' | 'user',
    name: '',
    identifier: '',
    permissions: [] as string[]
  });

  // Telegram settings state
  const [telegramUserId, setTelegramUserId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [savingTelegram, setSavingTelegram] = useState(false);

  const availableFeatures = [
    { id: 'dashboard', name: 'Панель управления', owner_only: false },
    { id: 'anti_nuke_settings', name: 'Анти-нюк настройки', owner_only: true },
    { id: 'backup_management', name: 'Управление резервными копиями', owner_only: true },
    { id: 'whitelist_management', name: 'Управление белым списком', owner_only: false },
    { id: 'quarantine_management', name: 'Управление карантином', owner_only: false },
    { id: 'moderation_settings', name: 'Настройки модерации', owner_only: false },
    { id: 'user_ranking', name: 'Система рейтингов', owner_only: false },
    { id: 'role_system_basic', name: 'Система ролей (базовая)', owner_only: false },
    { id: 'role_system_advanced', name: 'Система ролей (расширенная)', owner_only: true },
    { id: 'banner_management', name: 'Управление баннером', owner_only: false },
    { id: 'audit_logs', name: 'Журнал аудита', owner_only: false },
    { id: 'notifications', name: 'Уведомления', owner_only: false },
    { id: 'bot_settings', name: 'Настройки бота', owner_only: true },
    { id: 'server_settings', name: 'Настройки сервера', owner_only: true }
  ];

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Apply theme immediately
    if (key === 'theme') {
      setTheme(value);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('citadel-warden-settings', JSON.stringify(settings));
      setHasChanges(false);
      toast.success('Настройки сохранены успешно');
    } catch (error) {
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      language: 'ru',
      theme: 'dark',
      notifications: true,
      autoSave: true,
      refreshInterval: 30,
      compactMode: false,
      showBadges: true,
      enableSounds: false,
      autoBackup: true,
      backupInterval: 24,
      maxBackups: 10,
      debugMode: false,
      analyticsEnabled: true,
      customPrefix: '!',
      timezone: 'Europe/Moscow',
      telegramIntegration: {
        enabled: false,
        configured: false,
        userId: '',
        botTokenSet: false
      },
      ownerOnlyFeatures: [
        'anti_nuke_settings',
        'backup_management',
        'bot_settings',
        'server_settings',
        'role_system_advanced'
      ],
      dashboardAccess: {
        allowedRoles: [],
        allowedUsers: [],
        blockedUsers: []
      }
    });
    setHasChanges(true);
    setTheme('dark');
    toast.success('Настройки сброшены');
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'citadel-warden-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Настройки экспортированы');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        setHasChanges(true);
        toast.success('Настройки импортированы');
      } catch (error) {
        toast.error('Ошибка при импорте настроек');
      }
    };
    reader.readAsText(file);
  };

  const addAccessEntry = (type: 'allow' | 'block') => {
    if (!newAccessEntry.name.trim() || !newAccessEntry.identifier.trim()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const targetArray = type === 'allow' 
      ? (newAccessEntry.type === 'role' ? settings.dashboardAccess.allowedRoles : settings.dashboardAccess.allowedUsers)
      : settings.dashboardAccess.blockedUsers;

    if (targetArray.includes(newAccessEntry.identifier)) {
      toast.error('Запись с таким ID уже существует');
      return;
    }

    if (type === 'allow') {
      if (newAccessEntry.type === 'role') {
        updateSetting('dashboardAccess', {
          ...settings.dashboardAccess,
          allowedRoles: [...settings.dashboardAccess.allowedRoles, newAccessEntry.identifier]
        });
      } else {
        updateSetting('dashboardAccess', {
          ...settings.dashboardAccess,
          allowedUsers: [...settings.dashboardAccess.allowedUsers, newAccessEntry.identifier]
        });
      }
    } else {
      updateSetting('dashboardAccess', {
        ...settings.dashboardAccess,
        blockedUsers: [...settings.dashboardAccess.blockedUsers, newAccessEntry.identifier]
      });
    }

    setNewAccessEntry({ type: 'role', name: '', identifier: '', permissions: [] });
    setShowAccessDialog(false);
    toast.success(`Запись добавлена в ${type === 'allow' ? 'разрешенные' : 'заблокированные'}`);
  };

  const removeAccessEntry = (type: 'role' | 'user' | 'blocked', identifier: string) => {
    if (type === 'role') {
      updateSetting('dashboardAccess', {
        ...settings.dashboardAccess,
        allowedRoles: settings.dashboardAccess.allowedRoles.filter(id => id !== identifier)
      });
    } else if (type === 'user') {
      updateSetting('dashboardAccess', {
        ...settings.dashboardAccess,
        allowedUsers: settings.dashboardAccess.allowedUsers.filter(id => id !== identifier)
      });
    } else {
      updateSetting('dashboardAccess', {
        ...settings.dashboardAccess,
        blockedUsers: settings.dashboardAccess.blockedUsers.filter(id => id !== identifier)
      });
    }
    toast.success('Запись удалена');
  };

  const saveTelegramSettings = async () => {
    if (!telegramUserId.trim()) {
      toast.error('Введите Telegram User ID');
      return;
    }

    if (!telegramBotToken.trim() && !settings.telegramIntegration.botTokenSet) {
      toast.error('Введите токен Telegram бота');
      return;
    }

    setSavingTelegram(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateSetting('telegramIntegration', {
        ...settings.telegramIntegration,
        configured: true,
        userId: telegramUserId,
        botTokenSet: true
      });
      
      setTelegramUserId('');
      setTelegramBotToken('');
      toast.success('Интеграция с Telegram настроена успешно');
    } catch (error) {
      toast.error('Ошибка при настройке интеграции с Telegram');
    } finally {
      setSavingTelegram(false);
    }
  };

  const testTelegramConnection = async () => {
    try {
      setSavingTelegram(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Тестовое сообщение отправлено в Telegram!');
    } catch (error) {
      toast.error('Ошибка при отправке тестового сообщения');
    } finally {
      setSavingTelegram(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Настройки
          </h1>
          <p className="text-muted-foreground">
            Конфигурация дашборда и поведения бота
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Есть несохраненные изменения
            </Badge>
          )}
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            У вас есть несохраненные изменения. Не забудьте сохранить настройки.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Основные настройки
            </CardTitle>
            <CardDescription>
              Общие параметры дашборда
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language">Язык интерфейса</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value: 'ru' | 'en') => updateSetting('language', value)}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Тема оформления</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Светлая</SelectItem>
                  <SelectItem value="dark">Темная</SelectItem>
                  <SelectItem value="system">Системная</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Часовой пояс</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(value) => updateSetting('timezone', value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
                  <SelectItem value="Europe/London">Лондон (UTC+0)</SelectItem>
                  <SelectItem value="America/New_York">Нью-Йорк (UTC-5)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Токио (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Интервал обновления данных (сек)</Label>
              <Input
                id="refresh-interval"
                type="number"
                min="10"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value) || 30)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-prefix">Префикс команд бота</Label>
              <Input
                id="custom-prefix"
                type="text"
                maxLength="3"
                value={settings.customPrefix}
                onChange={(e) => updateSetting('customPrefix', e.target.value)}
                placeholder="!"
              />
            </div>
          </CardContent>
        </Card>

        {/* UI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Интерфейс
            </CardTitle>
            <CardDescription>
              Настройка внешнего вида и поведения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Уведомления</Label>
                    <Switch
                      checked={settings.notifications}
                      onCheckedChange={(checked) => updateSetting('notifications', checked)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pl-0">
                    Показывать всплывающие уведомления
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <Label>Уведомления</Label>
                    <div className="text-sm text-muted-foreground">
                      Показывать всплывающие уведомления
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', checked)}
                  />
                </>
              )}
            </div>

            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Автосохранение</Label>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pl-0">
                    Автоматически сохранять изменения
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <Label>Автосохранение</Label>
                    <div className="text-sm text-muted-foreground">
                      Автоматически сохранять изменения
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                  />
                </>
              )}
            </div>

            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Компактный режим</Label>
                    <Switch
                      checked={settings.compactMode}
                      onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pl-0">
                    Уменьшенные отступы и размеры
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <Label>Компактный режим</Label>
                    <div className="text-sm text-muted-foreground">
                      Уменьшенные отступы и размеры
                    </div>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                  />
                </>
              )}
            </div>

            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Показывать значки</Label>
                    <Switch
                      checked={settings.showBadges}
                      onCheckedChange={(checked) => updateSetting('showBadges', checked)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pl-0">
                    Отображать уведомления в интерфейсе
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <Label>Показывать значки</Label>
                    <div className="text-sm text-muted-foreground">
                      Отображать уведомления в интерфейсе
                    </div>
                  </div>
                  <Switch
                    checked={settings.showBadges}
                    onCheckedChange={(checked) => updateSetting('showBadges', checked)}
                  />
                </>
              )}
            </div>

            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Звуковые уведомления</Label>
                    <Switch
                      checked={settings.enableSounds}
                      onCheckedChange={(checked) => updateSetting('enableSounds', checked)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pl-0">
                    Воспроизводить звуки для событий
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <Label>Звуковые уведомления</Label>
                    <div className="text-sm text-muted-foreground">
                      Воспроизводить звуки для событий
                    </div>
                  </div>
                  <Switch
                    checked={settings.enableSounds}
                    onCheckedChange={(checked) => updateSetting('enableSounds', checked)}
                  />
                </>
              )}
            </div>

            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Аналитика</Label>
                    <Switch
                      checked={settings.analyticsEnabled}
                      onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pl-0">
                    Собирать данные для улучшения сервиса
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <Label>Аналитика</Label>
                    <div className="text-sm text-muted-foreground">
                      Собирать данные для улучшения сервиса
                    </div>
                  </div>
                  <Switch
                    checked={settings.analyticsEnabled}
                    onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Резервное копирование
            </CardTitle>
            <CardDescription>
              Настройки автоматического создания бэкапов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Автоматические бэкапы</Label>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pl-0">
                    Создавать резервные копии по расписанию
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <Label>Автоматические бэкапы</Label>
                    <div className="text-sm text-muted-foreground">
                      Создавать резервные копии по расписанию
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
                  />
                </>
              )}
            </div>

            {settings.autoBackup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="backup-interval">Интервал создания (часы)</Label>
                  <Input
                    id="backup-interval"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.backupInterval}
                    onChange={(e) => updateSetting('backupInterval', parseInt(e.target.value) || 24)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-backups">Максимум копий</Label>
                  <Input
                    id="max-backups"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxBackups}
                    onChange={(e) => updateSetting('maxBackups', parseInt(e.target.value) || 10)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Расширенные настройки
            </CardTitle>
            <CardDescription>
              Дополнительные параметры для опытных пользователей
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Режим отладки</Label>
                    <Switch
                      checked={settings.debugMode}
                      onCheckedChange={(checked) => updateSetting('debugMode', checked)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pl-0">
                    Показывать дополнительную информацию
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <Label>Режим отладки</Label>
                    <div className="text-sm text-muted-foreground">
                      Показывать дополнительную информацию
                    </div>
                  </div>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => updateSetting('debugMode', checked)}
                  />
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Импорт/Экспорт настроек</h4>
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={exportSettings} className="gap-2">
                  <Download className="h-4 w-4" />
                  Экспорт
                </Button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="gap-2 w-full pointer-events-none">
                    <Upload className="h-4 w-4" />
                    Импорт
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-destructive">Сброс настроек</h4>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Сброс вернет все настро��ки к значениям по умолчанию. Это действие нельзя отменить.
                </AlertDescription>
              </Alert>
              
              <Button variant="destructive" onClick={resetSettings} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Сбросить все настройки
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Integration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Интеграция с Telegram
            </CardTitle>
            <CardDescription>
              Дублирование уведомлений Discord в Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Alert */}
            {!settings.telegramIntegration.configured ? (
              <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-800 dark:text-orange-200">
                    Интеграция с Telegram не настроена
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Настройте интеграцию для получения уведомлений в Telegram. 
                    Все оповещения, отправляемые владельцу в личные сообщения Discord, 
                    будут дублироваться в Telegram.
                  </div>
                </div>
              </Alert>
            ) : (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-green-800 dark:text-green-200">
                    Интеграция с Telegram настроена
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    <div className="space-y-1">
                      <div>
                        <strong>User ID:</strong> <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded text-xs">{settings.telegramIntegration.userId || 'Настроен'}</code>
                      </div>
                      <div>
                        <strong>Bot Token:</strong> <span className="text-green-600 text-xs">Сохранен, зашифрован</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            )}

            {/* Configuration Form */}
            {!settings.telegramIntegration.configured && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Настройка интеграции</h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="telegram-user-id">
                      Telegram User ID
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="telegram-user-id"
                      type="text"
                      placeholder="123456789"
                      value={telegramUserId}
                      onChange={(e) => setTelegramUserId(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Ваш личный ID в Telegram. Получить можно у @userinfobot
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram-bot-token">
                      Bot Token
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="telegram-bot-token"
                      type="password"
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Токен бота от @BotFather. Будет зашифрован и сохранен безопасно
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={saveTelegramSettings}
                    disabled={savingTelegram || !telegramUserId.trim() || (!telegramBotToken.trim() && !settings.telegramIntegration.botTokenSet)}
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    {savingTelegram ? 'Настройка...' : 'Настроить интеграцию'}
                  </Button>
                </div>
              </div>
            )}

            {/* Update Configuration */}
            {settings.telegramIntegration.configured && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Обновить настройки</h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="telegram-user-id-update">Telegram User ID</Label>
                    <Input
                      id="telegram-user-id-update"
                      type="text"
                      placeholder={settings.telegramIntegration.userId || "123456789"}
                      value={telegramUserId}
                      onChange={(e) => setTelegramUserId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram-bot-token-update">
                      Bot Token 
                      <span className="text-sm text-muted-foreground ml-2">
                        {settings.telegramIntegration.botTokenSet ? 'Сохранен, зашифрован' : 'Не установлен'}
                      </span>
                    </Label>
                    <Input
                      id="telegram-bot-token-update"
                      type="password"
                      placeholder="Новый токен (оставьте пустым, чтобы не менять)"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={saveTelegramSettings}
                    disabled={savingTelegram || !telegramUserId.trim()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingTelegram ? 'Обновление...' : 'Обновить настройки'}
                  </Button>
                  
                  <Button 
                    onClick={testTelegramConnection}
                    disabled={savingTelegram || !settings.telegramIntegration.configured}
                    variant="outline"
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Тест связи
                  </Button>
                </div>
              </div>
            )}

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Уведомления в Telegram</Label>
                <div className="text-sm text-muted-foreground">
                  {settings.telegramIntegration.configured 
                    ? 'Включить/выключить дублирование уведомлений в Telegram'
                    : 'Сначала настройте интеграцию'
                  }
                </div>
              </div>
              <Switch
                checked={settings.telegramIntegration.enabled}
                onCheckedChange={(checked) => updateSetting('telegramIntegration', {
                  ...settings.telegramIntegration,
                  enabled: checked
                })}
                disabled={!settings.telegramIntegration.configured}
              />
            </div>

            {/* Information */}
            <Alert>
              <Bell className="h-4 w-4" />
              <div>
                <div className="font-medium">Какие уведомления дублируются?</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Срабатывания системы анти-нюк</li>
                    <li>Критические события безопасности</li>
                    <li>Ошибки и предупреждения бота</li>
                    <li>Завершение операций резервного копирования</li>
                    <li>Другие важные системные уведомления</li>
                  </ul>
                </div>
              </div>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}