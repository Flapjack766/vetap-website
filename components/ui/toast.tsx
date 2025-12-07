'use client';

import { ReactNode, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'error' | 'info' | 'warning' | 'destructive';

export interface Toast {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  destructive: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles: Record<ToastVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
};

export function ToastComponent({ toast, onClose }: ToastProps) {
  const variant = toast.variant || 'default';
  const Icon = icons[variant];
  const style = styles[variant];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm animate-in slide-in-from-top-5 bg-background dark:bg-background/90',
        style
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        {toast.title && <p className="font-semibold leading-tight">{toast.title}</p>}
        {toast.description && (
          <p className="text-muted-foreground mt-1 leading-relaxed">{toast.description}</p>
        )}
        {!toast.title && !toast.description && (
          <p className="leading-relaxed">{toast.variant === 'success' ? 'Success' : 'Notification'}</p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

