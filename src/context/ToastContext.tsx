import { createContext, useCallback, useContext, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const item: ToastItem = { id, message, type, duration, createdAt: Date.now() };
      setToasts((prev) => [...prev, item]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: ToastItem[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} item={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

const styles: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    text: 'text-emerald-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-800',
  },
  info: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: 'text-sky-600',
    text: 'text-sky-800',
  },
};

function ToastItem({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const s = styles[item.type];
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3 rounded-lg border shadow-sm ${s.bg} ${s.border} transition-all duration-200`}
      role="alert"
    >
      <span className={`text-lg font-bold shrink-0 ${s.icon}`} aria-hidden>{icons[item.type]}</span>
      <p className={`text-sm font-medium flex-1 min-w-0 ${s.text}`}>{item.message}</p>
      <button
        type="button"
        onClick={onClose}
        className={`shrink-0 p-0.5 rounded hover:bg-black/5 ${s.text} opacity-70 hover:opacity-100`}
        aria-label="Cerrar"
      >
        <span className="sr-only">Cerrar</span>
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
