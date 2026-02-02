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

  const addToast = useCallback((title: string, type: ToastType, description?: string) => {
    const id = Date.now().toString();
    setToasts([{ id, title, description, type }]); // Replace existing to show only one centered modal

    // Duration depends on content length
    const duration = description ? 5000 : 3000;

    setTimeout(() => {
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
      case 'success': return <CheckCircle size={40} className="text-white" strokeWidth={2} />;
      case 'error': return <XCircle size={40} className="text-white" strokeWidth={2} />;
      case 'warning': return <AlertTriangle size={40} className="text-white" strokeWidth={2} />;
      default: return <Bell size={40} className="text-white" strokeWidth={2} />;
    }
  };

  const getTheme = (type: ToastType) => {
    switch (type) {
      case 'success': return { 
        bg: 'bg-emerald-500', 
        shadow: 'shadow-emerald-500/30', 
        ring: 'ring-emerald-500/20',
        text: 'text-emerald-600',
        lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-100 dark:border-emerald-800'
      };
      case 'error': return { 
        bg: 'bg-rose-500', 
        shadow: 'shadow-rose-500/30', 
        ring: 'ring-rose-500/20',
        text: 'text-rose-600',
        lightBg: 'bg-rose-50 dark:bg-rose-900/20',
        border: 'border-rose-100 dark:border-rose-800'
      };
      case 'warning': return { 
        bg: 'bg-amber-500', 
        shadow: 'shadow-amber-500/30', 
        ring: 'ring-amber-500/20',
        text: 'text-amber-600',
        lightBg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-100 dark:border-amber-800'
      };
      default: return { 
        bg: 'bg-blue-600', 
        shadow: 'shadow-blue-600/30', 
        ring: 'ring-blue-600/20',
        text: 'text-blue-600',
        lightBg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-100 dark:border-blue-800'
      };
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Styles for Animation */}
      <style>{`
        @keyframes scaleUpBounce {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up-bounce {
          animation: scaleUpBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes progressShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Central Popup Container */}
      {toasts.length > 0 && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => removeToast(toasts[0].id)}
          ></div>

          {toasts.map((t) => {
            const theme = getTheme(t.type);
            const isCredentials = t.description?.toLowerCase().includes('পাসওয়ার্ড') || t.description?.toLowerCase().includes('password');
            const duration = t.description ? 5000 : 3000;

            return (
              <div
                key={t.id}
                className="pointer-events-auto relative w-full max-w-xs bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl animate-scale-up-bounce z-10 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center overflow-hidden"
              >
                 {/* Top Progress Bar */}
                 <div className="absolute top-0 left-0 h-1 bg-slate-100 dark:bg-slate-800 w-full">
                    <div 
                        className={`h-full ${theme.bg}`} 
                        style={{ animation: `progressShrink ${duration}ms linear forwards` }}
                    ></div>
                 </div>

                 {/* Icon Bubble with Glow */}
                 <div className="relative mb-5">
                    <div className={`absolute inset-0 ${theme.bg} blur-xl opacity-40 rounded-full scale-150`}></div>
                    <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${theme.bg} ${theme.shadow} ring-8 ${theme.ring}`}>
                        {getIcon(t.type)}
                    </div>
                 </div>

                 {/* Content */}
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                    {t.title}
                 </h3>
                 
                 {t.description && (
                   <div className={`mt-2 p-4 rounded-2xl w-full text-left relative group ${theme.lightBg} ${theme.border} border`}>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line break-words text-center">
                         {t.description}
                      </p>
                      
                      {/* Copy Button for Credentials */}
                      {isCredentials && (
                        <button 
                          onClick={() => copyToClipboard(t.description || '')}
                          className="absolute -top-3 -right-2 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Copy details"
                        >
                           {isCopied ? <CheckCheck size={14} className="text-green-500"/> : <Copy size={14}/>}
                        </button>
                      )}
                   </div>
                 )}

                 {/* Close Button */}
                 <button 
                   onClick={() => removeToast(t.id)}
                   className="mt-6 px-8 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                 >
                    বন্ধ করুন
                 </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};