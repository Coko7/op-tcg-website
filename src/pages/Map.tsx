import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import worldMapService, { Island, CrewMember, ActiveQuest, Quest, MapData } from '../services/worldMapService';
import { Map as MapIcon, Users, Trophy, Clock, CheckCircle2, Lock, Star, Gift, X } from 'lucide-react';
import GameCard from '../components/ui/GameCard';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';

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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadMapData();
    // Rafraîchir toutes les 30 secondes pour mettre à jour les timers
    const interval = setInterval(loadMapData, 30000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const loadMapData = async () => {
    try {
      const data = await worldMapService.getMapData();
      setMapData(data);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Erreur lors du chargement de la carte', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIslandClick = (island: Island) => {
    if (!island.unlocked) {
      showToast('Cette île n\'est pas encore débloquée', 'error');
      return;
    }
    setSelectedIsland(island);
  };

  const handleQuestClick = (quest: Quest) => {
    if (!mapData) return;

    setSelectedQuest(quest);
    setSelectedCrew([]);
    setShowQuestModal(true);
  };

  const handleCrewSelect = (crewId: string) => {
    if (!selectedQuest || !mapData) return;

    const crew = mapData.crewMembers.find(c => c.id === crewId && c.unlocked);
    if (!crew) return;

    if (selectedCrew.includes(crewId)) {
      setSelectedCrew(selectedCrew.filter(id => id !== crewId));
    } else {
      if (selectedCrew.length >= selectedQuest.required_crew_count) {
        showToast(`Cette quête nécessite ${selectedQuest.required_crew_count} membre(s) maximum`, 'error');
        return;
      }
      setSelectedCrew([...selectedCrew, crewId]);
    }
  };

  const handleStartQuest = async () => {
    if (!selectedQuest || selectedCrew.length !== selectedQuest.required_crew_count) {
      showToast(`Sélectionnez exactement ${selectedQuest.required_crew_count} membre(s)`, 'error');
      return;
    }

    setActionLoading(true);
    try {
      await worldMapService.startQuest(selectedQuest.id, selectedCrew);
      showToast('Quête démarrée avec succès !', 'success');
      setShowQuestModal(false);
      setSelectedQuest(null);
      setSelectedCrew([]);
      await loadMapData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Erreur lors du démarrage de la quête', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteQuest = async (activeQuestId: string) => {
    setActionLoading(true);
    try {
      const result = await worldMapService.completeQuest(activeQuestId);
      showToast(`Quête terminée ! +${result.reward.berrys} Berrys`, 'success');
      await loadMapData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Erreur lors de la complétion de la quête', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimIslandReward = async (islandId: string) => {
    setActionLoading(true);
    try {
      const result = await worldMapService.claimIslandReward(islandId);
      if (result.reward.type === 'berrys') {
        showToast(`Récompense réclamée ! +${result.reward.value} Berrys`, 'success');
      } else if (result.reward.type === 'crew_member') {
        const crew = mapData?.crewMembers.find(c => c.id === result.reward.crewMemberId);
        showToast(`Nouveau membre d'équipage ! ${crew?.name || 'Inconnu'} a rejoint l'équipage !`, 'success');
      }
      await loadMapData();
      setSelectedIsland(null);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Erreur lors de la réclamation de la récompense', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getTimeRemaining = (completesAt: string): string => {
    const now = new Date().getTime();
    const target = new Date(completesAt).getTime();
    const diff = target - now;

    if (diff <= 0) return 'Terminé !';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const isQuestComplete = (completesAt: string): boolean => {
    return new Date(completesAt).getTime() <= new Date().getTime();
  };

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <MapIcon className="w-10 h-10 text-ocean-400" />
              Carte du Monde
            </h1>
            <p className="text-white/60">Explorez Grand Line et complétez des quêtes épiques</p>
          </div>
          <GameCard variant="ocean" className="px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <Users className="w-6 h-6 text-ocean-400 mx-auto mb-1" />
                <p className="text-sm text-white/60">Équipage</p>
                <p className="text-xl font-bold text-white">
                  {mapData.crewMembers.filter(c => c.unlocked).length}/{mapData.crewMembers.length}
                </p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <Trophy className="w-6 h-6 text-treasure-400 mx-auto mb-1" />
                <p className="text-sm text-white/60">Îles</p>
                <p className="text-xl font-bold text-white">
                  {mapData.islands.filter(i => i.completed).length}/{mapData.islands.length}
                </p>
              </div>
            </div>
          </GameCard>
        </div>

        {/* Active Quests */}
        {mapData.activeQuests.length > 0 && (
          <GameCard variant="success" className="mb-8 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Quêtes en Cours ({mapData.activeQuests.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapData.activeQuests.map((activeQuest) => {
                const quest = mapData.islands
                  .flatMap(i => i.quests)
                  .find(q => q.id === activeQuest.quest_id);
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
        <GameCard className="p-8 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-ocean-950/50 via-slate-900/50 to-ocean-950/50" />
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-96 h-96 bg-ocean-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-treasure-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-ocean-400" />
              Grand Line
            </h2>

            {/* SVG Map Container */}
            <div className="w-full h-[600px] relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-ocean-950/30 to-slate-900/30">
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
                {mapData.islands.map((island, index) => {
                  if (index === 0) return null;
                  const prevIsland = mapData.islands[index - 1];
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
                {mapData.islands.map((island) => {
                  const unlocked = island.unlocked;
                  const completed = island.completed;
                  const canClaim = completed && !island.final_reward_claimed;

                  return (
                    <g
                      key={island.id}
                      transform={`translate(${island.longitude}, ${island.latitude})`}
                      onClick={() => handleIslandClick(island)}
                      className={unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
                      style={{ transition: 'transform 0.3s' }}
                    >
                      {/* Island circle */}
                      <circle
                        r={unlocked ? '2' : '1.5'}
                        fill={completed ? 'url(#islandGradient)' : unlocked ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.2)'}
                        stroke={canClaim ? '#fbbf24' : unlocked ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)'}
                        strokeWidth="0.3"
                        className={unlocked ? 'hover:r-3' : ''}
                      />

                      {/* Pulse effect for claimable rewards */}
                      {canClaim && (
                        <circle
                          r="2"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="0.2"
                          opacity="0.6"
                        >
                          <animate
                            attributeName="r"
                            from="2"
                            to="4"
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
                          y="0.5"
                          fontSize="1.5"
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
                          y="-2.5"
                          fontSize="1.5"
                          textAnchor="middle"
                        >
                          ⭐
                        </text>
                      )}

                      {/* Island name */}
                      <text
                        x="0"
                        y="3.5"
                        fontSize="1"
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
            </div>
          </div>
        </GameCard>

        {/* Island Details Modal */}
        {selectedIsland && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GameCard className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedIsland.name}</h2>
                    <p className="text-white/60">{selectedIsland.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedIsland(null)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/80">Progression</span>
                    <span className="text-sm font-bold text-white">
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

                {/* Final Reward */}
                {selectedIsland.completed && !selectedIsland.final_reward_claimed && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-treasure-500/20 to-treasure-600/20 border border-treasure-400/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gift className="w-8 h-8 text-treasure-400" />
                        <div>
                          <h3 className="font-bold text-white">Récompense Finale Disponible !</h3>
                          <p className="text-sm text-white/80">
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
                      >
                        Réclamer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quests List */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-ocean-400" />
                    Quêtes Disponibles
                  </h3>
                  <div className="grid gap-4">
                    {selectedIsland.quests.map((quest) => {
                      const activeQuest = mapData.activeQuests.find(aq => aq.quest_id === quest.id);
                      const isActive = !!activeQuest;

                      return (
                        <div
                          key={quest.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-400/30'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer'
                          }`}
                          onClick={() => !isActive && handleQuestClick(quest)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white mb-1">{quest.name}</h4>
                              <p className="text-sm text-white/60 mb-3">{quest.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-white/80">
                                  <Clock className="w-4 h-4 text-ocean-400" />
                                  <span>{quest.duration_hours}h</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/80">
                                  <Users className="w-4 h-4 text-ocean-400" />
                                  <span>{quest.required_crew_count} membre{quest.required_crew_count > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1 text-treasure-400 font-medium">
                                  <span>{quest.reward_berrys}</span>
                                  <img src="/icons/berry.svg" alt="Berry" className="w-4 h-4" onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }} />
                                </div>
                              </div>
                            </div>
                            {isActive ? (
                              <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-medium">En cours</span>
                              </div>
                            ) : (
                              <Button size="sm" variant="ocean">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GameCard className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedQuest.name}</h2>
                    <p className="text-white/60">{selectedQuest.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowQuestModal(false);
                      setSelectedQuest(null);
                      setSelectedCrew([]);
                    }}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Sélectionnez {selectedQuest.required_crew_count} membre{selectedQuest.required_crew_count > 1 ? 's' : ''} d'équipage
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-ocean-500/20 border-ocean-400'
                                : isBusy
                                ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-ocean-400" />}
                              {isBusy && <Clock className="w-4 h-4 text-white/40" />}
                              <span className="font-semibold text-white text-sm">{crew.name}</span>
                            </div>
                            {isBusy && <p className="text-xs text-white/40">En mission</p>}
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ocean"
                    className="flex-1"
                    onClick={handleStartQuest}
                    disabled={selectedCrew.length !== selectedQuest.required_crew_count}
                    isLoading={actionLoading}
                  >
                    Démarrer la Quête
                  </Button>
                  <Button
                    variant="ghost"
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
