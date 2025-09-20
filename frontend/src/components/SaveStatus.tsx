import React from 'react';
import type { SaveStatus as SaveStatusType } from '@shared/types';

interface SaveStatusProps {
  status: SaveStatusType;
  onRetry?: () => void;
  className?: string;
}

export function SaveStatus({ status, onRetry, className = '' }: SaveStatusProps) {
  const getStatusDisplay = () => {
    switch (status.state) {
      case 'idle':
        return (
          <span className="text-gray-500 text-sm">
            Ready to save
          </span>
        );

      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Saving...</span>
          </div>
        );

      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Saved
              {status.lastSaved && (
                <span className="text-gray-500 ml-1">
                  {formatLastSaved(status.lastSaved)}
                </span>
              )}
            </span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>Error saving</span>
            {status.error && (
              <span className="text-gray-500 ml-1">
                ({status.error})
              </span>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="ml-2 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {getStatusDisplay()}
    </div>
  );
}

function formatLastSaved(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}