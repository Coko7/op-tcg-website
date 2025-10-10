import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, BookOpen, TrendingUp, RotateCcw, Gift, Coins } from 'lucide-react';
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
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(false);
  const [dailyRewardData, setDailyRewardData] = useState<any>(null);

  // Vérifier si le modal a déjà été affiché aujourd'hui
  const checkIfModalShownToday = () => {
    const lastShown = localStorage.getItem('dailyRewardModalLastShown');
    if (!lastShown) return false;

    const today = new Date().toISOString().split('T')[0];
    const lastShownDate = new Date(lastShown).toISOString().split('T')[0];

    return today === lastShownDate;
  };

  const markModalAsShown = () => {
    localStorage.setItem('dailyRewardModalLastShown', new Date().toISOString());
  };

  // Fonction pour vérifier manuellement la récompense quotidienne
  const checkDailyRewardStatus = async () => {
    try {
      const dailyRewardCheck = await apiService.checkDailyReward();
      if (dailyRewardCheck.success) {
        setDailyRewardAvailable(dailyRewardCheck.data.is_available);
        setDailyRewardData(dailyRewardCheck.data);
        return dailyRewardCheck.data.is_available;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de la récompense quotidienne:', error);
      return false;
    }
  };

  // Ouvrir manuellement le modal de récompense
  const handleOpenDailyReward = () => {
    if (dailyRewardAvailable) {
      setShowDailyReward(true);
      markModalAsShown();
    }
  };

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

        // Vérifier l'état de la récompense quotidienne
        const isAvailable = await checkDailyRewardStatus();

        // Afficher automatiquement le modal si la récompense est disponible
        // ET si le modal n'a pas déjà été affiché aujourd'hui
        if (isAvailable && !checkIfModalShownToday()) {
          setShowDailyReward(true);
          markModalAsShown();
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
        onClaim={async () => {
          // Marquer comme non disponible immédiatement dans l'UI
          setDailyRewardAvailable(false);

          // Rafraîchir les statistiques après la réclamation
          await GameService.getCollectionStats().then(setStats);

          // Revérifier l'état de la récompense quotidienne depuis le backend
          await checkDailyRewardStatus();
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Carte Récompense Quotidienne */}
        <div className="group relative bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-amber-400/30 hover:border-amber-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Gift className="text-amber-300" size={20} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Récompense Quotidienne</h2>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {dailyRewardAvailable ? (
                <>
                  <div className="flex justify-center items-center text-5xl mb-2 animate-bounce">
                    🎁
                  </div>
                  <div className="text-center">
                    <p className="text-amber-200 text-sm mb-2 font-medium">Récompense disponible !</p>
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="text-amber-400" size={24} />
                      <p className="text-white font-bold text-2xl">10</p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenDailyReward}
                    className="block w-full text-center py-3 px-4 text-sm sm:text-base rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all transform hover:scale-105 hover:shadow-lg shadow-amber-500/50"
                  >
                    Réclamer maintenant
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-center items-center text-4xl mb-2 opacity-40">
                    ✓
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 text-sm mb-2">Déjà réclamée aujourd'hui</p>
                    <p className="text-slate-400 text-xs mb-3">Revenez demain !</p>
                  </div>
                  <button
                    disabled
                    className="block w-full text-center py-3 px-4 text-sm sm:text-base rounded-xl font-medium bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  >
                    Indisponible
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Carte Boosters */}
        <div className="group relative bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Package className="text-blue-300" size={20} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Boosters</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Disponibles</span>
                <div className="flex items-center gap-1">
                  {[...Array(boosterStatus?.max_daily_boosters || 3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i < (boosterStatus?.available_boosters || 0)
                          ? 'bg-blue-400 shadow-lg shadow-blue-400/50'
                          : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {timeUntilNext > 0 && boosterStatus?.next_booster_time && (
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-400 mb-1">Prochain dans</p>
                  <Timer
                    targetTime={boosterStatus.next_booster_time}
                    className="text-sm font-semibold text-blue-300"
                  />
                </div>
              )}

              <Link
                to="/boosters"
                className={`block w-full text-center py-3 px-4 text-sm sm:text-base rounded-xl font-bold transition-all ${
                  canOpenBooster
                    ? 'btn-primary hover:scale-105'
                    : 'btn-disabled'
                }`}
              >
                {canOpenBooster ? '🎲 Ouvrir Booster' : 'Indisponible'}
              </Link>
            </div>
          </div>
        </div>

        {/* Carte Collection */}
        <div className="group relative bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-emerald-400/30 hover:border-emerald-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <BookOpen className="text-emerald-300" size={20} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Collection</h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Progression</span>
                  <span className="text-white font-bold text-lg">{stats.collection_completion}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000 ease-out"
                    style={{ width: `${stats.collection_completion}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <p className="text-2xl font-bold text-white">{stats.unique_cards}</p>
                  <p className="text-xs text-slate-400">Uniques</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <p className="text-2xl font-bold text-white">{stats.total_cards}</p>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
              </div>

              <Link
                to="/collection"
                className="block w-full text-center py-3 px-4 text-sm sm:text-base rounded-xl font-bold btn-primary"
              >
                📚 Voir Collection
              </Link>
            </div>
          </div>
        </div>

        {/* Carte Statistiques */}
        <div className="group relative bg-gradient-to-br from-purple-500/20 to-fuchsia-600/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-400/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="text-purple-300" size={20} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Statistiques</h2>
            </div>

            <div className="space-y-3">
              <p className="text-slate-300 text-xs font-medium">Répartition par rareté</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Communes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-slate-400" style={{ width: `${Math.min((stats.rarity_breakdown?.common || 0) / 10, 100)}%` }} />
                    </div>
                    <span className="text-white text-sm font-semibold w-6">{stats.rarity_breakdown?.common || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 text-xs">P. Communes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${Math.min((stats.rarity_breakdown?.uncommon || 0) / 10, 100)}%` }} />
                    </div>
                    <span className="text-white text-sm font-semibold w-6">{stats.rarity_breakdown?.uncommon || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 text-xs">Rares</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${Math.min((stats.rarity_breakdown?.rare || 0) / 5, 100)}%` }} />
                    </div>
                    <span className="text-white text-sm font-semibold w-6">{stats.rarity_breakdown?.rare || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 text-xs">S. Rares</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-purple-400" style={{ width: `${Math.min((stats.rarity_breakdown?.super_rare || 0) / 3, 100)}%` }} />
                    </div>
                    <span className="text-white text-sm font-semibold w-6">{stats.rarity_breakdown?.super_rare || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 text-xs">Secrètes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${Math.min((stats.rarity_breakdown?.secret_rare || 0) / 2, 100)}%` }} />
                    </div>
                    <span className="text-white text-sm font-semibold w-6">{stats.rarity_breakdown?.secret_rare || 0}</span>
                  </div>
                </div>
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