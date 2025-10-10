import React from 'react';

export interface StatDisplayProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: 'default' | 'ocean' | 'treasure' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const StatDisplay: React.FC<StatDisplayProps> = ({
  icon,
  label,
  value,
  variant = 'default',
  size = 'md',
}) => {
  const variantStyles = {
    default: 'bg-slate-700/50 text-slate-300',
    ocean: 'bg-ocean-500/20 text-ocean-300',
    treasure: 'bg-treasure-500/20 text-treasure-300',
    success: 'bg-emerald-500/20 text-emerald-300',
    danger: 'bg-danger-500/20 text-danger-300',
  };

  const sizeStyles = {
    sm: {
      container: 'p-2',
      icon: 'text-lg',
      label: 'text-xs',
      value: 'text-lg',
    },
    md: {
      container: 'p-3',
      icon: 'text-xl',
      label: 'text-sm',
      value: 'text-2xl',
    },
    lg: {
      container: 'p-4',
      icon: 'text-2xl',
      label: 'text-base',
      value: 'text-3xl',
    },
  };

  return (
    <div className={`${variantStyles[variant]} rounded-xl ${sizeStyles[size].container} transition-all hover:scale-105`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={sizeStyles[size].icon}>{icon}</span>
        <span className={`font-medium uppercase tracking-wide ${sizeStyles[size].label}`}>{label}</span>
      </div>
      <div className={`text-white font-bold ${sizeStyles[size].value}`}>{value}</div>
    </div>
  );
};

export default StatDisplay;
