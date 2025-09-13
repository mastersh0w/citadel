import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  MusicConfig,
  MusicQueue,
  Song,
  Playlist,
  Channel,
  Role 
} from '@/types';
import { mockChannels, mockRoles } from '@/utils/mock-data';
import { toast } from 'sonner@2.0.3';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Upload,
  Settings,
  Users,
  Clock,
  Hash,
  Heart,
  Share,
  MoreHorizontal,
  Mic,
  Headphones,
  Radio,
  List,
  Globe,
  Eye,
  EyeOff,
  Copy,
  Star,
  ExternalLink
} from 'lucide-react';

const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    duration: 355,
    url: 'https://youtube.com/watch?v=fJ9rUzIMcZQ',
    thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg',
    source: 'youtube',
    requestedBy: '123456789',
    requestedByName: 'MusicLover',
    addedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    title: 'Hotel California',
    artist: 'Eagles',
    duration: 391,
    url: 'https://youtube.com/watch?v=09839DpTctU',
    thumbnail: 'https://img.youtube.com/vi/09839DpTctU/maxresdefault.jpg',
    source: 'spotify',
    requestedBy: '987654321',
    requestedByName: 'RockFan',
    addedAt: '2024-01-20T14:35:00Z'
  },
  {
    id: '3',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    duration: 482,
    url: 'https://youtube.com/watch?v=QkF3oxziUI4',
    thumbnail: 'https://img.youtube.com/vi/QkF3oxziUI4/maxresdefault.jpg',
    source: 'soundcloud',
    requestedBy: '456789123',
    requestedByName: 'ClassicRock',
    addedAt: '2024-01-20T14:40:00Z'
  }
];

const mockMultiPlatformPlaylist: Playlist = {
  id: '3',
  name: 'Мультиплатформенный Mix',
  description: 'Треки из разных платформ в одном плейлисте',
  ownerId: '123456789',
  songs: [
    { ...mockSongs[0], source: 'youtube' },
    { ...mockSongs[1], source: 'spotify' },
    { ...mockSongs[2], source: 'soundcloud' },
    {
      id: '4',
      title: 'Imagine',
      artist: 'John Lennon',
      duration: 183,
      url: 'https://open.spotify.com/track/7pKfPomDEeI4TPT6EOYjn9',
      thumbnail: 'https://via.placeholder.com/320x320',
      source: 'spotify',
      requestedBy: '123456789',
      requestedByName: 'PeaceLover',
      addedAt: '2024-01-20T15:00:00Z'
    },
    {
      id: '5',
      title: 'Chill Beats',
      artist: 'LoFi Producer',
      duration: 240,
      url: 'https://soundcloud.com/lofi-producer/chill-beats',
      thumbnail: 'https://via.placeholder.com/320x320',
      source: 'soundcloud',
      requestedBy: '123456789',
      requestedByName: 'ChillVibes',
      addedAt: '2024-01-20T15:10:00Z'
    }
  ],
  isPublic: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T15:10:00Z',
  plays: 892
};

const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Rock Classics',
    description: 'Лучшие рок-композиции всех времен',
    ownerId: '123456789',
    songs: mockSongs,
    isPublic: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:40:00Z',
    plays: 1247
  },
  {
    id: '2',
    name: 'Chill Vibes',
    description: 'Расслабляющая музыка для отдыха',
    ownerId: '987654321',
    songs: [],
    isPublic: false,
    createdAt: '2024-01-18T16:20:00Z',
    updatedAt: '2024-01-19T12:15:00Z',
    plays: 334
  },
  mockMultiPlatformPlaylist
];

const mockQueue: MusicQueue = {
  guildId: '123456789',
  channelId: '987654321',
  voiceChannelId: '456789123',
  currentSong: mockSongs[0],
  queue: mockSongs.slice(1),
  volume: 75,
  loop: 'none',
  shuffle: false,
  paused: false,
  createdAt: '2024-01-20T14:30:00Z'
};

