import React from 'react';
import { cn } from '../../utils/helpers';

interface BreadcrumbProps {
  items: Array<{ label: string; href?: string; onClick?: () => void }>;
  separator?: React.ReactNode;
  className?: string;
}

export function Breadcrumb({ items, separator = '/', className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
                {separator}
              </span>
            )}
            {item.href || item.onClick ? (
              <button
                onClick={item.onClick}
                className={cn(
                  'font-medium transition-colors',
                  item.href || item.onClick
                    ? 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
                    : 'text-gray-900 dark:text-white'
                )}
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-900 dark:text-white font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}