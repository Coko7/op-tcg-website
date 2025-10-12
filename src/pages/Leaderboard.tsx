import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface LeaderboardEntry {
  rank: number;
  username: string;
  user_id: string;
  secret_rare: number;
  super_rare: number;
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
  rare: 'Rare',
  uncommon: 'Uncommon',
  common: 'Common'
};

const RARITY_COLORS = {
  secret_rare: 'text-purple-400',
  super_rare: 'text-yellow-400',
  rare: 'text-blue-400',
  uncommon: 'text-green-400',
  common: 'text-gray-400'
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

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-700 to-amber-800 text-white';
      default:
        return 'bg-gray-700 text-white';
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
        return rank;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-300">Chargement du leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-600">
          🏆 Leaderboard - Top 3
        </h1>

        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className={`rounded-lg p-4 shadow-xl transform transition-all duration-300 hover:scale-[1.02] ${getRankStyle(entry.rank)}`}
            >
              {/* Layout principal : grille avec 2 colonnes sur desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                {/* Colonne gauche : infos utilisateur et stats */}
                <div className="space-y-3">
                  {/* Header avec rang et nom */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl flex-shrink-0">{getRankIcon(entry.rank)}</span>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold truncate">{entry.username}</h2>
                      <p className="text-xs opacity-80">Rang #{entry.rank}</p>
                    </div>
                  </div>

                  {/* Statistiques condensées en badges horizontaux */}
                  <div className="bg-black/30 rounded-lg p-3">
                    <h3 className="text-xs font-semibold mb-2 opacity-80">Collection</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(RARITY_LABELS).map(([key, label]) => {
                        const count = entry[key as keyof Omit<LeaderboardEntry, 'rank' | 'username' | 'user_id' | 'favorite_card_id' | 'favorite_card_name' | 'favorite_card_image' | 'favorite_card_rarity'>];
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-1.5 bg-black/40 rounded px-2 py-1"
                          >
                            <span className={`text-xs font-medium ${RARITY_COLORS[key as keyof typeof RARITY_COLORS]}`}>
                              {label}
                            </span>
                            <span className="text-sm font-bold text-white">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <span className="text-xs opacity-80">Total : </span>
                      <span className="text-lg font-bold">
                        {entry.secret_rare + entry.super_rare + entry.rare + entry.uncommon + entry.common}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Colonne droite : carte favorite en grand */}
                {entry.favorite_card_image && (
                  <div className="flex flex-col items-center justify-center bg-black/30 rounded-lg p-4 lg:min-w-[200px]">
                    <p className="text-xs opacity-80 mb-2">⭐ Carte favorite</p>
                    <img
                      src={entry.favorite_card_image}
                      alt={entry.favorite_card_name || 'Carte favorite'}
                      className="w-40 h-56 object-cover rounded-lg shadow-2xl mb-2"
                      title={entry.favorite_card_name || undefined}
                    />
                    <p className="font-semibold text-sm text-center">{entry.favorite_card_name}</p>
                    <p className="text-xs opacity-70">{entry.favorite_card_rarity}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center text-gray-400 text-xl mt-12">
            Aucun joueur dans le leaderboard pour le moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
