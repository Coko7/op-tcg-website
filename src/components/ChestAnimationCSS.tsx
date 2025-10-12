import React, { useState, useEffect, useRef } from 'react';
import { Card as CardType } from '../types';

interface ChestAnimationCSSProps {
  isOpening: boolean;
  animationPhase: 'idle' | 'opening' | 'deck' | 'revealing' | 'complete';
  cards?: CardType[];
  onAnimationComplete?: () => void;
  onClick?: () => void;
}

interface CardPosition {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const ChestAnimationCSS: React.FC<ChestAnimationCSSProps> = ({
  isOpening,
  animationPhase,
  cards,
  onAnimationComplete,
  onClick,
}) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [currentFlyingCardIndex, setCurrentFlyingCardIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
    color: string;
  }>>([]);

  // Déclencher l'animation des cartes sortant du coffre UNE PAR UNE
  useEffect(() => {
    if (animationPhase === 'opening' && cards && cards.length > 0) {
      setCurrentFlyingCardIndex(-1);
      // Attendre que le coffre s'ouvre avant de faire sortir la première carte
      const timer = setTimeout(() => {
        setCurrentFlyingCardIndex(0);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (animationPhase === 'deck') {
      setCurrentFlyingCardIndex(-1);
    }
  }, [animationPhase, cards]);

  // Faire sortir les cartes une par une - RALENTI
  useEffect(() => {
    if (animationPhase === 'opening' && cards && currentFlyingCardIndex >= 0 && currentFlyingCardIndex < cards.length - 1) {
      const timer = setTimeout(() => {
        setCurrentFlyingCardIndex(prev => prev + 1);
      }, 1200); // Délai entre chaque carte (ralenti de 400ms à 1200ms)
      return () => clearTimeout(timer);
    }
  }, [currentFlyingCardIndex, animationPhase, cards]);

  // Animation des particules avec Canvas
  useEffect(() => {
    if (!isOpening && animationPhase !== 'deck') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialiser les particules
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particlesRef.current.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 2,
          alpha: 1,
          size: Math.random() * 4 + 2,
          color: ['#FFD700', '#FFA500', '#FF6B35', '#FBBF24'][Math.floor(Math.random() * 4)]
        });
      }
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dessiner et mettre à jour les particules
      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // Gravité
        particle.alpha -= 0.01;

        if (particle.alpha > 0) {
          ctx.globalAlpha = particle.alpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Réinitialiser la particule
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1;
          particle.x = canvas.width / 2;
          particle.y = canvas.height / 2;
          particle.vx = Math.cos(angle) * speed;
          particle.vy = Math.sin(angle) * speed - Math.random() * 2;
          particle.alpha = 1;
        }
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      particlesRef.current = [];
    };
  }, [isOpening, animationPhase]);

  const handleStackClick = () => {
    if (animating || !cards || revealedCount >= cards.length) return;

    setAnimating(true);
    // Attendre que l'animation de slide-out soit terminée avant d'incrémenter
    setTimeout(() => {
      setRevealedCount(prev => {
        const newCount = prev + 1;
        if (newCount >= cards.length) {
          setTimeout(() => onAnimationComplete?.(), 800);
        }
        return newCount;
      });
      setAnimating(false);
    }, 800); // Augmenté pour correspondre à la durée de l'animation
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#FFFFFF',      // Blanc
      uncommon: '#10B981',    // Vert
      rare: '#3B82F6',        // Bleu
      leader: '#EF4444',      // Rouge
      super_rare: '#FBBF24',  // Doré
      secret_rare: '#A855F7', // Multicolor (violet comme base)
    };
    return colors[rarity] || colors.common;
  };

  const getRarityGradient = (rarity: string) => {
    const gradients: Record<string, string> = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-green-500 to-green-700',
      rare: 'from-blue-500 to-blue-700',
      leader: 'from-red-500 to-red-700',
      super_rare: 'from-yellow-400 to-yellow-600',
      secret_rare: 'from-purple-500 via-pink-500 to-blue-500',
    };
    return gradients[rarity] || gradients.common;
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] bg-gradient-to-b from-sky-400 via-sky-500 to-blue-400 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
      {/* Canvas pour les particules */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Carte qui sort du coffre pendant l'ouverture - FACE CACHÉE - UNE PAR UNE */}
      {animationPhase === 'opening' && currentFlyingCardIndex >= 0 && cards && cards[currentFlyingCardIndex] && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            key={`flying-${cards[currentFlyingCardIndex].id}-${currentFlyingCardIndex}`}
            className="absolute cards-fly-out w-[160px] h-[224px] sm:w-[200px] sm:h-[280px] md:w-[240px] md:h-[336px]"
            style={{
              animationDuration: '2.5s', // Ralenti de 1.5s à 2.5s
              animationFillMode: 'forwards',
              zIndex: 30,
            }}
          >
            {/* Bordure de rareté */}
            <div
              className="absolute inset-0 rounded-xl p-1"
              style={{
                background: `linear-gradient(135deg, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}dd)`,
                boxShadow: `0 0 30px ${getRarityColor(cards[currentFlyingCardIndex].rarity)}`,
              }}
            >
              {/* DOS DE CARTE */}
              <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Pattern de fond */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black" />
                  {[...Array(8)].map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-gray-600 to-transparent"
                      style={{ top: `${(idx + 1) * 12.5}%` }}
                    />
                  ))}
                </div>

                {/* Logo central */}
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full animate-pulse"
                    style={{
                      background: `radial-gradient(circle, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}, transparent)`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 sm:border-3 md:border-4 animate-spin-slow"
                      style={{ borderColor: `${getRarityColor(cards[currentFlyingCardIndex].rarity)} transparent ${getRarityColor(cards[currentFlyingCardIndex].rarity)} transparent` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl md:text-3xl">
                    🃏
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase IDLE - Coffre fermé */}
      {(animationPhase === 'idle' || animationPhase === 'opening') && (
        <div className={`absolute inset-0 flex items-center justify-center ${isOpening ? 'camera-zoom' : ''}`}>
          <div
            className={`chest-container cursor-pointer transition-transform duration-300 hover:scale-105 ${
              isOpening ? 'opening' : ''
            }`}
            onClick={onClick}
            style={{ perspective: '1000px' }}
          >
            {/* Coffre */}
            <div className="chest relative w-48 h-36 sm:w-56 sm:h-42 md:w-64 md:h-48">
              {/* Corps du coffre */}
              <div className="chest-body absolute bottom-0 w-full h-32 bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg border-4 border-yellow-600 shadow-2xl">
                {/* Détails du coffre - planches */}
                <div className="absolute inset-0 flex justify-around p-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1 h-full bg-amber-950/50 rounded" />
                  ))}
                </div>

                {/* Bandes métalliques */}
                <div className="absolute top-2 left-0 right-0 h-2 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 shadow-inner" />
                <div className="absolute bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 shadow-inner" />

                {/* Pieds du coffre */}
                {[-1, 1].map((dir) => (
                  <React.Fragment key={dir}>
                    <div
                      className="absolute bottom-[-8px] w-6 h-4 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded"
                      style={{ left: dir === -1 ? '10px' : 'auto', right: dir === 1 ? '10px' : 'auto' }}
                    />
                  </React.Fragment>
                ))}

                {/* Serrure ornée */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-20 flex items-center justify-center">
                  <div className="relative w-12 h-16 bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-lg shadow-lg border-2 border-yellow-600">
                    {/* Gemme centrale */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full shadow-lg animate-pulse">
                      <div className="absolute inset-1 bg-red-400 rounded-full" />
                      <div className="absolute inset-2 bg-red-300 rounded-full" />
                    </div>
                    {/* Ornements autour */}
                    {[0, 90, 180, 270].map((angle) => (
                      <div
                        key={angle}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-16px)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Couvercle du coffre */}
              <div
                className={`chest-lid absolute top-0 w-full h-24 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-lg border-4 border-yellow-600 shadow-2xl transition-all duration-1000 origin-bottom ${
                  isOpening ? 'rotate-x-120' : ''
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isOpening ? 'rotateX(-120deg)' : 'rotateX(0deg)',
                }}
              >
                {/* Planches du couvercle */}
                <div className="absolute inset-0 flex justify-around p-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1 h-full bg-amber-950/50 rounded" />
                  ))}
                </div>

                {/* Bandes métalliques du couvercle */}
                <div className="absolute top-4 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 shadow-inner" />
                <div className="absolute bottom-4 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 shadow-inner" />

                {/* Charnières */}
                {[-1, 1].map((dir) => (
                  <div
                    key={dir}
                    className="absolute bottom-0 w-4 h-3 bg-gray-700 rounded"
                    style={{ left: dir === -1 ? '20px' : 'auto', right: dir === 1 ? '20px' : 'auto' }}
                  />
                ))}
              </div>

              {/* Lueur magique quand le coffre s'ouvre - Couleur selon la rareté de la carte - Plus subtile avec dégradé */}
              {isOpening && currentFlyingCardIndex >= 0 && cards && cards[currentFlyingCardIndex] && (
                <div className="absolute top-12 sm:top-16 left-1/2 transform -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32">
                  <div
                    className="absolute inset-0 rounded-full opacity-30 animate-ping"
                    style={{
                      background: cards[currentFlyingCardIndex].rarity === 'secret_rare'
                        ? 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, rgba(236, 72, 153, 0.4) 50%, transparent 100%)'
                        : `radial-gradient(circle, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}99 0%, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}44 50%, transparent 100%)`
                    }}
                  />
                  <div
                    className="absolute inset-2 sm:inset-4 rounded-full opacity-40 animate-pulse"
                    style={{
                      background: cards[currentFlyingCardIndex].rarity === 'secret_rare'
                        ? 'radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, rgba(251, 191, 36, 0.5) 50%, transparent 100%)'
                        : `radial-gradient(circle, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}bb 0%, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}66 50%, transparent 100%)`
                    }}
                  />
                  <div
                    className="absolute inset-4 sm:inset-8 rounded-full opacity-60"
                    style={{
                      background: cards[currentFlyingCardIndex].rarity === 'secret_rare'
                        ? 'radial-gradient(circle, rgba(251, 191, 36, 0.8) 0%, rgba(251, 146, 60, 0.6) 50%, transparent 100%)'
                        : `radial-gradient(circle, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}dd 0%, ${getRarityColor(cards[currentFlyingCardIndex].rarity)}88 50%, transparent 100%)`
                    }}
                  />
                </div>
              )}
              {/* Lueur jaune par défaut quand aucune carte n'est encore sortie */}
              {isOpening && currentFlyingCardIndex < 0 && (
                <div className="absolute top-12 sm:top-16 left-1/2 transform -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32">
                  <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-60 animate-ping" />
                  <div className="absolute inset-2 sm:inset-4 bg-yellow-300 rounded-full opacity-80 animate-pulse" />
                  <div className="absolute inset-4 sm:inset-8 bg-yellow-200 rounded-full opacity-100" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase DECK - Pile de cartes avec images */}
      {animationPhase === 'deck' && cards && (
        <div className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center pt-16 sm:pt-0">
          {/* Instructions */}
          <div className="absolute top-4 sm:top-8 left-0 right-0 text-center z-20 px-2 sm:px-4">
            <div className="inline-block backdrop-blur-sm bg-black/40 py-2 px-4 sm:py-3 sm:px-6 rounded-lg">
              <p className="text-white font-semibold text-sm sm:text-base md:text-lg mb-1">
                🎴 Cliquez sur la pile pour découvrir vos cartes !
              </p>
              <p className="text-blue-300 text-xs sm:text-sm">
                {revealedCount} / {cards.length} cartes révélées
              </p>
            </div>
          </div>

          {/* Pile de cartes au centre avec images */}
          <div
            className={`relative cursor-pointer transition-transform hover:scale-105 ${
              animating ? 'animate-bounce' : ''
            } w-[160px] h-[224px] sm:w-[220px] sm:h-[308px] md:w-[250px] md:h-[350px] mb-4 sm:mb-0`}
            onClick={handleStackClick}
            style={{ perspective: '1000px' }}
          >
            {cards
              .slice(revealedCount, Math.min(revealedCount + 5, cards.length))
              .map((card, i) => {
                const cardIndex = revealedCount + i;
                const isTop = i === 0;
                const offset = i * 6;

                return (
                  <div
                    key={`stack-${cardIndex}`}
                    className={`absolute card-3d w-full h-full ${
                      isTop && animating ? 'card-slide-out-animation' : 'transition-all duration-500'
                    } ${isTop && !animating ? 'hover:translate-y-[-12px]' : ''}`}
                    style={{
                      transform: `translateY(${offset}px) translateX(${i * 2}px) rotateY(${i * 2}deg)`,
                      zIndex: 10 - i,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Bordure de rareté avec effet 3D */}
                    <div
                      className="absolute inset-0 rounded-xl p-1.5"
                      style={{
                        background: `linear-gradient(135deg, ${getRarityColor(card.rarity)}, ${getRarityColor(card.rarity)}dd)`,
                        boxShadow: isTop
                          ? `0 0 40px ${getRarityColor(card.rarity)}, 0 0 80px ${getRarityColor(card.rarity)}66`
                          : `0 4px 12px rgba(0,0,0,0.5)`,
                      }}
                    >
                      {/* Carte avec image et effet holographique */}
                      <div className={`w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg overflow-hidden relative ${
                        card.rarity === 'super_rare' ? 'holographic-shimmer' : ''
                      } ${card.rarity === 'secret_rare' ? 'rainbow-foil' : ''}`}>
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://via.placeholder.com/250x350?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <div className="text-center">
                              <div className="text-6xl mb-4">🃏</div>
                              <span className="text-gray-500 text-sm">No Image</span>
                            </div>
                          </div>
                        )}

                        {/* Overlay gradient pour effet de profondeur */}
                        {!isTop && (
                          <div
                            className="absolute inset-0 bg-black"
                            style={{ opacity: i * 0.15 }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Effet de brillance sur la carte du dessus */}
                    {isTop && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-xl pointer-events-none" />
                        {/* Particules brillantes */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                          {[...Array(5)].map((_, sparkle) => (
                            <div
                              key={sparkle}
                              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                              style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${sparkle * 0.3}s`,
                                animationDuration: '2s',
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

            {/* Message quand toutes les cartes sont révélées */}
            {revealedCount >= cards.length && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
                <div className="text-center backdrop-blur-md bg-gradient-to-br from-green-500/90 to-blue-500/90 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl mx-4">
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 animate-bounce">✨</div>
                  <p className="text-white font-bold text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2">Toutes révélées !</p>
                  <p className="text-white/80 text-xs sm:text-sm">Cliquez sur "Voir le résumé" ci-dessous</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions en bas pour la phase idle */}
      {animationPhase === 'idle' && (
        <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 text-center px-2 sm:px-4">
          <p className="text-white/90 text-xs sm:text-sm backdrop-blur-sm bg-black/30 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg inline-block shadow-lg">
            🖱️ Cliquez sur le coffre pour l'ouvrir
          </p>
        </div>
      )}

      {/* Message d'ouverture */}
      {animationPhase === 'opening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="backdrop-blur-sm bg-black/40 py-3 px-6 sm:py-4 sm:px-8 rounded-xl mx-4">
            <p className="text-white font-bold text-lg sm:text-xl md:text-2xl animate-pulse">
              ✨ Ouverture du coffre... ✨
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .chest-container {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .card-back {
          transform-style: preserve-3d;
        }

        .card-3d {
          transform-style: preserve-3d;
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        /* Animation des cartes qui sortent du coffre */
        @keyframes cards-fly-out {
          0% {
            transform: translate(0, 30px) scale(0.3) rotateY(0deg) rotateZ(0deg);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          50% {
            transform: translate(0, -100px) scale(0.8) rotateY(180deg) rotateZ(360deg);
            opacity: 1;
          }
          70% {
            transform: translate(0, -150px) scale(1) rotateY(360deg) rotateZ(720deg);
            opacity: 1;
          }
          100% {
            transform: translate(0, -200px) scale(1.2) rotateY(360deg) rotateZ(1080deg);
            opacity: 0;
          }
        }

        /* Version desktop de l'animation */
        @media (min-width: 640px) {
          @keyframes cards-fly-out {
            0% {
              transform: translate(0, 50px) scale(0.3) rotateY(0deg) rotateZ(0deg);
              opacity: 0;
            }
            30% {
              opacity: 1;
            }
            50% {
              transform: translate(0, -150px) scale(0.8) rotateY(180deg) rotateZ(360deg);
              opacity: 1;
            }
            70% {
              transform: translate(0, -200px) scale(1) rotateY(360deg) rotateZ(720deg);
              opacity: 1;
            }
            100% {
              transform: translate(0, -250px) scale(1.2) rotateY(360deg) rotateZ(1080deg);
              opacity: 0;
            }
          }
        }

        .cards-fly-out {
          animation-name: cards-fly-out;
          animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Scrollbar personnalisée */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }

        /* Animation de caméra zoom vers le coffre avec vue en plongée */
        @keyframes camera-zoom-in {
          0% {
            transform: scale(1) perspective(1200px) rotateX(0deg) translateZ(0px);
          }
          100% {
            transform: scale(1.8) perspective(1200px) rotateX(15deg) translateZ(100px);
          }
        }

        .camera-zoom {
          animation: camera-zoom-in 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          transform-style: preserve-3d;
        }

        /* Animation de slide out naturelle pour la carte du dessus */
        @keyframes card-slide-out-natural {
          0% {
            transform: translateY(0) translateX(0) rotateY(0deg) scale(1);
            opacity: 1;
          }
          40% {
            transform: translateY(10px) translateX(0) rotateY(0deg) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(0) translateX(-150%) rotateY(-15deg) scale(0.9);
            opacity: 0;
          }
        }

        .card-slide-out-animation {
          animation: card-slide-out-natural 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default ChestAnimationCSS;
