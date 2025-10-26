import { useState, useEffect } from 'react';
import { Trophy, Award, Gift, CheckCircle, Circle } from 'lucide-react';
import { apiService } from '../services/api';
import { AchievementWithProgress, AchievementStats } from '../types';
import { useDialog } from '../hooks/useDialog';
import Dialog from '../components/ui/Dialog';
import { GameCard } from '../components/ui';

export default function Achievements() {
  const { dialogState, showAlert, handleClose, handleConfirm } = useDialog();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [achievementsResponse, statsResponse] = await Promise.all([
        apiService.getAchievements(),
        apiService.getAchievementStats()
      ]);

      if (achievementsResponse.success) {
        setAchievements(achievementsResponse.data);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (achievementId: string) => {
    try {
      setClaimingId(achievementId);
      const response = await apiService.claimAchievement(achievementId);

      if (response.success) {
        await loadAchievements();
        await showAlert('Félicitations !', `Vous avez gagné ${response.data.berrys_earned} Berrys !`, 'success');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'achievement:', error);
      await showAlert('Erreur', error.message || 'Erreur lors de la récupération de l\'achievement', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];
  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const groupedAchievements = filteredAchievements
    // Trier : réclamables en premier, puis par progression
    .sort((a, b) => {
      const aCanClaim = a.progress >= a.threshold && !a.is_claimed;
      const bCanClaim = b.progress >= b.threshold && !b.is_claimed;

      // Si a est réclamable et pas b, a vient en premier
      if (aCanClaim && !bCanClaim) return -1;
      // Si b est réclamable et pas a, b vient en premier
      if (!aCanClaim && bCanClaim) return 1;
      // Sinon, trier par pourcentage de progression (décroissant)
      return b.completion_percentage - a.completion_percentage;
    })
    .reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, AchievementWithProgress[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-white text-xl">Chargement des achievements...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog
        isOpen={dialogState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        showCancel={dialogState.showCancel}
      />

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-10 h-10 text-treasure-400" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-ocean-300 via-treasure-300 to-ocean-300 bg-clip-text text-transparent">
              Achievements
            </h1>
          </div>
          <p className="text-slate-300 text-base sm:text-lg">
            Débloquez des achievements pour gagner des Berrys !
          </p>
        </div>

        {/* Stats Cards - Glassmorphism */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <GameCard variant="ocean" className="p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-xs sm:text-sm text-slate-300">Total</div>
            </GameCard>
            <GameCard variant="success" className="p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats.completed}</div>
              <div className="text-xs sm:text-sm text-slate-300">Complétés</div>
            </GameCard>
            <GameCard variant="default" className="p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats.claimed}</div>
              <div className="text-xs sm:text-sm text-slate-300">Réclamés</div>
            </GameCard>
            <GameCard variant="treasure" className="p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats.unclaimed}</div>
              <div className="text-xs sm:text-sm text-slate-300">À réclamer</div>
            </GameCard>
            <GameCard variant="treasure" className="p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats.total_berrys_earned}</div>
              <div className="text-xs sm:text-sm text-slate-300">฿ gagnés</div>
            </GameCard>
            <GameCard variant="treasure" className="p-3 sm:p-4 border-2 border-treasure-400/40">
              <div className="text-2xl sm:text-3xl font-bold text-treasure-300">{stats.total_berrys_available}</div>
              <div className="text-xs sm:text-sm text-slate-300">฿ disponibles</div>
            </GameCard>
          </div>
        )}

        {/* Category Filters - Glassmorphism */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-300 backdrop-blur-xl text-sm sm:text-base ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-500/30 scale-105 border border-ocean-400/30'
                  : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 hover:scale-105'
              }`}
            >
              {category === 'all' ? 'Tous' : category}
            </button>
          ))}
        </div>

        {/* Warning if no achievements */}
        {!loading && achievements.length === 0 && (
          <GameCard variant="treasure" className="p-4 sm:p-6">
            <div className="text-center">
              <p className="text-white font-bold mb-2 text-base sm:text-lg">
                ℹ️ Aucun achievement disponible
              </p>
              <p className="text-slate-300 text-sm">
                Total d'achievements chargés : {achievements.length}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">
                Vérifiez la console du navigateur (F12) pour plus de détails sur la réponse de l'API.
              </p>
            </div>
          </GameCard>
        )}

        {/* Achievements by Category */}
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category}>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-white">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-treasure-400" />
                {category}
              </h2>
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryAchievements.map(achievement => {
                  const isCompleted = achievement.progress >= achievement.threshold;
                  const isClaimed = achievement.is_claimed;

                  return (
                    <GameCard
                      key={achievement.id}
                      variant={isClaimed ? 'default' : isCompleted ? 'success' : 'ocean'}
                      className={`p-4 sm:p-6 transition-all ${
                        isClaimed ? 'opacity-75' : isCompleted ? 'border-2 border-emerald-400/40 shadow-lg shadow-emerald-500/20' : ''
                      }`}
                    >
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-2xl sm:text-3xl flex-shrink-0">{achievement.icon || '🏆'}</div>
                            <h3 className="font-bold text-base sm:text-lg text-white break-words">{achievement.name}</h3>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {isClaimed ? (
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                            ) : isCompleted ? (
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 ml-9 sm:ml-11">{achievement.description}</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                          <span className="text-slate-300">Progression</span>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="font-semibold text-white">
                              {achievement.progress} / {achievement.threshold}
                            </span>
                            <span className={`font-bold text-base sm:text-lg ${
                              isCompleted ? 'text-emerald-400' : 'text-ocean-400'
                            }`}>
                              {achievement.completion_percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800/50 rounded-full h-2.5 sm:h-3 overflow-hidden backdrop-blur-sm border border-white/10">
                          <div
                            className={`h-full rounded-full transition-all flex items-center justify-center ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                : 'bg-gradient-to-r from-ocean-400 to-ocean-500'
                            }`}
                            style={{ width: `${achievement.completion_percentage}%` }}
                          >
                            {achievement.completion_percentage > 15 && (
                              <span className="text-xs font-bold text-white drop-shadow">
                                {achievement.completion_percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reward and Action */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-treasure-400" />
                          <span className="font-bold text-treasure-300 text-sm sm:text-base">
                            {achievement.reward_berrys} ฿
                          </span>
                        </div>

                        {isCompleted && !isClaimed && (
                          <button
                            onClick={() => handleClaim(achievement.id)}
                            disabled={claimingId === achievement.id}
                            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-emerald-500/40 hover:scale-105 border border-emerald-400/30 backdrop-blur-xl text-xs sm:text-sm"
                          >
                            {claimingId === achievement.id ? 'Réclamation...' : 'Réclamer'}
                          </button>
                        )}

                        {isClaimed && (
                          <span className="text-xs sm:text-sm text-purple-400 font-semibold flex items-center gap-1">
                            <CheckCircle size={14} />
                            Réclamé
                          </span>
                        )}
                      </div>

                      {isClaimed && achievement.claimed_at && (
                        <div className="mt-2 text-xs text-slate-400">
                          Réclamé le {new Date(achievement.claimed_at).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </GameCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && achievements.length > 0 && (
          <div className="text-center py-8 sm:py-12">
            <GameCard variant="default" className="p-6 sm:p-8 max-w-md mx-auto">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-300 text-base sm:text-lg">Aucun achievement dans cette catégorie</p>
            </GameCard>
          </div>
        )}
      </div>
    </>
  );
}
