import React, { createContext, useContext, useState, useEffect } from 'react';

interface RoleMapping {
  id: string;
  emoji?: string;
  buttonText?: string;
  buttonColor?: 'gray' | 'blue' | 'green' | 'red';
  roleId: string;
  roleName: string;
  roleColor: string;
}

interface RoleGroup {
  id: string;
  name: string;
  channelId: string;
  channelName: string;
  messageId?: string;
  messageContent: {
    title: string;
    description: string;
    color: string;
  };
  type: 'reactions' | 'buttons';
  mode: 'unique' | 'multiple' | 'toggle';
  roles: RoleMapping[];
  requirements: string[];
  ignoredRoles: string[];
  enabled: boolean;
  createdAt: string;
  usageStats: {
    totalUses: number;
    uniqueUsers: number;
  };
}

interface ReactionRolesContextType {
  roleGroups: RoleGroup[];
  setRoleGroups: React.Dispatch<React.SetStateAction<RoleGroup[]>>;
  addRoleGroup: (group: RoleGroup) => void;
  updateRoleGroup: (id: string, updates: Partial<RoleGroup>) => void;
  deleteRoleGroup: (id: string) => void;
  getRoleGroup: (id: string) => RoleGroup | undefined;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ReactionRolesContext = createContext<ReactionRolesContextType | undefined>(undefined);

export function useReactionRoles() {
  const context = useContext(ReactionRolesContext);
  if (context === undefined) {
    throw new Error('useReactionRoles must be used within a ReactionRolesProvider');
  }
  return context;
}

interface ReactionRolesProviderProps {
  children: React.ReactNode;
}

// Mock initial data
const initialRoleGroups: RoleGroup[] = [
  {
    id: 'group_1',
    name: '🎭 Роли по интересам',
    channelId: '2',
    channelName: 'роли',
    messageId: '1234567890123456789',
    messageContent: {
      title: '🎭 Выберите свои роли',
      description: 'Нажмите на реакции ниже, чтобы получить соответствующие роли на сервере.',
      color: '#3b82f6'
    },
    type: 'reactions',
    mode: 'multiple',
    roles: [
      { id: '1', emoji: '🎮', roleId: '5', roleName: 'Gamer', roleColor: '#8b5cf6' },
      { id: '2', emoji: '🎨', roleId: '6', roleName: 'Artist', roleColor: '#ec4899' },
      { id: '3', emoji: '💻', roleId: '7', roleName: 'Developer', roleColor: '#10b981' },
      { id: '4', emoji: '🎵', roleId: '8', roleName: 'Music Lover', roleColor: '#f97316' }
    ],
    requirements: [],
    ignoredRoles: [],
    enabled: true,
    createdAt: '2024-01-15T10:30:00Z',
    usageStats: {
      totalUses: 156,
      uniqueUsers: 89
    }
  },
  {
    id: 'group_2',
    name: '📚 Уровень участника',
    channelId: '2',
    channelName: 'роли',
    messageId: '2345678901234567890',
    messageContent: {
      title: '📚 Выберите ваш уровень',
      description: 'Кнопки ниже позволяют выбрать роль в зависимости от вашего уровня участия.',
      color: '#22c55e'
    },
    type: 'buttons',
    mode: 'unique',
    roles: [
      { id: '1', buttonText: 'Новичок', buttonColor: 'green', roleId: '10', roleName: 'Новичок', roleColor: '#84cc16' },
      { id: '2', buttonText: 'Участник', buttonColor: 'blue', roleId: '4', roleName: 'Участник', roleColor: '#22c55e' },
      { id: '3', buttonText: 'VIP', buttonColor: 'red', roleId: '3', roleName: 'VIP', roleColor: '#f59e0b' }
    ],
    requirements: [],
    ignoredRoles: ['1', '2'],
    enabled: true,
    createdAt: '2024-01-10T14:45:00Z',
    usageStats: {
      totalUses: 234,
      uniqueUsers: 145
    }
  },
  {
    id: 'group_3',
    name: '🔔 Уведомления',
    channelId: '4',
    channelName: 'объявления',
    messageContent: {
      title: '🔔 Управление уведомлениями',
      description: 'Выберите, какие уведомления вы хотите получать.',
      color: '#f59e0b'
    },
    type: 'reactions',
    mode: 'toggle',
    roles: [
      { id: '1', emoji: '📢', roleId: '11', roleName: 'Объявления', roleColor: '#3b82f6' },
      { id: '2', emoji: '🎉', roleId: '12', roleName: 'События', roleColor: '#22c55e' }
    ],
    requirements: ['4'],
    ignoredRoles: [],
    enabled: false,
    createdAt: '2024-01-20T09:15:00Z',
    usageStats: {
      totalUses: 45,
      uniqueUsers: 32
    }
  }
];

export function ReactionRolesProvider({ children }: ReactionRolesProviderProps) {
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>(initialRoleGroups);
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

  const addRoleGroup = (group: RoleGroup) => {
    setRoleGroups(prev => [...prev, group]);
  };

  const updateRoleGroup = (id: string, updates: Partial<RoleGroup>) => {
    setRoleGroups(prev => prev.map(group => 
      group.id === id ? { ...group, ...updates } : group
    ));
  };

  const deleteRoleGroup = (id: string) => {
    setRoleGroups(prev => prev.filter(group => group.id !== id));
  };

  const getRoleGroup = (id: string) => {
    return roleGroups.find(group => group.id === id);
  };

  const value: ReactionRolesContextType = {
    roleGroups,
    setRoleGroups,
    addRoleGroup,
    updateRoleGroup,
    deleteRoleGroup,
    getRoleGroup,
    loading,
    setLoading
  };

  return (
    <ReactionRolesContext.Provider value={value}>
      {children}
    </ReactionRolesContext.Provider>
  );
}