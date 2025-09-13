import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Smile } from 'lucide-react';

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
}

// Mock server emojis (в реальном приложении это будет API call)
const mockServerEmojis = [
  { id: '1', name: 'custom_smile', url: '😊', category: 'custom' },
  { id: '2', name: 'server_logo', url: '🏆', category: 'custom' },
  { id: '3', name: 'mod_badge', url: '🛡️', category: 'custom' },
  { id: '4', name: 'vip_crown', url: '👑', category: 'custom' },
  { id: '5', name: 'gamer_controller', url: '🎮', category: 'custom' },
  { id: '6', name: 'artist_palette', url: '🎨', category: 'custom' },
  { id: '7', name: 'dev_laptop', url: '💻', category: 'custom' },
  { id: '8', name: 'music_note', url: '🎵', category: 'custom' }
];

// Standard Unicode emoji categories
const standardEmojis = {
  people: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
    '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝',
    '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
    '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
    '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'
  ],
  activities: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸',
    '🏒', '🏑', '🥍', '🏏', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹',
    '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾',
    '🏌️', '🧘', '🏇', '🏊', '🚴', '🚵', '🧗', '🤹'
  ],
  objects: [
    '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '📷',
    '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
    '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦',
    '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳'
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
    '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯',
    '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
    '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸'
  ]
};

export function EmojiPicker({ value, onChange, placeholder = "Выберите эмодзи" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('server');

  const filteredServerEmojis = mockServerEmojis.filter(emoji =>
    emoji.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFilteredStandardEmojis = (category: keyof typeof standardEmojis) => {
    if (!searchQuery) return standardEmojis[category];
    // For standard emojis, we can't really search by name, so just return all if no search
    return standardEmojis[category];
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-20 h-12 text-lg justify-center"
          aria-label="Выбрать эмодзи"
        >
          {value || <Smile className="h-5 w-5 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск эмодзи..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              <TabsTrigger value="server" className="text-xs py-2">Сервер</TabsTrigger>
              <TabsTrigger value="people" className="text-xs py-2">Люди</TabsTrigger>
              <TabsTrigger value="activities" className="text-xs py-2">Активности</TabsTrigger>
              <TabsTrigger value="objects" className="text-xs py-2">Объекты</TabsTrigger>
              <TabsTrigger value="symbols" className="text-xs py-2">Символы</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-64">
            <TabsContent value="server" className="p-3 mt-0">
              {filteredServerEmojis.length > 0 ? (
                <div className="grid grid-cols-8 gap-2">
                  {filteredServerEmojis.map((emoji) => (
                    <Button
                      key={emoji.id}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg hover:bg-accent"
                      onClick={() => handleEmojiSelect(emoji.url)}
                      title={emoji.name}
                    >
                      {emoji.url}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {searchQuery ? 'Эмодзи не найдены' : 'Нет кастомных эмодзи'}
                </div>
              )}
            </TabsContent>

            <TabsContent value="people" className="p-3 mt-0">
              <div className="grid grid-cols-8 gap-2">
                {getFilteredStandardEmojis('people').map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-accent"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activities" className="p-3 mt-0">
              <div className="grid grid-cols-8 gap-2">
                {getFilteredStandardEmojis('activities').map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-accent"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="objects" className="p-3 mt-0">
              <div className="grid grid-cols-8 gap-2">
                {getFilteredStandardEmojis('objects').map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-accent"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="symbols" className="p-3 mt-0">
              <div className="grid grid-cols-8 gap-2">
                {getFilteredStandardEmojis('symbols').map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-accent"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="border-t p-3">
          <p className="text-xs text-muted-foreground">
            {activeTab === 'server' ? 'Эмодзи сервера' : 'Стандартные эмодзи'}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}