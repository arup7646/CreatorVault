import React from 'react';
import { cn } from '../../utils/helpers';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-shimmer bg-gray-200 dark:bg-gray-700 rounded',
          variant === 'circular' && 'rounded-full',
          variant === 'rectangular' && 'rounded-lg',
          className
        )}
        style={{ width, height }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export const SkeletonCard = () => (
  <div className="space-y-4">
    <Skeleton variant="rectangular" height={200} className="rounded-lg" />
    <div className="space-y-3 px-4 pb-4">
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="40%" height={16} />
      <Skeleton variant="text" width="30%" height={14} />
    </div>
  </div>
);

export const SkeletonTableRow = ({ columns = 4 }: { columns?: number }) => (
  <div className="grid gap-4 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton variant="text" key={i} width="80%" height={16} />
    ))}
  </div>
);

export const SkeletonProjectGrid = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);