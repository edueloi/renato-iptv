import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-5 right-3 md:right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'error':
        return {
          bg: 'bg-rose-900/90 text-rose-100 border-rose-700 dark:bg-rose-950/95 dark:text-rose-100 dark:border-rose-800',
          icon: <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-900/90 text-amber-100 border-amber-700 dark:bg-amber-950/95 dark:text-amber-100 dark:border-amber-800',
          icon: <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
        };
      case 'info':
        return {
          bg: 'bg-slate-900/90 text-slate-100 border-slate-700 dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-700',
          icon: <Info className="w-4 h-4 text-indigo-300 shrink-0" />
        };
      case 'success':
      default:
        return {
          bg: 'bg-slate-900/90 text-slate-100 border-slate-700 dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-700',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`pointer-events-auto p-3 rounded-lg border shadow-lg backdrop-blur-md text-xs font-medium flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom-3 duration-200 ${style.bg}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {style.icon}
        <span className="truncate">{toast.text}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-0.5 opacity-70 hover:opacity-100 transition-opacity shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
