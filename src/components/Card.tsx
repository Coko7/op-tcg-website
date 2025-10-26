import React from 'react';
import { Card as CardType } from '../types';
import { RARITY_COLORS, RARITY_LABELS } from '../data/cards';
import { Heart, Sword, Shield } from 'lucide-react';

interface CardProps {
  card: CardType;
  quantity?: number;
  isNew?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onCardClick?: (card: CardType) => void;
  showStats?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  card,
  quantity = 1,
  isNew = false,
  isFavorite = false,
  onToggleFavorite,
  onCardClick,
  showStats = true,
  className = ''
}) => {
  const rarityClass = `card-${card.rarity.replace('_', '-')}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on favorite button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onCardClick) {
      onCardClick(card);
    }
  };

  return (
    <div
      className={`relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl md:hover:scale-105 transition-all duration-300 cursor-pointer ${rarityClass} ${className}`}
      onClick={handleCardClick}
    >
      {isNew && (
        <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce-in z-10">
          NOUVEAU!
        </div>
      )}

      {quantity !== undefined && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-black/80 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold z-10">
          x{quantity}
        </div>
      )}

      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10"
        >
          <Heart
            size={16}
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}
          />
        </button>
      )}

      {/* Full-size card image */}
      <div className={`w-full aspect-[2.5/3.5] relative overflow-hidden bg-gray-800 ${
        card.rarity === 'super_rare' ? 'holographic-shimmer' : ''
      } ${card.rarity === 'secret_rare' ? 'rainbow-foil' : ''}`}>
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover ${
              card.rarity === 'super_rare' || card.rarity === 'secret_rare' ? 'holographic-effect' : ''
            }`}
            style={{
              contentVisibility: 'auto'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Essaie l'URL de fallback si disponible
              if (card.fallback_image_url && target.src !== card.fallback_image_url) {
                target.src = card.fallback_image_url;
              } else {
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-white/80 bg-gradient-to-br ${RARITY_COLORS[card.rarity]} ${card.image_url ? 'hidden' : ''}`}>
          <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🏴‍☠️</div>
          <div className="text-sm sm:text-lg font-bold text-center px-2 sm:px-4">{card.character}</div>
          <div className="text-xs sm:text-sm mt-1 sm:mt-2">{RARITY_LABELS[card.rarity]}</div>
          {card.image_url && (
            <div className="text-xs mt-1 sm:mt-2 text-red-400">Image indisponible</div>
          )}
        </div>
      </div>

      {/* Card info below image */}
      <div className="p-2 sm:p-4 bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Card name and character */}
        <div className="text-center mb-2 sm:mb-3">
          <h3 className="font-bold text-white text-sm sm:text-lg leading-tight mb-1">{card.name}</h3>
          <p className="text-white/80 text-xs sm:text-sm">{card.character}</p>

          {/* Rarity and type */}
          <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-2 text-xs mt-1 sm:mt-2">
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium text-xs ${
              card.rarity === 'secret_rare' ? 'bg-purple-600 text-white' :
              card.rarity === 'super_rare' ? 'bg-yellow-600 text-white' :
              card.rarity === 'leader' ? 'bg-red-600 text-white' :
              card.rarity === 'rare' ? 'bg-blue-600 text-white' :
              card.rarity === 'uncommon' ? 'bg-green-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {RARITY_LABELS[card.rarity]}
            </span>
            {card.type && (
              <span className="bg-gray-700 text-white/90 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">{card.type}</span>
            )}
          </div>

          {/* Colors */}
          {card.color && card.color.length > 0 && (
            <div className="flex justify-center flex-wrap gap-1 mt-1 sm:mt-2">
              {card.color.map((color, index) => (
                <span
                  key={index}
                  className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium ${
                    color === 'Red' ? 'bg-red-600 text-white' :
                    color === 'Blue' ? 'bg-blue-600 text-white' :
                    color === 'Green' ? 'bg-green-600 text-white' :
                    color === 'Yellow' ? 'bg-yellow-600 text-white' :
                    color === 'Purple' ? 'bg-purple-600 text-white' :
                    color === 'Black' ? 'bg-gray-800 text-white' :
                    color === 'White' ? 'bg-gray-200 text-gray-800' :
                    'bg-gray-600 text-white'
                  }`}
                >
                  {color}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {showStats && (
          <div className="space-y-2 sm:space-y-3">
            {/* One Piece TCG Stats */}
            {(card.cost !== undefined || card.power !== undefined || card.counter !== undefined) && (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
                {card.cost !== undefined && (
                  <div className="bg-gray-700/50 rounded p-1 sm:p-2">
                    <div className="text-white/60 text-xs font-medium">COST</div>
                    <div className="text-white font-bold text-sm sm:text-lg">{card.cost}</div>
                  </div>
                )}
                {card.power !== undefined && (
                  <div className="bg-gray-700/50 rounded p-1 sm:p-2">
                    <div className="text-white/60 text-xs font-medium">PWR</div>
                    <div className="text-white font-bold text-sm sm:text-lg">{card.power}</div>
                  </div>
                )}
                {card.counter !== undefined && (
                  <div className="bg-gray-700/50 rounded p-1 sm:p-2">
                    <div className="text-white/60 text-xs font-medium">CTR</div>
                    <div className="text-white font-bold text-sm sm:text-lg">{card.counter}</div>
                  </div>
                )}
              </div>
            )}

            {/* Fallback stats with icons */}
            {!(card.cost !== undefined || card.power !== undefined || card.counter !== undefined) && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 bg-gray-700/50 rounded p-1.5 sm:p-2">
                  <Sword size={14} className="text-red-400" />
                  <span className="text-white font-bold text-sm sm:text-base">{card.power || card.attack}</span>
                </div>
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 bg-gray-700/50 rounded p-1.5 sm:p-2">
                  <Shield size={14} className="text-blue-400" />
                  <span className="text-white font-bold text-sm sm:text-base">{card.counter || card.defense}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {card.description && (
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-700/30 rounded text-white/90 text-xs leading-relaxed line-clamp-3">
            {card.description}
          </div>
        )}

        {/* Special ability */}
        {card.special_ability && (
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-yellow-900/30 border border-yellow-600/30 rounded">
            <div className="text-yellow-400 font-semibold text-xs mb-1">🌟 SPÉCIAL</div>
            <div className="text-white/90 text-xs leading-relaxed line-clamp-2">{card.special_ability}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;