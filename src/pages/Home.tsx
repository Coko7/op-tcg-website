import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, BookOpen, TrendingUp, RotateCcw } from 'lucide-react';
import { GameService } from '../services/gameService';
import { BoosterStatus, User } from '../types';
import Timer from '../components/Timer';
import DailyRewardModal from '../components/DailyRewardModal';
import { apiService } from '../services/api';

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [boosterStatus, setBoosterStatus] = useState<BoosterStatus | null>(null);
  const [stats, setStats] = useState<any>({
    total_cards: 0,
    unique_cards: 0,
    collection_completion: 0,
    rarity_breakdown: { common: 0, uncommon: 0, rare: 0, super_rare: 0, secret_rare: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [showDailyReward, setShowDailyReward] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [boosterStatusData, statsData] = await Promise.all([
          GameService.getBoosterStatus(),
          GameService.getCollectionStats()
        ]);

        setBoosterStatus(boosterStatusData);
        setStats(statsData);

        // Vérifier si la récompense quotidienne est disponible
        try {
          const dailyRewardCheck = await apiService.checkDailyReward();
          if (dailyRewardCheck.success && dailyRewardCheck.data.is_available) {
            setShowDailyReward(true);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de la récompense quotidienne:', error);
        }
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Charger une seule fois au montage
    loadData();
  }, []);

  // Calculer si un booster est disponible côté client en temps réel
  useEffect(() => {
    if (!boosterStatus?.next_booster_time) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const nextTime = new Date(boosterStatus.next_booster_time!).getTime();

      // Si le timer est écoulé et qu'on n'a pas encore 3 boosters, on incrémente
      if (now >= nextTime && boosterStatus.available_boosters < boosterStatus.max_daily_boosters) {
        setBoosterStatus((prev: BoosterStatus | null) => {
          if (!prev) return prev;
          const newAvailable = Math.min(prev.available_boosters + 1, prev.max_daily_boosters);

          // Calculer le prochain timer si on n'est pas au max
          let newNextTime: Date | undefined = undefined;
          if (newAvailable < prev.max_daily_boosters) {
            newNextTime = new Date(nextTime + 8 * 60 * 60 * 1000);
          }

          return {
            ...prev,
            available_boosters: newAvailable,
            next_booster_time: newNextTime,
            time_until_next: newNextTime ? newNextTime.getTime() - now : 0
          };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [boosterStatus?.next_booster_time]);

  const canOpenBooster = boosterStatus ? boosterStatus.available_boosters > 0 : false;
  const timeUntilNext = boosterStatus?.next_booster_time
    ? Math.max(0, new Date(boosterStatus.next_booster_time).getTime() - new Date().getTime())
    : 0;

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser complètement le jeu ? Toutes vos cartes seront perdues !')) {
      // TODO: Implémenter une API pour reset le compte
      alert('Fonctionnalité de reset à implémenter côté serveur');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <DailyRewardModal
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        onClaim={() => {
          // Rafraîchir les statistiques après la réclamation
          GameService.getCollectionStats().then(setStats);
        }}
      />

      <section className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
          Bienvenue sur One Piece TCG!
        </h1>
        <p className="text-blue-200 text-sm sm:text-base md:text-lg">
          Explorez les mers de Grand Line et collectionnez les cartes légendaires !
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-blue-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-600/30">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <Package className="text-blue-300" size={20} />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Boosters</h2>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="text-blue-200">Disponibles:</span>
              <span className="text-white font-bold">
                {boosterStatus?.available_boosters || 0}/{boosterStatus?.max_daily_boosters || 3}
              </span>
            </div>

            {timeUntilNext > 0 && boosterStatus?.next_booster_time && (
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-blue-200">Prochain dans:</span>
                <Timer
                  targetTime={boosterStatus.next_booster_time}
                  className="text-xs sm:text-sm"
                />
              </div>
            )}

            <Link
              to="/boosters"
              className={`block w-full text-center py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base rounded-lg font-bold transition-all ${
                canOpenBooster
                  ? 'btn-primary hover:scale-105'
                  : 'btn-disabled'
              }`}
            >
              {canOpenBooster ? 'Ouvrir un Booster!' : 'Indisponible'}
            </Link>
          </div>
        </div>

        <div className="bg-blue-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-600/30">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <BookOpen className="text-green-300" size={20} />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Collection</h2>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="text-blue-200">Cartes totales:</span>
              <span className="text-white font-bold">{stats.total_cards}</span>
            </div>

            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="text-blue-200">Cartes uniques:</span>
              <span className="text-white font-bold">{stats.unique_cards}</span>
            </div>

            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="text-blue-200">Progression:</span>
              <span className="text-white font-bold">
                {stats.collection_completion}%
              </span>
            </div>

            <Link
              to="/collection"
              className="block w-full text-center py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base rounded-lg font-bold btn-primary"
            >
              Voir Collection
            </Link>
          </div>
        </div>

        <div className="bg-blue-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-600/30">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <TrendingUp className="text-yellow-300" size={20} />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Statistiques</h2>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="text-blue-200 text-xs sm:text-sm mb-2">Répartition par rareté:</div>
            <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Communes:</span>
                <span className="text-white">{stats.rarity_breakdown?.common || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-300">P. Communes:</span>
                <span className="text-white">{stats.rarity_breakdown?.uncommon || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Rares:</span>
                <span className="text-white">{stats.rarity_breakdown?.rare || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">S. Rares:</span>
                <span className="text-white">{stats.rarity_breakdown?.super_rare || 0}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-yellow-300">Secrète Rares:</span>
                <span className="text-white">{stats.rarity_breakdown?.secret_rare || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="text-center py-8 sm:py-12 px-2">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🏴‍☠️</div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Prêt pour l'aventure ?
        </h2>
        <p className="text-blue-200 text-sm sm:text-base mb-4 sm:mb-6">
          Ouvrez des boosters pour agrandir votre collection de cartes légendaires !
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Link
            to="/boosters"
            className={`inline-block py-3 px-6 text-sm sm:text-base rounded-lg font-bold transition-all ${canOpenBooster ? 'btn-primary' : 'btn-disabled'}`}
          >
            {canOpenBooster ? 'Ouvrir un Booster!' : 'Patience, moussaillon...'}
          </Link>
          <Link
            to="/collection"
            className="inline-block py-3 px-6 text-sm sm:text-base rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white transition-all"
          >
            Voir ma Collection
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;