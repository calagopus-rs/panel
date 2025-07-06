import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

type ToastType = 'success' | 'error' | 'warning' | 'loading' | 'info';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  addToast: (message: string, type?: ToastType) => number;
  dismissToast: (id: number) => void;
  promise: <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

const toastTimeout = 7500;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = toastId++;
    setToasts(prev => [...prev, { id, message, type }]);

    if (type !== 'loading') {
      setTimeout(() => {
        dismissToast(id);
      }, toastTimeout);
    }

    return id;
  }, []);

  const promise = useCallback(
    async <T,>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) => {
      const id = addToast(messages.loading, 'loading');

      try {
        const result = await promise;
        setToasts(prev => prev.map(t => (t.id === id ? { ...t, message: messages.success, type: 'success' } : t)));
        setTimeout(() => dismissToast(id), toastTimeout);
        return result;
      } catch (error) {
        setToasts(prev => prev.map(t => (t.id === id ? { ...t, message: messages.error, type: 'error' } : t)));
        setTimeout(() => dismissToast(id), toastTimeout);
        throw error;
      }
    },
    [addToast, dismissToast],
  );

  const getToastColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-700';
      case 'loading':
        return 'bg-blue-600';
      case 'warning':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, dismissToast, promise }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              onClick={() => dismissToast(toast.id)}
              className={classNames(
                'text-white px-4 py-3 rounded-lg shadow cursor-pointer flex items-center justify-between gap-2 w-72',
                getToastColor(toast.type),
              )}
            >
              <span>{toast.message}</span>
              <FontAwesomeIcon icon={faX} className="w-4 h-4 text-white/60" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
