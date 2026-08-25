import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/helpers';
import { Search, X, File, Folder, Star, Clock, ChevronRight } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { searchApi } from '../../api/endpoints';
import { formatRelativeTime, getFileIcon, formatFileSize } from '../../utils/helpers';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ projects: any[]; assets: any[] }>({ projects: [], assets: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.projects.length + results.assets.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      }
      if (e.key === 'Enter' && selectedIndex >= 0) {
        const allResults = [...results.projects, ...results.assets];
        const selected = allResults[selectedIndex];
        if (selected) {
          if ('owner' in selected) {
            window.location.href = `/projects/${selected.id}`;
          } else {
            window.location.href = `/projects/${selected.projectId}/assets/${selected.id}`;
          }
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true);
      searchApi.search({ q: debouncedQuery, limit: 10 })
        .then(res => {
          setResults({ projects: res.data.projects, assets: res.data.assets });
          setSelectedIndex(-1);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setResults({ projects: [], assets: [] });
      setSelectedIndex(-1);
    }
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery('');
    setResults({ projects: [], assets: [] });
    inputRef.current?.focus();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pb-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 animate-scale-in overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onBlur={(e) => { setTimeout(() => { if (!e.currentTarget.contains(e.relatedTarget as Node) && !document.querySelector('.fixed.right-4')) onClose(); }, 100); }}
              className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search assets, projects, tags..."
              autoComplete="off"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
            <kbd className="font-mono">⌘</kbd>K
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 animate-shimmer">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                  </div>
                </div>
              ))}
            </div>
          ) : (results.projects.length === 0 && results.assets.length === 0 && query.length >= 2) ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No results for "{query}"</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try different keywords or filters</p>
            </div>
          ) : (
            <>
              {results.projects.length > 0 && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Folder className="h-5 w-5 text-blue-500" />
                    Projects ({results.projects.length})
                  </h4>
                  <ul role="list" className="space-y-2">
                    {results.projects.map((project, index) => (
                      <li key={project.id}>
                        <button
                          onClick={() => { window.location.href = `/projects/${project.id}`; onClose(); }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                            selectedIndex === index ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                          role="option"
                          aria-selected={selectedIndex === index}
                        >
                          <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <Folder className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.assets.length > 0 && (
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <File className="h-5 w-5 text-green-500" />
                    Assets ({results.assets.length})
                  </h4>
                  <ul role="list" className="space-y-2">
                    {results.assets.map((asset, index) => {
                      const globalIndex = results.projects.length + index;
                      const Icon = getFileIcon(asset.mimeType);
                      return (
                        <li key={asset.id}>
                          <button
                            onClick={() => { window.location.href = `/projects/${asset.projectId}/assets/${asset.id}`; onClose(); }}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                              selectedIndex === globalIndex ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                            role="option"
                            aria-selected={selectedIndex === globalIndex}
                          >
                            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>{asset.project?.name}</span>
                                <span>·</span>
                                <span>{formatFileSize(asset.fileSize)}</span>
                                <span>·</span>
                                <span>{formatRelativeTime(asset.createdAt)}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>{' '}
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>{' '}
          navigate · 
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>{' '}
          open · 
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>{' '}
          close
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}