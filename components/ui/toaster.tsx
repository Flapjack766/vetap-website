'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastComponent, Toast, ToastOptions, ToastVariant } from './toast';

type ToastInput = ToastOptions | string;

interface ToastContextType {
  toast: (options: ToastInput) => void;
  success: (message: ReactNode, duration?: number) => void;
  error: (message: ReactNode, duration?: number) => void;
  info: (message: ReactNode, duration?: number) => void;
  warning: (message: ReactNode, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToasterProvider');
  }
  return context;
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((input: ToastInput) => {
    const id = Math.random().toString(36).substring(2, 9);
    const options: ToastOptions =
      typeof input === 'string'
        ? { title: input }
        : input || {};

    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      duration: options.duration || 3000,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastInput) => {
      addToast(options);
    },
    [addToast]
  );

  const variantToast = useCallback(
    (message: ReactNode, variant: ToastVariant, duration?: number) => {
      addToast({
        title: message,
        variant,
        duration,
      });
    },
    [addToast]
  );

  const success = useCallback((message: ReactNode, duration?: number) => {
    variantToast(message, 'success', duration);
  }, [variantToast]);

  const error = useCallback((message: ReactNode, duration?: number) => {
    variantToast(message, 'error', duration);
  }, [variantToast]);

  const info = useCallback((message: ReactNode, duration?: number) => {
    variantToast(message, 'info', duration);
  }, [variantToast]);

  const warning = useCallback((message: ReactNode, duration?: number) => {
    variantToast(message, 'warning', duration);
  }, [variantToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastComponent toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

