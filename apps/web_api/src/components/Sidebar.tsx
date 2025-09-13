import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Shield,
  Archive,
  Users,
  UserMinus,
  Settings,
  Gavel,
  Trophy,
  Crown,
  Image,
  FileText,
  Bell,
  X,
  Ticket,
  MessageSquare,
  Music,
  BarChart3,
  Zap,
  Command,
  Rss,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { SidebarProps, PageType } from '../types';

const navigationItems = [
  {
    id: 'dashboard' as PageType,
    label: 'Панель управления',
    icon: LayoutDashboard,
    description: 'Общая статистика'
  },
  {
    id: 'anti-nuke' as PageType,
    label: 'Анти-Нюк',
    icon: Shield,
    description: 'Защита от атак',
    badge: 'Активно'
  },
  {
    id: 'backups' as PageType,
    label: 'Резервные копии',
    icon: Archive,
    description: 'Бэкапы сервера'
  },
  {
    id: 'whitelist' as PageType,
    label: 'Белый список',
    icon: Users,
    description: 'Доверенные пользователи'
  },
  {
    id: 'quarantine' as PageType,
    label: 'Карантин',
    icon: UserMinus,
    description: 'Заблокированные пользователи',
    badge: '3'
  }
];

const moderationItems = [
  {
    id: 'moderation' as PageType,
    label: 'Модерация',
    icon: Gavel,
    description: 'Настройки модерации'
  },
  {
    id: 'warnings-manager' as PageType,
    label: 'Журнал предупреждений',
    icon: AlertTriangle,
    description: 'Управление варнами'
  },
  {
    id: 'user-ranking' as PageType,
    label: 'Рейтинг пользователей',
    icon: Trophy,
    description: 'Система уровней'
  },
  {
    id: 'role-system' as PageType,
    label: 'Система ролей',
    icon: Crown,
    description: 'Управление ролями'
  },
  {
    id: 'banner-manager' as PageType,
    label: 'Баннер сервера',
    icon: Image,
    description: 'Настройка баннера'
  }
];

const systemItems = [
  {
    id: 'audit-logs' as PageType,
    label: 'Аудит',
    icon: FileText,
    description: 'Логи действий'
  },
  {
    id: 'notifications' as PageType,
    label: 'Оповещения',
    icon: Bell,
    description: 'Уведомления',
    badge: '2'
  },
  {
    id: 'access-control' as PageType,
    label: 'Управление доступом',
    icon: Shield,
    description: 'Контроль доступа к панели',
    badge: 'NEW'
  },
  {
    id: 'settings' as PageType,
    label: 'Настройки',
    icon: Settings,
    description: 'Конфигурация'
  }
];

const automationItems = [
  {
    id: 'reaction-roles' as PageType,
    label: 'Роли-реакции',
    icon: Zap,
    description: 'Автоназначение ролей',
    badge: 'NEW'
  },
  {
    id: 'custom-commands' as PageType,
    label: 'Кастомные команды',
    icon: Command,
    description: 'Собственные команды'
  },
  {
    id: 'social-notifications' as PageType,
    label: 'Оповещения соцсетей',
    icon: Rss,
    description: 'Уведомления о стримах'
  }
];

const additionalItems = [
  {
    id: 'ticket-system' as PageType,
    label: 'Тикет-система',
    icon: Ticket,
    description: 'Обращения пользователей',
    badge: '5'
  },
  {
    id: 'cross-chat' as PageType,
    label: 'Межсерверный чат',
    icon: MessageSquare,
    description: 'Связь между серверами'
  },
  {
    id: 'music-bot' as PageType,
    label: 'Музыкальный бот',
    icon: Music,
    description: 'Воспроизведение музыки'
  },
  {
    id: 'server-stats' as PageType,
    label: 'Статистика сервера',
    icon: BarChart3,
    description: 'Настройка статистики'
  }
];