export function MusicBot() {
  const [channels] = useState<Channel[]>(mockChannels);
  const [roles] = useState<Role[]>(mockRoles);
  const [queue, setQueue] = useState<MusicQueue>(mockQueue);
  const [playlists, setPlaylists] = useState<Playlist[]>(mockPlaylists);
  const [config, setConfig] = useState<MusicConfig>({
    enabled: true,
    djRoles: ['123456789', '987654321'],
    voiceChannels: ['456789123', '789123456'],
    maxSongLength: 3600, // 1 hour
    maxQueueSize: 100,
    defaultVolume: 75,
    allowPlaylists: true,
    allowedSources: ['youtube', 'spotify', 'soundcloud', 'apple-music', 'deezer'],
    voteskipThreshold: 50, // 50%
    autoLeave: true,
    autoLeaveTimeout: 5, // 5 minutes
    logChannelId: '321654987'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [currentProgress, setCurrentProgress] = useState(45); // Mock progress
  const [newPlaylist, setNewPlaylist] = useState<Partial<Playlist>>({
    name: '',
    description: '',
    isPublic: true
  });
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [activeTab, setActiveTab] = useState('player');
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

  const getMusicStats = () => {
    const totalPlaylists = playlists.length;
    const publicPlaylists = playlists.filter(p => p.isPublic).length;
    const totalSongs = playlists.reduce((sum, p) => sum + p.songs.length, 0);
    const totalPlays = playlists.reduce((sum, p) => sum + p.plays, 0);
    const queueLength = queue.queue.length + (queue.currentSong ? 1 : 0);
    
    return { totalPlaylists, publicPlaylists, totalSongs, totalPlays, queueLength };
  };

  const stats = getMusicStats();

  const handleConfigChange = (key: keyof MusicConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    toast.success('Настройки сохранены');
  };

  const handlePlayPause = () => {
    setQueue(prev => ({ ...prev, paused: !prev.paused }));
    toast.success(queue.paused ? 'Воспроизведение возобновлено' : 'Воспроизведение приостановлено');
  };

  const handlePlayTrack = (song: Song) => {
    setQueue(prev => ({
      ...prev,
      currentSong: song,
      queue: prev.queue.filter(s => s.id !== song.id),
      paused: false
    }));
    setCurrentProgress(0);
    toast.success(`Играет: ${song.title}`);
  };

  const handleSkip = () => {
    if (queue.queue.length > 0) {
      const nextSong = queue.queue[0];
      const newQueue = queue.queue.slice(1);
      
      setQueue(prev => ({
        ...prev,
        currentSong: nextSong,
        queue: newQueue
      }));
      toast.success('Трек пропущен');
    } else {
      toast.error('Очередь пуста');
    }
  };

  const handleVolumeChange = (volume: number[]) => {
    setQueue(prev => ({ ...prev, volume: volume[0] }));
    toast.success(`Громкость: ${volume[0]}%`);
  };

  const handleLoopChange = () => {
    const loopModes: Array<'none' | 'song' | 'queue'> = ['none', 'song', 'queue'];
    const currentIndex = loopModes.indexOf(queue.loop);
    const nextLoop = loopModes[(currentIndex + 1) % loopModes.length];
    
    setQueue(prev => ({ ...prev, loop: nextLoop }));
    
    const loopLabels = {
      none: 'Повтор отключен',
      song: 'Повтор трека',
      queue: 'Повтор очереди'
    };
    
    toast.success(loopLabels[nextLoop]);
  };

  const handleShuffleToggle = () => {
    setQueue(prev => ({ ...prev, shuffle: !prev.shuffle }));
    toast.success(queue.shuffle ? 'Перемешивание отключено' : 'Перемешивание включено');
  };

  const handleSearchMusic = () => {
    if (!searchQuery.trim()) {
      toast.error('Введите поисковый запрос');
      return;
    }

    // Mock search results with different platforms
    const platforms = ['youtube', 'spotify', 'soundcloud', 'apple-music', 'deezer'];
    const mockResults: Song[] = platforms.map((platform, index) => ({
      id: `search-${Date.now()}-${index}`,
      title: `${searchQuery} - ${platform.charAt(0).toUpperCase() + platform.slice(1)} Result`,
      artist: 'Various Artists',
      duration: 240 + index * 20,
      url: `https://${platform}.com/search?q=${encodeURIComponent(searchQuery)}`,
      thumbnail: 'https://via.placeholder.com/320x180',
      source: platform as any,
      requestedBy: 'current-user',
      requestedByName: 'You',
      addedAt: new Date().toISOString()
    }));

    setSearchResults(mockResults);
    toast.success('Найдено треков: ' + mockResults.length);
  };

  const handleAddToQueue = (song: Song) => {
    if (queue.queue.length >= config.maxQueueSize) {
      toast.error('Очередь переполнена');
      return;
    }

    setQueue(prev => ({
      ...prev,
      queue: [...prev.queue, song]
    }));
    toast.success(`"${song.title}" добавлен в очередь`);
  };

  const handleRemoveFromQueue = (songId: string) => {
    setQueue(prev => ({
      ...prev,
      queue: prev.queue.filter(song => song.id !== songId)
    }));
    toast.success('Трек удален из очереди');
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylist.name?.trim()) {
      toast.error('Введите название плейлиста');
      return;
    }

    const playlist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylist.name,
      description: newPlaylist.description || '',
      ownerId: 'current-user',
      songs: [],
      isPublic: newPlaylist.isPublic || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      plays: 0
    };

    setPlaylists(prev => [playlist, ...prev]);
    setNewPlaylist({ name: '', description: '', isPublic: true });
    setShowCreatePlaylist(false);
    toast.success('Плейлист создан');
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setNewPlaylist({
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.isPublic
    });
    setShowCreatePlaylist(true);
  };

  const handleUpdatePlaylist = () => {
    if (!editingPlaylist || !newPlaylist.name?.trim()) {
      toast.error('Введите название плейлиста');
      return;
    }

    setPlaylists(prev => prev.map(p => 
      p.id === editingPlaylist.id 
        ? {
            ...p,
            name: newPlaylist.name!,
            description: newPlaylist.description || '',
            isPublic: newPlaylist.isPublic || false,
            updatedAt: new Date().toISOString()
          }
        : p
    ));

    setEditingPlaylist(null);
    setNewPlaylist({ name: '', description: '', isPublic: true });
    setShowCreatePlaylist(false);
    toast.success('Плейлист обновлен');
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    toast.success('Плейлист удален');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'youtube':
        return '🎬';
      case 'spotify':
        return '🎵';
      case 'soundcloud':
        return '☁️';
      case 'apple-music':
        return '🍎';
      case 'deezer':
        return '🎶';
      default:
        return '🎵';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return `${Math.floor(diffInMinutes / 1440)} д назад`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Музыкальный бот</h2>
          <p className="text-muted-foreground">
            Воспроизведение музыки и управление плейлистами с поддержкой мультиплатформенности
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {config.enabled ? 'Активен' : 'Неактивен'}
          </Badge>
          {queue.currentSong && (
            <Badge variant="outline" className="text-sm bg-green-500/10 text-green-700 dark:text-green-400">
              <Music className="h-3 w-3 mr-1" />
              Играет
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Плейлистов</p>
                <p className="text-2xl font-semibold">{stats.totalPlaylists}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Публичных</p>
                <p className="text-2xl font-semibold">{stats.publicPlaylists}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Треков</p>
                <p className="text-2xl font-semibold">{stats.totalSongs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Прослушиваний</p>
                <p className="text-2xl font-semibold">{stats.totalPlays.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">В очереди</p>
                <p className="text-2xl font-semibold">{stats.queueLength}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {isMobile ? (
          // Mobile dropdown menu
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Раздел музыкального бота</Label>
                <Badge variant="outline" className="text-xs">
                  {activeTab === 'player' && (queue.currentSong ? 'Играет' : 'Ожидает')}
                  {activeTab === 'search' && `${searchResults.length} результатов`}
                  {activeTab === 'playlists' && `${stats.totalPlaylists} плейлистов`}
                  {activeTab === 'settings' && 'Настройки'}
                </Badge>
              </div>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {activeTab === 'player' && '🎵 Плеер и очередь'}
                    {activeTab === 'search' && '🔍 Поиск музыки'}
                    {activeTab === 'playlists' && '📁 Плейлисты'}
                    {activeTab === 'settings' && '⚙️ Настройки бота'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">
                    <div className="flex items-center justify-between w-full">
                      <span>🎵 Плеер и очередь</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {stats.queueLength}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="search">
                    <div className="flex items-center justify-between w-full">
                      <span>🔍 Поиск музыки</span>
                      {searchResults.length > 0 && (
                        <Badge variant="outline" className="text-xs ml-2">
                          {searchResults.length}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="playlists">
                    <div className="flex items-center justify-between w-full">
                      <span>📁 Плейлисты</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {stats.totalPlaylists}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="settings">⚙️ Настройки бота</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
          </Card>
        ) : (
          // Desktop tabs
          <TabsList>
            <TabsTrigger value="player">Плеер</TabsTrigger>
            <TabsTrigger value="search">Поиск</TabsTrigger>
            <TabsTrigger value="playlists">Плейлисты</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="player" className="space-y-6">
          {/* Now Playing */}
          <Card>
            <CardHeader>
              <CardTitle>Сейчас играет</CardTitle>
            </CardHeader>
            <CardContent>
              {queue.currentSong ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{queue.currentSong.title}</h3>
                        <a 
                          href={queue.currentSong.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="text-muted-foreground">{queue.currentSong.artist}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Добавил: {queue.currentSong.requestedByName}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getSourceIcon(queue.currentSong.source)} {queue.currentSong.source}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(queue.currentSong.duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={currentProgress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatDuration(Math.floor(queue.currentSong.duration * currentProgress / 100))}</span>
                      <span>{formatDuration(queue.currentSong.duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button size="sm" variant="outline">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button size="lg" onClick={handlePlayPause}>
                      {queue.paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleSkip}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    
                    <Separator orientation="vertical" className="h-8" />
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleLoopChange}
                      className={queue.loop !== 'none' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      {queue.loop === 'song' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleShuffleToggle}
                      className={queue.shuffle ? 'bg-primary text-primary-foreground' : ''}
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4" />
                    <div className="flex-1">
                      <Slider
                        value={[queue.volume]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12">
                      {queue.volume}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ничего не воспроизводится</p>
                  <p className="text-sm">Добавьте треки в очередь для начала воспроизведения</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Очередь ({queue.queue.length})</CardTitle>
              <CardDescription>
                Следующие треки для воспроизведения
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queue.queue.length > 0 ? (
                <div className="space-y-3">
                  {queue.queue.map((song, index) => (
                    <div key={song.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <button 
                          onClick={() => handlePlayTrack(song)}
                          className="text-left hover:text-primary transition-colors group"
                        >
                          <h4 className="font-medium truncate group-hover:underline cursor-pointer">
                            {song.title}
                          </h4>
                        </button>
                        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getSourceIcon(song.source)} {song.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(song.duration)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {song.requestedByName}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleRemoveFromQueue(song.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Очередь пуста</p>
                  <p className="text-sm">Найдите треки и добавьте их в очередь</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Поиск музыки</CardTitle>
              <CardDescription>
                Найдите треки на YouTube, Spotify, SoundCloud, Apple Music и других платформах
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Введите название трека или исполнителя..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchMusic()}
                  className="flex-1"
                />
                <Button onClick={handleSearchMusic}>
                  <Search className="h-4 w-4 mr-2" />
                  Найти
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Результаты поиска (мультиплатформенный)</h4>
                  {searchResults.map((song) => (
                    <div key={song.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{song.title}</h4>
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getSourceIcon(song.source)} {song.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(song.duration)}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleAddToQueue(song)}>
                        <Plus className="h-4 w-4 mr-2" />
                        В очередь
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playlists" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Плейлисты</h3>
              <p className="text-sm text-muted-foreground">Управление коллекциями треков из разных платформ</p>
            </div>
            <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPlaylist(null);
                  setNewPlaylist({ name: '', description: '', isPublic: true });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать плейлист
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPlaylist ? 'Редактировать плейлист' : 'Новый плейлист'}
                  </DialogTitle>
                  <DialogDescription>
                    Создайте коллекцию ваших любимых треков с разных платформ
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playlistName">Название*</Label>
                    <Input
                      id="playlistName"
                      value={newPlaylist.name || ''}
                      onChange={(e) => setNewPlaylist(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Мой плейлист"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playlistDescription">Описание</Label>
                    <Textarea
                      id="playlistDescription"
                      value={newPlaylist.description || ''}
                      onChange={(e) => setNewPlaylist(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Описание плейлиста..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="publicPlaylist">Публичный плейлист</Label>
                      <p className="text-sm text-muted-foreground">
                        Разрешить другим пользователям просматривать этот плейлист
                      </p>
                    </div>
                    <Switch
                      id="publicPlaylist"
                      checked={newPlaylist.isPublic || false}
                      onCheckedChange={(checked) => setNewPlaylist(prev => ({ ...prev, isPublic: checked }))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreatePlaylist(false)}>
                    Отмена
                  </Button>
                  <Button onClick={editingPlaylist ? handleUpdatePlaylist : handleCreatePlaylist}>
                    {editingPlaylist ? 'Обновить' : 'Создать'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{playlist.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {playlist.description || 'Нет описания'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {playlist.isPublic ? (
                        <Globe className="h-4 w-4 text-green-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditPlaylist(playlist)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{playlist.songs.length} треков</span>
                      <span>{playlist.plays} прослушиваний</span>
                    </div>
                    
                    {playlist.songs.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Платформы:</p>
                        <div className="flex gap-1 flex-wrap">
                          {Array.from(new Set(playlist.songs.map(s => s.source))).map(source => (
                            <Badge key={source} variant="outline" className="text-xs">
                              {getSourceIcon(source)} {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Play className="h-3 w-3 mr-1" />
                        Играть
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Настройки музыкального бота</CardTitle>
              <CardDescription>
                Конфигурация воспроизведения и поддерживаемых платформ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Включить музыкального бота</Label>
                  <p className="text-sm text-muted-foreground">
                    Разрешить воспроизведение музыки на сервере
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Поддерживаемые платформы</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Выберите платформы для поиска и воспроизведения музыки
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['youtube', 'spotify', 'soundcloud', 'apple-music', 'deezer'].map(source => (
                      <div key={source} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={source}
                          checked={config.allowedSources.includes(source)}
                          onChange={(e) => {
                            const sources = e.target.checked
                              ? [...config.allowedSources, source]
                              : config.allowedSources.filter(s => s !== source);
                            handleConfigChange('allowedSources', sources);
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={source} className="text-sm">
                          {getSourceIcon(source)} {source}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxQueueSize">Максимальный размер очереди</Label>
                    <Input
                      id="maxQueueSize"
                      type="number"
                      value={config.maxQueueSize}
                      onChange={(e) => handleConfigChange('maxQueueSize', parseInt(e.target.value))}
                      min={1}
                      max={1000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultVolume">Громкость по умолчанию (%)</Label>
                    <Input
                      id="defaultVolume"
                      type="number"
                      value={config.defaultVolume}
                      onChange={(e) => handleConfigChange('defaultVolume', parseInt(e.target.value))}
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="voteskipThreshold">Порог голосования за пропуск (%)</Label>
                    <Input
                      id="voteskipThreshold"
                      type="number"
                      value={config.voteskipThreshold}
                      onChange={(e) => handleConfigChange('voteskipThreshold', parseInt(e.target.value))}
                      min={1}
                      max={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="autoLeaveTimeout">Автовыход через (мин)</Label>
                    <Input
                      id="autoLeaveTimeout"
                      type="number"
                      value={config.autoLeaveTimeout}
                      onChange={(e) => handleConfigChange('autoLeaveTimeout', parseInt(e.target.value))}
                      min={1}
                      max={60}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}