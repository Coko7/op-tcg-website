import React, { useState, useEffect, useRef } from 'react';
import { Card as CardType } from '../types';

interface WantedPosterAnimationProps {
  isOpening: boolean;
  animationPhase: 'idle' | 'opening' | 'deck' | 'revealing' | 'complete';
  cards?: CardType[];
  onAnimationComplete?: () => void;
  onClick?: () => void;
}

const WantedPosterAnimation: React.FC<WantedPosterAnimationProps> = ({
  isOpening,
  animationPhase,
  cards,
  onAnimationComplete,
  onClick,
}) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    alpha: number;
    size: number;
  }>>([]);

  // Déclencher l'animation de déchirement
  useEffect(() => {
    if (animationPhase === 'opening') {
      if (canvasRef.current && particlesRef.current.length === 0) {
        for (let i = 0; i < 100; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2;
          particlesRef.current.push({
            x: canvasRef.current.width / 2,
            y: canvasRef.current.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - Math.random() * 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 18,
            alpha: 1,
            size: Math.random() * 15 + 6,
          });
        }
      }
    }
  }, [animationPhase]);

  // Animation des particules
  useEffect(() => {
    if (animationPhase !== 'opening' && animationPhase !== 'deck') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.25;
        particle.rotation += particle.rotationSpeed;
        particle.alpha -= 0.012;

        if (particle.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = particle.alpha;
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);

          ctx.fillStyle = '#F5E6D3';
          ctx.beginPath();
          ctx.moveTo(-particle.size / 2, -particle.size / 2);
          ctx.lineTo(particle.size / 2 + Math.random() * 3, -particle.size / 3);
          ctx.lineTo(particle.size / 3, particle.size / 2 + Math.random() * 3);
          ctx.lineTo(-particle.size / 3, particle.size / 3);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#8B7355';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      if (animationPhase !== 'opening') {
        particlesRef.current = [];
      }
    };
  }, [animationPhase]);

  const handlePosterClick = () => {
    if (animating || !cards || revealedCount >= cards.length) return;

    setAnimating(true);

    // Attendre la fin complète de l'animation de déchirement (1100ms)
    setTimeout(() => {
      // React 18+ batche automatiquement ces updates ensemble
      setRevealedCount((prev) => {
        const newCount = prev + 1;

        if (newCount >= cards.length) {
          setTimeout(() => onAnimationComplete?.(), 500);
        }

        return newCount;
      });
      setAnimating(false);
    }, 1100);
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#8B7355',
      uncommon: '#10B981',
      rare: '#3B82F6',
      leader: '#EF4444',
      super_rare: '#F59E0B',
      secret_rare: '#A855F7',
    };
    return colors[rarity] || colors.common;
  };

  const getBountyAmount = (rarity: string) => {
    const bounties: Record<string, string> = {
      common: '1,000,000',
      uncommon: '10,000,000',
      rare: '50,000,000',
      leader: '100,000,000',
      super_rare: '500,000,000',
      secret_rare: '1,000,000,000',
    };
    return bounties[rarity] || bounties.common;
  };

  const PosterContent = ({ card }: { card: CardType }) => (
    <div className="absolute inset-0 rounded-lg shadow-2xl border-8 border-black overflow-visible"
      style={{
        background: 'linear-gradient(135deg, #F5DEB3 0%, #F4E4C1 50%, #EDD9B0 100%)',
        boxShadow: `0 25px 60px ${getRarityColor(card.rarity)}99, 0 0 80px ${getRarityColor(card.rarity)}66, inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 10px rgba(0,0,0,0.15)`,
      }}>
      {/* Texture */}
      <div className="absolute inset-0 opacity-15 mix-blend-multiply pointer-events-none">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="absolute rounded-full bg-amber-900" style={{
            width: `${Math.random() * 25 + 8}px`,
            height: `${Math.random() * 25 + 8}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.4,
          }} />
        ))}
      </div>

      {/* Grain */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        backgroundSize: '150px 150px'
      }} />

      {/* WANTED */}
      <div className="absolute top-2 sm:top-4 left-0 right-0 text-center z-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-black tracking-wider select-none"
          style={{
            fontFamily: 'Impact, Arial Black, sans-serif',
            textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
            WebkitTextStroke: '1px #2D1810'
          }}>
          WANTED
        </h2>
      </div>

      {/* Image - ratio 1:1.4 pour cartes One Piece */}
      <div className="absolute top-10 sm:top-12 left-1/2 transform -translate-x-1/2 w-[140px] h-[196px] sm:w-[175px] sm:h-[245px] md:w-[200px] md:h-[280px] border-4 border-black shadow-lg overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #E5D6A3 0%, #E4D4B1 50%, #DDD1A0 100%)' }}>
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'auto' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x280?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-30">🃏</span>
          </div>
        )}
      </div>

      {/* Nom - VRAIMENT SOUS le cadre image */}
      <div className="absolute top-[244px] sm:top-[300px] md:top-[338px] left-0 right-0 text-center px-2 z-20">
        <p className="text-sm sm:text-base md:text-lg font-bold text-black truncate select-none"
          style={{
            fontFamily: 'Arial, sans-serif',
            fontWeight: '800',
            textShadow: '0 1px 2px rgba(255,255,255,0.8), 1px 1px 1px rgba(0,0,0,0.2)',
            WebkitFontSmoothing: 'antialiased'
          }}>
          {card.name}
        </p>
      </div>

      {/* DEAD OR ALIVE - SOUS le nom */}
      <div className="absolute top-[266px] sm:top-[323px] md:top-[363px] left-0 right-0 text-center z-20">
        <p className="text-xs sm:text-sm md:text-base font-bold text-black tracking-widest select-none"
          style={{
            fontFamily: 'Impact, sans-serif',
            textShadow: '1px 1px 0px rgba(0,0,0,0.2)'
          }}>
          DEAD OR ALIVE
        </p>
      </div>

      {/* Bounty - sans bordure ni cadre */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center z-20">
        <div className="inline-block">
          <p className="text-xs sm:text-sm font-semibold text-gray-700" style={{ fontWeight: '600' }}>BOUNTY</p>
          <p className="text-base sm:text-lg md:text-xl font-black select-none"
            style={{
              fontFamily: 'Impact, Arial Black, sans-serif',
              color: getRarityColor(card.rarity),
              textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
            }}>
            {getBountyAmount(card.rarity)} <span className="text-sm">฿</span>
          </p>
        </div>
      </div>

      {/* Logo Marine */}
      <div className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 opacity-60 z-10">
        <div className="text-lg sm:text-xl" style={{ filter: 'grayscale(1) brightness(0.3)' }}>🕊️</div>
      </div>

      {/* Bordure déchirée */}
      <div className="absolute inset-0 border-2 border-black/50 rounded-lg pointer-events-none z-10" style={{
        clipPath: 'polygon(0% 2%, 3% 0%, 7% 2%, 10% 0%, 14% 2%, 17% 0%, 21% 2%, 24% 0%, 28% 2%, 31% 0%, 35% 2%, 38% 0%, 42% 2%, 45% 0%, 49% 2%, 52% 0%, 56% 2%, 59% 0%, 63% 2%, 66% 0%, 70% 2%, 73% 0%, 77% 2%, 80% 0%, 84% 2%, 87% 0%, 91% 2%, 94% 0%, 98% 2%, 100% 0%, 100% 98%, 98% 100%, 94% 98%, 91% 100%, 87% 98%, 84% 100%, 80% 98%, 77% 100%, 73% 98%, 70% 100%, 66% 98%, 63% 100%, 59% 98%, 56% 100%, 52% 98%, 49% 100%, 45% 98%, 42% 100%, 38% 98%, 35% 100%, 31% 98%, 28% 100%, 24% 98%, 21% 100%, 17% 98%, 14% 100%, 10% 98%, 7% 100%, 3% 98%, 0% 100%, 0% 2%)'
      }} />
    </div>
  );

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-orange-900/20 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
      {/* Fond texture bois */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `
          repeating-linear-gradient(90deg, #4A3520 0px, #5C4430 2px, #4A3520 4px),
          repeating-linear-gradient(0deg, #4A3520 0px, #5C4430 1px, #4A3520 2px)
        `,
        backgroundSize: '100% 8px, 8px 100%'
      }} />

      {/* Canvas particules */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />

      {/* Phase IDLE */}
      {animationPhase === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative cursor-pointer transition-all duration-300 hover:scale-105 w-[220px] h-[340px] sm:w-[280px] sm:h-[420px] md:w-[320px] md:h-[480px]" onClick={onClick}>
            <div className="relative w-full h-full shadow-2xl" style={{
              background: 'linear-gradient(135deg, #F5DEB3 0%, #F4E4C1 50%, #EDD9B0 100%)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 10px rgba(0,0,0,0.15)'
            }}>
              {/* Texture */}
              <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-amber-900" style={{
                    width: `${Math.random() * 40 + 15}px`,
                    height: `${Math.random() * 40 + 15}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.4 + 0.1,
                  }} />
                ))}
              </div>
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
                backgroundSize: '200px 200px'
              }} />
              {/* Bordure */}
              <div className="absolute inset-0 border-8 border-black rounded-lg" style={{
                clipPath: 'polygon(0% 2%, 2% 0%, 5% 2%, 8% 0%, 12% 2%, 15% 0%, 18% 2%, 22% 0%, 25% 1%, 28% 0%, 32% 2%, 35% 0%, 38% 2%, 42% 0%, 45% 1%, 48% 0%, 52% 2%, 55% 0%, 58% 2%, 62% 0%, 65% 1%, 68% 0%, 72% 2%, 75% 0%, 78% 2%, 82% 0%, 85% 1%, 88% 0%, 92% 2%, 95% 0%, 98% 2%, 100% 0%, 100% 98%, 98% 100%, 95% 98%, 92% 100%, 88% 98%, 85% 100%, 82% 98%, 78% 100%, 75% 98%, 72% 100%, 68% 98%, 65% 100%, 62% 98%, 58% 100%, 55% 98%, 52% 100%, 48% 98%, 45% 100%, 42% 98%, 38% 100%, 35% 98%, 32% 100%, 28% 98%, 25% 100%, 22% 98%, 18% 100%, 15% 98%, 12% 100%, 8% 98%, 5% 100%, 2% 98%, 0% 100%, 0% 2%)'
              }} />
              {/* WANTED */}
              <div className="absolute top-8 sm:top-12 left-0 right-0 text-center">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-wider select-none"
                  style={{
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    textShadow: '3px 3px 0px #654321, 4px 4px 0px rgba(0,0,0,0.3)',
                    WebkitTextStroke: '2px #2D1810'
                  }}>WANTED</h1>
              </div>
              {/* Cadre vide */}
              <div className="absolute top-24 sm:top-28 left-1/2 transform -translate-x-1/2 w-[140px] h-[196px] sm:w-[175px] sm:h-[245px] md:w-[200px] md:h-[280px] border-4 border-black shadow-xl"
                style={{ background: 'linear-gradient(135deg, #E5D6A3 0%, #E4D4B1 50%, #DDD1A0 100%)' }} />
              {/* DEAD OR ALIVE - SOUS le cadre vide */}
              <div className="absolute top-[228px] sm:top-[282px] md:top-[302px] left-0 right-0 text-center">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-black tracking-widest select-none"
                  style={{
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                    WebkitTextStroke: '1px #2D1810'
                  }}>DEAD OR ALIVE</p>
              </div>
              {/* Logo */}
              <div className="absolute top-4 right-4 w-10 h-10 opacity-70">
                <div className="text-2xl" style={{ filter: 'grayscale(1) brightness(0.3)' }}>🕊️</div>
              </div>
              {/* Indicateur */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white/90 text-xs sm:text-sm backdrop-blur-sm bg-black/40 py-2 px-4 rounded-lg inline-block shadow-lg animate-pulse">
                  🖱️ Cliquez pour ouvrir !
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase OPENING */}
      {animationPhase === 'opening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="absolute top-8 left-0 right-0 text-center z-30">
            <div className="backdrop-blur-sm bg-black/50 py-3 px-6 rounded-xl inline-block">
              <p className="text-white font-bold text-lg sm:text-xl animate-pulse">💥 Déchirement en cours... 💥</p>
            </div>
          </div>
        </div>
      )}

      {/* Phase DECK */}
      {animationPhase === 'deck' && cards && (
        <div className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center pt-12 sm:pt-0 z-10">
          {/* Instructions */}
          <div className="absolute top-4 sm:top-8 left-0 right-0 text-center z-40 px-2">
            <div className="inline-block backdrop-blur-sm bg-black/40 py-2 px-4 rounded-lg">
              <p className="text-white font-semibold text-sm sm:text-base mb-1">🎴 Cliquez pour révéler les WANTED !</p>
              <p className="text-amber-300 text-xs sm:text-sm">{revealedCount} / {cards.length} révélés</p>
            </div>
          </div>

          {/* Pile de posters */}
          <div className="relative cursor-pointer hover:scale-105 transition-transform w-[220px] h-[340px] sm:w-[280px] sm:h-[420px] md:w-[320px] md:h-[480px]"
            onClick={handlePosterClick} style={{ perspective: '1500px' }}>

            {/* Posters statiques (NON en cours d'animation) */}
            {!animating && cards.slice(revealedCount, Math.min(revealedCount + 3, cards.length)).map((card, i) => {
              const offset = i * 8;

              return (
                <div key={`wanted-static-${revealedCount + i}`}
                  className={`absolute w-full h-full ${i === 0 ? 'hover:translate-y-[-8px] hover:rotate-2 transition-all duration-300' : ''}`}
                  style={{
                    transform: `translateY(${offset}px) translateX(${i * 3}px) rotate(${i * 2 - 2}deg)`,
                    zIndex: 10 - i,
                    transformStyle: 'preserve-3d',
                  }}>
                  <div className="relative w-full h-full">
                    <PosterContent card={card} />
                    {i > 0 && (
                      <div className="absolute inset-0 bg-black rounded-lg pointer-events-none" style={{ opacity: i * 0.15 }} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Animation de déchirement (EN COURS) */}
            {animating && cards[revealedCount] && (
              <>
                {/* Poster suivant visible en arrière-plan */}
                {cards[revealedCount + 1] && (
                  <div className="absolute w-full h-full" style={{ zIndex: 50 }}>
                    <div className="relative w-full h-full">
                      <PosterContent card={cards[revealedCount + 1]} />
                    </div>
                  </div>
                )}

                {/* Moitié gauche */}
                <div className="absolute inset-0 poster-tear-left" style={{
                  clipPath: 'polygon(0% 0%, 48% 2%, 45% 10%, 49% 20%, 46% 30%, 50% 40%, 47% 50%, 49% 60%, 46% 70%, 48% 80%, 45% 90%, 47% 98%, 48% 100%, 0% 100%)',
                  zIndex: 100
                }}>
                  <div className="relative w-full h-full">
                    <PosterContent card={cards[revealedCount]} />
                  </div>
                </div>

                {/* Moitié droite */}
                <div className="absolute inset-0 poster-tear-right" style={{
                  clipPath: 'polygon(52% 0%, 100% 0%, 100% 100%, 52% 100%, 53% 98%, 51% 90%, 55% 80%, 52% 70%, 54% 60%, 53% 50%, 54% 40%, 51% 30%, 53% 20%, 52% 10%, 55% 2%)',
                  zIndex: 100
                }}>
                  <div className="relative w-full h-full">
                    <PosterContent card={cards[revealedCount]} />
                  </div>
                </div>
              </>
            )}

            {/* Message de fin */}
            {revealedCount >= cards.length && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 60 }}>
                <div className="text-center bg-gradient-to-br from-amber-500 to-orange-500 p-4 sm:p-6 rounded-xl shadow-2xl border-4 border-black">
                  <div className="text-3xl sm:text-4xl mb-2 animate-bounce">🏴‍☠️</div>
                  <p className="text-white font-black text-lg sm:text-xl mb-1" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                    Tous révélés !
                  </p>
                  <p className="text-white/90 text-xs sm:text-sm">Les primes ont été affichées !</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes tear-left {
          0% {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
          }
          20% {
            transform: translateX(-5px) rotate(-2deg);
            opacity: 1;
          }
          40% {
            transform: translateX(-15px) rotate(-5deg);
            opacity: 1;
          }
          60% {
            transform: translateX(-40px) rotate(-10deg);
            opacity: 0.95;
          }
          80% {
            transform: translateX(-100px) rotate(-18deg);
            opacity: 0.7;
          }
          100% {
            transform: translateX(-350%) rotate(-30deg);
            opacity: 0;
          }
        }

        .poster-tear-left {
          animation: tear-left 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes tear-right {
          0% {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
          }
          20% {
            transform: translateX(5px) rotate(2deg);
            opacity: 1;
          }
          40% {
            transform: translateX(15px) rotate(5deg);
            opacity: 1;
          }
          60% {
            transform: translateX(40px) rotate(10deg);
            opacity: 0.95;
          }
          80% {
            transform: translateX(100px) rotate(18deg);
            opacity: 0.7;
          }
          100% {
            transform: translateX(350%) rotate(30deg);
            opacity: 0;
          }
        }

        .poster-tear-right {
          animation: tear-right 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default WantedPosterAnimation;
