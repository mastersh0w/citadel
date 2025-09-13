// apps/web_api/src/App.tsx

import React, { useState, useEffect } from 'react';
// --- ИСПРАВЛЕНИЕ ИМПОРТОВ: Используем абсолютные пути с '@' ---
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import { ReactionRolesProvider } from '@/components/ReactionRolesProvider';
import { SocialNotificationsProvider } from '@/components/SocialNotificationsProvider';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Footer } from '@/components/Footer';
import { Dashboard } from '@/components/pages/Dashboard';
import { BackupManager } from '@/components/pages/BackupManager';
import { AntiNukeSettings } from '@/components/pages/AntiNukeSettings';
import { QuarantineManager } from '@/components/pages/QuarantineManager';
import { WhitelistManager } from '@/components/pages/WhitelistManager';
import { Settings } from '@/components/pages/Settings';
import { ModerationSettings } from '@/components/pages/ModerationSettings';
import { UserRanking } from '@/components/pages/UserRanking';
import { RoleSystem } from '@/components/pages/RoleSystem';
import { BannerManager } from '@/components/pages/BannerManager';
import { AuditLogs } from '@/components/pages/AuditLogs';
import { Notifications } from '@/components/pages/Notifications';
import { TermsOfService } from '@/components/pages/TermsOfService';
import { PrivacyPolicy } from '@/components/pages/PrivacyPolicy';
import { CookiePolicy } from '@/components/pages/CookiePolicy';
import { AccessControl } from '@/components/pages/AccessControl';
import { TicketSystem } from '@/components/pages/TicketSystem';
import { CrossChat } from '@/components/pages/CrossChat';
import { MusicBot } from '@/components/pages/MusicBot';
import { ServerStats } from '@/components/pages/ServerStats';
import { ReactionRoles } from '@/components/pages/ReactionRoles';
import { ReactionRolesWizard } from '@/components/pages/ReactionRolesWizard';
import { CustomCommands } from '@/components/pages/CustomCommands';
import { SocialNotifications } from '@/components/pages/SocialNotifications';
import { SocialNotificationsWizard } from '@/components/pages/SocialNotificationsWizard';
import { WarningsManager } from '@/components/pages/WarningsManager';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Toaster } from '@/components/ui/sonner';

type PageType = 'dashboard' | 'anti-nuke' | 'backups' | 'whitelist' | 'quarantine' | 'moderation' | 'user-ranking' | 'role-system' | 'banner-manager' | 'audit-logs' | 'notifications' | 'access-control' | 'settings' | 'terms' | 'privacy' | 'cookies' | 'ticket-system' | 'cross-chat' | 'music-bot' | 'server-stats' | 'reaction-roles' | 'reaction-roles-wizard' | 'custom-commands' | 'social-notifications' | 'social-notifications-wizard' | 'warnings-manager';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=Nunito:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Work+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Source+Serif+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@300;400;500;600;700&family=Source+Code+Pro:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=JetBrains+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Oswald:wght@200;300;400;500;600;700&family=Bebas+Neue&family=Anton&family=Bangers&family=Righteous&family=Fredoka+One&family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Comfortaa:wght@300;400;500;600;700&family=Russo+One&family=Dancing+Script:wght@400;500;600;700&family=Pacifico&family=Lobster&family=Caveat:wght@400;500;600;700&family=Shadows+Into+Light&display=swap';
    link.rel = 'stylesheet';
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      document.head.appendChild(link);
    }
  }, []);

  const [editingGroupId, setEditingGroupId] = useState<string | undefined>();
  const [editingNotificationId, setEditingNotificationId] = useState<string | undefined>();

  const handleNavigate = (page: PageType | string) => {
    if (page.includes('?edit=')) {
      const [pageName, params] = page.split('?');
      const editId = params.split('=')[1];
      if (pageName === 'reaction-roles-wizard') {
        setEditingGroupId(editId);
        setEditingNotificationId(undefined);
      } else if (pageName === 'social-notifications-wizard') {
        setEditingNotificationId(editId);
        setEditingGroupId(undefined);
      }
      setCurrentPage(pageName as PageType);
    } else {
      const pageName = page.includes('?') ? page.split('?')[0] : page;
      setEditingGroupId(undefined);
      setEditingNotificationId(undefined);
      setCurrentPage(pageName as PageType);
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
    window.scrollTo(0, 0);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'anti-nuke': return <AntiNukeSettings />;
      case 'backups': return <BackupManager />;
      case 'whitelist': return <WhitelistManager />;
      case 'quarantine': return <QuarantineManager />;
      case 'moderation': return <ModerationSettings onNavigate={handleNavigate} />;
      case 'user-ranking': return <UserRanking />;
      case 'role-system': return <RoleSystem />;
      case 'banner-manager': return <BannerManager />;
      case 'audit-logs': return <AuditLogs />;
      case 'notifications': return <Notifications />;
      case 'access-control': return <AccessControl />;
      case 'ticket-system': return <TicketSystem />;
      case 'cross-chat': return <CrossChat />;
      case 'music-bot': return <MusicBot />;
      case 'server-stats': return <ServerStats />;
      case 'reaction-roles': return <ReactionRoles onNavigate={handleNavigate} />;
      case 'reaction-roles-wizard': return <ReactionRolesWizard onNavigate={handleNavigate} editingGroupId={editingGroupId} />;
      case 'custom-commands': return <CustomCommands />;
      case 'social-notifications': return <SocialNotifications onNavigate={handleNavigate} />;
      case 'social-notifications-wizard': return <SocialNotificationsWizard onNavigate={handleNavigate} editingNotificationId={editingNotificationId} />;
      case 'warnings-manager': return <WarningsManager />;
      case 'settings': return <Settings />;
      case 'terms': return <TermsOfService onNavigate={handleNavigate} />;
      case 'privacy': return <PrivacyPolicy onNavigate={handleNavigate} />;
      case 'cookies': return <CookiePolicy onNavigate={handleNavigate} />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ReactionRolesProvider>
          <SocialNotificationsProvider>
            <div className="min-h-screen bg-background flex flex-col">
              <Header onNavigate={handleNavigate} onToggleSidebar={toggleSidebar} />
              <div className="flex flex-1 relative">
                <div className="hidden md:block">
                  <Sidebar currentPage={currentPage} onNavigate={handleNavigate} isMobile={false} isOpen={true} />
                </div>
                <main className="flex-1 overflow-auto w-full min-w-0 relative">
                  <div className="h-full min-h-0">{renderCurrentPage()}</div>
                </main>
                {isMobile && sidebarOpen && (
                  <>
                    <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} style={{ pointerEvents: 'all' }} />
                    <div className="fixed left-0 top-0 h-full z-50 md:hidden" style={{ pointerEvents: 'all' }}>
                      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} isMobile={true} isOpen={sidebarOpen} />
                    </div>
                  </>
                )}
              </div>
              <Footer onNavigate={handleNavigate} />
              <ScrollToTop />
              <Toaster position="top-right" />
            </div>
          </SocialNotificationsProvider>
        </ReactionRolesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}