import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/helpers';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  dangerous?: boolean;
  shortcut?: string;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  closeOnClick?: boolean;
}

export function Dropdown({ trigger, items, align = 'right', closeOnClick = true }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick();
    if (closeOnClick) setIsOpen(false);
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed z-50 mt-1.5 min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-slide-in"
      style={{
        right: align === 'right' ? 0 : undefined,
        left: align === 'left' ? 0 : undefined,
      }}
      role="menu"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={cn(
            'w-full px-4 py-2 text-left flex items-center gap-2 text-sm',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
            item.disabled && 'opacity-50 cursor-not-allowed',
            item.dangerous && 'text-red-600 dark:text-red-400'
          )}
          role="menuitem"
          tabIndex={-1}
        >
          {item.icon && <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
          {item.shortcut && <span className="text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative inline-block" onClick={() => setIsOpen(!isOpen)}>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-1"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
}