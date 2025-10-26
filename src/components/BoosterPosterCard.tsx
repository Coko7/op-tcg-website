import React from 'react';
import { Sparkles, Coins, Lock } from 'lucide-react';
import { BoosterPack } from '../data/onePieceCards';
import { BOOSTER_BERRY_PRICE } from '../types';

interface BoosterPosterCardProps {
  booster: BoosterPack;
  canOpenFree: boolean;
  berrysBalance: number;
  isDisabled: boolean;
  isNew?: boolean;
  onClick: (booster: BoosterPack) => void;
}

const BoosterPosterCard: React.FC<BoosterPosterCardProps> = ({
  booster,
  canOpenFree,
  berrysBalance,
  isDisabled,
  isNew = false,
  onClick,
}) => {
  const canBuy = berrysBalance >= BOOSTER_BERRY_PRICE;
  const isLocked = false; // Pour futures extensions (boosters verrouillés)

  const handleClick = () => {
    if (!isDisabled && !isLocked) {
      onClick(booster);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative group cursor-pointer transition-all duration-300 ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
      } ${isLocked ? 'grayscale cursor-not-allowed' : ''}`}
    >
      {/* Container poster WANTED */}
      <div
        className={`relative rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ${
          canOpenFree && !isDisabled
            ? 'ring-4 ring-yellow-400/50 shadow-yellow-400/40 animate-pulse-slow'
            : 'ring-2 ring-white/10'
        }`}
        style={{
          background: 'linear-gradient(135deg, #F5DEB3 0%, #F4E4C1 50%, #EDD9B0 100%)',
          aspectRatio: '2/3',
        }}
      >
        {/* Texture */}
        <div className="absolute inset-0 opacity-15 mix-blend-multiply pointer-events-none">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="absolute rounded-full bg-amber-900"
              style={{
                width: `${Math.random() * 20 + 5}px`,
                height: `${Math.random() * 20 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.4,
              }}
            />
          ))}
        </div>

        {/* Grain */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '150px 150px',
          }}
        />

        {/* Header WANTED */}
        <div className="absolute top-2 left-0 right-0 text-center z-10">
          <h3
            className="text-lg sm:text-xl font-black text-black tracking-wider select-none"
            style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
          >
            WANTED
          </h3>
        </div>

        {/* Image du booster */}
        <div
          className="absolute top-12 left-1/2 transform -translate-x-1/2 w-[70%] aspect-[1/1.4] border-3 border-black shadow-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #E5D6A3 0%, #E4D4B1 50%, #DDD1A0 100%)',
          }}
        >
          {booster.image ? (
            <img
              src={booster.image}
              alt={booster.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-30">🃏</span>
            </div>
          )}
        </div>

        {/* Code du booster - SOUS l'image */}
        <div className="absolute bottom-[72px] left-0 right-0 text-center px-2 z-20">
          <p
            className="text-sm font-bold text-black tracking-wide select-none truncate"
            style={{ fontFamily: 'Impact, sans-serif' }}
          >
            {booster.code}
          </p>
        </div>

        {/* Nom du booster */}
        <div className="absolute bottom-[52px] left-0 right-0 text-center px-2 z-20">
          <p
            className="text-xs text-black select-none truncate"
            style={{
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: '600',
            }}
          >
            {booster.name}
          </p>
        </div>

        {/* DEAD OR ALIVE */}
        <div className="absolute bottom-[32px] left-0 right-0 text-center z-20">
          <p
            className="text-[10px] font-bold text-black tracking-widest select-none"
            style={{ fontFamily: 'Impact, sans-serif' }}
          >
            DEAD OR ALIVE
          </p>
        </div>

        {/* Prix / Statut */}
        <div className="absolute bottom-2 left-0 right-0 text-center z-20">
          <div className="inline-block px-2 py-1 rounded-md backdrop-blur-sm">
            {isLocked ? (
              <div className="flex items-center gap-1 text-gray-600">
                <Lock size={12} />
                <span className="text-xs font-bold">VERROUILLÉ</span>
              </div>
            ) : canOpenFree && !isDisabled ? (
              <div className="flex items-center gap-1 text-yellow-600 bg-yellow-100/80 px-2 py-0.5 rounded-full">
                <Sparkles size={12} />
                <span className="text-xs font-black">GRATUIT</span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-1 ${
                  canBuy ? 'text-treasure-700 bg-treasure-100/80' : 'text-gray-600 bg-gray-100/80'
                } px-2 py-0.5 rounded-full`}
              >
                <Coins size={12} />
                <span className="text-xs font-bold">{BOOSTER_BERRY_PRICE} ฿</span>
              </div>
            )}
          </div>
        </div>

        {/* Badge NOUVEAU en haut à droite */}
        {isNew && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] px-2 py-1 rounded-full font-black shadow-lg z-30 animate-bounce">
            NEW
          </div>
        )}

        {/* Glow effect pour les boosters gratuits */}
        {canOpenFree && !isDisabled && (
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity -z-10 animate-pulse" />
        )}

        {/* Logo Marine */}
        <div className="absolute top-2 left-2 w-5 h-5 opacity-40 z-10">
          <div className="text-sm" style={{ filter: 'grayscale(1) brightness(0.3)' }}>
            🕊️
          </div>
        </div>

        {/* Overlay hover */}
        {!isDisabled && !isLocked && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg" />
        )}
      </div>

      {/* Infos supplémentaires au survol (desktop) */}
      <div className="hidden md:block absolute inset-x-0 -bottom-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40 pointer-events-none">
        <div className="bg-black/90 backdrop-blur-xl rounded-lg p-3 shadow-2xl border border-white/20">
          <p className="text-white text-xs mb-1 line-clamp-2">{booster.description}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span>{booster.cardCount} cartes</span>
            <span>{new Date(booster.releaseDate).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoosterPosterCard;
