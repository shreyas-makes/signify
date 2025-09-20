import { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Wait for fade out animation
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'success':
        return 'bg-green-100 border-green-400 text-green-700';
      default:
        return 'bg-blue-100 border-blue-400 text-blue-700';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`
        max-w-sm w-full
        px-4 py-3 border rounded-lg shadow-lg
        flex items-start gap-3
        transition-all duration-300 transform
        ${getTypeStyles()}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="flex-shrink-0 text-lg" aria-hidden="true">
        {getIcon()}
      </span>
      
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      
      <button
        onClick={handleClose}
        className="flex-shrink-0 ml-2 text-lg hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}