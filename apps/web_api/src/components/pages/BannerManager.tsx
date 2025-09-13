import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  FileImage,
  Crop,
  Settings,
  Users,
  Hash,
  Crown,
  Star,
  Activity,
  Calendar,
  Monitor,
  Shield,
  GripVertical,
  Palette,
  CircleSlash,
  Play,
  Pause,
  Smartphone,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { api } from '@/utils/api';
import { toast } from 'sonner';

// Константы
const MAX_PARAMETERS = 3;

// Типы для параметров баннера
interface BannerParameter {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  value: string | number;
  enabled: boolean;
}

interface ParameterPosition {
  x: number; // Координата X в процентах (0-100)
  y: number; // Координата Y в процентах (0-100)
}

interface ParameterStyle {
  fontFamily: string;
  fontSize: string; // Теперь используем точные значения в пикселях
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  backgroundOpacity: number; // Непрозрачность фона (0-100)
  backgroundColor: string; // Цвет фона в формате hex
}

interface BannerSettings {
  showParameters: boolean;
  parameters: BannerParameter[];
  selectedParameters: string[];
  parameterPositions: Record<string, ParameterPosition>; // Позиции параметров на баннере
  parameterStyles: Record<string, ParameterStyle>; // Стили для каждого параметра
  textSize: 'small' | 'medium' | 'large'; // Глобальная настройка (устаревшая, но оставляем для совместимости)
  displayMode: 'full' | 'compact'; // full = "Участники онлайн: 342", compact = "342"
  autoUpdateInterval: 5 | 10 | 20 | 30; // Интервал автообновления в минутах
}

// Типы для drag and drop на баннере
interface BannerDragItem {
  id: string;
  type: string;
  originalPosition: ParameterPosition;
}

// Draggable Parameter на баннере
interface BannerParameterProps {
  param: BannerParameter;
  position: ParameterPosition;
  displayMode: 'full' | 'compact';
  style: ParameterStyle;
  onMove: (id: string, position: ParameterPosition) => void;
}

const BannerParameter: React.FC<BannerParameterProps> = React.memo(({
  param,
  position,
  displayMode,
  style,
  onMove
}) => {
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'banner-parameter',
    item: () => {
      // Сохраняем начальную позицию для возврата в случае неудачного drop
      return { 
        id: param.id, 
        type: 'banner-parameter', 
        originalPosition: position 
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      setDragOffset(null);
      if (!monitor.didDrop()) {
        console.log('Drop failed, element will return to original position');
        // Возвращаем элемент на исходную позицию при неудачном drop
        onMove(item.id, item.originalPosition);
      } else {
        console.log('Drop successful');
      }
    },
  });

  const getFontWeightClass = useMemo(() => {
    switch (style.fontWeight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-medium';
    }
  }, [style.fontWeight]);

  const getPaddingClass = useMemo(() => {
    const fontSize = parseInt(style.fontSize);
    if (fontSize <= 12) return 'px-2 py-1';
    if (fontSize <= 16) return 'px-3 py-1.5';
    if (fontSize <= 24) return 'px-3 py-2';
    if (fontSize <= 36) return 'px-4 py-2.5';
    if (fontSize <= 48) return 'px-5 py-3';
    return 'px-6 py-4';
  }, [style.fontSize]);

  const getBackgroundStyle = useMemo(() => {
    const opacity = style.backgroundOpacity / 100;
    let hexColor = style.backgroundColor;
    
    // Валидация и корректировка hex цвета
    if (!hexColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      hexColor = '#000000'; // Fallback цвет
    }
    
    // Конвертируем hex в rgba
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }, [style.backgroundOpacity, style.backgroundColor]);

  const getDisplayText = useMemo(() => {
    if (displayMode === 'compact') {
      return param.value.toString();
    }
    return `${param.name}: ${param.value}`;
  }, [displayMode, param.name, param.value]);

  const positionStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)', // Центрируем элемент относительно позиции
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Плавный переход только когда не перетаскиваем
  }), [position.x, position.y, style.fontFamily, style.fontSize, isDragging]);

  return (
    <div
      ref={drag}
      className={`group flex items-center gap-2 backdrop-blur-md rounded-lg border border-white/20 shadow-lg cursor-move z-20 select-none relative ${
        isDragging 
          ? 'opacity-70 scale-105 shadow-2xl border-primary/60 ring-2 ring-primary/30' 
          : 'opacity-100 hover:scale-102 hover:border-primary/30 hover:shadow-xl'
      } ${getPaddingClass}`}
      style={{
        ...positionStyle,
        backgroundColor: getBackgroundStyle,
        transform: `${positionStyle.transform} ${isDragging ? 'rotate(2deg)' : 'rotate(0deg)'}`,
      }}
    >
      {displayMode === 'full' && param.icon}
      <span className={`text-white whitespace-nowrap ${getFontWeightClass}`}>
        {getDisplayText}
      </span>
      
      {/* Центральная точка позиционирования - видна только при hover или drag */}
      <div className={`absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-200 ${
        isDragging ? 'opacity-90' : 'opacity-0 group-hover:opacity-60'
      }`} />
      
      {/* Индикатор перетаскивания */}
      {isDragging && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-pulse border-2 border-white shadow-lg">
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
        </div>
      )}
      
      {/* Подсказка при hover */}
      {!isDragging && (
        <div className="absolute inset-0 rounded-lg border-2 border-transparent hover:border-primary/40 pointer-events-none transition-all duration-200" />
      )}
      
      {/* Направляющие линии при перетаскивании */}
      {isDragging && (
        <>
          <div className="absolute top-1/2 left-full w-screen h-px bg-primary/30 pointer-events-none -translate-y-1/2" />
          <div className="absolute left-1/2 top-full h-screen w-px bg-primary/30 pointer-events-none -translate-x-1/2" />
        </>
      )}
    </div>
  );
});

