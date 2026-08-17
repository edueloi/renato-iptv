import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getButtonBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500';
      case 'info':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${
              variant === 'danger'
                ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900'
                : variant === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900'
                : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900'
            }`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3.5 py-1.5 border font-semibold text-xs rounded-lg shadow-xs transition-colors ${getButtonBg()}`}
          >
            {isLoading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
