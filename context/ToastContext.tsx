
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Check, AlertTriangle, X, Info, Bell, CheckCircle, XCircle, ShieldAlert, Copy, CheckCheck } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (title: string, desc?: string) => void;
    error: (title: string, desc?: string) => void;
    warning: (title: string, desc?: string) => void;
    info: (title: string, desc?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  // Use a ref to keep track of the current timer so we can clear it if a new toast comes fast
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToast = useCallback((title: string, type: ToastType, description?: string) => {
    const id = Date.now().toString();
    
    // Clear existing timer to prevent premature closing of new toast
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Replace existing to show only one sleek notification at a time
    setToasts([{ id, title, description, type }]); 

    // Duration depends on content length (longer read time for descriptions)
    const duration = description ? 4000 : 2500;

    timerRef.current = setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setIsCopied(false);
  }, []);

  const toast = {
    success: (title: string, desc?: string) => addToast(title, 'success', desc),
    error: (title: string, desc?: string) => addToast(title, 'error', desc),
    warning: (title: string, desc?: string) => addToast(title, 'warning', desc),
    info: (title: string, desc?: string) => addToast(title, 'info', desc),
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-white" strokeWidth={2.5} />;
      case 'error': return <XCircle size={20} className="text-white" strokeWidth={2.5} />;
      case 'warning': return <AlertTriangle size={20} className="text-white" strokeWidth={2.5} />;
      default: return <Bell size={20} className="text-white" strokeWidth={2.5} />;
    }
  };

  const getTheme = (type: ToastType) => {
    switch (type) {
      case 'success': return { 
        bg: 'bg-emerald-500', 
        border: 'border-emerald-100 dark:border-emerald-900',
        iconBg: 'bg-emerald-500',
        titleColor: 'text-emerald-800 dark:text-emerald-200'
      };
      case 'error': return { 
        bg: 'bg-rose-500', 
        border: 'border-rose-100 dark:border-rose-900',
        iconBg: 'bg-rose-500',
        titleColor: 'text-rose-800 dark:text-rose-200'
      };
      case 'warning': return { 
        bg: 'bg-amber-500', 
        border: 'border-amber-100 dark:border-amber-900',
        iconBg: 'bg-amber-500',
        titleColor: 'text-amber-800 dark:text-amber-200'
      };
      default: return { 
        bg: 'bg-blue-600', 
        border: 'border-blue-100 dark:border-blue-900',
        iconBg: 'bg-blue-600',
        titleColor: 'text-blue-800 dark:text-blue-200'
      };
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      <style>{`
        @keyframes slideDownFade {
          0% { transform: translateY(-100%) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-toast-entry {
          animation: slideDownFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes progressShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Top Floating Container - Non blocking */}
      <div className="fixed top-0 left-0 right-0 z-[150] flex flex-col items-center p-4 pointer-events-none">
        {toasts.map((t) => {
          const theme = getTheme(t.type);
          const isCredentials = t.description?.toLowerCase().includes('পাসওয়ার্ড') || t.description?.toLowerCase().includes('password');
          const duration = t.description ? 4000 : 2500;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border ${theme.border} animate-toast-entry overflow-hidden flex flex-col`}
            >
                <div className="flex items-start gap-3 p-4">
                    {/* Compact Icon */}
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme.iconBg} shadow-sm mt-0.5`}>
                        {getIcon(t.type)}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className={`text-sm font-bold leading-tight ${theme.titleColor}`}>
                            {t.title}
                        </h3>
                        {t.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed break-words">
                                {t.description}
                            </p>
                        )}
                        
                        {/* Copy Button Logic */}
                        {isCredentials && (
                            <button 
                                onClick={() => copyToClipboard(t.description || '')}
                                className="mt-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                            >
                                {isCopied ? <CheckCheck size={12} className="text-green-500"/> : <Copy size={12}/>}
                                কপি করুন
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={() => removeToast(t.id)}
                        className="shrink-0 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Slim Progress Bar */}
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                    <div 
                        className={`h-full ${theme.bg}`} 
                        style={{ animation: `progressShrink ${duration}ms linear forwards` }}
                    ></div>
                </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
