import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SocialNotification {
  id: string;
  platform: 'twitch' | 'youtube' | 'trovo' | 'kick' | 'discord';
  username: string;
  displayName: string;
  channelId: string;
  channelName: string;
  notificationType: 'stream' | 'video' | 'post';
  message: string;
  mentionRole?: string;
  enabled: boolean;
  createdAt: string;
  lastNotification?: string;
  notificationCount: number;
}

export interface PlatformConfig {
  id: string;
  name: string;
  color: string;
  description: string;
  supportedTypes: string[];
}

interface SocialNotificationsContextType {
  notifications: SocialNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<SocialNotification[]>>;
  addNotification: (notification: SocialNotification) => void;
  updateNotification: (id: string, updates: Partial<SocialNotification>) => void;
  deleteNotification: (id: string) => void;
  getNotification: (id: string) => SocialNotification | undefined;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  platforms: PlatformConfig[];
}

const SocialNotificationsContext = createContext<SocialNotificationsContextType | undefined>(undefined);

export function useSocialNotifications() {
  const context = useContext(SocialNotificationsContext);
  if (context === undefined) {
    throw new Error('useSocialNotifications must be used within a SocialNotificationsProvider');
  }
  return context;
}

interface SocialNotificationsProviderProps {
  children: React.ReactNode;
}

// Mock initial data
const initialNotifications: SocialNotification[] = [
  {
    id: 'notif_1',
    platform: 'twitch',
    username: 'gamingstreamer',
    displayName: 'Gaming Streamer',
    channelId: '1',
    channelName: 'стримы',
    notificationType: 'stream',
    message: '🎮 **{displayName}** начал стрим!\n\n**{title}**\n{game}\n\n{url}',
    mentionRole: '2',
    enabled: true,
    createdAt: '2024-01-10T14:30:00Z',
    lastNotification: '2024-01-20T19:45:00Z',
    notificationCount: 23
  },
  {
    id: 'notif_2',
    platform: 'youtube',
    username: 'techreviewer',
    displayName: 'Tech Reviewer',
    channelId: '2',
    channelName: 'youtube',
    notificationType: 'video',
    message: '📺 Новое видео от **{displayName}**!\n\n**{title}**\n\n{url}',
    enabled: true,
    createdAt: '2024-01-12T09:15:00Z',
    lastNotification: '2024-01-19T16:30:00Z',
    notificationCount: 8
  },
  {
    id: 'notif_3',
    platform: 'trovo',
    username: 'prostreamer',
    displayName: 'Pro Streamer',
    channelId: '1',
    channelName: 'стримы',
    notificationType: 'stream',
    message: '⚡ **{displayName}** в эфире на Trovo!\n\n**{title}**\n\n{url}',
    mentionRole: '3',
    enabled: false,
    createdAt: '2024-01-15T11:20:00Z',
    notificationCount: 5
  },
  {
    id: 'notif_4',
    platform: 'kick',
    username: 'progamer2024',
    displayName: 'Pro Gamer',
    channelId: '1',
    channelName: 'стримы',
    notificationType: 'stream',
    message: '🚀 **{displayName}** начал стрим на Kick!\n\n**{title}**\n\n{url}',
    mentionRole: '4',
    enabled: true,
    createdAt: '2024-01-18T20:15:00Z',
    lastNotification: '2024-01-21T22:30:00Z',
    notificationCount: 12
  }
];

const platforms: PlatformConfig[] = [
  {
    id: 'twitch',
    name: 'Twitch',
    color: '#9146ff',
    description: 'Уведомления о стримах на Twitch',
    supportedTypes: ['stream']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#ff0000',
    description: 'Уведомления о видео и стримах на YouTube',
    supportedTypes: ['stream', 'video']
  },
  {
    id: 'trovo',
    name: 'Trovo',
    color: '#00ff88',
    description: 'Уведомления о стримах на Trovo',
    supportedTypes: ['stream']
  },
  {
    id: 'kick',
    name: 'Kick',
    color: '#53fc18',
    description: 'Уведомления о стримах на Kick',
    supportedTypes: ['stream']
  }
];

export function SocialNotificationsProvider({ children }: SocialNotificationsProviderProps) {
  const [notifications, setNotifications] = useState<SocialNotification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);

  // Simulate loading initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    };
    
    loadData();
  }, []);

  const addNotification = (notification: SocialNotification) => {
    setNotifications(prev => [...prev, notification]);
  };

  const updateNotification = (id: string, updates: Partial<SocialNotification>) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, ...updates } : notification
    ));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotification = (id: string) => {
    return notifications.find(notification => notification.id === id);
  };

  const value: SocialNotificationsContextType = {
    notifications,
    setNotifications,
    addNotification,
    updateNotification,
    deleteNotification,
    getNotification,
    loading,
    setLoading,
    platforms
  };

  return (
    <SocialNotificationsContext.Provider value={value}>
      {children}
    </SocialNotificationsContext.Provider>
  );
}