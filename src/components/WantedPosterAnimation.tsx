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
  const [isUnrolling, setIsUnrolling] = useState(false);
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

  // Déclencher l'animation de déroulement
  useEffect(() => {
    if (animationPhase === 'opening') {
      setIsUnrolling(true);
      // Après le déroulement, passer à la phase deck
      const timer = setTimeout(() => {
        setIsUnrolling(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [animationPhase]);

  // Animation des particules de papier avec Canvas
  useEffect(() => {
    if (animationPhase !== 'opening' && animationPhase !== 'deck') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialiser les particules de confettis de papier
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        particlesRef.current.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 100,
          y: canvas.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 3,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          alpha: 1,
          size: Math.random() * 8 + 4,
        });
      }
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dessiner et mettre à jour les particules
      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.15; // Gravité
        particle.rotation += particle.rotationSpeed;
        particle.alpha -= 0.008;

        if (particle.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = particle.alpha;
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);

          // Dessiner un morceau de papier déchiré (rectangle irrégulier)
          ctx.fillStyle = '#F5E6D3';
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);

          // Bordure sombre
          ctx.strokeStyle = '#8B7355';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);

          ctx.restore();
        } else {
          // Réinitialiser la particule
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 0.5;
          particle.x = canvas.width / 2 + (Math.random() - 0.5) * 100;
          particle.y = canvas.height / 2;
          particle.vx = Math.cos(angle) * speed;
          particle.vy = Math.sin(angle) * speed - Math.random() * 3;
          particle.rotation = Math.random() * 360;
          particle.alpha = 1;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      particlesRef.current = [];
    };
  }, [animationPhase]);

  const handlePosterClick = () => {
    if (animating || !cards || revealedCount >= cards.length) return;

    setAnimating(true);
    setTimeout(() => {
      setRevealedCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= cards.length) {
          setTimeout(() => onAnimationComplete?.(), 800);
        }
        return newCount;
      });
      setAnimating(false);
    }, 600);
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

      {/* Canvas pour les particules de papier */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {/* Phase IDLE - Poster roulé */}
      {animationPhase === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative cursor-pointer transition-all duration-300 hover:scale-105 hover:rotate-2"
            onClick={onClick}
          >
            {/* Rouleau de poster fermé */}
            <div className="relative w-16 h-64 sm:w-20 sm:h-80 md:w-24 md:h-96">
              {/* Cylindre du rouleau */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-lg shadow-2xl border-4 border-amber-200"
                style={{
                  boxShadow: `
                    inset 0 2px 4px rgba(0,0,0,0.2),
                    inset 0 -2px 4px rgba(255,255,255,0.5),
                    0 10px 30px rgba(0,0,0,0.3)
                  `
                }}>
                {/* Texture papier roulé */}
                <div className="absolute inset-0 opacity-40" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139, 115, 85, 0.1) 3px, rgba(139, 115, 85, 0.1) 4px)'
                }} />

                {/* Ficelle qui attache le rouleau */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-1.5 bg-gradient-to-r from-amber-800 via-amber-900 to-amber-800 rounded-full shadow-lg"
                  style={{ transform: 'translate(-50%, -50%) rotate(-5deg)' }} />
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-amber-900 rounded-full shadow-inner"
                  style={{ transform: 'translate(-50%, -50%)' }} />
              </div>

              {/* Bords du papier visibles */}
              <div className="absolute -left-1 top-0 w-1 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-l-lg" />
              <div className="absolute -right-1 top-0 w-1 h-full bg-gradient-to-r from-transparent via-black/30 to-transparent rounded-r-lg" />

              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-lg pointer-events-none" />

              {/* Animation de flottement */}
              <style>{`
                @keyframes poster-float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-10px) rotate(2deg); }
                }
              `}</style>
              <div className="absolute inset-0" style={{ animation: 'poster-float 3s ease-in-out infinite' }} />
            </div>

            {/* Texte d'instruction */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <p className="text-white/90 text-xs sm:text-sm backdrop-blur-sm bg-black/30 py-2 px-4 rounded-lg shadow-lg">
                🖱️ Cliquez pour dérouler le poster
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase OPENING - Poster se déroule */}
      {animationPhase === 'opening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className={`wanted-poster-unroll ${isUnrolling ? 'unrolling' : ''}`}>
            {/* Poster WANTED vide qui se déroule */}
            <div className="relative w-[280px] h-[400px] sm:w-[350px] sm:h-[500px] md:w-[400px] md:h-[580px]">
              {/* Papier principal avec texture */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-lg shadow-2xl border-8 border-amber-900"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(139, 115, 85, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.08) 0%, transparent 50%)
                  `,
                  boxShadow: `
                    0 20px 50px rgba(0,0,0,0.4),
                    inset 0 2px 0 rgba(255,255,255,0.5),
                    inset 0 -2px 10px rgba(0,0,0,0.2)
                  `
                }}>
                {/* Texture papier ancien avec taches */}
                <div className="absolute inset-0 opacity-30 mix-blend-multiply pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-amber-900"
                      style={{
                        width: `${Math.random() * 30 + 10}px`,
                        height: `${Math.random() * 30 + 10}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.3,
                      }}
                    />
                  ))}
                </div>

                {/* Bordure déchirée */}
                <div className="absolute inset-0 border-4 border-amber-900/50 rounded-lg" style={{
                  clipPath: 'polygon(0% 2%, 2% 0%, 5% 2%, 8% 0%, 12% 2%, 15% 0%, 18% 2%, 22% 0%, 25% 1%, 28% 0%, 32% 2%, 35% 0%, 38% 2%, 42% 0%, 45% 1%, 48% 0%, 52% 2%, 55% 0%, 58% 2%, 62% 0%, 65% 1%, 68% 0%, 72% 2%, 75% 0%, 78% 2%, 82% 0%, 85% 1%, 88% 0%, 92% 2%, 95% 0%, 98% 2%, 100% 0%, 100% 98%, 98% 100%, 95% 98%, 92% 100%, 88% 98%, 85% 100%, 82% 98%, 78% 100%, 75% 98%, 72% 100%, 68% 98%, 65% 100%, 62% 98%, 58% 100%, 55% 98%, 52% 100%, 48% 98%, 45% 100%, 42% 98%, 38% 100%, 35% 98%, 32% 100%, 28% 98%, 25% 100%, 22% 98%, 18% 100%, 15% 98%, 12% 100%, 8% 98%, 5% 100%, 2% 98%, 0% 100%, 0% 2%)'
                }} />

                {/* WANTED text - style manga */}
                <div className="absolute top-8 sm:top-12 left-0 right-0 text-center">
                  <div className="relative inline-block">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-black tracking-wider"
                      style={{
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: `
                          3px 3px 0px #654321,
                          4px 4px 0px rgba(0,0,0,0.3),
                          2px 2px 10px rgba(0,0,0,0.2)
                        `,
                        WebkitTextStroke: '2px #2D1810'
                      }}>
                      WANTED
                    </h1>
                    {/* Effet de relief */}
                    <div className="absolute inset-0 text-5xl sm:text-6xl md:text-7xl font-black text-red-900 tracking-wider opacity-30 blur-sm"
                      style={{
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        transform: 'translateY(2px)'
                      }}>
                      WANTED
                    </div>
                  </div>
                </div>

                {/* Espace pour la photo - cadre vide */}
                <div className="absolute top-28 sm:top-36 left-1/2 transform -translate-x-1/2 w-40 h-48 sm:w-52 sm:h-60 md:w-60 md:h-72 bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-black shadow-inner flex items-center justify-center">
                  <div className="text-4xl sm:text-5xl animate-pulse opacity-50">📸</div>
                </div>

                {/* DEAD OR ALIVE */}
                <div className="absolute top-[290px] sm:top-[360px] md:top-[420px] left-0 right-0 text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-black tracking-widest"
                    style={{
                      fontFamily: 'Impact, Arial Black, sans-serif',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                      WebkitTextStroke: '1px #2D1810'
                    }}>
                    DEAD OR ALIVE
                  </p>
                </div>

                {/* Logo Marine (mouette stylisée) */}
                <div className="absolute top-4 right-4 w-12 h-12 sm:w-14 sm:h-14 opacity-70">
                  <div className="text-3xl sm:text-4xl" style={{ filter: 'grayscale(1) brightness(0.3)' }}>🕊️</div>
                </div>

                {/* Effet de papier qui ondule */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Message d'ouverture */}
          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-30">
            <div className="backdrop-blur-sm bg-black/40 py-3 px-6 sm:py-4 sm:px-8 rounded-xl inline-block mx-4">
              <p className="text-white font-bold text-lg sm:text-xl md:text-2xl animate-pulse">
                📜 Déroulement du poster... 📜
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase DECK - Posters WANTED empilés avec les cartes */}
      {animationPhase === 'deck' && cards && (
        <div className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center pt-12 sm:pt-0">
          {/* Instructions */}
          <div className="absolute top-4 sm:top-8 left-0 right-0 text-center z-30 px-2 sm:px-4">
            <div className="inline-block backdrop-blur-sm bg-black/40 py-2 px-4 sm:py-3 sm:px-6 rounded-lg">
              <p className="text-white font-semibold text-sm sm:text-base md:text-lg mb-1">
                🎴 Cliquez pour révéler les WANTED !
              </p>
              <p className="text-amber-300 text-xs sm:text-sm">
                {revealedCount} / {cards.length} révélés
              </p>
            </div>
          </div>

          {/* Pile de posters WANTED */}
          <div
            className="relative cursor-pointer hover:scale-105 transition-transform w-[200px] h-[280px] sm:w-[260px] sm:h-[360px] md:w-[300px] md:h-[420px] mb-4 sm:mb-0"
            onClick={handlePosterClick}
            style={{ perspective: '1000px' }}
          >
            {cards
              .slice(revealedCount, Math.min(revealedCount + 3, cards.length))
              .map((card, i) => {
                const cardIndex = revealedCount + i;
                const isTop = i === 0;
                const offset = i * 8;

                return (
                  <div
                    key={`wanted-${cardIndex}`}
                    className={`absolute w-full h-full ${
                      isTop && animating ? 'poster-fly-away' : ''
                    } ${isTop && !animating ? 'hover:translate-y-[-8px] hover:rotate-2 transition-all duration-300' : ''}`}
                    style={{
                      transform: isTop && animating ? '' : `translateY(${offset}px) translateX(${i * 3}px) rotate(${i * 2 - 2}deg)`,
                      zIndex: 10 - i,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Poster WANTED complet avec la carte */}
                    <div className="relative w-full h-full">
                      {/* Papier du poster */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-lg shadow-2xl border-4 border-amber-900"
                        style={{
                          backgroundImage: `
                            radial-gradient(circle at 20% 30%, rgba(139, 115, 85, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.08) 0%, transparent 50%)
                          `,
                          boxShadow: isTop
                            ? `0 20px 50px ${getRarityColor(card.rarity)}66, 0 0 60px ${getRarityColor(card.rarity)}33`
                            : '0 10px 30px rgba(0,0,0,0.3)',
                        }}>

                        {/* Texture papier ancien */}
                        <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none">
                          {[...Array(5)].map((_, idx) => (
                            <div
                              key={idx}
                              className="absolute rounded-full bg-amber-900"
                              style={{
                                width: `${Math.random() * 20 + 5}px`,
                                height: `${Math.random() * 20 + 5}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: Math.random() * 0.3,
                              }}
                            />
                          ))}
                        </div>

                        {/* WANTED titre */}
                        <div className="absolute top-2 sm:top-4 left-0 right-0 text-center z-10">
                          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-wider"
                            style={{
                              fontFamily: 'Impact, Arial Black, sans-serif',
                              textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                              WebkitTextStroke: '1px #2D1810'
                            }}>
                            WANTED
                          </h2>
                        </div>

                        {/* Image de la carte comme photo du wanted */}
                        <div className="absolute top-12 sm:top-16 left-1/2 transform -translate-x-1/2 w-[140px] h-[160px] sm:w-[180px] sm:h-[200px] md:w-[200px] md:h-[240px] bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-black shadow-lg overflow-hidden">
                          {card.image_url ? (
                            <img
                              src={card.image_url}
                              alt={card.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x240?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700">
                              <span className="text-4xl">🃏</span>
                            </div>
                          )}
                        </div>

                        {/* Nom du personnage */}
                        <div className="absolute top-[185px] sm:top-[230px] md:top-[270px] left-0 right-0 text-center px-2">
                          <p className="text-sm sm:text-base md:text-lg font-bold text-black truncate"
                            style={{
                              fontFamily: 'Arial Black, sans-serif',
                              textShadow: '1px 1px 0px rgba(255,255,255,0.5)'
                            }}>
                            {card.name}
                          </p>
                        </div>

                        {/* DEAD OR ALIVE */}
                        <div className="absolute top-[205px] sm:top-[250px] md:top-[295px] left-0 right-0 text-center">
                          <p className="text-xs sm:text-sm md:text-base font-bold text-black tracking-widest"
                            style={{
                              fontFamily: 'Impact, sans-serif',
                              textShadow: '1px 1px 0px rgba(0,0,0,0.2)'
                            }}>
                            DEAD OR ALIVE
                          </p>
                        </div>

                        {/* Prime (Bounty) */}
                        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center">
                          <div className="inline-block bg-white/80 px-3 py-1 sm:px-4 sm:py-2 rounded border-2 border-black shadow-lg">
                            <p className="text-xs sm:text-sm font-semibold text-gray-700">BOUNTY</p>
                            <p className="text-lg sm:text-xl md:text-2xl font-black"
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
                        <div className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 opacity-60">
                          <div className="text-lg sm:text-xl" style={{ filter: 'grayscale(1) brightness(0.3)' }}>🕊️</div>
                        </div>

                        {/* Bordure déchirée */}
                        <div className="absolute inset-0 border-2 border-amber-900/50 rounded-lg pointer-events-none" style={{
                          clipPath: 'polygon(0% 2%, 3% 0%, 7% 2%, 10% 0%, 14% 2%, 17% 0%, 21% 2%, 24% 0%, 28% 2%, 31% 0%, 35% 2%, 38% 0%, 42% 2%, 45% 0%, 49% 2%, 52% 0%, 56% 2%, 59% 0%, 63% 2%, 66% 0%, 70% 2%, 73% 0%, 77% 2%, 80% 0%, 84% 2%, 87% 0%, 91% 2%, 94% 0%, 98% 2%, 100% 0%, 100% 98%, 98% 100%, 94% 98%, 91% 100%, 87% 98%, 84% 100%, 80% 98%, 77% 100%, 73% 98%, 70% 100%, 66% 98%, 63% 100%, 59% 98%, 56% 100%, 52% 98%, 49% 100%, 45% 98%, 42% 100%, 38% 98%, 35% 100%, 31% 98%, 28% 100%, 24% 98%, 21% 100%, 17% 98%, 14% 100%, 10% 98%, 7% 100%, 3% 98%, 0% 100%, 0% 2%)'
                        }} />
                      </div>

                      {/* Effet de brillance sur le poster du dessus */}
                      {isTop && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-lg pointer-events-none" />
                          {/* Animation de vent sur le papier */}
                          <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-paper-wave" />
                          </div>
                        </>
                      )}

                      {/* Ombre portée progressive */}
                      {!isTop && (
                        <div
                          className="absolute inset-0 bg-black/30 rounded-lg pointer-events-none"
                          style={{ opacity: i * 0.1 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Message quand tous les posters sont révélés */}
            {revealedCount >= cards.length && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
                <div className="text-center backdrop-blur-md bg-gradient-to-br from-amber-500/90 to-orange-500/90 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl mx-4 border-4 border-amber-900">
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 animate-bounce">🏴‍☠️</div>
                  <p className="text-white font-black text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2"
                    style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
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
        /* Animation de déroulement du poster */
        @keyframes unroll-poster {
          0% {
            transform: scaleY(0) translateY(-50%) rotateX(90deg);
            opacity: 0;
          }
          50% {
            transform: scaleY(0.7) translateY(0) rotateX(45deg);
            opacity: 0.8;
          }
          100% {
            transform: scaleY(1) translateY(0) rotateX(0deg);
            opacity: 1;
          }
        }

        .wanted-poster-unroll.unrolling {
          animation: unroll-poster 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: top center;
        }

        /* Animation du poster qui s'envole */
        @keyframes poster-fly {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          30% {
            transform: translateY(-20px) translateX(10px) rotate(5deg) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(-200%) rotate(-20deg) scale(0.8);
            opacity: 0;
          }
        }

        .poster-fly-away {
          animation: poster-fly 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Animation de shimmer sur le papier */
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        /* Animation d'ondulation du papier au vent */
        @keyframes paper-wave {
          0%, 100% {
            transform: translateX(-100%) skewX(0deg);
          }
          50% {
            transform: translateX(100%) skewX(5deg);
          }
        }

        .animate-paper-wave {
          animation: paper-wave 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WantedPosterAnimation;
