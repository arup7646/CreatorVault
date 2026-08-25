import React from 'react';
import { cn } from '../../utils/helpers';
import { getInitials } from '../../utils/helpers';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', shape = 'circle', ...props }, ref) => {
    const sizes = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
    };

    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-lg',
    };

    const fallbackColor = name 
      ? `hsl(${name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 137 % 360}, 70%, 50%)`
      : 'hsl(239, 84%, 67%)';

    if (src) {
      return (
        <div
          ref={ref}
          className={cn('inline-flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800', shapes[shape], sizes[size], className)}
          {...props}
        >
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center font-medium text-white', shapes[shape], sizes[size], className)}
        style={{ backgroundColor: fallbackColor }}
        {...props}
      >
        {name ? getInitials(name) : '?'}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';