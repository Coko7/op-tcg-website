import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { GameCard } from '../components/ui';

interface LeaderboardEntry {
  rank: number;
  username: string;
  user_id: string;
  secret_rare: number;
  super_rare: number;
  leader: number;
  rare: number;
  uncommon: number;
  common: number;
  favorite_card_id?: string | null;
  favorite_card_name?: string | null;
  favorite_card_image?: string | null;
  favorite_card_rarity?: string | null;
}

const RARITY_LABELS = {
  secret_rare: 'Secret Rare',
  super_rare: 'Super Rare',
  leader: 'Leader',
  rare: 'Rare',
  uncommon: 'Peu Commune',
  common: 'Commune'
};

const RARITY_COLORS = {
  secret_rare: 'text-orange-300',
  super_rare: 'text-purple-300',
  leader: 'text-red-300',
  rare: 'text-blue-300',
  uncommon: 'text-emerald-300',
  common: 'text-slate-300'
};

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLeaderboard();

      if (response.success) {
        setLeaderboard(response.leaderboard);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du leaderboard');
      console.error('Erreur leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return 'treasure';
      case 2:
        return 'ocean';
      case 3:
        return 'success';
      default:
        return 'default';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-white text-xl">Chargement du leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <GameCard variant="default" className="p-6 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <div className="text-xl text-red-400">{error}</div>
          </div>
        </GameCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-treasure-300 via-ocean-300 to-treasure-300 bg-clip-text text-transparent mb-3">
            🏆 Leaderboard - Top 3
          </h1>
          <p className="text-slate-300 text-base sm:text-lg">
            Les meilleurs collectionneurs de One Piece TCG
          </p>
        </div>

        {/* Leaderboard Entries */}
        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <GameCard
              key={entry.user_id}
              variant={getRankVariant(entry.rank)}
              glow={entry.rank <= 3}
              className="p-4 sm:p-6 hover:scale-[1.02] transition-all duration-300"
            >
              {/* Layout principal : grille avec 2 colonnes sur desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                {/* Colonne gauche : infos utilisateur et stats */}
                <div className="space-y-3">
                  {/* Header avec rang et nom */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl flex-shrink-0 font-bold">{getRankIcon(entry.rank)}</span>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{entry.username}</h2>
                      <p className="text-xs sm:text-sm text-slate-300">Rang #{entry.rank}</p>
                    </div>
                  </div>

                  {/* Statistiques condensées en badges horizontaux */}
                  <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
                    <h3 className="text-xs sm:text-sm font-semibold mb-2 text-slate-300">Collection</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(RARITY_LABELS).map(([key, label]) => {
                        const count = entry[key as keyof Omit<LeaderboardEntry, 'rank' | 'username' | 'user_id' | 'favorite_card_id' | 'favorite_card_name' | 'favorite_card_image' | 'favorite_card_rarity'>];
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10"
                          >
                            <span className={`text-xs font-medium ${RARITY_COLORS[key as keyof typeof RARITY_COLORS]}`}>
                              {label}
                            </span>
                            <span className="text-sm font-bold text-white">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-xs sm:text-sm text-slate-300">Total : </span>
                      <span className="text-lg sm:text-xl font-bold text-white">
                        {entry.secret_rare + entry.super_rare + entry.leader + entry.rare + entry.uncommon + entry.common}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Colonne droite : carte favorite en grand */}
                {entry.favorite_card_image && (
                  <div className="flex flex-col items-center justify-center bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 lg:min-w-[200px]">
                    <p className="text-xs sm:text-sm text-slate-300 mb-2">⭐ Carte favorite</p>
                    <div className={`relative w-32 sm:w-40 aspect-[2.5/3.5] overflow-hidden rounded-xl ${
                      entry.favorite_card_rarity === 'super_rare' ? 'holographic-shimmer' : ''
                    } ${entry.favorite_card_rarity === 'secret_rare' ? 'rainbow-foil' : ''} border-2 border-white/20 shadow-2xl`}>
                      <img
                        src={entry.favorite_card_image}
                        alt={entry.favorite_card_name || 'Carte favorite'}
                        className={`w-full h-full object-cover ${
                          entry.favorite_card_rarity === 'super_rare' || entry.favorite_card_rarity === 'secret_rare'
                            ? 'holographic-effect'
                            : ''
                        }`}
                        title={entry.favorite_card_name || undefined}
                      />
                    </div>
                    <p className="font-semibold text-sm text-center mt-2 text-white">{entry.favorite_card_name}</p>
                    <p className={`text-xs ${RARITY_COLORS[entry.favorite_card_rarity as keyof typeof RARITY_COLORS] || 'text-slate-400'}`}>
                      {RARITY_LABELS[entry.favorite_card_rarity as keyof typeof RARITY_LABELS] || entry.favorite_card_rarity}
                    </p>
                  </div>
                )}
              </div>
            </GameCard>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <GameCard variant="default" className="p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-slate-300 text-xl">
                Aucun joueur dans le leaderboard pour le moment.
              </p>
            </div>
          </GameCard>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
