import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
}

const presetColors = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6b7280', // gray
  '#1f2937', // dark gray
  '#000000', // black
];

export function ColorPicker({ color, onChange, label, disabled = false }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    setInputValue(newColor);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const isValidHex = (hex: string) => {
    return /^#[0-9A-F]{6}$/i.test(hex);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="#3b82f6"
          disabled={disabled}
          className={`font-mono ${!isValidHex(inputValue) ? 'border-red-500' : ''}`}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="w-12 h-10 p-0 border-2"
              style={{ backgroundColor: isValidHex(inputValue) ? inputValue : '#ffffff' }}
            >
              <span className="sr-only">Выбрать цвет</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Готовые цвета</h4>
                <div className="grid grid-cols-6 gap-2">
                  {presetColors.map((presetColor) => (
                    <button
                      key={presetColor}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: presetColor }}
                      onClick={() => {
                        handleColorChange(presetColor);
                        setIsOpen(false);
                      }}
                      title={presetColor}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Системный выбор цвета</h4>
                <input
                  type="color"
                  value={isValidHex(inputValue) ? inputValue : '#3b82f6'}
                  onChange={(e) => {
                    handleColorChange(e.target.value);
                    setIsOpen(false);
                  }}
                  className="w-full h-10 rounded border cursor-pointer"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {!isValidHex(inputValue) && (
        <p className="text-xs text-red-500">
          Неверный формат. Используйте #RRGGBB (например, #3b82f6)
        </p>
      )}
    </div>
  );
}