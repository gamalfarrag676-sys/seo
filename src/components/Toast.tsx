import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Toast Provider Component
export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    let toastId = 0;

    const showToast = (type: ToastType, message: string, duration = 4000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, type, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const contextValue: ToastContextType = {
        showToast,
        success: (message) => showToast('success', message),
        error: (message) => showToast('error', message, 6000),
        warning: (message) => showToast('warning', message),
        info: (message) => showToast('info', message),
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

// Toast Container Component
const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: number) => void }) => {
    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm" dir="rtl">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
            ))}
        </div>
    );
};

// Single Toast Item
const ToastItem = ({ toast, onRemove }: { toast: Toast, onRemove: () => void }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <XCircle className="w-5 h-5 text-red-400" />,
        warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
    };

    const backgrounds = {
        success: 'bg-green-900/90 border-green-700',
        error: 'bg-red-900/90 border-red-700',
        warning: 'bg-yellow-900/90 border-yellow-700',
        info: 'bg-blue-900/90 border-blue-700',
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 ${backgrounds[toast.type]} ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                }`}
        >
            {icons[toast.type]}
            <span className="text-white text-sm flex-1">{toast.message}</span>
            <button
                onClick={onRemove}
                className="text-white/60 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
