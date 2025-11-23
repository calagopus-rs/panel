import { AnimatePresence, motion } from 'motion/react';
import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import Notification from '@/elements/Notification';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => number;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

const toastTimeout = 7500;

const getToastColor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    default:
      return 'teal';
  }
};

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toastTimeout);

    return id;
  }, []);

  const contextValue = useMemo(
    () => ({
      addToast,
      dismissToast,
    }),
    [addToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className='fixed top-4 right-4 z-999 space-y-2'>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className='w-72'
            >
              <Notification color={getToastColor(toast.type)} withCloseButton onClose={() => dismissToast(toast.id)}>
                {toast.message}
              </Notification>
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
