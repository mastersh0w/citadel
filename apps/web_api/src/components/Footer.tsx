import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, Heart, Github, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const handleLegalClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer className="border-t bg-background">
      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Top Row - Brand and Status */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left side - Brand and info */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-semibold">Citadel Warden</span>
                <Badge variant="outline" className="text-xs">
                  v2.0.0
                </Badge>
              </div>
              
              <Separator orientation="vertical" className="hidden md:block h-4" />
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Сделано с</span>
                <Heart className="h-3 w-3 text-red-500" />
                <span>для Discord сообществ</span>
              </div>
            </div>

            {/* Right side - Bot Status */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground">
                Бот онлайн • Пинг: 42ms
              </span>
            </div>
          </div>

          <Separator />

          {/* Middle Row - Social Links */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
              <span className="text-sm font-medium text-foreground">Социальные сети:</span>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Discord */}
                <a
                  href="https://discord.gg/citadel-warden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#5865F2] transition-colors"
                  title="Discord сервер"
                >
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  <span className="hidden sm:inline">Discord</span>
                </a>

                {/* Patreon */}
                <a
                  href="https://patreon.com/citadelwarden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#FF424D] transition-colors"
                  title="Поддержать на Patreon"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 .48v23.04h4.22V.48H0zm15.385 0c-4.764 0-8.641 3.88-8.641 8.65 0 4.755 3.877 8.623 8.641 8.623 4.75 0 8.615-3.868 8.615-8.623C24 4.36 20.136.48 15.385.48z"/>
                  </svg>
                  <span className="hidden sm:inline">Patreon</span>
                </a>

                {/* Boosty */}
                <a
                  href="https://boosty.to/citadelwarden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#F15F2C] transition-colors"
                  title="Поддержать на Boosty"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zM12 4.2L19.5 8 12 11.8 4.5 8 12 4.2zM4 9.5l7 3.5v7l-7-3.5v-7zm16 0v7l-7 3.5v-7l7-3.5z"/>
                  </svg>
                  <span className="hidden sm:inline">Boosty</span>
                </a>

                {/* VK */}
                <a
                  href="https://vk.com/citadelwarden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#0077FF] transition-colors"
                  title="ВКонтакте"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-.908-1.49.408v1.573c0 .4-.129.645-1.188.645-1.743 0-3.675-1.09-5.031-3.114C6.533 11.369 5.659 7.188 7.686 7.188c.817 0 1.13.645 1.45 1.319.4.844 1.379 3.149 2.16 2.478.781-.67-.09-2.478-.09-3.148 0-.645.129-.9.516-.9 1.09 0 3.114 2.478 4.163 4.126.649 1.01.452 1.645-.452 1.645z"/>
                  </svg>
                  <span className="hidden sm:inline">VKontakte</span>
                </a>

                {/* Top.gg */}
                <a
                  href="https://top.gg/bot/citadel-warden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#FF3366] transition-colors"
                  title="Голосовать на Top.gg"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="hidden sm:inline">Top.gg</span>
                </a>
              </div>
            </div>

            {/* Development Links */}
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://github.com/citadel-warden/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-3 w-3 flex-shrink-0" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              
              <a
                href="https://docs.citadel-warden.bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="hidden sm:inline">Документация</span>
              </a>
            </div>
          </div>

          <Separator />

          {/* Bottom Row - Legal Links */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-muted-foreground">
              © 2024 Citadel Warden. Все права защищены.
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <button
                onClick={() => handleLegalClick('terms')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Условия использования
              </button>
              <button
                onClick={() => handleLegalClick('privacy')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Конфиденциальность
              </button>
              <button
                onClick={() => handleLegalClick('cookies')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Файлы Cookie
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}