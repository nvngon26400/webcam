import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Lock, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'auth';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  authRequired: (message?: string, onLoginClick?: () => void) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4500, actionText, onAction }: Omit<Toast, 'id'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration, actionText, onAction };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'success', title: title || 'Thành công', message });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'error', title: title || 'Lỗi', message });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'warning', title: title || 'Chú ý', message });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'info', title: title || 'Thông tin', message });
    },
    [addToast]
  );

  const authRequired = useCallback(
    (
      message = 'Bạn cần đăng nhập để truy cập tính năng này. Hãy đăng nhập hoặc đăng ký tài khoản.',
      onLoginClick?: () => void
    ) => {
      addToast({
        type: 'auth',
        title: 'Yêu cầu đăng nhập',
        message,
        duration: 6000,
        actionText: 'Đăng nhập ngay',
        onAction: onLoginClick,
      });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, success, error, warning, info, authRequired, removeToast }}
    >
      {children}

      {/* Modern floating toast viewport */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isAuth = t.type === 'auth';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto transform transition-all duration-300 ease-out translate-y-0 opacity-100 flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl ${
                isSuccess
                  ? 'bg-slate-900/90 dark:bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/20'
                  : isError
                  ? 'bg-slate-900/90 dark:bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-rose-950/20'
                  : isWarning
                  ? 'bg-slate-900/90 dark:bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-amber-950/20'
                  : isAuth
                  ? 'bg-slate-900/95 dark:bg-slate-900/95 border-indigo-500/60 text-slate-100 shadow-indigo-950/30 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/90 dark:bg-slate-900/95 border-slate-700/60 text-slate-100'
              }`}
            >
              {/* Type icon */}
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isAuth && <Lock className="w-5 h-5 text-indigo-400 animate-pulse" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
              </div>

              {/* Message body */}
              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h4 className="text-xs font-bold text-white mb-0.5 tracking-tight flex items-center gap-1.5">
                    {t.title}
                    {isAuth && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        Protected
                      </span>
                    )}
                  </h4>
                )}
                <p className="text-xs text-slate-300 leading-snug break-words">{t.message}</p>

                {t.actionText && t.onAction && (
                  <button
                    onClick={() => {
                      t.onAction?.();
                      removeToast(t.id);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>{t.actionText}</span>
                  </button>
                )}
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
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
