'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './ToastProvider.module.css';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
    addToast: () => { },
});

export function useToast() {
    return useContext(ToastContext);
}

const ICONS = {
    success: CheckCircle,
    error: AlertTriangle,
    info: Info,
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        // Auto-remove after 3.5s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className={styles.container}>
                {toasts.map((toast) => {
                    const Icon = ICONS[toast.type];
                    return (
                        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
                            <Icon size={16} className={styles.icon} />
                            <span className={styles.message}>{toast.message}</span>
                            <button className={styles.close} onClick={() => removeToast(toast.id)}>
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
