import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Code,
  Hash,
  AtSign,
  Crown,
  Calendar,
  Clock,
  ChevronDown,
  Plus
} from 'lucide-react';

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  eventType: string;
  label?: string;
}

const MACROS = {
  user: {
    label: 'Пользователь',
    description: 'Имя пользователя',
    icon: <AtSign className="h-3 w-3" />,
    variables: [
      { key: '{user}', desc: 'Имя пользователя' },
      { key: '{user.mention}', desc: 'Упоминание пользователя' },
      { key: '{user.id}', desc: 'ID пользователя' },
      { key: '{user.tag}', desc: 'Тег пользователя (Name#1234)' },
      { key: '{user.avatar}', desc: 'Ссылка на аватар' },
      { key: '{user.created}', desc: 'Дата создания аккаунта' },
      { key: '{user.joined}', desc: 'Дата присоединения к серверу' }
    ]
  },
  server: {
    label: 'Сервер',
    description: 'Информация о сервере',
    icon: <Hash className="h-3 w-3" />,
    variables: [
      { key: '{server}', desc: 'Название сервера' },
      { key: '{server.id}', desc: 'ID сервера' },
      { key: '{server.icon}', desc: 'Иконка сервера' },
      { key: '{server.members}', desc: 'Количество участников' },
      { key: '{server.channels}', desc: 'Количество каналов' },
      { key: '{server.roles}', desc: 'Количество ролей' },
      { key: '{server.boosts}', desc: 'Количество бустов' }
    ]
  },
  moderator: {
    label: 'Модератор',
    description: 'Информация о модераторе',
    icon: <Crown className="h-3 w-3" />,
    variables: [
      { key: '{moderator}', desc: 'Имя модератора' },
      { key: '{moderator.mention}', desc: 'Упоминание модератора' },
      { key: '{moderator.id}', desc: 'ID модератора' },
      { key: '{moderator.tag}', desc: 'Тег модератора' }
    ]
  },
  datetime: {
    label: 'Дата и время',
    description: 'Временные метки',
    icon: <Calendar className="h-3 w-3" />,
    variables: [
      { key: '{date}', desc: 'Текущая дата' },
      { key: '{time}', desc: 'Текущее время' },
      { key: '{datetime}', desc: 'Дата и время' },
      { key: '{timestamp}', desc: 'Unix timestamp' },
      { key: '{relative}', desc: 'Относительное время' }
    ]
  },
  action: {
    label: 'Действие',
    description: 'Информация о действии',
    icon: <Clock className="h-3 w-3" />,
    variables: [
      { key: '{reason}', desc: 'Причина действия' },
      { key: '{duration}', desc: 'Длительность' },
      { key: '{channel}', desc: 'Канал' },
      { key: '{role}', desc: 'Роль' },
      { key: '{action}', desc: 'Тип действия' }
    ]
  }
};

const FORMATTING_BUTTONS = [
  { icon: Bold, label: 'Жирный', wrap: '**', shortcut: 'Ctrl+B' },
  { icon: Italic, label: 'Курсив', wrap: '*', shortcut: 'Ctrl+I' },
  { icon: Underline, label: 'Подчеркнутый', wrap: '__', shortcut: 'Ctrl+U' },
  { icon: Strikethrough, label: 'Зачеркнутый', wrap: '~~', shortcut: 'Ctrl+Shift+X' },
  { icon: Code, label: 'Код', wrap: '`', shortcut: 'Ctrl+E' }
];

export function MessageEditor({ value, onChange, placeholder, eventType, label }: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
    }
  };

  const insertText = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const wrapSelection = (wrapper: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText;
    if (selectedText) {
      newText = `${wrapper}${selectedText}${wrapper}`;
    } else {
      newText = `${wrapper}${wrapper}`;
    }
    
    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + wrapper.length, end + wrapper.length);
      } else {
        textarea.setSelectionRange(start + wrapper.length, start + wrapper.length);
      }
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Введите URL:');
    if (url) {
      const linkText = selectionStart !== selectionEnd 
        ? value.substring(selectionStart, selectionEnd)
        : 'ссылка';
      insertText(`[${linkText}](${url})`);
    }
  };

  // Filter macros based on event type
  const getAvailableMacros = () => {
    const baseMacros = ['user', 'server', 'datetime'];
    
    if (['memberBan', 'memberKick', 'memberTimeout'].includes(eventType)) {
      return [...baseMacros, 'moderator', 'action'];
    }
    
    if (['channelCreate', 'channelDelete', 'roleCreate', 'roleDelete'].includes(eventType)) {
      return [...baseMacros, 'moderator', 'action'];
    }
    
    return baseMacros;
  };

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}
      
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md bg-muted/30">
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          {FORMATTING_BUTTONS.map(({ icon: Icon, label, wrap, shortcut }) => (
            <Button
              key={label}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => wrapSelection(wrap)}
              title={`${label} (${shortcut})`}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Link Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={insertLink}
          title="Вставить ссылку"
        >
          <Link className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Macros Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 h-8">
              <Plus className="h-4 w-4" />
              Макросы
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3">
              <h4 className="font-medium mb-3">Доступные макросы</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {getAvailableMacros().map(macroKey => {
                  const macro = MACROS[macroKey as keyof typeof MACROS];
                  return (
                    <div key={macroKey} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {macro.icon}
                        {macro.label}
                      </div>
                      <div className="grid gap-1">
                        {macro.variables.map(variable => (
                          <Button
                            key={variable.key}
                            variant="ghost"
                            size="sm"
                            className="justify-start h-auto p-2"
                            onClick={() => insertText(variable.key)}
                          >
                            <div className="text-left">
                              <div className="font-mono text-xs text-primary">
                                {variable.key}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {variable.desc}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                      {macroKey !== getAvailableMacros()[getAvailableMacros().length - 1] && (
                        <Separator />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Text Area */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onClick={handleSelectionChange}
        placeholder={placeholder}
        className="min-h-[120px] resize-y font-mono text-sm"
        onKeyDown={(e) => {
          // Handle keyboard shortcuts
          if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
              case 'b':
                e.preventDefault();
                wrapSelection('**');
                break;
              case 'i':
                e.preventDefault();
                wrapSelection('*');
                break;
              case 'u':
                e.preventDefault();
                wrapSelection('__');
                break;
              case 'e':
                e.preventDefault();
                wrapSelection('`');
                break;
            }
          }
          if (e.ctrlKey && e.shiftKey && e.key === 'X') {
            e.preventDefault();
            wrapSelection('~~');
          }
        }}
      />

      {/* Preview */}
      {value && (
        <div className="space-y-2">
          <Label className="text-xs">Предварительный просмотр:</Label>
          <div className="p-3 border rounded-md bg-muted/30 text-sm">
            <div 
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{
                __html: value
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/__(.*?)__/g, '<u>$1</u>')
                  .replace(/~~(.*?)~~/g, '<del>$1</del>')
                  .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
                  .replace(/\{([^}]+)\}/g, '<span class="bg-primary/20 px-1 rounded text-primary font-mono text-xs">{$1}</span>')
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Macros */}
      <div className="flex flex-wrap gap-1">
        <Label className="text-xs text-muted-foreground mr-2">Быстрые макросы:</Label>
        {getAvailableMacros().slice(0, 2).map(macroKey => {
          const macro = MACROS[macroKey as keyof typeof MACROS];
          return macro.variables.slice(0, 3).map(variable => (
            <Badge
              key={variable.key}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 text-xs"
              onClick={() => insertText(variable.key)}
            >
              {variable.key}
            </Badge>
          ));
        })}
      </div>
    </div>
  );
}