import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertTriangle, X, Info, Bell } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts((prev) => {
        // Limit to 2 toasts to avoid clutter, removing oldest
        const newToasts = [...prev, { id, message, type }];
        if (newToasts.length > 2) return newToasts.slice(1);
        return newToasts;
    });

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <Check size={20} className="text-emerald-400" strokeWidth={3} />;
      case 'error': return <X size={20} className="text-red-400" strokeWidth={3} />;
      case 'warning': return <AlertTriangle size={20} className="text-amber-400" strokeWidth={3} />;
      default: return <Bell size={20} className="text-blue-400" strokeWidth={3} />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* iPhone Dynamic Island Style Toast Container - using Slate-900 instead of Black */}
      <div className="fixed top-2 left-0 right-0 z-[120] pointer-events-none flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className="pointer-events-auto cursor-pointer relative bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-900/50 pl-2 pr-6 py-2 flex items-center gap-3 min-w-[320px] max-w-sm animate-in slide-in-from-top-[-150%] fade-in duration-500 ease-out hover:scale-[1.02] active:scale-95 transition-transform border border-slate-800/50"
          >
            {/* Icon Circle */}
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 backdrop-blur-xl border border-slate-700">
                {getIcon(t.type)}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center">
               <p className="text-[13px] font-semibold leading-tight text-white/95">
                  {t.message}
               </p>
            </div>
            
            {/* Handle/Indicator */}
            <div className="w-1 h-8 bg-slate-800 rounded-full shrink-0"></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};