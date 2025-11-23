'use client';

import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
};

export function ToastComponent({ toast, onClose }: ToastProps) {
  const Icon = icons[toast.type];
  const style = styles[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm animate-in slide-in-from-top-5',
        style
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

