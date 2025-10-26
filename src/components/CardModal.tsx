import React, { useState, useRef, useEffect } from 'react';
import { X, Heart, RotateCcw } from 'lucide-react';
import { Card as CardType } from '../types';
import { RARITY_COLORS, RARITY_LABELS } from '../data/cards';

interface CardModalProps {
  card: CardType;
  isOpen: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  quantity?: number;
}

const CardModal: React.FC<CardModalProps> = ({
  card,
  isOpen,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  quantity = 1
}) => {
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      // Sauvegarder la position de scroll actuelle
      scrollPositionRef.current = window.scrollY;

      setTiltX(0);
      setTiltY(0);
      setGlareX(50);
      setGlareY(50);
      setIsHovering(false);

      // Empêcher le scroll de l'arrière-plan sur mobile
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
    } else {
      // Restaurer le scroll et la position sauvegardée
      const savedPosition = scrollPositionRef.current;

      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // Utiliser requestAnimationFrame pour s'assurer que le scroll se fait après le rendu
      if (savedPosition > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, savedPosition);
        });
      }
    }

    // Cleanup en cas de démontage du composant pendant qu'il est ouvert
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInteraction = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculer la position relative (0-100%)
    const relativeX = ((clientX - rect.left) / rect.width) * 100;
    const relativeY = ((clientY - rect.top) / rect.height) * 100;

    // Effet de tilt (plus prononcé pour les cartes holographiques)
    const maxTilt = ['super_rare', 'secret_rare', 'leader'].includes(card.rarity) ? 20 : 15;
    const newTiltX = ((clientY - centerY) / (rect.height / 2)) * maxTilt;
    const newTiltY = ((clientX - centerX) / (rect.width / 2)) * -maxTilt;

    setTiltX(newTiltX);
    setTiltY(newTiltY);
    setGlareX(relativeX);
    setGlareY(relativeY);
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleInteraction(e.clientX, e.clientY);
  };

  const handleCardTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleInteraction(touch.clientX, touch.clientY);
    }
  };

  const resetTilt = () => {
    setTiltX(0);
    setTiltY(0);
    setGlareX(50);
    setGlareY(50);
  };

  const handleCardMouseEnter = () => {
    setIsHovering(true);
  };

  const handleCardMouseLeave = () => {
    setIsHovering(false);
    setTimeout(() => {
      resetTilt();
    }, 100);
  };

  const handleCardTouchEnd = () => {
    setIsHovering(false);
    setTimeout(() => {
      resetTilt();
    }, 100);
  };

  const transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovering ? 1.05 : 1})`;

  // Vérifier si la carte a un effet holographique (Leader n'a pas d'effet holo IRL)
  const hasHolographicEffect = ['super_rare', 'secret_rare'].includes(card.rarity);

  // Effet de lumière simple pour les cartes non-holographiques
  const hasSimpleLightEffect = !hasHolographicEffect;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-w-4xl w-full bg-gray-900 rounded-2xl p-6 max-h-[90vh] overflow-y-auto scrollbar-stable">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors z-10"
        >
          <X size={24} className="text-white" />
        </button>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="relative">
            <div
              ref={cardRef}
              className="relative w-full max-w-md mx-auto transition-transform duration-100 ease-out"
              style={{
                transform,
                transformStyle: 'preserve-3d'
              }}
              onMouseMove={handleCardMouseMove}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              onTouchMove={handleCardTouchMove}
              onTouchEnd={handleCardTouchEnd}
              onTouchStart={() => setIsHovering(true)}
            >
              <div className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl card-${card.rarity.replace('_', '-')}`}>
                {/* Image de la carte */}
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.name}
                    className="w-full h-full object-cover relative z-0"
                    style={{ pointerEvents: 'none' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (card.fallback_image_url && target.src !== card.fallback_image_url) {
                        target.src = card.fallback_image_url;
                      } else {
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}

                {/* Fallback si pas d'image */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center text-white/80 bg-gradient-to-br ${RARITY_COLORS[card.rarity]} ${card.image_url ? 'hidden' : ''} z-0`}>
                  <div className="text-6xl mb-4">🏴‍☠️</div>
                  <div className="text-lg font-bold text-center px-4">{card.character}</div>
                  <div className="text-sm mt-2">{RARITY_LABELS[card.rarity]}</div>
                  {card.image_url && (
                    <div className="text-xs mt-2 text-red-400">Image indisponible</div>
                  )}
                </div>

                {/* Effet holographique interactif pour les cartes Super Rare et Secret Rare */}
                {hasHolographicEffect && (
                  <>
                    {/* Couche de brillance principale qui suit la souris */}
                    <div
                      className="absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300"
                      style={{
                        opacity: isHovering ? 0.7 : 0,
                        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 15%, transparent 40%)`,
                      }}
                    />

                    {/* Effet holographique arc-en-ciel dynamique pour Secret Rare */}
                    {card.rarity === 'secret_rare' && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300"
                        style={{
                          opacity: isHovering ? 0.55 : 0,
                          background: `
                            linear-gradient(
                              ${(glareX - 50) * 3.6}deg,
                              rgba(255, 0, 0, 0.5) 0%,
                              rgba(255, 77, 0, 0.5) 5%,
                              rgba(255, 154, 0, 0.5) 10%,
                              rgba(231, 188, 16, 0.5) 15%,
                              rgba(208, 222, 33, 0.5) 20%,
                              rgba(143, 221, 53, 0.5) 25%,
                              rgba(79, 220, 74, 0.5) 30%,
                              rgba(71, 219, 145, 0.5) 35%,
                              rgba(63, 218, 216, 0.5) 40%,
                              rgba(55, 209, 221, 0.5) 45%,
                              rgba(47, 201, 226, 0.5) 50%,
                              rgba(37, 164, 232, 0.5) 55%,
                              rgba(28, 127, 238, 0.5) 60%,
                              rgba(61, 74, 240, 0.5) 65%,
                              rgba(95, 21, 242, 0.5) 70%,
                              rgba(140, 16, 245, 0.5) 75%,
                              rgba(186, 12, 248, 0.5) 80%,
                              rgba(218, 9, 232, 0.5) 85%,
                              rgba(251, 7, 217, 0.5) 90%,
                              rgba(253, 3, 108, 0.5) 95%,
                              rgba(255, 0, 0, 0.5) 100%
                            )
                          `,
                          mixBlendMode: 'color-dodge',
                        }}
                      />
                    )}

                    {/* Effet holographique pour super_rare */}
                    {card.rarity === 'super_rare' && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300"
                        style={{
                          opacity: isHovering ? 0.5 : 0,
                          background: `
                            linear-gradient(
                              ${(glareX - 50) * 2.5}deg,
                              rgba(255, 0, 255, 0.45) 0%,
                              rgba(212, 0, 255, 0.45) 6.25%,
                              rgba(170, 0, 255, 0.45) 12.5%,
                              rgba(85, 85, 255, 0.45) 18.75%,
                              rgba(0, 170, 255, 0.45) 25%,
                              rgba(0, 212, 255, 0.45) 31.25%,
                              rgba(0, 255, 255, 0.45) 37.5%,
                              rgba(85, 255, 170, 0.45) 43.75%,
                              rgba(170, 255, 85, 0.45) 50%,
                              rgba(212, 255, 42, 0.45) 56.25%,
                              rgba(255, 255, 0, 0.45) 62.5%,
                              rgba(255, 212, 0, 0.45) 68.75%,
                              rgba(255, 170, 0, 0.45) 75%,
                              rgba(255, 127, 0, 0.45) 81.25%,
                              rgba(255, 85, 0, 0.45) 87.5%,
                              rgba(255, 42, 127, 0.45) 93.75%,
                              rgba(255, 0, 255, 0.45) 100%
                            )
                          `,
                          mixBlendMode: 'color-dodge',
                        }}
                      />
                    )}
                  </>
                )}

                {/* Effet de lumière simple pour les cartes non-holographiques */}
                {hasSimpleLightEffect && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300"
                    style={{
                      opacity: isHovering ? 0.4 : 0,
                      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 15%, transparent 35%)`,
                      mixBlendMode: 'overlay',
                    }}
                  />
                )}

                {/* Ring animé pour les cartes très rares */}
                {(card.rarity === 'super_rare' || card.rarity === 'secret_rare') && (
                  <div className="absolute -inset-2 ring-4 ring-yellow-400 ring-opacity-50 rounded-xl pointer-events-none animate-pulse"></div>
                )}
              </div>

              {/* Indication tactile pour mobile */}
              {!isHovering && hasHolographicEffect && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full pointer-events-none opacity-70 md:hidden">
                  👆 Toucher pour voir l'effet
                </div>
              )}
            </div>

            {quantity > 1 && (
              <div className="absolute top-4 left-4 bg-black/80 text-white text-lg px-4 py-2 rounded-full font-bold z-20">
                x{quantity}
              </div>
            )}

            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className="absolute top-4 right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 transition-colors z-20"
              >
                <Heart
                  size={24}
                  className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}
                />
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{card.name}</h2>
              <p className="text-xl text-white/80 mb-4">{card.character}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  card.rarity === 'secret_rare' ? 'bg-yellow-600 text-white' :
                  card.rarity === 'super_rare' ? 'bg-purple-600 text-white' :
                  card.rarity === 'leader' ? 'bg-red-600 text-white' :
                  card.rarity === 'rare' ? 'bg-blue-600 text-white' :
                  card.rarity === 'uncommon' ? 'bg-green-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {RARITY_LABELS[card.rarity]}
                </span>
                {card.type && (
                  <span className="bg-gray-700 text-white/90 px-3 py-1 rounded-full text-sm">{card.type}</span>
                )}
              </div>

              {card.color && card.color.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {card.color.map((color, index) => (
                    <span
                      key={index}
                      className={`text-sm px-3 py-1 rounded-full font-medium ${
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

            {(card.cost !== undefined || card.power !== undefined || card.counter !== undefined) && (
              <div className="grid grid-cols-3 gap-4">
                {card.cost !== undefined && (
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-white/60 text-sm font-medium mb-1">COST</div>
                    <div className="text-white font-bold text-2xl">{card.cost}</div>
                  </div>
                )}
                {card.power !== undefined && (
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-white/60 text-sm font-medium mb-1">POWER</div>
                    <div className="text-white font-bold text-2xl">{card.power}</div>
                  </div>
                )}
                {card.counter !== undefined && (
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-white/60 text-sm font-medium mb-1">COUNTER</div>
                    <div className="text-white font-bold text-2xl">{card.counter}</div>
                  </div>
                )}
              </div>
            )}

            {card.description && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Description</h3>
                <p className="text-white/90 leading-relaxed">{card.description}</p>
              </div>
            )}

            {card.special_ability && (
              <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  🌟 Capacité Spéciale
                </h3>
                <p className="text-white/90 leading-relaxed">{card.special_ability}</p>
              </div>
            )}

            {/* Indication pour les utilisateurs desktop */}
            {hasHolographicEffect && (
              <div className="hidden md:block bg-blue-900/30 border border-blue-600/30 rounded-lg p-3">
                <p className="text-blue-300 text-sm text-center">
                  🖱️ Déplacez votre souris sur la carte pour voir l'effet holographique !
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
