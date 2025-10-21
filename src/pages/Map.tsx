import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import worldMapService, { Island, CrewMember, ActiveQuest, Quest, MapData } from '../services/worldMapService';
import { Map as MapIcon, Users, Trophy, Clock, CheckCircle2, Lock, Star, Gift, X } from 'lucide-react';
import GameCard from '../components/ui/GameCard';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';

// Composant mémoïsé pour la carte SVG (évite les re-renders inutiles)
const WorldMapSVG = memo(({ islands, onIslandClick }: {
  islands: Island[],
  onIslandClick: (island: Island) => void
}) => {
  return (
    <svg
      viewBox="0 0 100 60"
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.2))' }}
    >
      {/* Water waves */}
      <defs>
        <pattern id="waves" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M0 10 Q 5 8, 10 10 T 20 10"
            stroke="rgba(59, 130, 246, 0.1)"
            fill="none"
            strokeWidth="0.5"
          />
        </pattern>
        <linearGradient id="islandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      <rect width="100" height="60" fill="url(#waves)" />

      {/* Path lines connecting islands */}
      {islands.map((island, index) => {
        if (index === 0) return null;
        const prevIsland = islands[index - 1];
        const unlocked = island.unlocked || prevIsland.completed;

        return (
          <line
            key={`path-${island.id}`}
            x1={prevIsland.longitude}
            y1={prevIsland.latitude}
            x2={island.longitude}
            y2={island.latitude}
            stroke={unlocked ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'}
            strokeWidth="0.3"
            strokeDasharray={unlocked ? '0' : '1 1'}
          />
        );
      })}

      {/* Islands */}
      {islands.map((island) => {
        const unlocked = island.unlocked;
        const completed = island.completed;
        const canClaim = completed && !island.final_reward_claimed;

        return (
          <g
            key={island.id}
            transform={`translate(${island.longitude}, ${island.latitude})`}
            onClick={() => onIslandClick(island)}
            className={unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
            style={{ transition: 'transform 0.3s' }}
          >
            {/* Island circle */}
            <circle
              r={unlocked ? '2.5' : '2'}
              fill={completed ? 'url(#islandGradient)' : unlocked ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.2)'}
              stroke={canClaim ? '#fbbf24' : unlocked ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)'}
              strokeWidth="0.4"
              className={unlocked ? 'hover:r-3' : ''}
            />

            {/* Pulse effect for claimable rewards */}
            {canClaim && (
              <circle
                r="2.5"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="0.3"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  from="2.5"
                  to="5"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Lock icon for locked islands */}
            {!unlocked && (
              <text
                x="0"
                y="0.7"
                fontSize="2"
                fill="rgba(255, 255, 255, 0.4)"
                textAnchor="middle"
              >
                🔒
              </text>
            )}

            {/* Completion star */}
            {completed && (
              <text
                x="0"
                y="-3"
                fontSize="2"
                textAnchor="middle"
              >
                ⭐
              </text>
            )}

            {/* Island name */}
            <text
              x="0"
              y="4.5"
              fontSize="1.2"
              fill="white"
              textAnchor="middle"
              className="font-semibold"
              style={{ pointerEvents: 'none' }}
            >
              {island.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
});

WorldMapSVG.displayName = 'WorldMapSVG';

const Map: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadMapData();
    // Rafraîchir les données toutes les 5 minutes seulement
    const dataInterval = setInterval(loadMapData, 300000);
    return () => clearInterval(dataInterval);
  }, [user, navigate]);

  // Timer séparé pour les countdowns (1 seconde)
  useEffect(() => {
    if (mapData && mapData.activeQuests.length > 0) {
      const timerInterval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [mapData?.activeQuests.length]);

  const loadMapData = useCallback(async () => {
    try {
      const data = await worldMapService.getMapData();
      setMapData(data);
    } catch (error: any) {
      showToast('error', error.response?.data?.error || 'Erreur lors du chargement de la carte');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleIslandClick = useCallback((island: Island) => {
    if (!island.unlocked) {
      showToast('error', 'Cette île n\'est pas encore débloquée');
      return;
    }
    setSelectedIsland(island);
  }, [showToast]);

  const handleQuestClick = useCallback((quest: Quest) => {
    setSelectedQuest(quest);
    setSelectedCrew([]);
    setShowQuestModal(true);
  }, []);

  const handleCrewSelect = useCallback((crewId: string) => {
    if (!selectedQuest || !mapData) return;

    const crew = mapData.crewMembers.find(c => c.id === crewId && c.unlocked);
    if (!crew) return;

    setSelectedCrew(prev => {
      if (prev.includes(crewId)) {
        return prev.filter(id => id !== crewId);
      } else {
        if (prev.length >= selectedQuest.required_crew_count) {
          showToast('error', `Cette quête nécessite ${selectedQuest.required_crew_count} membre(s) maximum`);
          return prev;
        }
        return [...prev, crewId];
      }
    });
  }, [selectedQuest, mapData, showToast]);

  const handleStartQuest = useCallback(async () => {
    if (!selectedQuest || selectedCrew.length !== selectedQuest.required_crew_count) {
      showToast('error', `Sélectionnez exactement ${selectedQuest?.required_crew_count || 0} membre(s)`);
      return;
    }

    setActionLoading(true);
    try {
      await worldMapService.startQuest(selectedQuest.id, selectedCrew);
      showToast('success', 'Quête démarrée avec succès !');
      setShowQuestModal(false);
      setSelectedQuest(null);
      setSelectedCrew([]);
      await loadMapData();
    } catch (error: any) {
      showToast('error', error.response?.data?.error || 'Erreur lors du démarrage de la quête');
    } finally {
      setActionLoading(false);
    }
  }, [selectedQuest, selectedCrew, showToast, loadMapData]);

  const handleCompleteQuest = useCallback(async (activeQuestId: string) => {
    setActionLoading(true);
    try {
      const result = await worldMapService.completeQuest(activeQuestId);
      showToast('success', `Quête terminée ! +${result.reward.berrys} Berrys`);
      await loadMapData();
    } catch (error: any) {
      showToast('error', error.response?.data?.error || 'Erreur lors de la complétion de la quête');
    } finally {
      setActionLoading(false);
    }
  }, [showToast, loadMapData]);

  const handleClaimIslandReward = useCallback(async (islandId: string) => {
    setActionLoading(true);
    try {
      const result = await worldMapService.claimIslandReward(islandId);
      if (result.reward.type === 'berrys') {
        showToast('success', `Récompense réclamée ! +${result.reward.value} Berrys`);
      } else if (result.reward.type === 'crew_member') {
        const crew = mapData?.crewMembers.find(c => c.id === result.reward.crewMemberId);
        showToast('success', `Nouveau membre d'équipage ! ${crew?.name || 'Inconnu'} a rejoint l'équipage !`);
      }
      await loadMapData();
      setSelectedIsland(null);
    } catch (error: any) {
      showToast('error', error.response?.data?.error || 'Erreur lors de la réclamation de la récompense');
    } finally {
      setActionLoading(false);
    }
  }, [mapData, showToast, loadMapData]);

  // Mémoïsation des fonctions de temps avec currentTime
  const getTimeRemaining = useCallback((completesAt: string): string => {
    const target = new Date(completesAt).getTime();
    const diff = target - currentTime;

    if (diff <= 0) return 'Terminé !';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }, [currentTime]);

  const isQuestComplete = useCallback((completesAt: string): boolean => {
    return new Date(completesAt).getTime() <= currentTime;
  }, [currentTime]);

  // Mémoïser la recherche des quêtes pour éviter flatMap à chaque render
  const questsMap = useMemo(() => {
    if (!mapData) return new globalThis.Map<string, Quest>();
    const map = new globalThis.Map<string, Quest>();
    mapData.islands.forEach(island => {
      island.quests.forEach(quest => {
        map.set(quest.id, quest);
      });
    });
    return map;
  }, [mapData]);

  // Mémoïser les stats
  const stats = useMemo(() => {
    if (!mapData) return { unlockedCrew: 0, totalCrew: 0, completedIslands: 0, totalIslands: 0 };
    return {
      unlockedCrew: mapData.crewMembers.filter(c => c.unlocked).length,
      totalCrew: mapData.crewMembers.length,
      completedIslands: mapData.islands.filter(i => i.completed).length,
      totalIslands: mapData.islands.length
    };
  }, [mapData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MapIcon className="w-16 h-16 text-ocean-400 animate-pulse mx-auto mb-4" />
          <p className="text-white/80">Chargement de la carte du monde...</p>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/80">Erreur de chargement de la carte</p>
          <Button onClick={loadMapData} className="mt-4">Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <MapIcon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-ocean-400" />
              Carte du Monde
            </h1>
            <p className="text-sm sm:text-base text-white/60">Explorez Grand Line et complétez des quêtes épiques</p>
          </div>
          <GameCard variant="ocean" className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-ocean-400 mx-auto mb-1" />
                <p className="text-xs sm:text-sm text-white/60">Équipage</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {stats.unlockedCrew}/{stats.totalCrew}
                </p>
              </div>
              <div className="w-px h-10 sm:h-12 bg-white/10" />
              <div className="text-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-treasure-400 mx-auto mb-1" />
                <p className="text-xs sm:text-sm text-white/60">Îles</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {stats.completedIslands}/{stats.totalIslands}
                </p>
              </div>
            </div>
          </GameCard>
        </div>

        {/* Active Quests */}
        {mapData.activeQuests.length > 0 && (
          <GameCard variant="success" className="mb-6 sm:mb-8 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              Quêtes en Cours ({mapData.activeQuests.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {mapData.activeQuests.map((activeQuest) => {
                const quest = questsMap.get(activeQuest.quest_id);
                if (!quest) return null;

                const complete = isQuestComplete(activeQuest.completes_at);

                return (
                  <div
                    key={activeQuest.id}
                    className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
                  >
                    <h3 className="font-semibold text-white mb-2">{quest.name}</h3>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">{quest.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-ocean-400" />
                        <span className={`text-sm font-medium ${complete ? 'text-emerald-400' : 'text-white/80'}`}>
                          {getTimeRemaining(activeQuest.completes_at)}
                        </span>
                      </div>
                      {complete && !activeQuest.reward_claimed && (
                        <Button
                          size="sm"
                          variant="treasure"
                          onClick={() => handleCompleteQuest(activeQuest.id)}
                          isLoading={actionLoading}
                        >
                          Terminer
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GameCard>
        )}

        {/* World Map */}
        <GameCard className="p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-ocean-950/50 via-slate-900/50 to-ocean-950/50" />
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-48 h-48 sm:w-96 sm:h-96 bg-ocean-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-48 h-48 sm:w-96 sm:h-96 bg-treasure-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <MapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-ocean-400" />
              Grand Line
            </h2>

            {/* SVG Map Container */}
            <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-ocean-950/30 to-slate-900/30">
              <WorldMapSVG islands={mapData.islands} onIslandClick={handleIslandClick} />
            </div>
          </div>
        </GameCard>

        {/* Island Details Modal */}
        {selectedIsland && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <GameCard className="max-w-4xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">{selectedIsland.name}</h2>
                    <p className="text-sm sm:text-base text-white/60">{selectedIsland.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedIsland(null)}
                    className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-white/80">Progression</span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {selectedIsland.progress.completed}/{selectedIsland.progress.total} quêtes
                    </span>
                  </div>
                  <ProgressBar
                    value={selectedIsland.progress.completed}
                    max={selectedIsland.progress.total}
                    variant="ocean"
                    animated
                  />
                </div>

                {/* Island Completion Reward Preview */}
                {!selectedIsland.completed && selectedIsland.final_reward_type && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-ocean-500/10 to-treasure-500/10 border border-white/10">
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-treasure-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-white mb-1">Récompense de Complétion</h3>
                        <p className="text-xs sm:text-sm text-white/80">
                          {selectedIsland.final_reward_type === 'berrys' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="font-semibold text-treasure-400">{selectedIsland.final_reward_value} Berrys</span>
                              <img src="/icons/berry.svg" alt="Berry" className="w-4 h-4" onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }} />
                            </span>
                          ) : (
                            <span className="font-semibold text-ocean-400">
                              {mapData?.crewMembers.find(c => c.id === selectedIsland.final_reward_crew_member_id)?.name || 'Nouveau membre d\'équipage'}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          Complétez toutes les quêtes pour débloquer cette récompense
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Reward */}
                {selectedIsland.completed && !selectedIsland.final_reward_claimed && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-treasure-500/20 to-treasure-600/20 border border-treasure-400/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-treasure-400 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white">Récompense Finale Disponible !</h3>
                          <p className="text-xs sm:text-sm text-white/80">
                            {selectedIsland.final_reward_type === 'berrys'
                              ? `${selectedIsland.final_reward_value} Berrys`
                              : `Nouveau membre d'équipage !`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="treasure"
                        onClick={() => handleClaimIslandReward(selectedIsland.id)}
                        isLoading={actionLoading}
                        className="w-full sm:w-auto"
                      >
                        Réclamer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quests List */}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-ocean-400" />
                    Quêtes Disponibles
                  </h3>
                  <div className="grid gap-3 sm:gap-4">
                    {selectedIsland.quests.map((quest) => {
                      const activeQuest = mapData.activeQuests.find(aq => aq.quest_id === quest.id);
                      const isActive = !!activeQuest;

                      return (
                        <div
                          key={quest.id}
                          className={`p-3 sm:p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-400/30'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer'
                          }`}
                          onClick={() => !isActive && handleQuestClick(quest)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-semibold text-white mb-1">{quest.name}</h4>
                              <p className="text-xs sm:text-sm text-white/60 mb-2 sm:mb-3 line-clamp-2">{quest.description}</p>
                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                <div className="flex items-center gap-1 text-white/80">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-ocean-400" />
                                  <span>{quest.duration_hours}h</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/80">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-ocean-400" />
                                  <span>{quest.required_crew_count} membre{quest.required_crew_count > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1 text-treasure-400 font-medium">
                                  <span>{quest.reward_berrys}</span>
                                  <img src="/icons/berry.svg" alt="Berry" className="w-3 h-3 sm:w-4 sm:h-4" onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }} />
                                </div>
                              </div>
                            </div>
                            {isActive ? (
                              <div className="flex items-center gap-2 text-emerald-400 self-start">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xs sm:text-sm font-medium">En cours</span>
                              </div>
                            ) : (
                              <Button size="sm" variant="primary" className="w-full sm:w-auto">
                                Démarrer
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </GameCard>
          </div>
        )}

        {/* Quest Start Modal with Crew Selection */}
        {showQuestModal && selectedQuest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <GameCard className="max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{selectedQuest.name}</h2>
                    <p className="text-sm sm:text-base text-white/60">{selectedQuest.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowQuestModal(false);
                      setSelectedQuest(null);
                      setSelectedCrew([]);
                    }}
                    className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                    Sélectionnez {selectedQuest.required_crew_count} membre{selectedQuest.required_crew_count > 1 ? 's' : ''} d'équipage
                  </h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {mapData.crewMembers
                      .filter(c => c.unlocked)
                      .map((crew) => {
                        const isSelected = selectedCrew.includes(crew.id);
                        const isBusy = mapData.activeQuests.some(aq =>
                          JSON.parse(aq.crew_member_ids).includes(crew.id)
                        );

                        return (
                          <button
                            key={crew.id}
                            onClick={() => !isBusy && handleCrewSelect(crew.id)}
                            disabled={isBusy}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-ocean-500/20 border-ocean-400'
                                : isBusy
                                ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ocean-400 flex-shrink-0" />}
                              {isBusy && <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 flex-shrink-0" />}
                              <span className="font-semibold text-white text-xs sm:text-sm truncate">{crew.name}</span>
                            </div>
                            {isBusy && <p className="text-xs text-white/40">En mission</p>}
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    variant="primary"
                    className="flex-1 w-full"
                    onClick={handleStartQuest}
                    disabled={selectedCrew.length !== selectedQuest.required_crew_count}
                    isLoading={actionLoading}
                  >
                    Démarrer la Quête
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setShowQuestModal(false);
                      setSelectedQuest(null);
                      setSelectedCrew([]);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </GameCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
