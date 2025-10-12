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
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-600">
          🏆 Leaderboard - Top 3
        </h1>

        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className={`rounded-lg p-4 shadow-xl transform transition-all duration-300 hover:scale-[1.02] ${getRankStyle(entry.rank)}`}
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl flex-shrink-0">{getRankIcon(entry.rank)}</span>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{entry.username}</h2>
                  <p className="text-xs opacity-80">Rang #{entry.rank}</p>
                </div>

                {/* Afficher la carte favorite si elle existe */}
                {entry.favorite_card_image && (
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2 flex-shrink-0">
                    <img
                      src={entry.favorite_card_image}
                      alt={entry.favorite_card_name || 'Carte favorite'}
                      className="w-12 h-16 object-cover rounded shadow-lg"
                      title={entry.favorite_card_name || undefined}
                    />
                    <div className="text-left hidden sm:block">
                      <p className="text-xs opacity-80">Carte favorite</p>
                      <p className="font-semibold text-sm">{entry.favorite_card_name}</p>
                      <p className="text-xs opacity-70">{entry.favorite_card_rarity}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-black bg-opacity-30 rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2">Collection de Cartes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white border-opacity-20">
                        <th className="text-left py-1 px-2">Rareté</th>
                        <th className="text-right py-1 px-2">Nombre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(RARITY_LABELS).map(([key, label]) => (
                        <tr key={key} className="border-b border-white border-opacity-10">
                          <td className={`py-1 px-2 font-medium ${RARITY_COLORS[key as keyof typeof RARITY_COLORS]}`}>
                            {label}
                          </td>
                          <td className="text-right py-1 px-2 font-bold">
                            {entry[key as keyof Omit<LeaderboardEntry, 'rank' | 'username' | 'user_id' | 'favorite_card_id' | 'favorite_card_name' | 'favorite_card_image' | 'favorite_card_rarity'>]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-white border-opacity-30">
                        <td className="py-1 px-2 font-bold text-sm">Total</td>
                        <td className="text-right py-1 px-2 font-bold text-lg">
                          {entry.secret_rare + entry.super_rare + entry.rare + entry.uncommon + entry.common}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
