import React from 'react';
import { AlertCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';

export interface ErrorAlertProps {
  title?: string;
  message: string | React.ReactNode;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  onDismiss,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'error',
  className = ''
}) => {
  if (!message) return null;

  const isWarning = variant === 'warning';
  const isInfo = variant === 'info';

  const containerBg = isWarning
    ? 'from-amber-50/95 via-orange-50/80 to-amber-50/95 border-amber-200/80 shadow-[0_4px_16px_rgba(245,158,11,0.08)]'
    : isInfo
    ? 'from-blue-50/95 via-indigo-50/80 to-blue-50/95 border-blue-200/80 shadow-[0_4px_16px_rgba(59,130,246,0.08)]'
    : 'from-rose-50/95 via-red-50/80 to-rose-50/95 border-rose-200/80 shadow-[0_4px_16px_rgba(244,63,94,0.08)]';

  const iconBg = isWarning
    ? 'bg-amber-100/90 text-amber-700 border-amber-200/70'
    : isInfo
    ? 'bg-blue-100/90 text-blue-700 border-blue-200/70'
    : 'bg-rose-100/90 text-rose-600 border-rose-200/70';

  const titleColor = isWarning ? 'text-amber-950' : isInfo ? 'text-blue-950' : 'text-rose-950';
  const textColor = isWarning ? 'text-amber-800' : isInfo ? 'text-blue-800' : 'text-rose-700';
  const dismissHover = isWarning
    ? 'text-amber-500 hover:text-amber-800 hover:bg-amber-100/60'
    : isInfo
    ? 'text-blue-500 hover:text-blue-800 hover:bg-blue-100/60'
    : 'text-rose-400 hover:text-rose-700 hover:bg-rose-100/60';

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl bg-gradient-to-r ${containerBg} border text-xs flex items-start gap-3.5 animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}
    >
      <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0 border shadow-2xs mt-0.5`}>
        {isWarning ? <AlertTriangle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <div className={`font-bold uppercase tracking-wider text-[11px] mb-0.5 ${titleColor}`}>
            {title}
          </div>
        )}
        <div className={`leading-relaxed text-xs font-medium ${textColor}`}>
          {message}
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{retryLabel}</span>
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 -mr-1 -mt-1 ${dismissHover}`}
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
