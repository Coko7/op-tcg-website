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
  const baseStyles = 'relative backdrop-blur-md rounded-2xl border transition-all duration-300';

  const variantStyles = {
    default: 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/60',
    ocean: 'bg-gradient-to-br from-ocean-500/20 to-ocean-600/20 border-ocean-400/30 hover:border-ocean-400/60',
    treasure: 'bg-gradient-to-br from-treasure-500/20 to-treasure-600/20 border-treasure-400/30 hover:border-treasure-400/60',
    danger: 'bg-gradient-to-br from-danger-500/20 to-danger-600/20 border-danger-400/30 hover:border-danger-400/60',
    success: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-400/30 hover:border-emerald-400/60',
  };

  const hoverEffect = hover ? 'hover:scale-[1.02] hover:shadow-2xl' : '';
  const glowEffect = glow ? 'shadow-glow-lg' : 'shadow-xl';

  return (
    <div className={`group ${baseStyles} ${variantStyles[variant]} ${hoverEffect} ${glowEffect} ${className}`}>
      {/* Overlay effet au hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Contenu */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default GameCard;
