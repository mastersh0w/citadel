import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import {
  Trophy,
  TrendingUp,
  Settings,
  Plus,
  Trash2,
  Save,
  Crown,
  MessageSquare,
  Mic,
  Star,
  Award,
  Users,
  RotateCcw,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Image,
  Palette
} from 'lucide-react';
import { RankingSettings, UserRankingData } from '@/types';
import { api } from '@/utils/api';
import { formatNumber, formatExperience, formatVoiceTime, formatRelativeTime, calculateLevelProgress } from '@/utils/formatters';
import { toast } from 'sonner';

export function UserRanking() {
  const [settings, setSettings] = useState<RankingSettings | null>(null);
  const [rankings, setRankings] = useState<UserRankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newRewardLevel, setNewRewardLevel] = useState('');
  const [newRewardRole, setNewRewardRole] = useState('');
  const [activeTab, setActiveTab] = useState<string>('rankings');
  const [isMobile, setIsMobile] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Array<{id: string, name: string, color?: number}>>([]);
  const [availableChannels, setAvailableChannels] = useState<Array<{id: string, name: string}>>([]);

  // Rank card customization state
  const [rankCardSettings, setRankCardSettings] = useState({
    backgroundImage: '',
    backgroundOpacity: 80,
    textShadow: true,
    borderColor: '#3b82f6',
    showProgressBar: true,
    showAvatarBorder: true
  });

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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, rankingsResponse, rolesResponse, channelsResponse] = await Promise.all([
        api.ranking.getSettings(),
        api.ranking.getUserRankings(20),
        api.guild.getRoles(),
        api.guild.getChannels()
      ]);

      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
      }

      if (rankingsResponse.success && rankingsResponse.data) {
        setRankings(rankingsResponse.data);
      }

      if (rolesResponse.success && rolesResponse.data) {
        setAvailableRoles(rolesResponse.data.map(role => ({
          id: role.id,
          name: role.name,
          color: role.color
        })));
      }

      if (channelsResponse.success && channelsResponse.data) {
        setAvailableChannels(channelsResponse.data
          .filter(channel => channel.type === 0) // Only text channels
          .map(channel => ({
            id: channel.id,
            name: channel.name
          })));
      }
    } catch (error) {
      console.error('Ошибка загрузки данных рейтинга:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (updates: Partial<RankingSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const response = await api.ranking.updateSettings(settings);
      if (response.success) {
        setHasChanges(false);
        toast.success('Настройки рейтинга сохранены');
      }
    } catch (error) {
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const addRoleReward = async () => {
    const level = parseInt(newRewardLevel);
    if (!level || !newRewardRole.trim() || !settings) return;
    
    const selectedRole = availableRoles.find(role => role.id === newRewardRole.trim());
    if (!selectedRole) {
      toast.error('Выберите роль из списка');
      return;
    }
    
    try {
      const response = await api.ranking.addRoleReward(level, newRewardRole.trim(), selectedRole.name);
      if (response.success && response.data) {
        updateSettings({ roleRewards: response.data });
        setNewRewardLevel('');
        setNewRewardRole('');
        toast.success('Награда за уровень добавлена');
      }
    } catch (error) {
      toast.error('Ошибка при добавлении награды');
    }
  };

  const removeRoleReward = async (level: number) => {
    if (!settings) return;
    
    try {
      const response = await api.ranking.removeRoleReward(level);
      if (response.success && response.data) {
        updateSettings({ roleRewards: response.data });
        toast.success('Награда за уровень удалена');
      }
    } catch (error) {
      toast.error('Ошибка при удалении награды');
    }
  };

  const resetUserExperience = async (userId: string) => {
    try {
      const response = await api.ranking.resetUserExperience(userId);
      if (response.success) {
        await loadData(); // Refresh rankings
        toast.success('Опыт пользователя сброшен');
      }
    } catch (error) {
      toast.error('Ошибка при сбросе опыта');
    }
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setRankCardSettings(prev => ({ ...prev, backgroundImage: result }));
      toast.success('Фон карточки загружен');
    };
    reader.readAsDataURL(file);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500"><Crown className="h-3 w-3 mr-1" />1</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400"><Award className="h-3 w-3 mr-1" />2</Badge>;
    if (rank === 3) return <Badge className="bg-orange-500"><Star className="h-3 w-3 mr-1" />3</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'text-purple-400 dark:text-purple-300';
    if (level >= 25) return 'text-blue-500 dark:text-blue-400';
    if (level >= 10) return 'text-green-500 dark:text-green-400';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-8 w-8 animate-pulse" />
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
              <p className="text-muted-foreground">Не удалось загрузить настройки рейтинга</p>
              <Button onClick={loadData} className="mt-4">
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
            <Trophy className="h-8 w-8" />
            Рейтинг пользователей
          </h1>
          <p className="text-muted-foreground">
            Система уровней и достижений участников сервера
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={settings.enabled ? "default" : "secondary"} className="gap-1">
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
            <Badge variant="secondary" className="gap-1">
              <Edit className="h-3 w-3" />
              Несохранено
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

      {!settings.enabled && (
        <Alert>
          <Trophy className="h-4 w-4" />
          <AlertDescription>
            Система рейтинга отключена. Включите её для начисления опыта участникам.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-4">
          <TabsTrigger value="rankings">Рейтинг</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
          <TabsTrigger value="rewards">Награды</TabsTrigger>
          <TabsTrigger value="messages">Сообщения</TabsTrigger>
        </TabsList>

        {/* Mobile Dropdown */}
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rankings">Рейтинг</SelectItem>
              <SelectItem value="settings">Настройки</SelectItem>
              <SelectItem value="rewards">Награды</SelectItem>
              <SelectItem value="messages">Сообщения</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="rankings" className="space-y-6">
          {/* Top Users Cards */}
          {rankings.length >= 3 && (
            <div className="grid gap-4 md:grid-cols-3">
              {rankings.slice(0, 3).map((user, index) => (
                <Card key={user.userId} className={`relative ${index === 0 ? 'ring-2 ring-yellow-500' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      {getRankBadge(user.rank)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetUserExperience(user.userId)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar>
                        <AvatarImage src={`https://cdn.discordapp.com/avatars/${user.userId}/avatar.png`} />
                        <AvatarFallback>
                          {String(user.userId).slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Пользователь #{user.userId.slice(-4)}</p>
                        <p className={`text-sm font-bold ${getLevelColor(user.level)}`}>
                          Уровень {user.level}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Опыт</span>
                        <span className="font-mono">{formatExperience(user.experience)}</span>
                      </div>
                      <Progress value={calculateLevelProgress(user.experience)} className="h-2" />
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {formatNumber(user.messages)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mic className="h-3 w-3" />
                          {formatVoiceTime(user.voiceTime)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Full Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Полный рейтинг</CardTitle>
              <CardDescription>
                Все участники сервера, отсортированные по опыту
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Ранг</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Уровень</TableHead>
                      <TableHead>Опыт</TableHead>
                      <TableHead>Сообщения</TableHead>
                      <TableHead>Голос</TableHead>
                      <TableHead>Активность</TableHead>
                      <TableHead className="w-20">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          {getRankBadge(user.rank)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://cdn.discordapp.com/avatars/${user.userId}/avatar.png`} />
                              <AvatarFallback className="text-xs">
                                {String(user.userId).slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-mono text-sm">#{user.userId.slice(-4)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${getLevelColor(user.level)}`}>
                            {user.level}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatExperience(user.experience)}
                        </TableCell>
                        <TableCell>{formatNumber(user.messages)}</TableCell>
                        <TableCell>{formatVoiceTime(user.voiceTime)}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(user.lastActive)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetUserExperience(user.userId)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {rankings.map((user) => (
                  <Card key={user.userId} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://cdn.discordapp.com/avatars/${user.userId}/avatar.png`} />
                          <AvatarFallback className="text-xs">
                            {String(user.userId).slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-mono text-sm">#{user.userId.slice(-4)}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {getRankBadge(user.rank)}
                            <span className={`font-bold text-sm ${getLevelColor(user.level)}`}>
                              Ур. {user.level}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetUserExperience(user.userId)}
                        className="flex-shrink-0"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Опыт:</span>
                        <span className="font-mono text-sm">{formatExperience(user.experience)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Сообщения:
                        </span>
                        <span className="text-sm">{formatNumber(user.messages)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mic className="h-3 w-3" />
                          Голос:
                        </span>
                        <span className="text-sm">{formatVoiceTime(user.voiceTime)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Активность:
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(user.lastActive)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Основные настройки
              </CardTitle>
              <CardDescription>
                Конфигурация системы рейтинга и начисления опыта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                {isMobile ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Включить систему рейтинга</Label>
                      <Switch
                        checked={settings.enabled}
                        onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground pl-0">
                      Начислять опыт за активность участников
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <Label className="text-base">Включить систему рейтинга</Label>
                      <div className="text-sm text-muted-foreground">
                        Начислять опыт за активность участников
                      </div>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                    />
                  </>
                )}
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="exp-per-message">Опыт за сообщение</Label>
                  <Input
                    id="exp-per-message"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.experiencePerMessage}
                    onChange={(e) => updateSettings({ experiencePerMessage: parseInt(e.target.value) || 15 })}
                  />
                  <div className="text-xs text-muted-foreground">
                    Количество опыта за одно сообщение
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp-per-voice">Опыт за минуту в голосовом</Label>
                  <Input
                    id="exp-per-voice"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.experiencePerMinuteVoice}
                    onChange={(e) => updateSettings({ experiencePerMinuteVoice: parseInt(e.target.value) || 10 })}
                  />
                  <div className="text-xs text-muted-foreground">
                    Количество опыта за минуту в голосовом канале
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level-multiplier">Множитель уровней</Label>
                  <Input
                    id="level-multiplier"
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.0"
                    value={settings.levelUpMultiplier}
                    onChange={(e) => updateSettings({ levelUpMultiplier: parseFloat(e.target.value) || 1.2 })}
                  />
                  <div className="text-xs text-muted-foreground">
                    Коэффициент увеличения требований для следующего уровня
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldown">Кулдаун (секунды)</Label>
                  <Input
                    id="cooldown"
                    type="number"
                    min="10"
                    max="300"
                    value={settings.cooldown}
                    onChange={(e) => updateSettings({ cooldown: parseInt(e.target.value) || 60 })}
                  />
                  <div className="text-xs text-muted-foreground">
                    Минимальный интервал между начислениями опыта
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-channel">Канал объявлений</Label>
                <Select 
                  value={settings.announcementChannel || 'none'} 
                  onValueChange={(value) => updateSettings({ announcementChannel: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите канал для уведомлений" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не использовать канал</SelectItem>
                    {availableChannels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Канал для уведомлений о повышении уровня участников
                </div>
              </div>

              <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                {isMobile ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Объявлять повышения уровня</Label>
                      <Switch
                        checked={settings.announceOnLevelUp}
                        onCheckedChange={(checked) => updateSettings({ announceOnLevelUp: checked })}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground pl-0">
                      Отправлять сообщения при достижении нового уровня
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <Label>Объявлять повышения уровня</Label>
                      <div className="text-sm text-muted-foreground">
                        Отправлять сообщения при достижении нового уровня
                      </div>
                    </div>
                    <Switch
                      checked={settings.announceOnLevelUp}
                      onCheckedChange={(checked) => updateSettings({ announceOnLevelUp: checked })}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Награды за уровни
              </CardTitle>
              <CardDescription>
                Роли, которые автоматически выдаются при достижении определенного уровня
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  placeholder="Уровень"
                  type="number"
                  min="1"
                  max="100"
                  value={newRewardLevel}
                  onChange={(e) => setNewRewardLevel(e.target.value)}
                />
                <Select 
                  value={newRewardRole} 
                  onValueChange={setNewRewardRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          {role.color && (
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: `#${role.color.toString(16).padStart(6, '0')}` }}
                            />
                          )}
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addRoleReward} 
                  disabled={!newRewardLevel || !newRewardRole}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Добавить
                </Button>
              </div>

              <div className="space-y-2">
                {settings.roleRewards.length > 0 ? (
                  settings.roleRewards
                    .sort((a, b) => a.level - b.level)
                    .map((reward) => (
                      <div key={reward.level} className="p-3 rounded-lg border">
                        {/* Desktop Layout */}
                        <div className="hidden md:flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge className={getLevelColor(reward.level)}>
                              Ур. {reward.level}
                            </Badge>
                            <Crown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{reward.roleName}</span>
                            <span className="font-mono text-xs text-muted-foreground truncate">
                              {reward.roleId}
                            </span>
                            {reward.removeOnHigher && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0 whitespace-nowrap">
                                Заменяется
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoleReward(reward.level)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Mobile Layout */}
                        <div className="md:hidden space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getLevelColor(reward.level)}>
                                Ур. {reward.level}
                              </Badge>
                              <Crown className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRoleReward(reward.level)}
                              className="flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="font-medium">{reward.roleName}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {reward.roleId}
                            </div>
                            {reward.removeOnHigher && (
                              <Badge variant="secondary" className="text-xs">
                                Заменяется при получении роли выше
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="h-12 w-12 mx-auto mb-2" />
                    <p>Награды за уровни не настроены</p>
                    <p className="text-xs mt-1">Добавьте награды для мотивации участников</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Настройка карточки ранга
              </CardTitle>
              <CardDescription>
                Кастомизация карточки пользователя (доступно только на ПК)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isMobile ? (
                <Alert>
                  <Palette className="h-4 w-4" />
                  <AlertDescription>
                    Настройка карточки ранга доступна только на десктопной версии. Откройте панель управления на компьютере для доступа к этой функции.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Background Image Upload */}
                  <div className="space-y-4">
                    <Label className="text-base">Фон карточки ранга</Label>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Button variant="outline" className="w-full gap-2 pointer-events-none">
                            <Upload className="h-4 w-4" />
                            Загрузить фон
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Поддерживаются форматы: JPG, PNG, GIF (макс. 5 МБ)
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="aspect-video bg-muted rounded-lg p-4 border-2 border-dashed relative overflow-hidden">
                          {rankCardSettings.backgroundImage ? (
                            <>
                              <img 
                                src={rankCardSettings.backgroundImage}
                                alt="Фон карточки"
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ opacity: rankCardSettings.backgroundOpacity / 100 }}
                              />
                              <div className="relative z-10 flex items-center gap-3">
                                <Avatar className={rankCardSettings.showAvatarBorder ? "ring-2 ring-white" : ""}>
                                  <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <div className={rankCardSettings.textShadow ? "text-white" : ""} style={{
                                  textShadow: rankCardSettings.textShadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
                                }}>
                                  <p className="font-medium">Пример пользователя</p>
                                  <p className="text-sm">Уровень 25 • 15,420 опыта</p>
                                </div>
                              </div>
                              {rankCardSettings.showProgressBar && (
                                <div className="relative z-10 mt-2">
                                  <Progress value={65} className="h-2" />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <div className="text-center">
                                <Image className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Предпросмотр карточки</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {rankCardSettings.backgroundImage && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium">Настройки фона</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Прозрачность фона: {rankCardSettings.backgroundOpacity}%</Label>
                            <Slider
                              value={[rankCardSettings.backgroundOpacity]}
                              onValueChange={([value]) => setRankCardSettings(prev => ({ ...prev, backgroundOpacity: value }))}
                              max={100}
                              min={10}
                              step={5}
                              className="mt-2"
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm">Тень для текста</Label>
                                <div className="text-xs text-muted-foreground">
                                  Улучшает читаемость на ярких фонах
                                </div>
                              </div>
                              <Switch
                                checked={rankCardSettings.textShadow}
                                onCheckedChange={(checked) => setRankCardSettings(prev => ({ ...prev, textShadow: checked }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm">Рамка аватара</Label>
                                <div className="text-xs text-muted-foreground">
                                  Белая рамка вокруг аватара
                                </div>
                              </div>
                              <Switch
                                checked={rankCardSettings.showAvatarBorder}
                                onCheckedChange={(checked) => setRankCardSettings(prev => ({ ...prev, showAvatarBorder: checked }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm">Полоса прогресса</Label>
                                <div className="text-xs text-muted-foreground">
                                  Показывать прогресс до следующего уровня
                                </div>
                              </div>
                              <Switch
                                checked={rankCardSettings.showProgressBar}
                                onCheckedChange={(checked) => setRankCardSettings(prev => ({ ...prev, showProgressBar: checked }))}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Цвет рамки карточки</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={rankCardSettings.borderColor}
                                  onChange={(e) => setRankCardSettings(prev => ({ ...prev, borderColor: e.target.value }))}
                                  className="w-10 h-8 rounded border"
                                />
                                <Input
                                  value={rankCardSettings.borderColor}
                                  onChange={(e) => setRankCardSettings(prev => ({ ...prev, borderColor: e.target.value }))}
                                  placeholder="#3b82f6"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setRankCardSettings({
                                backgroundImage: '',
                                backgroundOpacity: 80,
                                textShadow: true,
                                borderColor: '#3b82f6',
                                showProgressBar: true,
                                showAvatarBorder: true
                              })}
                              className="gap-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Сбросить
                            </Button>
                            <Button
                              onClick={() => {
                                // Here would save rank card settings
                                toast.success('Настройки карточки сохранены');
                              }}
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Сохранить дизайн
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Level Up Message Template */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base">Шаблон сообщения о повышении</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        Настройте текст, который будет отправляться при достижении нового уровня
                      </div>
                    </div>

                    <Textarea
                      placeholder="🎉 Поздравляем {user.mention}! Вы достигли {level} уровня и получили роль {role}!"
                      value={settings.levelUpMessage || ''}
                      onChange={(e) => updateSettings({ levelUpMessage: e.target.value })}
                      rows={4}
                    />

                    <div className="text-xs text-muted-foreground">
                      <p className="mb-1">Доступные переменные:</p>
                      <div className="flex flex-wrap gap-2">
                        <code className="bg-muted px-1 rounded">{'{user.mention}'}</code>
                        <code className="bg-muted px-1 rounded">{'{user.name}'}</code>
                        <code className="bg-muted px-1 rounded">{'{level}'}</code>
                        <code className="bg-muted px-1 rounded">{'{role}'}</code>
                        <code className="bg-muted px-1 rounded">{'{experience}'}</code>
                        <code className="bg-muted px-1 rounded">{'{server.name}'}</code>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}