BannerParameter.displayName = 'BannerParameter';

// Простой Parameter для списка выбора
interface SimpleParameterProps {
  param: BannerParameter;
  onToggle: (id: string, enabled: boolean) => void;
  disabled: boolean;
}

const SimpleParameter: React.FC<SimpleParameterProps> = React.memo(({
  param,
  onToggle,
  disabled
}) => {
  const handleToggle = useCallback((enabled: boolean) => {
    onToggle(param.id, enabled);
  }, [param.id, onToggle]);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {param.icon}
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{param.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {param.description}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge variant="outline" className="font-mono">
          {param.value}
        </Badge>
        <Switch
          checked={param.enabled}
          onCheckedChange={handleToggle}
          disabled={disabled}
        />
      </div>
    </div>
  );
});

SimpleParameter.displayName = 'SimpleParameter';

// Banner Drop Zone Component - исправленная версия
interface BannerDropZoneProps {
  children: React.ReactNode;
  onMove: (id: string, position: ParameterPosition) => void;
}

const BannerDropZone: React.FC<BannerDropZoneProps> = ({ children, onMove }) => {
  const dropRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'banner-parameter',
    drop: (item: BannerDragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (clientOffset && dropRef.current) {
        const rect = dropRef.current.getBoundingClientRect();
        
        // Вычисляем относительную позицию в процентах
        let x = ((clientOffset.x - rect.left) / rect.width) * 100;
        let y = ((clientOffset.y - rect.top) / rect.height) * 100;
        
        // Привязка к сетке 2.5% для более плавного позиционирования
        const gridSize = 2.5;
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
        
        // Ограничиваем в пределах баннера с учетом размера элемента
        const clampedX = Math.max(10, Math.min(90, x));
        const clampedY = Math.max(10, Math.min(90, y));
        
        console.log('Drop detected:', { 
          id: item.id, 
          originalPos: item.originalPosition,
          newPos: { x: clampedX, y: clampedY },
          rawPos: { x, y },
          clientOffset,
          rect: { width: rect.width, height: rect.height }
        });
        
        onMove(item.id, { x: clampedX, y: clampedY });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Объединяем refs
  const combinedRef = useCallback((node: HTMLDivElement) => {
    dropRef.current = node;
    drop(node);
  }, [drop]);

  return (
    <div 
      ref={combinedRef} 
      className={`w-full h-full relative transition-all duration-200 ${
        isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
      }`}
    >
      {children}
    </div>
  );
};

// Компонент настроек стилей параметра
interface ParameterStyleEditorProps {
  param: BannerParameter;
  style: ParameterStyle;
  onStyleChange: (style: ParameterStyle) => void;
  displayMode: 'full' | 'compact';
}

const ParameterStyleEditor: React.FC<ParameterStyleEditorProps> = ({
  param,
  style,
  onStyleChange,
  displayMode
}) => {
  const [expanded, setExpanded] = useState(false);

  // Динамический максимальный размер шрифта
  const maxFontSize = displayMode === 'compact' ? 100 : 48;

  // Расширенный список шрифтов
  const fontOptions = [
    // Системные шрифты
    { value: 'Inter', label: 'Inter (Системный)' },
    { value: 'Arial', label: 'Arial (Системный)' },
    { value: 'Helvetica', label: 'Helvetica (Системный)' },
    { value: 'Times New Roman', label: 'Times New Roman (Системный)' },
    { value: 'Georgia', label: 'Georgia (Системный)' },
    { value: 'Verdana', label: 'Verdana (Системный)' },
    { value: 'Tahoma', label: 'Tahoma (Системный)' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS (Системный)' },
    { value: 'Courier New', label: 'Courier New (Системный)' },
    { value: 'Lucida Console', label: 'Lucida Console (Системный)' },
    
    // Google Fonts - Sans Serif
    { value: 'Roboto', label: 'Roboto (Google)' },
    { value: 'Open Sans', label: 'Open Sans (Google)' },
    { value: 'Lato', label: 'Lato (Google)' },
    { value: 'Montserrat', label: 'Montserrat (Google)' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro (Google)' },
    { value: 'Raleway', label: 'Raleway (Google)' },
    { value: 'Ubuntu', label: 'Ubuntu (Google)' },
    { value: 'Nunito', label: 'Nunito (Google)' },
    { value: 'Poppins', label: 'Poppins (Google)' },
    { value: 'Work Sans', label: 'Work Sans (Google)' },
    { value: 'Fira Sans', label: 'Fira Sans (Google)' },
    { value: 'IBM Plex Sans', label: 'IBM Plex Sans (Google)' },
    
    // Google Fonts - Serif
    { value: 'Playfair Display', label: 'Playfair Display (Google)' },
    { value: 'Merriweather', label: 'Merriweather (Google)' },
    { value: 'Lora', label: 'Lora (Google)' },
    { value: 'PT Serif', label: 'PT Serif (Google)' },
    { value: 'Crimson Text', label: 'Crimson Text (Google)' },
    { value: 'Source Serif Pro', label: 'Source Serif Pro (Google)' },
    { value: 'Libre Baskerville', label: 'Libre Baskerville (Google)' },
    
    // Google Fonts - Monospace
    { value: 'Fira Code', label: 'Fira Code (Google)' },
    { value: 'Source Code Pro', label: 'Source Code Pro (Google)' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono (Google)' },
    { value: 'IBM Plex Mono', label: 'IBM Plex Mono (Google)' },
    { value: 'Roboto Mono', label: 'Roboto Mono (Google)' },
    
    // Google Fonts - Display/Decorative
    { value: 'Oswald', label: 'Oswald (Google)' },
    { value: 'Bebas Neue', label: 'Bebas Neue (Google)' },
    { value: 'Anton', label: 'Anton (Google)' },
    { value: 'Bangers', label: 'Bangers (Google)' },
    { value: 'Righteous', label: 'Righteous (Google)' },
    { value: 'Fredoka One', label: 'Fredoka One (Google)' },
    { value: 'Orbitron', label: 'Orbitron (Google)' },
    { value: 'Exo 2', label: 'Exo 2 (Google)' },
    { value: 'Comfortaa', label: 'Comfortaa (Google)' },
    { value: 'Russo One', label: 'Russo One (Google)' },
    
    // Google Fonts - Handwriting/Script
    { value: 'Dancing Script', label: 'Dancing Script (Google)' },
    { value: 'Pacifico', label: 'Pacifico (Google)' },
    { value: 'Lobster', label: 'Lobster (Google)' },
    { value: 'Caveat', label: 'Caveat (Google)' },
    { value: 'Shadows Into Light', label: 'Shadows Into Light (Google)' }
  ];

  return (
    <div className="border rounded-lg">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {param.icon}
          <span className="font-medium">{param.name}</span>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </div>
      
      {expanded && (
        <div className="p-4 border-t space-y-4">
          <div className="space-y-2">
            <Label>Шрифт</Label>
            <Select 
              value={style.fontFamily} 
              onValueChange={(value) => onStyleChange({ ...style, fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Размер шрифта: {style.fontSize}</Label>
              <Badge variant="outline" className="text-xs">
                Макс: {maxFontSize}px {displayMode === 'compact' ? '(только цифры)' : '(с описанием)'}
              </Badge>
            </div>
            <Slider
              value={[parseInt(style.fontSize)]}
              onValueChange={([value]) => onStyleChange({ ...style, fontSize: `${value}px` })}
              min={8}
              max={maxFontSize}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>8px</span>
              <span>{maxFontSize}px</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Жирность шрифта</Label>
            <Select 
              value={style.fontWeight} 
              onValueChange={(value: any) => onStyleChange({ ...style, fontWeight: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (400)</SelectItem>
                <SelectItem value="medium">Medium (500)</SelectItem>
                <SelectItem value="semibold">Semibold (600)</SelectItem>
                <SelectItem value="bold">Bold (700)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Цвет фона</Label>
            <Input
              type="color"
              value={style.backgroundColor}
              onChange={(e) => onStyleChange({ ...style, backgroundColor: e.target.value })}
              className="w-full h-10"
            />
          </div>

          <div className="space-y-2">
            <Label>Прозрачность фона: {style.backgroundOpacity}%</Label>
            <Slider
              value={[style.backgroundOpacity]}
              onValueChange={([value]) => onStyleChange({ ...style, backgroundOpacity: value })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% (Прозрачный)</span>
              <span>100% (Непрозрачный)</span>
            </div>
          </div>

          {/* Предпросмотр стиля */}
          <div className="space-y-2">
            <Label>Предпросмотр</Label>
            <div className="p-3 rounded-lg border bg-muted/20 text-center">
              <div 
                className="inline-block px-3 py-2 rounded-lg"
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: Math.min(parseInt(style.fontSize), 24) + 'px', // Ограничиваем для предпросмотра
                  fontWeight: style.fontWeight,
                  backgroundColor: `rgba(${parseInt(style.backgroundColor.slice(1, 3), 16)}, ${parseInt(style.backgroundColor.slice(3, 5), 16)}, ${parseInt(style.backgroundColor.slice(5, 7), 16)}, ${style.backgroundOpacity / 100})`,
                  color: 'white'
                }}
              >
                {displayMode === 'compact' ? param.value.toString() : `${param.name}: ${param.value}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент мобильного предупреждения
const MobileBannerWarning: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Smartphone className="h-5 w-5" />
            Баннер сервера
          </CardTitle>
          <CardDescription>
            Настройка баннера сервера
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Monitor className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Рекомендуется использовать ПК</p>
                <p className="text-sm">
                  Настройка баннера включает сложные функции редактирования с перетаскиванием элементов, 
                  детальные настройки стилей и позиционирование объектов. Для удобства использования 
                  всех возможностей рекомендуется открыть эту страницу на компьютере.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Загрузка баннера</div>
                  <div className="text-sm text-muted-foreground">Доступно на ПК</div>
                </div>
              </div>
              <Badge variant="secondary">ПК</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Перетаскивание элементов</div>
                  <div className="text-sm text-muted-foreground">Доступно на ПК</div>
                </div>
              </div>
              <Badge variant="secondary">ПК</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Детальные настройки стилей</div>
                  <div className="text-sm text-muted-foreground">Доступно на ПК</div>
                </div>
              </div>
              <Badge variant="secondary">ПК</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Позиционирование элементов</div>
                  <div className="text-sm text-muted-foreground">Доступно на ПК</div>
                </div>
              </div>
              <Badge variant="secondary">ПК</Badge>
            </div>
          </div>

          <Separator />

          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Открыть на компьютере для полного функционала
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Monitor className="h-4 w-4 mr-2" />
              Требуется ПК
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export function BannerManager() {
  // All state hooks first - must be called in the same order every render
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnimatedBanner, setIsAnimatedBanner] = useState(false);
  const [bannerEditMode, setBannerEditMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // All memos and callbacks - must be called in the same order every render
  const initialParameters: BannerParameter[] = useMemo(() => [
    {
      id: 'online-members',
      name: 'Участники онлайн',
      description: 'Количество участников в сети',
      icon: <Activity className="h-4 w-4" />,
      value: 342,
      enabled: false
    },
    {
      id: 'total-members',
      name: 'Всего участников',
      description: 'Общее количество участников сервера',
      icon: <Users className="h-4 w-4" />,
      value: 1547,
      enabled: false
    },
    {
      id: 'channels',
      name: 'Количество каналов',
      description: 'Общее количество каналов',
      icon: <Hash className="h-4 w-4" />,
      value: 28,
      enabled: false
    },
    {
      id: 'roles',
      name: 'Количество ролей',
      description: 'Общее количество ролей на сервере',
      icon: <Crown className="h-4 w-4" />,
      value: 15,
      enabled: false
    },
    {
      id: 'boosts',
      name: 'Server Boosts',
      description: 'Количество бустов сервера',
      icon: <Star className="h-4 w-4" />,
      value: 7,
      enabled: false
    },
    {
      id: 'creation-date',
      name: 'Дата создания',
      description: 'Дата создания сервера',
      icon: <Calendar className="h-4 w-4" />,
      value: '12.03.2021',
      enabled: false
    },
    {
      id: 'voice-members',
      name: 'В голосовых каналах',
      description: 'Участники в голосовых каналах',
      icon: <Monitor className="h-4 w-4" />,
      value: 23,
      enabled: false
    },
    {
      id: 'security-level',
      name: 'Уровень безопасности',
      description: 'Текущий уровень защиты сервера',
      icon: <Shield className="h-4 w-4" />,
      value: 'Высокий',
      enabled: false
    }
  ], []);

  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({
    showParameters: false,
    parameters: initialParameters,
    selectedParameters: [],
    parameterPositions: {},
    parameterStyles: {},
    textSize: 'medium',
    displayMode: 'full',
    autoUpdateInterval: 10
  });

  const isAnimatedFormat = useCallback((file: File): boolean => {
    return file.type === 'image/gif' || file.type === 'image/webp';
  }, []);

  const checkIfAnimatedBanner = useCallback((url: string) => {
    if (!url || typeof url !== 'string') return false;
    const parts = url.toLowerCase().split('.');
    if (parts.length < 2) return false; // Нет расширения файла
    const extension = parts[parts.length - 1];
    return extension === 'gif' || extension === 'webp';
  }, []);

  const enabledParameters = useMemo(() => 
    bannerSettings.parameters.filter(p => p.enabled), 
    [bannerSettings.parameters]
  );

  // All functions for managing parameters
  const handleParameterToggle = useCallback(async (id: string, enabled: boolean) => {
    // Вычисляем текущее количество включенных параметров из bannerSettings
    const currentEnabledCount = bannerSettings.parameters.filter(p => p.enabled).length;
    
    // Проверяем лимит при включении параметра
    if (enabled && currentEnabledCount >= MAX_PARAMETERS) {
      toast.error(`Можно выбрать максимум ${MAX_PARAMETERS} параметра`);
      return;
    }

    setBannerSettings(prev => ({
      ...prev,
      parameters: prev.parameters.map(param =>
        param.id === id ? { ...param, enabled } : param
      ),
      selectedParameters: enabled
        ? [...prev.selectedParameters, id]
        : prev.selectedParameters.filter(paramId => paramId !== id)
    }));

    try {
      await api.banner.updateParameterStatus(id, enabled);
      toast.success(enabled ? 'Параметр добавлен на баннер' : 'Параметр удален с баннера');
    } catch (error) {
      console.error('Error updating parameter:', error);
      toast.error('Ошибка при обновлении параметра');
    }
  }, [bannerSettings.parameters]);

  const handleParameterMove = useCallback((id: string, position: ParameterPosition) => {
    setBannerSettings(prev => ({
      ...prev,
      parameterPositions: {
        ...prev.parameterPositions,
        [id]: position
      }
    }));
  }, []);

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка размера файла (8 МБ)
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 8 МБ');
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    setUploading(true);
    setIsAnimatedBanner(isAnimatedFormat(file));

    try {
      // Создаем preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Имитируем загрузку файла
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await api.banner.uploadBanner(file);
      if (response.success) {
        setCurrentBanner(response.data);
        setPreviewUrl(null);
        toast.success('Баннер успешно загружен');
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Ошибка при загрузке баннера');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Очищаем input
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [isAnimatedFormat]);

  const handleSave = useCallback(async () => {
    try {
      await api.banner.saveBannerSettings(bannerSettings);
      toast.success('Настройки баннера сохранены');
    } catch (error) {
      console.error('Error saving banner settings:', error);
      toast.error('Ошибка при сохранении настроек');
    }
  }, [bannerSettings]);

  const handleReset = useCallback(() => {
    setBannerSettings({
      showParameters: false,
      parameters: initialParameters,
      selectedParameters: [],
      parameterPositions: {},
      parameterStyles: {},
      textSize: 'medium',
      displayMode: 'full',
      autoUpdateInterval: 10
    });
    toast.success('Настройки сброшены');
  }, [initialParameters]);

  const getParameterStyle = useCallback((id: string): ParameterStyle => {
    return bannerSettings.parameterStyles[id] || {
      fontFamily: 'Inter',
      fontSize: '16px',
      fontWeight: 'medium',
      backgroundOpacity: 70,
      backgroundColor: '#000000'
    };
  }, [bannerSettings.parameterStyles]);

  const handleStyleChange = useCallback((id: string, style: ParameterStyle) => {
    setBannerSettings(prev => ({
      ...prev,
      parameterStyles: {
        ...prev.parameterStyles,
        [id]: style
      }
    }));
  }, []);

  const handleRemoveBanner = useCallback(async () => {
    try {
      await api.banner.removeBanner();
      setCurrentBanner(null);
      setPreviewUrl(null);
      setIsAnimatedBanner(false);
      toast.success('Баннер удален');
    } catch (error) {
      console.error('Error removing banner:', error);
      toast.error('Ошибка при удалении баннера');
    }
  }, []);

  const handlePreview = useCallback(async () => {
    if (!currentBanner && !previewUrl) {
      toast.error('Сначала загрузите баннер');
      return;
    }
    
    try {
      const response = await api.banner.generatePreview(bannerSettings);
      if (response.success) {
        window.open(response.data, '_blank');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Ошибка при создании превью');
    }
  }, [currentBanner, previewUrl, bannerSettings]);

  // All effect hooks must be called in the same order every render
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadCurrentBanner = async () => {
      try {
        setLoading(true);
        const response = await api.banner.getCurrentBanner();
        if (response.success && response.data) {
          setCurrentBanner(response.data);
          setIsAnimatedBanner(checkIfAnimatedBanner(response.data));
        }
        
        // Загружаем также настройки баннера
        try {
          const settingsResponse = await api.banner.getBannerSettings();
          if (settingsResponse.success) {
            setBannerSettings(prev => ({
              ...prev,
              ...settingsResponse.data
            }));
          }
        } catch (settingsError) {
          console.warn('Failed to load banner settings, using defaults');
        }
      } catch (error) {
        console.error('Error loading banner:', error);
        toast.error('Ошибка при загрузке баннера');
      } finally {
        setLoading(false);
      }
    };

    loadCurrentBanner();
  }, [checkIfAnimatedBanner]);

  // Conditional rendering at the very end - after ALL hooks have been called
  if (isMobile) {
    return <MobileBannerWarning />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Загрузка баннера...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Баннер сервера</h1>
            <p className="text-muted-foreground">
              Настройте баннер вашего сервера с динамическими параметрами
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Banner Preview */}
          <div className="xl:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Загрузка баннера
                </CardTitle>
                <CardDescription>
                  Загрузите изображение для баннера сервера (JPG, PNG, GIF, WebP)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  
                  {currentBanner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveBanner}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </Button>
                  )}
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Загрузка баннера...
                  </div>
                )}
                
                {isAnimatedBanner && (
                  <Alert>
                    <Play className="h-4 w-4" />
                    <AlertDescription>
                      Анимированный баннер загружен! Поддерживаются GIF и WebP форматы.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Banner Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Предпросмотр баннера
                </CardTitle>
                <CardDescription>
                  Перетащите элементы на баннер для позиционирования. Центральная точка элемента показывает точку привязки.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-background border rounded-lg overflow-hidden relative">
                  {!currentBanner && !previewUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="font-medium text-muted-foreground">Загрузите баннер</p>
                          <p className="text-sm text-muted-foreground">
                            Выберите изображение для предпросмотра
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <BannerDropZone onMove={handleParameterMove}>
                      <img
                        src={previewUrl || currentBanner || ''}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Улучшенная сетка позиционирования */}
                      {enabledParameters.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none opacity-40 hover:opacity-60 transition-opacity duration-300">
                          {/* Основная сетка 4x4 */}
                          {[...Array(5)].map((_, i) => (
                            <React.Fragment key={`grid-${i}`}>
                              {/* Вертикальные линии */}
                              <div 
                                className={`absolute top-0 bottom-0 w-px ${
                                  i === 2 ? 'bg-white/40' : 'bg-white/20'
                                }`}
                                style={{ left: `${(i * 25)}%` }}
                              />
                              {/* Горизонтальные линии */}
                              <div 
                                className={`absolute left-0 right-0 h-px ${
                                  i === 2 ? 'bg-white/40' : 'bg-white/20'
                                }`}
                                style={{ top: `${(i * 25)}%` }}
                              />
                            </React.Fragment>
                          ))}
                          
                          {/* Дополнительная мелкая сетка для точного позиционирования */}
                          {[...Array(9)].map((_, i) => (
                            <React.Fragment key={`fine-grid-${i}`}>
                              <div 
                                className="absolute top-0 bottom-0 w-px bg-white/10"
                                style={{ left: `${(i + 1) * 10 + 2.5}%` }}
                              />
                              <div 
                                className="absolute left-0 right-0 h-px bg-white/10"
                                style={{ top: `${(i + 1) * 10 + 2.5}%` }}
                              />
                            </React.Fragment>
                          ))}
                          
                          {/* Угловые точки для ориентации */}
                          <div className="absolute top-2 left-2 w-1 h-1 bg-white/60 rounded-full" />
                          <div className="absolute top-2 right-2 w-1 h-1 bg-white/60 rounded-full" />
                          <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/60 rounded-full" />
                          <div className="absolute bottom-2 right-2 w-1 h-1 bg-white/60 rounded-full" />
                          
                          {/* Центральная точка */}
                          <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2 border border-white/30">
                            <div className="absolute inset-0.5 bg-primary/60 rounded-full" />
                          </div>
                        </div>
                      )}
                      
                      {/* Render enabled parameters on banner */}
                      {enabledParameters.map(param => {
                        const position = bannerSettings.parameterPositions[param.id] || { x: 20, y: 20 };
                        const style = getParameterStyle(param.id);
                        return (
                          <BannerParameter
                            key={param.id}
                            param={param}
                            position={position}
                            displayMode={bannerSettings.displayMode}
                            style={style}
                            onMove={handleParameterMove}
                          />
                        );
                      })}
                    </BannerDropZone>
                  )}
                </div>

                {/* Preview Actions */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {currentBanner || previewUrl ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Баннер загружен
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        Баннер не загружен
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    disabled={!currentBanner && !previewUrl}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Предпросмотр
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Banner Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Основные настройки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Режим отображения</Label>
                  <Select 
                    value={bannerSettings.displayMode} 
                    onValueChange={(value: 'full' | 'compact') => setBannerSettings(prev => ({ ...prev, displayMode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Полный (Участники онлайн: 342)</SelectItem>
                      <SelectItem value="compact">Компактный (342)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Автообновление баннера</Label>
                  <Select 
                    value={bannerSettings.autoUpdateInterval.toString()} 
                    onValueChange={(value) => setBannerSettings(prev => ({ ...prev, autoUpdateInterval: parseInt(value) as 5 | 10 | 20 | 30 }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>5 минут</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="10">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>10 минут</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="20">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>20 минут</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="30">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>30 минут</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Баннер будет автоматически обновляться каждые {bannerSettings.autoUpdateInterval} минут
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Parameters Selection with Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Параметры баннера
                </CardTitle>
                <CardDescription>
                  Выберите до {MAX_PARAMETERS} параметров для отображения на баннере
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="parameters" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="parameters">
                      <Users className="h-4 w-4 mr-2" />
                      Параметры
                    </TabsTrigger>
                    <TabsTrigger value="styles" disabled={enabledParameters.length === 0}>
                      <Palette className="h-4 w-4 mr-2" />
                      Стили ({enabledParameters.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="parameters" className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Включенные параметры</Label>
                      <Badge variant={enabledParameters.length === MAX_PARAMETERS ? "destructive" : "secondary"}>
                        {enabledParameters.length}/{MAX_PARAMETERS}
                      </Badge>
                    </div>
                    
                    {enabledParameters.length > 0 && (
                      <Alert>
                        <GripVertical className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Система позиционирования:</p>
                            <p className="text-xs text-muted-foreground">
                              • Элементы автоматически привязываются к сетке для точного позиционирования<br/>
                              • Центральная точка элемента показывает точку привязки<br/>
                              • При перетаскивании появляются направляющие линии<br/>
                              • Сетка становится более видимой при наведении на баннер
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {bannerSettings.parameters.map(param => (
                        <SimpleParameter
                          key={param.id}
                          param={param}
                          onToggle={handleParameterToggle}
                          disabled={!param.enabled && enabledParameters.length >= MAX_PARAMETERS}
                        />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="styles" className="space-y-3 mt-4">
                    {enabledParameters.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Настройки стилей</Label>
                          <Badge variant="secondary">
                            {enabledParameters.length} параметр(ов)
                          </Badge>
                        </div>
                        
                        <Alert>
                          <Palette className="h-4 w-4" />
                          <AlertDescription>
                            <p className="text-sm">
                              Настройте внешний вид каждого параметра на баннере. Изменения применяются мгновенно.
                            </p>
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {enabledParameters.map(param => (
                            <ParameterStyleEditor
                              key={param.id}
                              param={param}
                              style={getParameterStyle(param.id)}
                              displayMode={bannerSettings.displayMode}
                              onStyleChange={(style) => handleStyleChange(param.id, style)}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <Palette className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="font-medium text-muted-foreground">Нет активных параметров</p>
                          <p className="text-sm text-muted-foreground">
                            Включите параметры на вкладке "Параметры", чтобы настроить их стили
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}