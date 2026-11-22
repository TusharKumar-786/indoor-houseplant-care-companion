import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_STYLES: Record<string, { bg: string; color: string; border: string; icon: string }> = {
  success: { bg: 'var(--color-mint-light)', color: 'var(--color-forest)',  border: 'var(--color-sage)', icon: 'var(--color-forest)' },
  error:   { bg: 'var(--color-coral-light)', color: 'var(--color-coral)',  border: '#f5b8b2',          icon: 'var(--color-coral)' },
  info:    { bg: 'var(--color-cream)',       color: 'var(--color-text-base)', border: 'var(--color-border)', icon: 'var(--color-text-muted)' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
              style={{
                background: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
              }}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: style.icon }} />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: style.icon }} />}
              {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" style={{ color: style.icon }} />}
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
