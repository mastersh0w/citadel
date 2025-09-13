import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Shield,
  AlertTriangle,
  Settings,
  Save,
  RotateCcw,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Users,
  Hash,
  Zap,
  Target,
  Activity,
  TrendingDown,
  Gauge,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../LanguageProvider';

interface ThreatSettings {
  enabled: boolean;
  threatThreshold: number;
  threatDecay: number;
  actionScores: {
    channelDelete: number;
    channelCreate: number;
    roleCreate: number;
    memberBan: number;
    memberKick: number;
    webhookCreate: number;
  };
}

interface ThreatExample {
  title: string;
  description: string;
  actions: Array<{
    action: string;
    count: number;
    score: number;
  }>;
}

const defaultSettings: ThreatSettings = {
  enabled: false,
  threatThreshold: 50,
  threatDecay: 1.0,
  actionScores: {
    channelDelete: 10,
    channelCreate: 5,
    roleCreate: 5,
    memberBan: 8,
    memberKick: 8,
    webhookCreate: 5
  }
};

export function AntiNukeSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<ThreatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [quarantineRoleConfigured, setQuarantineRoleConfigured] = useState(false);
  const [exampleVariant, setExampleVariant] = useState(0);
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
      // Simulate loading from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings(defaultSettings);
      // Simulate checking quarantine role (random for demo)
      setQuarantineRoleConfigured(Math.random() > 0.3); // 70% chance configured
    } catch (error) {
      console.error('Ошибка загрузки настроек анти-нюк:', error);
      setSettings(defaultSettings);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (updates: Partial<ThreatSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
    setHasChanges(true);
  };

  const updateActionScore = (action: keyof ThreatSettings['actionScores'], score: number) => {
    if (!settings) return;
    updateSettings({
      actionScores: {
        ...settings.actionScores,
        [action]: score
      }
    });
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({ ...defaultSettings });
    setHasChanges(true);
    toast.success('Настройки сброшены к значениям по умолчанию');
  };

  const getThreatExamples = (): ThreatExample[] => {
    if (!settings) return [];
    
    return [
      {
        title: "🚨 Типичная атака на каналы",
        description: "Злоумышленник пытается уничтожить структуру сервера",
        actions: [
          { action: "Удалил каналы", count: 3, score: settings.actionScores.channelDelete },
          { action: "Создал спам-каналы", count: 2, score: settings.actionScores.channelCreate }
        ]
      },
      {
        title: "⚡ Быстрая зачистка участников",
        description: "Массовые баны для очистки сервера от пользователей",
        actions: [
          { action: "Забанил участников", count: 5, score: settings.actionScores.memberBan },
          { action: "Кикнул участников", count: 2, score: settings.actionScores.memberKick }
        ]
      },
      {
        title: "🎭 Хитрая подготовка к атаке",
        description: "Создание инфраструктуры для дальнейших деструктивных действий",
        actions: [
          { action: "Создал роли", count: 4, score: settings.actionScores.roleCreate },
          { action: "Создал вебхуки", count: 3, score: settings.actionScores.webhookCreate },
          { action: "Удалил канал", count: 1, score: settings.actionScores.channelDelete }
        ]
      },
      {
        title: "🔥 Полномасштабная атака",
        description: "Комбинированная атака по всем направлениям",
        actions: [
          { action: "Удалил каналы", count: 2, score: settings.actionScores.channelDelete },
          { action: "Забанил участников", count: 3, score: settings.actionScores.memberBan },
          { action: "Создал роли", count: 2, score: settings.actionScores.roleCreate },
          { action: "Создал вебхуки", count: 1, score: settings.actionScores.webhookCreate }
        ]
      }
    ];
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 animate-pulse" />
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
              <p className="text-muted-foreground">Не удалось загрузить настройки анти-нюк</p>
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
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 md:h-8 md:w-8" />
            Анти-Нюк защита
          </h1>
          <p className="text-muted-foreground">
            Автоматическая защита от массовых деструктивных действий
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Badge variant={settings.enabled ? "default" : "secondary"} className="gap-1 justify-center">
            {settings.enabled ? (
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
            <Badge variant="secondary" className="gap-1 justify-center">
              <AlertTriangle className="h-3 w-3" />
              Несохранено
            </Badge>
          )}
        </div>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Принцип работы системы "Анти-нюк"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            "Анти-нюк" — это ваша вторая линия обороны, работающая как интеллектуальная система безопасности. 
            Она не вмешивается в каждое действие, а анализирует поведение модераторов и админист��аторов в реальном времени, 
            выявляя аномалии, характерные для спланированной атаки (краш-рейда) или взлома аккаунта.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <h4 className="font-medium">1. Начисление Очков</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Каждое потенциально деструктивное действие добавляет пользователю "очки угрозы"
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-primary" />
                <h4 className="font-medium">2. Порог Срабатывания</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                При превышении порога угрозы система считает действия пользователя атакой
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-primary" />
                <h4 className="font-medium">3. Спад Угрозы</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Очки угрозы постепенно "сгорают" с течением времени для легитимных действий
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <h4 className="font-medium">4. Автоматический Карантин</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                При превышении порога пользователь мгновенно помещается в карантин
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarantine Role Check */}
      {!quarantineRoleConfigured && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Требуется настройка карантинной роли</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-3">
              <p>
                Для работы системы анти-нюк необходимо настроить карантинную роль. 
                Эта роль будет автоматически назначаться пользователям при превышении порога угрозы.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-warning/20 border-warning text-warning hover:bg-warning/30"
                onClick={() => {
                  // Navigate to quarantine page - this would be implemented with proper navigation
                  toast.info('Переход на страницу настроек карантина...');
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Настроить карантинную роль
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!settings.enabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Система анти-нюк защиты отключена. Включите её для защиты сервера от атак.
          </AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Общие параметры
          </CardTitle>
          <CardDescription>
            Основные настройки системы анти-нюк защиты
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className={isMobile ? "space-y-3" : "flex items-center justify-between gap-4"}>
            {isMobile ? (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-base">Защита Анти-нюк активна</Label>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                  />
                </div>
                <div className="text-sm text-muted-foreground pl-0">
                  Полностью включает или отключает систему начисления очков и автоматического карантина. Отключение не рекомендуется.
                </div>
              </>
            ) : (
              <>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label className="text-base">Защита Анти-нюк активна</Label>
                  <div className="text-sm text-muted-foreground">
                    Полностью включает или отключает систему начисления очков и автоматического карантина. Отключение не рекомендуется.
                  </div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                  className="flex-shrink-0"
                />
              </>
            )}
          </div>

          <Separator />

          {/* Threat Threshold */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Порог срабатывания
              </Label>
              <div className="text-sm text-muted-foreground">
                Максимальное количество очков угрозы, которое может набрать пользователь. При превышении этого значения он будет помещен в карантин.
              </div>
            </div>
            <div className="space-y-3">
              <Slider
                value={[settings.threatThreshold]}
                onValueChange={([value]) => updateSettings({ threatThreshold: value })}
                max={100}
                min={25}
                step={5}
                className="flex-1"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>25</span>
                <Input
                  type="number"
                  min="25"
                  max="100"
                  value={settings.threatThreshold}
                  onChange={(e) => updateSettings({ threatThreshold: Math.max(25, Math.min(100, parseInt(e.target.value) || 50)) })}
                  className="w-20 h-8 text-center"
                />
                <span>100</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Threat Decay */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Спад угрозы (очков в секунду)
              </Label>
              <div className="text-sm text-muted-foreground">
                Сколько очков угрозы автоматически снимается с пользователя каждую секунду. Более высокое значение делает систему менее чувствительной к медленным, растянутым по времени действиям.
              </div>
            </div>
            <div className="space-y-3">
              <Slider
                value={[settings.threatDecay]}
                onValueChange={([value]) => updateSettings({ threatDecay: Math.round(value * 10) / 10 })}
                max={5}
                min={0.2}
                step={0.1}
                className="flex-1"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>0.2</span>
                <Input
                  type="number"
                  min="0.2"
                  max="5.0"
                  step="0.1"
                  value={settings.threatDecay}
                  onChange={(e) => updateSettings({ threatDecay: Math.max(0.2, Math.min(5.0, parseFloat(e.target.value) || 1.0)) })}
                  className="w-20 h-8 text-center"
                />
                <span>5.0</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Очки за действия
          </CardTitle>
          <CardDescription>
            Начисление очков за конкретные действия
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel Delete */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Удаление канала</Label>
                <p className="text-sm text-muted-foreground">
                  Очки за каждое удаление текстового или голосового канала. Это самое разрушительное и заметное действие при атаке.
                </p>
              </div>
              <Input
                type="number"
                min="1"
                max="50"
                value={settings.actionScores.channelDelete}
                onChange={(e) => updateActionScore('channelDelete', Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                className="w-20"
              />
            </div>

            {/* Channel Create */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Создание канала</Label>
                <p className="text-sm text-muted-foreground">
                  Очки за создание нового канала. Помогает предотвратить спам-создание каналов с неприемлемыми названиями.
                </p>
              </div>
              <Input
                type="number"
                min="1"
                max="20"
                value={settings.actionScores.channelCreate}
                onChange={(e) => updateActionScore('channelCreate', Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                className="w-20"
              />
            </div>

            {/* Role Create */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Создание роли</Label>
                <p className="text-sm text-muted-foreground">
                  Очки за создание новой роли. Злоумышленник может создать сотни ролей для "засорения" настроек сервера.
                </p>
              </div>
              <Input
                type="number"
                min="1"
                max="20"
                value={settings.actionScores.roleCreate}
                onChange={(e) => updateActionScore('roleCreate', Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                className="w-20"
              />
            </div>

            {/* Member Ban */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Бан участника</Label>
                <p className="text-sm text-muted-foreground">
                  Очки за каждый бан. Массовый бан всех участников — это быстрый способ "убить" сервер.
                </p>
              </div>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.actionScores.memberBan}
                onChange={(e) => updateActionScore('memberBan', Math.max(1, Math.min(30, parseInt(e.target.value) || 8)))}
                className="w-20"
              />
            </div>

            {/* Member Kick */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Кик участника</Label>
                <p className="text-sm text-muted-foreground">
                  Очки за каждый кик (исключение с сервера). Массовый кик всех онлайн-участников может серьезно нарушить работу сообщества.
                </p>
              </div>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.actionScores.memberKick}
                onChange={(e) => updateActionScore('memberKick', Math.max(1, Math.min(30, parseInt(e.target.value) || 8)))}
                className="w-20"
              />
            </div>

            {/* Webhook Create */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Создание вебхука</Label>
                <p className="text-sm text-muted-foreground">
                  Очки за создание вебхука в текстовом канале. Может использоваться для рассылки фишинговых ссылок или спама.
                </p>
              </div>
              <Input
                type="number"
                min="1"
                max="20"
                value={settings.actionScores.webhookCreate}
                onChange={(e) => updateActionScore('webhookCreate', Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                className="w-20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threat Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Примеры расчета угрозы
          </CardTitle>
          <CardDescription>
            Посмотрите, как система оценивает различные сценарии атак
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Example Selector */}
            <div className="flex items-center gap-2">
              <Label>Выберите сценарий:</Label>
              <div className="flex gap-1">
                {getThreatExamples().map((_, index) => (
                  <Button
                    key={index}
                    variant={exampleVariant === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExampleVariant(index)}
                    className="w-8 h-8 p-0"
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExampleVariant((prev) => (prev + 1) % getThreatExamples().length)}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Далее
              </Button>
            </div>

            {/* Current Example */}
            {(() => {
              const example = getThreatExamples()[exampleVariant];
              if (!example) return null;

              const totalScore = example.actions.reduce((sum, action) => sum + (action.score * action.count), 0);
              const isBlocked = totalScore >= settings.threatThreshold;

              return (
                <Alert className={isBlocked ? "border-destructive bg-destructive/5" : "border-success bg-success/5"}>
                  <Info className={`h-4 w-4 ${isBlocked ? 'text-destructive' : 'text-success'}`} />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">{example.title}</h4>
                        <p className="text-sm text-muted-foreground">{example.description}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-medium">Действия пользователя за последние 60 секунд:</p>
                        <ul className="space-y-1">
                          {example.actions.map((action, index) => (
                            <li key={index} className="flex justify-between text-sm">
                              <span>{action.action} ({action.count}х)</span>
                              <span className="font-mono">
                                {action.score} × {action.count} = {action.score * action.count} очков
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Итого:</span>
                          <span className="font-mono">
                            {totalScore} очков из {settings.threatThreshold}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                isBlocked ? 'bg-destructive' : 'bg-success'
                              }`}
                              style={{ width: `${Math.min(100, (totalScore / settings.threatThreshold) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <p className={`font-medium mt-2 ${isBlocked ? 'text-destructive' : 'text-success'}`}>
                          {isBlocked 
                            ? '🚨 КАРАНТИН - Пользователь заблокирован!' 
                            : '✅ Безопасно - В пределах нормы'}
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button 
          variant="outline" 
          onClick={resetToDefaults}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Сбросить к умолчанию
        </Button>
        
        <Button 
          onClick={saveSettings} 
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>
    </div>
  );
}