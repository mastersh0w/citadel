import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gavel,
  Shield,
  AlertTriangle,
  Ban,
  UserX,
  Clock,
  Settings,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  Link,
  Hash,
  Zap,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  List,
  Skull
} from 'lucide-react';
import { ModerationSettings } from '@/types';
import { api } from '@/utils/api';
import { toast } from 'sonner';

interface ModerationSettingsProps {
  onNavigate?: (page: any) => void;
}

export function ModerationSettings({ onNavigate }: ModerationSettingsProps) {
  const [settings, setSettings] = useState<ModerationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newBadWord, setNewBadWord] = useState('');
  const [activeTab, setActiveTab] = useState<string>('automod');
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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.moderation.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек модерации:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (updates: Partial<ModerationSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
    setHasChanges(true);
  };

  const updateAutomod = (updates: Partial<ModerationSettings['automod']>) => {
    if (!settings) return;
    updateSettings({
      automod: { ...settings.automod, ...updates }
    });
  };

  const updatePunishments = (updates: Partial<ModerationSettings['punishments']>) => {
    if (!settings) return;
    updateSettings({
      punishments: { ...settings.punishments, ...updates }
    });
  };

  const updateWarnings = (updates: Partial<ModerationSettings['punishments']['warnings']>) => {
    if (!settings) return;
    updateSettings({
      punishments: {
        ...settings.punishments,
        warnings: { ...settings.punishments.warnings, ...updates }
      }
    });
  };

  const updateFilters = (updates: Partial<ModerationSettings['filters']>) => {
    if (!settings) return;
    updateSettings({
      filters: { ...settings.filters, ...updates }
    });
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const response = await api.moderation.updateSettings(settings);
      if (response.success) {
        setHasChanges(false);
        toast.success('Настройки модерации сохранены');
      }
    } catch (error) {
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const addBadWord = async () => {
    if (!newBadWord.trim() || !settings) return;
    
    try {
      const response = await api.moderation.addBadWord(newBadWord.trim());
      if (response.success && response.data) {
        updateAutomod({ badWords: response.data });
        setNewBadWord('');
        toast.success('Слово добавлено в фильтр');
      }
    } catch (error) {
      toast.error('Ошибка при добавлении слова');
    }
  };

  const removeBadWord = async (word: string) => {
    if (!settings) return;
    
    try {
      const response = await api.moderation.removeBadWord(word);
      if (response.success && response.data) {
        updateAutomod({ badWords: response.data });
        toast.success('Слово удалено из фильтра');
      }
    } catch (error) {
      toast.error('Ошибка при удалении слова');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Gavel className="h-8 w-8 animate-pulse" />
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

  if (!settings) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Не удалось загрузить настройки модерации</p>
              <Button onClick={loadSettings} className="mt-4">
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gavel className="h-8 w-8" />
            Настройки модерации
          </h1>
          <p className="text-muted-foreground">
            Автоматическая модерация и фильтрация контента
          </p>
        </div>
        
        {/* Desktop layout */}
        <div className="hidden md:flex items-center gap-2">
          <Badge variant={settings.automod.enabled ? "default" : "secondary"} className="gap-1">
            {settings.automod.enabled ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Активно
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Отключено
              </>
            )}
          </Badge>
          {hasChanges && (
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Не сохранено
            </Badge>
          )}
          {onNavigate && (
            <Button 
              variant="outline" 
              onClick={() => onNavigate('warnings-manager')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              Журнал варнов
            </Button>
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

        {/* Mobile layout */}
        <div className="md:hidden space-y-3">
          {/* Mobile Dropdown moved to top */}
          <div>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automod">Автомодерация</SelectItem>
                <SelectItem value="punishments">Наказания</SelectItem>
                <SelectItem value="badwords">Стоп-слова</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={settings.automod.enabled ? "default" : "secondary"} className="gap-1">
              {settings.automod.enabled ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Активно
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Отключено
                </>
              )}
            </Badge>
            {hasChanges && (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Не сохранено
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {onNavigate && (
              <Button 
                variant="outline" 
                onClick={() => onNavigate('warnings-manager')}
                className="gap-2 w-full"
              >
                <List className="h-4 w-4" />
                Журнал варнов
              </Button>
            )}
            <Button 
              onClick={saveSettings} 
              disabled={!hasChanges || saving}
              className="gap-2 w-full"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>

      {!settings.automod.enabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Автоматическая модерация отключена. Включите её для защиты сервера от нежелательного контента.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-3">
          <TabsTrigger value="automod">Автомодерация</TabsTrigger>
          <TabsTrigger value="punishments">Наказания</TabsTrigger>
          <TabsTrigger value="badwords">Стоп-слова</TabsTrigger>
        </TabsList>

        <TabsContent value="automod" className="space-y-6">
          {/* Main Automod Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Основные настройки
              </CardTitle>
              <CardDescription>
                Базовая конфигурация системы автоматической модерации и фильтрации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                {isMobile ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Включить автомодерацию</Label>
                      <Switch
                        checked={settings.automod.enabled}
                        onCheckedChange={(checked) => updateAutomod({ enabled: checked })}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground pl-0">
                      Основной переключатель системы модерации
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <Label className="text-base">Включить автомодерацию</Label>
                      <div className="text-sm text-muted-foreground">
                        Основной переключатель системы модерации
                      </div>
                    </div>
                    <Switch
                      checked={settings.automod.enabled}
                      onCheckedChange={(checked) => updateAutomod({ enabled: checked })}
                    />
                  </>
                )}
              </div>

              <Separator />

              <div className={isMobile ? "space-y-6" : "grid gap-6 md:grid-cols-2"}>
                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Защита о�� спама
                        </Label>
                        <Switch
                          checked={settings.automod.spamProtection}
                          onCheckedChange={(checked) => updateAutomod({ spamProtection: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Обнаружение и блокировка спам-сообщений
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Защита от спама
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          Обнаружение и блокировка спам-сообщений
                        </div>
                      </div>
                      <Switch
                        checked={settings.automod.spamProtection}
                        onCheckedChange={(checked) => updateAutomod({ spamProtection: checked })}
                      />
                    </>
                  )}
                </div>

                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          Защита от ссылок
                        </Label>
                        <Switch
                          checked={settings.automod.linkProtection}
                          onCheckedChange={(checked) => updateAutomod({ linkProtection: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Блокировка подозрительных ссылок
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          Защита от ссылок
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          Блокировка подозрительных ссылок
                        </div>
                      </div>
                      <Switch
                        checked={settings.automod.linkProtection}
                        onCheckedChange={(checked) => updateAutomod({ linkProtection: checked })}
                      />
                    </>
                  )}
                </div>

                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Защита от капса
                        </Label>
                        <Switch
                          checked={settings.automod.capsProtection}
                          onCheckedChange={(checked) => updateAutomod({ capsProtection: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Ограничение сообщений заглавными буквами
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Защита от капса
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          Ограничение сообщений заглавными буквами
                        </div>
                      </div>
                      <Switch
                        checked={settings.automod.capsProtection}
                        onCheckedChange={(checked) => updateAutomod({ capsProtection: checked })}
                      />
                    </>
                  )}
                </div>

                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Защита от упоминаний
                        </Label>
                        <Switch
                          checked={settings.automod.mentionSpamProtection}
                          onCheckedChange={(checked) => updateAutomod({ mentionSpamProtection: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Ограничение массовых упоминаний
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Защита от упоминаний
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          Ограничение массовых упоминаний
                        </div>
                      </div>
                      <Switch
                        checked={settings.automod.mentionSpamProtection}
                        onCheckedChange={(checked) => updateAutomod({ mentionSpamProtection: checked })}
                      />
                    </>
                  )}
                </div>

                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Защита от флуда</Label>
                        <Switch
                          checked={settings.automod.duplicateMessageProtection}
                          onCheckedChange={(checked) => updateAutomod({ duplicateMessageProtection: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Обнаружение флуда и повторяющихся сообщений
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label>Защита от флуда</Label>
                        <div className="text-sm text-muted-foreground">
                          Обнаружение флуда и повторяющихся сообщений
                        </div>
                      </div>
                      <Switch
                        checked={settings.automod.duplicateMessageProtection}
                        onCheckedChange={(checked) => updateAutomod({ duplicateMessageProtection: checked })}
                      />
                    </>
                  )}
                </div>

                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Skull className="h-4 w-4" />
                          Защита от Zalgo
                        </Label>
                        <Switch
                          checked={settings.automod.zalgoProtection}
                          onCheckedChange={(checked) => updateAutomod({ zalgoProtection: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Блокировка сообщений с символами Zalgo
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Skull className="h-4 w-4" />
                          Защита от Zalgo
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          Блокировка сообщений с символами Zalgo
                        </div>
                      </div>
                      <Switch
                        checked={settings.automod.zalgoProtection}
                        onCheckedChange={(checked) => updateAutomod({ zalgoProtection: checked })}
                      />
                    </>
                  )}
                </div>

                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Нецензурная лексика
                        </Label>
                        <Switch
                          checked={settings.filters.profanity}
                          onCheckedChange={(checked) => updateFilters({ profanity: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Фильтрация матов и оскорблений
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Нецензурная лекс��ка
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          Фильтрация матов и оскорблений
                        </div>
                      </div>
                      <Switch
                        checked={settings.filters.profanity}
                        onCheckedChange={(checked) => updateFilters({ profanity: checked })}
                      />
                    </>
                  )}
                </div>

                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Приглашения Discord</Label>
                        <Switch
                          checked={settings.filters.invites}
                          onCheckedChange={(checked) => updateFilters({ invites: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Блокировка инвайтов на другие серверы
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label>Приглашения Discord</Label>
                        <div className="text-sm text-muted-foreground">
                          Блокировка инвайтов на другие серверы
                        </div>
                      </div>
                      <Switch
                        checked={settings.filters.invites}
                        onCheckedChange={(checked) => updateFilters({ invites: checked })}
                      />
                    </>
                  )}
                </div>

                <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                  {isMobile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Избыток эмодзи</Label>
                        <Switch
                          checked={settings.filters.emojis}
                          onCheckedChange={(checked) => updateFilters({ emojis: checked })}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pl-0">
                        Ограничение избыточного использования эмодзи
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Label>Избыток эмодзи</Label>
                        <div className="text-sm text-muted-foreground">
                          Ограничение избыточного использования эмодзи
                        </div>
                      </div>
                      <Switch
                        checked={settings.filters.emojis}
                        onCheckedChange={(checked) => updateFilters({ emojis: checked })}
                      />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Save Button */}
          {isMobile && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={saveSettings} 
                disabled={!hasChanges || saving}
                className="gap-2 w-full max-w-xs"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="punishments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Система наказаний
              </CardTitle>
              <CardDescription>
                Настройка автоматических наказаний за нарушения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                {isMobile ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Автоматические наказания</Label>
                      <Switch
                        checked={settings.punishments.enabled}
                        onCheckedChange={(checked) => updatePunishments({ enabled: checked })}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground pl-0">
                      Включить автоматические баны и мьюты
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <Label>Автоматические наказания</Label>
                      <div className="text-sm text-muted-foreground">
                        Включить автоматические баны и мьюты
                      </div>
                    </div>
                    <Switch
                      checked={settings.punishments.enabled}
                      onCheckedChange={(checked) => updatePunishments({ enabled: checked })}
                    />
                  </>
                )}
              </div>

              {settings.punishments.enabled && (
                <>
                  <Separator />
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ban-threshold">Порог для бана (нарушения)</Label>
                      <Input
                        id="ban-threshold"
                        type="number"
                        min="1"
                        max="50"
                        value={settings.punishments.banThreshold}
                        onChange={(e) => updatePunishments({ banThreshold: parseInt(e.target.value) || 5 })}
                      />
                      <div className="text-xs text-muted-foreground">
                        Количество нарушений для автоматического бана
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mute-threshold">Порог для мьюта (нарушения)</Label>
                      <Input
                        id="mute-threshold"
                        type="number"
                        min="1"
                        max="20"
                        value={settings.punishments.muteThreshold}
                        onChange={(e) => updatePunishments({ muteThreshold: parseInt(e.target.value) || 3 })}
                      />
                      <div className="text-xs text-muted-foreground">
                        Количество нарушений для автоматического мьюта
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mute-duration">Длительность мьюта (минуты)</Label>
                      <Input
                        id="mute-duration"
                        type="number"
                        min="1"
                        max="10080"
                        value={settings.punishments.muteDuration}
                        onChange={(e) => updatePunishments({ muteDuration: parseInt(e.target.value) || 60 })}
                      />
                      <div className="text-xs text-muted-foreground">
                        Продолжительность автоматического мьюта
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warn-threshold">Порог для варна (нарушения)</Label>
                      <Input
                        id="warn-threshold"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.punishments.warnings.threshold}
                        onChange={(e) => updateWarnings({ threshold: parseInt(e.target.value) || 1 })}
                      />
                      <div className="text-xs text-muted-foreground">
                        Количество нарушений для выдачи предупреждения
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badwords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Стоп-слова
              </CardTitle>
              <CardDescription>
                Управление списком запрещенных слов и фраз
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Добавить стоп-слово..."
                  value={newBadWord}
                  onChange={(e) => setNewBadWord(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBadWord()}
                />
                <Button onClick={addBadWord} disabled={!newBadWord.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {settings.automod.badWords && settings.automod.badWords.length > 0 && (
                <div className="space-y-2">
                  <Label>Текущие стоп-слова</Label>
                  <div className="flex flex-wrap gap-2">
                    {settings.automod.badWords.map((word) => (
                      <Badge key={word} variant="secondary" className="gap-1">
                        {word}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeBadWord(word)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(!settings.automod.badWords || settings.automod.badWords.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Стоп-слова не добавлены</p>
                  <p className="text-sm">Добавьте слова, которые будут автоматически удаляться</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}