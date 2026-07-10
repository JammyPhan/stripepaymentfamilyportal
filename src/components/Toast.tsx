import { useEffect, useState } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: ((toast: ToastMessage) => void)[] = [];

export function showToast(type: ToastType, message: string) {
  const toast: ToastMessage = { id: crypto.randomUUID(), type, message };
  toastListeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => {
        const config = {
          success: { icon: CheckCircle2, bg: 'bg-success-50', border: 'border-success-100', text: 'text-success-700', iconColor: 'text-success-500' },
          error: { icon: AlertCircle, bg: 'bg-danger-50', border: 'border-danger-100', text: 'text-danger-700', iconColor: 'text-danger-700' },
          warning: { icon: AlertCircle, bg: 'bg-warning-50', border: 'border-warning-100', text: 'text-warning-700', iconColor: 'text-primary' },
          info: { icon: Info, bg: 'bg-primary-50', border: 'border-primary-100', text: 'text-primary-500', iconColor: 'text-primary' },
        }[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl border ${config.bg} ${config.border} px-4 py-3 animate-slide-up max-w-sm`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
            <p className={`flex-1 text-sm font-medium ${config.text}`}>{toast.message}</p>
            <button onClick={() => remove(toast.id)} className={`flex-shrink-0 ${config.text} opacity-50 hover:opacity-100`}>
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
