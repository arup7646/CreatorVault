import React from 'react';
import { cn } from '../../utils/helpers';
import { X } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline';
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', removable, onRemove, children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
        {removable && onRemove && (
          <button
            onClick={onRemove}
            className={cn(
              'rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
              size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
            )}
            aria-label="Remove"
          >
            <X className={cn('h-3 w-3', size === 'sm' ? 'h-2.5 w-2.5' : '')} />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';