import React, { useState } from 'react';
import { Filter, Gift, Package } from 'lucide-react';
import { BoosterPack } from '../data/onePieceCards';
import BoosterPosterCard from './BoosterPosterCard';

interface BoosterWallProps {
  boosters: BoosterPack[];
  canOpenFree: boolean;
  berrysBalance: number;
  isDisabled: boolean;
  onBoosterSelect: (booster: BoosterPack) => void;
}

type FilterType = 'all' | 'free' | 'starter' | 'booster';

const BoosterWall: React.FC<BoosterWallProps> = ({
  boosters,
  canOpenFree,
  berrysBalance,
  isDisabled,
  onBoosterSelect,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  // Filtrer les boosters selon le filtre sélectionné
  const filteredBoosters = boosters.filter((booster) => {
    switch (filter) {
      case 'free':
        return canOpenFree;
      case 'starter':
        return booster.series === 'Starter Deck';
      case 'booster':
        return booster.series === 'Booster Pack';
      default:
        return true;
    }
  });

  // Si le filtre est 'free', on affiche tous les boosters mais on met en avant celui qui peut être ouvert
  const displayBoosters = filter === 'free' && canOpenFree ? boosters : filteredBoosters;

  return (
    <div className="space-y-6">
      {/* Barre de filtres */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-white/60" />
          <span className="text-white/80 text-sm font-semibold">Filtrer les boosters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
              filter === 'all'
                ? 'bg-ocean-500 text-white shadow-lg shadow-ocean-500/40 border-2 border-ocean-400'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-2 border-white/10'
            }`}
          >
            <Package size={16} />
            <span className="hidden sm:inline">Tous</span>
            <span className="sm:hidden">Tous</span>
          </button>

          <button
            onClick={() => setFilter('free')}
            disabled={!canOpenFree}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
              filter === 'free'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/40 border-2 border-yellow-400'
                : canOpenFree
                ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-2 border-white/10'
                : 'bg-white/5 text-white/20 cursor-not-allowed border-2 border-white/5'
            }`}
          >
            <Gift size={16} />
            <span className="hidden sm:inline">Gratuits</span>
            <span className="sm:hidden">Gratuit</span>
          </button>

          <button
            onClick={() => setFilter('starter')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
              filter === 'starter'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border-2 border-emerald-400'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-2 border-white/10'
            }`}
          >
            <span className="text-base">🎯</span>
            <span className="hidden sm:inline">Starter Decks</span>
            <span className="sm:hidden">Starter</span>
          </button>

          <button
            onClick={() => setFilter('booster')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
              filter === 'booster'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/40 border-2 border-purple-400'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-2 border-white/10'
            }`}
          >
            <span className="text-base">⚡</span>
            <span className="hidden sm:inline">Booster Packs</span>
            <span className="sm:hidden">Booster</span>
          </button>
        </div>
      </div>

      {/* Compteur de résultats */}
      <div className="text-center text-white/60 text-sm">
        {displayBoosters.length === 1
          ? '1 booster disponible'
          : `${displayBoosters.length} boosters disponibles`}
      </div>

      {/* Grille de boosters */}
      {displayBoosters.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {displayBoosters.map((booster) => (
            <BoosterPosterCard
              key={booster.id}
              booster={booster}
              canOpenFree={canOpenFree}
              berrysBalance={berrysBalance}
              isDisabled={isDisabled}
              onClick={onBoosterSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
          <div className="text-4xl mb-3 opacity-30">📦</div>
          <p className="text-white/60">Aucun booster ne correspond aux filtres sélectionnés</p>
        </div>
      )}
    </div>
  );
};

export default BoosterWall;
