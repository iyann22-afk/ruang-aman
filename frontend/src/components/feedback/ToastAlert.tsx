import React from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface ToastAlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
}) => {
  const configs = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: XCircle,
      iconColor: 'text-rose-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertCircle,
      iconColor: 'text-amber-500',
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: Info,
      iconColor: 'text-sky-500',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start p-4 rounded-xl border shadow-xs ${config.bg} ${className}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 text-sm">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <p className="leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-3 -mr-1.5 -mt-1.5 p-1 rounded-lg hover:bg-black/5 transition-colors focus:outline-hidden"
          aria-label="Close"
        >
          <X className="w-4 h-4 opacity-60 hover:opacity-100" />
        </button>
      )}
    </div>
  );
};
