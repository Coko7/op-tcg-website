import React from 'react';

export interface GameCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'ocean' | 'treasure' | 'danger' | 'success';
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({
  children,
  variant = 'default',
  className = '',
  hover = true,
  glow = false,
}) => {
  const baseStyles = 'relative backdrop-blur-xl rounded-3xl border-2 transition-all duration-300 overflow-hidden';

  const variantStyles = {
    default: 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10',
    ocean: 'bg-gradient-to-br from-ocean-500/10 to-ocean-600/20 border-ocean-400/20 hover:border-ocean-400/40 hover:shadow-ocean-500/20',
    treasure: 'bg-gradient-to-br from-treasure-500/10 to-treasure-600/20 border-treasure-400/20 hover:border-treasure-400/40 hover:shadow-treasure-500/20',
    danger: 'bg-gradient-to-br from-danger-500/10 to-danger-600/20 border-danger-400/20 hover:border-danger-400/40 hover:shadow-danger-500/20',
    success: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border-emerald-400/20 hover:border-emerald-400/40 hover:shadow-emerald-500/20',
  };

  const hoverEffect = hover ? 'hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1' : '';
  const glowEffect = glow ? 'shadow-glow-lg' : 'shadow-xl shadow-black/20';

  return (
    <div className={`group ${baseStyles} ${variantStyles[variant]} ${hoverEffect} ${glowEffect} ${className}`}>
      {/* Glassmorphism shiny edge */}
      <div className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Overlay effet au hover - Glassmorphism shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Contenu */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default GameCard;
