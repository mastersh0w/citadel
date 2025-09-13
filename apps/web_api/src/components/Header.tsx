import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, Settings, Shield, Bell, Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLanguage } from './LanguageProvider';
import { useTranslations } from '../utils/translations';
import { HeaderProps } from '../types';

export function Header({ onNavigate, onToggleSidebar }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const t = useTranslations(language);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative h-16 px-6">
        <div className="flex h-full items-center">
          {/* Left Section - Logo */}
          <div className="flex items-center gap-2 md:gap-3 w-auto md:w-80 min-w-0">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-9 w-9 p-0 flex-shrink-0"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t('header.toggleMenu')}</span>
            </Button>
            
            {/* Logo and title */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block min-w-0">
                <h1 className="font-semibold text-foreground truncate">{t('header.botName')}</h1>
                <p className="text-xs text-muted-foreground truncate">{t('header.botDescription')}</p>
              </div>
            </div>
          </div>

          {/* Center Section - Server Info (Absolutely Centered) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                {t('header.serverName')}
              </Badge>
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                1,247 {t('header.members')}
              </Badge>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="relative h-9 w-12 p-0 flex-shrink-0 group"
              title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              <div className="flex items-center justify-center">
                <Languages className="h-3 w-3 absolute opacity-20 group-hover:opacity-40 transition-opacity" />
                <span className="text-xs font-medium relative z-10">
                  {language.toUpperCase()}
                </span>
              </div>
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 flex-shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">{t('header.toggleTheme')}</span>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('notifications')}
              className="relative h-9 w-9 p-0 flex-shrink-0"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive">
                <span className="sr-only">3 {t('header.newNotifications')}</span>
              </span>
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('settings')}
              className="h-9 w-9 p-0 flex-shrink-0"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">{t('header.settings')}</span>
            </Button>

            {/* Bot status */}
            <div className="hidden sm:flex items-center gap-2 ml-3 pl-3 border-l flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{t('header.online')}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}