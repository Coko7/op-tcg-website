import { useState, useEffect } from 'react';
import { Trophy, Award, Gift, CheckCircle, Circle } from 'lucide-react';
import { apiService } from '../services/api';
import { AchievementWithProgress, AchievementStats } from '../types';
import Layout from '../components/Layout';

export default function Achievements() {
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
        alert(`Vous avez gagné ${response.data.berrys_earned} Berrys !`);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'achievement:', error);
      alert(error.message || 'Erreur lors de la récupération de l\'achievement');
    } finally {
      setClaimingId(null);
    }
  };

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];
  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, AchievementWithProgress[]>);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-gray-600">Chargement des achievements...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            Achievements
          </h1>
          <p className="text-gray-600">
            Débloquez des achievements pour gagner des Berrys !
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Complétés</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-purple-600">{stats.claimed}</div>
              <div className="text-sm text-gray-600">Réclamés</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-orange-600">{stats.unclaimed}</div>
              <div className="text-sm text-gray-600">À réclamer</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-yellow-600">{stats.total_berrys_earned}</div>
              <div className="text-sm text-gray-600">Berrys gagnés</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-red-600">{stats.total_berrys_available}</div>
              <div className="text-sm text-gray-600">Berrys disponibles</div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category === 'all' ? 'Tous' : category}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-6 h-6" />
                {category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryAchievements.map(achievement => {
                  const isCompleted = achievement.progress >= achievement.threshold;
                  const isClaimed = achievement.is_claimed;

                  return (
                    <div
                      key={achievement.id}
                      className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all ${
                        isClaimed
                          ? 'border-purple-500 opacity-75'
                          : isCompleted
                          ? 'border-green-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{achievement.icon || '🏆'}</div>
                          <div>
                            <h3 className="font-bold text-lg">{achievement.name}</h3>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                        <div>
                          {isClaimed ? (
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                          ) : isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progression</span>
                          <span className="font-semibold">
                            {achievement.progress} / {achievement.threshold}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${achievement.completion_percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="w-5 h-5 text-yellow-600" />
                          <span className="font-bold text-yellow-600">
                            {achievement.reward_berrys} Berrys
                          </span>
                        </div>

                        {isCompleted && !isClaimed && (
                          <button
                            onClick={() => handleClaim(achievement.id)}
                            disabled={claimingId === achievement.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-semibold"
                          >
                            {claimingId === achievement.id ? 'Réclamation...' : 'Réclamer'}
                          </button>
                        )}

                        {isClaimed && (
                          <span className="text-sm text-purple-600 font-semibold">
                            Réclamé
                          </span>
                        )}
                      </div>

                      {isClaimed && achievement.claimed_at && (
                        <div className="mt-2 text-xs text-gray-500">
                          Réclamé le {new Date(achievement.claimed_at).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucun achievement dans cette catégorie</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
