import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'treasure' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent backdrop-blur-xl';

  const variantStyles = {
    primary: 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white shadow-lg hover:shadow-ocean-500/50 border border-ocean-400/30 hover:border-ocean-400/60 focus:ring-ocean-500 active:scale-95 hover:-translate-y-0.5',
    secondary: 'bg-white/5 hover:bg-white/10 text-white/90 hover:text-white shadow-lg hover:shadow-xl border-2 border-white/10 hover:border-white/20 focus:ring-white/50 active:scale-95 hover:-translate-y-0.5',
    danger: 'bg-gradient-to-r from-danger-500/90 to-danger-600/90 hover:from-danger-600 hover:to-danger-700 text-white shadow-lg hover:shadow-danger-500/50 border border-danger-400/30 hover:border-danger-400/60 focus:ring-danger-500 active:scale-95 hover:-translate-y-0.5',
    treasure: 'bg-gradient-to-r from-treasure-500/90 to-treasure-600/90 hover:from-treasure-600 hover:to-treasure-700 text-white shadow-lg hover:shadow-treasure-500/50 border border-treasure-400/30 hover:border-treasure-400/60 focus:ring-treasure-500 active:scale-95 hover:-translate-y-0.5',
    ghost: 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-2 border-white/20 hover:border-white/40 active:scale-95 hover:-translate-y-0.5',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