export function Sidebar({ currentPage, onNavigate, isMobile, isOpen }: SidebarProps) {
  // Helper function to determine which section contains the current page
  const getSectionForPage = (page: string) => {
    if (navigationItems.some(item => item.id === page)) return 'main';
    if (moderationItems.some(item => item.id === page)) return 'moderation';
    if (automationItems.some(item => item.id === page)) return 'automation';
    if (additionalItems.some(item => item.id === page)) return 'additional';
    if (systemItems.some(item => item.id === page)) return 'system';
    return 'main';
  };

  const currentSection = getSectionForPage(currentPage);

  // State for mobile collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const initialState = {
      main: false,
      moderation: true,
      automation: true,
      additional: true,
      system: true
    };

    // Auto-expand section containing current page on mobile
    if (isMobile) {
      initialState[currentSection] = false;
    }

    return initialState;
  });

  // Auto-expand section when current page changes on mobile
  useEffect(() => {
    if (isMobile) {
      const pageSection = getSectionForPage(currentPage);
      setCollapsedSections(prev => ({
        ...prev,
        [pageSection]: false
      }));
    }
  }, [currentPage, isMobile]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleAllSections = () => {
    const allCollapsed = Object.values(collapsedSections).every(collapsed => collapsed);
    const newState = allCollapsed ? false : true;
    
    setCollapsedSections({
      main: newState,
      moderation: newState,
      automation: newState,
      additional: newState,
      system: newState
    });
  };

  const allSectionsCollapsed = Object.values(collapsedSections).every(collapsed => collapsed);

  const renderNavItem = (item: typeof navigationItems[0]) => {
    const isActive = currentPage === item.id;
    
    return (
      <Button
        key={item.id}
        variant={isActive ? "secondary" : "ghost"}
        className={`w-full justify-start gap-3 h-auto p-3 ${
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onNavigate(item.id)}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium truncate">{item.label}</div>
          <div className="text-xs opacity-70 truncate">{item.description}</div>
        </div>
        {item.badge && (
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
            {item.badge}
          </Badge>
        )}
      </Button>
    );
  };

  const renderMobileSection = (
    sectionKey: string,
    title: string,
    items: typeof navigationItems,
    showSeparator = true
  ) => {
    const isCurrentSection = currentSection === sectionKey;
    const itemCount = items.length;
    
    return (
      <div key={sectionKey}>
        <Collapsible 
          open={!collapsedSections[sectionKey]} 
          onOpenChange={() => toggleSection(sectionKey)}
        >
          <CollapsibleTrigger className="w-full">
            <div className={`flex items-center justify-between w-full px-3 py-2 hover:bg-accent/50 rounded-md transition-colors ${
              isCurrentSection ? 'bg-accent/30' : ''
            }`}>
              <div className="flex items-center gap-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${
                  isCurrentSection ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {title}
                </h3>
                <Badge variant="outline" className="text-xs h-4 px-1.5">
                  {itemCount}
                </Badge>
                {isCurrentSection && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <div className="transition-transform duration-200">
                {collapsedSections[sectionKey] ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-2 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
            {items.map(renderNavItem)}
          </CollapsibleContent>
        </Collapsible>
        {showSeparator && <Separator className="my-4" />}
      </div>
    );
  };

  const renderDesktopSection = (title: string, items: typeof navigationItems, showSeparator = true) => (
    <div>
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map(renderNavItem)}
        </div>
      </div>
      {showSeparator && <Separator />}
    </div>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Mobile header */}
      {isMobile && (
        <div className="border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Citadel Warden</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(currentPage)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Toggle all sections button */}
          <div className="px-4 pb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllSections}
              className="w-full text-xs h-8"
            >
              {allSectionsCollapsed ? 'Развернуть все' : 'Свернуть все'}
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {isMobile ? (
            // Mobile layout with collapsible sections
            <div className="space-y-2">
              {renderMobileSection('main', 'Основное', navigationItems)}
              {renderMobileSection('moderation', 'Модерация', moderationItems)}
              {renderMobileSection('automation', 'Автоматизация', automationItems)}
              {renderMobileSection('additional', 'Дополнительные функции', additionalItems)}
              {renderMobileSection('system', 'Система', systemItems, false)}
            </div>
          ) : (
            // Desktop layout with always visible sections
            <>
              {renderDesktopSection('Основное', navigationItems)}
              {renderDesktopSection('Модерация', moderationItems)}
              {renderDesktopSection('Автоматизация', automationItems)}
              {renderDesktopSection('Дополнительные функции', additionalItems)}
              {renderDesktopSection('Система', systemItems, false)}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <div className="w-80 h-full border-r border-sidebar-border overflow-hidden">
        {sidebarContent}
      </div>
    );
  }

  return (
    <aside className="w-80 h-full border-r border-sidebar-border">
      {sidebarContent}
    </aside>
  );
}