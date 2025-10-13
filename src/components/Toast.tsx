import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/20 text-emerald-50 border-emerald-400/40';
      case 'error':
        return 'bg-red-500/20 text-red-50 border-red-400/40';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-50 border-yellow-400/40';
      case 'info':
        return 'bg-blue-500/20 text-blue-50 border-blue-400/40';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${getStyles()} backdrop-blur-xl animate-slide-in-right max-w-md hover:scale-105 transition-transform duration-200`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1.5 transition-all duration-200"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
