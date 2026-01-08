'use client';

import { useEffect } from 'react';
import styles from './toast.module.css';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export default function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    error: '⚠️',
    success: '✓',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <div className={styles.toastIcon}>{icons[toast.type]}</div>
      <div className={styles.toastMessage}>{toast.message}</div>
      <button
        className={styles.toastClose}
        onClick={() => onClose(toast.id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
