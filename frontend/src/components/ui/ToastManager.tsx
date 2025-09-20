import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from './Toast';

interface ToastData {
  id: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: generateId(),
    };
    
    setToasts(prev => {
      // Limit to 5 toasts maximum
      const updatedToasts = [...prev, newToast];
      return updatedToasts.slice(-5);
    });
  }, [generateId]);

  const showError = useCallback((message: string) => {
    showToast({ message, type: 'error' });
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast({ message, type: 'warning' });
  }, [showToast]);

  const showSuccess = useCallback((message: string) => {
    showToast({ message, type: 'success' });
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast({ message, type: 'info' });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const value: ToastContextType = {
    showToast,
    showError,
    showWarning,
    showSuccess,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}