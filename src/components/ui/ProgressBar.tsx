import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'ocean' | 'treasure' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'ocean',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const variantStyles = {
    ocean: 'from-ocean-500 to-ocean-600',
    treasure: 'from-treasure-500 to-treasure-600',
    success: 'from-emerald-500 to-emerald-600',
    danger: 'from-danger-500 to-danger-600',
  };

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-slate-300 font-medium">{label}</span>}
          {showLabel && (
            <span className="text-sm text-white font-bold">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${variantStyles[variant]} ${animated ? 'transition-all duration-1000 ease-out' : ''} shadow-lg`}
          style={{ width: `${percentage}%` }}
        >
          {animated && size === 'lg' && (
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
