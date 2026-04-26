import { createContext, useContext, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_ICONS = { success: Check, error: X, info: Info };
const COLORS = {
  success: { icon: 'text-green-600 bg-green-50', bar: 'bg-green-500' },
  error:   { icon: 'text-red-600 bg-red-50',     bar: 'bg-red-500'   },
  info:    { icon: 'text-blue-600 bg-blue-50',   bar: 'bg-blue-500'  },
};

function ToastItem({ toast, onDismiss }) {
  const c = COLORS[toast.type] || COLORS.success;
  const ToastIcon = TOAST_ICONS[toast.type] || TOAST_ICONS.success;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-80 max-w-[calc(100vw-3rem)] toast-enter">
      <div className={`h-0.5 w-full ${c.bar}`} />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${c.icon}`}>
          <ToastIcon size={14} strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
        {toast.action && (
          <Link to={toast.action.to} onClick={() => onDismiss(toast.id)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap flex-shrink-0">
            {toast.action.label}
          </Link>
        )}
        <button onClick={() => onDismiss(toast.id)}
          className="text-gray-300 hover:text-gray-500 flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .toast-enter { animation: toast-in 0.2s ease-out forwards; }
      `}</style>
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', action = null, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    if (duration > 0) setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
