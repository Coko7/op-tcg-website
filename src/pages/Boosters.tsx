import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight, Coins } from 'lucide-react';
import { GameService } from '../services/gameService';
import { BoosterResult, Card as CardType, BOOSTER_BERRY_PRICE } from '../types';
import { BoosterPack } from '../data/onePieceCards';
import Card from '../components/Card';
import CardModal from '../components/CardModal';
import Timer from '../components/Timer';
import WantedPosterAnimation from '../components/WantedPosterAnimation';
import Dialog from '../components/ui/Dialog';
import { useDialog } from '../hooks/useDialog';
import BoosterWall from '../components/BoosterWall';

type AnimationPhase = 'idle' | 'opening' | 'deck' | 'revealing' | 'complete';

const Boosters: React.FC = () => {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [boosterResult, setBoosterResult] = useState<BoosterResult | null>(null);
  const [revealedCards, setRevealedCards] = useState<number>(0);
  const [canOpen, setCanOpen] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [boosterStatus, setBoosterStatus] = useState<any>(null);
  const [selectedBooster, setSelectedBooster] = useState<BoosterPack | null>(null);
  const [boosterIndex, setBoosterIndex] = useState<number>(0);
  const [availableBoosters, setAvailableBoosters] = useState<BoosterPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [berrysBalance, setBerrysBalance] = useState<number>(0);
  const { dialogState, showDialog, handleClose, handleConfirm } = useDialog();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [boosters, boosterStatus, berrys] = await Promise.all([
          GameService.getAllBoosters(),
          GameService.getBoosterStatus(),
          GameService.getBerrysBalance()
        ]);

        setAvailableBoosters(boosters);
        if (boosters.length > 0) {
          setSelectedBooster(boosters[0]);
        }

        setBoosterStatus(boosterStatus);
        setCanOpen(boosterStatus.available_boosters > 0);
        setBerrysBalance(berrys);

        if (boosterStatus.next_booster_time) {
          const now = new Date();
          const nextTime = new Date(boosterStatus.next_booster_time);
          setTimeUntilNext(Math.max(0, nextTime.getTime() - now.getTime()));
        } else {
          setTimeUntilNext(0);
        }
      } catch (error) {
        console.error('Error loading data:', error);
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

      // Mettre à jour le temps restant
      setTimeUntilNext(Math.max(0, nextTime - now));

      // Si le timer est écoulé et qu'on n'a pas encore 3 boosters, on incrémente
      if (now >= nextTime && boosterStatus.available_boosters < boosterStatus.max_daily_boosters) {
        setBoosterStatus((prev: any) => {
          if (!prev) return prev;
          const newAvailable = Math.min(prev.available_boosters + 1, prev.max_daily_boosters);

          // Calculer le prochain timer si on n'est pas au max
          let newNextTime: Date | string | undefined = undefined;
          if (newAvailable < prev.max_daily_boosters) {
            newNextTime = new Date(nextTime + 8 * 60 * 60 * 1000);
          }

          setCanOpen(newAvailable > 0);

          return {
            ...prev,
            available_boosters: newAvailable,
            next_booster_time: newNextTime
          };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [boosterStatus?.next_booster_time]);

  const handleOpenBooster = async () => {
    if (!canOpen || animationPhase !== 'idle' || !selectedBooster) return;

    setAnimationPhase('opening');

    // Appeler l'API immédiatement pour avoir les cartes pendant l'animation
    const result = await GameService.openBooster(selectedBooster.id);
    if (result) {
      setBoosterResult(result);

      // Attendre la fin de l'animation de déchirement du poster
      // 1000ms (déchirement du poster en deux moitiés)
      setTimeout(() => {
        setAnimationPhase('deck');
        setRevealedCards(0);
      }, 1000);

      // Mettre à jour le statut
      if (result.available_boosters !== undefined) {
        setBoosterStatus((prev: any) => prev ? {
          ...prev,
          available_boosters: result.available_boosters!,
          next_booster_time: result.next_booster_time ? new Date(result.next_booster_time) : undefined
        } : null);
        setCanOpen(result.available_boosters > 0);
      }
    }
  };

  const handleCardRevealed = (card: CardType, index: number) => {
    console.log('🃏 Carte révélée:', card.name, 'Index:', index);

    // Effet spécial pour les cartes rares
    if (card.rarity === 'super_rare' || card.rarity === 'secret_rare') {
      console.log('🌟 Carte rare révélée!', card.name);
      // Ici on pourrait ajouter des sons ou des effets visuels spéciaux
    }

    setRevealedCards(prev => prev + 1);
  };

  const handleDeckComplete = () => {
    setAnimationPhase('complete');
  };

  const resetAnimation = () => {
    setAnimationPhase('idle');
    setBoosterResult(null);
    setRevealedCards(0);
    // Le statut a déjà été mis à jour par handleOpenBooster, pas besoin de refaire un appel API
  };

  const nextBooster = () => {
    const newIndex = (boosterIndex + 1) % availableBoosters.length;
    setBoosterIndex(newIndex);
    setSelectedBooster(availableBoosters[newIndex]);
  };

  const prevBooster = () => {
    const newIndex = boosterIndex === 0 ? availableBoosters.length - 1 : boosterIndex - 1;
    setBoosterIndex(newIndex);
    setSelectedBooster(availableBoosters[newIndex]);
  };

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handleBuyWithBerrys = async () => {
    if (animationPhase !== 'idle' || !selectedBooster || berrysBalance < BOOSTER_BERRY_PRICE) return;

    showDialog({
      title: 'Acheter un booster',
      message: `Voulez-vous acheter un booster pour ${BOOSTER_BERRY_PRICE} Berrys ?`,
      type: 'confirm',
      confirmText: 'Acheter',
      cancelText: 'Annuler',
      showCancel: true,
      onConfirm: async () => {
        handleClose();
        setAnimationPhase('opening');

        try {
          const result = await GameService.buyBoosterWithBerrys(selectedBooster.id);
          if (result) {
            setBoosterResult(result);

            // Attendre la fin de l'animation de déchirement du poster
            // 1000ms (déchirement du poster en deux moitiés)
            setTimeout(() => {
              setAnimationPhase('deck');
              setRevealedCards(0);
            }, 1000);

            // Mettre à jour le solde de Berrys
            const newBalance = await GameService.getBerrysBalance();
            setBerrysBalance(newBalance);

            // Mettre à jour le statut des boosters
            if (result.available_boosters !== undefined) {
              setBoosterStatus((prev: any) => prev ? {
                ...prev,
                available_boosters: result.available_boosters!,
                next_booster_time: result.next_booster_time ? new Date(result.next_booster_time) : undefined
              } : null);
              setCanOpen(result.available_boosters > 0);
            }
          }
        } catch (error: any) {
          showDialog({
            title: 'Erreur',
            message: error.message || 'Erreur lors de l\'achat du booster',
            type: 'error',
            confirmText: 'OK',
            showCancel: false,
            onConfirm: () => {
              handleClose();
              setAnimationPhase('idle');
            }
          });
        }
      }
    });
  };

  const handleBoosterSelect = (booster: BoosterPack) => {
    // Mettre à jour le booster sélectionné
    setSelectedBooster(booster);

    // Si on peut ouvrir gratuitement, on ouvre directement
    if (canOpen && animationPhase === 'idle') {
      handleOpenBoosterWithBooster(booster);
    }
    // Sinon, on propose d'acheter avec des Berrys
    else if (animationPhase === 'idle') {
      handleBuyWithBerrysWithBooster(booster);
    }
  };

  const handleOpenBoosterWithBooster = async (booster: BoosterPack) => {
    if (!canOpen || animationPhase !== 'idle') return;

    setAnimationPhase('opening');

    // Appeler l'API immédiatement pour avoir les cartes pendant l'animation
    const result = await GameService.openBooster(booster.id);
    if (result) {
      setBoosterResult(result);

      // Attendre la fin de l'animation de déchirement du poster
      // 1000ms (déchirement du poster en deux moitiés)
      setTimeout(() => {
        setAnimationPhase('deck');
        setRevealedCards(0);
      }, 1000);

      // Mettre à jour le statut
      if (result.available_boosters !== undefined) {
        setBoosterStatus((prev: any) => prev ? {
          ...prev,
          available_boosters: result.available_boosters!,
          next_booster_time: result.next_booster_time ? new Date(result.next_booster_time) : undefined
        } : null);
        setCanOpen(result.available_boosters > 0);
      }
    }
  };

  const handleBuyWithBerrysWithBooster = async (booster: BoosterPack) => {
    if (animationPhase !== 'idle' || berrysBalance < BOOSTER_BERRY_PRICE) return;

    showDialog({
      title: 'Acheter un booster',
      message: `Voulez-vous acheter "${booster.name}" pour ${BOOSTER_BERRY_PRICE} Berrys ?`,
      type: 'confirm',
      confirmText: 'Acheter',
      cancelText: 'Annuler',
      showCancel: true,
      onConfirm: async () => {
        handleClose();
        setAnimationPhase('opening');

        try {
          const result = await GameService.buyBoosterWithBerrys(booster.id);
          if (result) {
            setBoosterResult(result);

            // Attendre la fin de l'animation de déchirement du poster
            // 1000ms (déchirement du poster en deux moitiés)
            setTimeout(() => {
              setAnimationPhase('deck');
              setRevealedCards(0);
            }, 1000);

            // Mettre à jour le solde de Berrys
            const newBalance = await GameService.getBerrysBalance();
            setBerrysBalance(newBalance);

            // Mettre à jour le statut des boosters
            if (result.available_boosters !== undefined) {
              setBoosterStatus((prev: any) => prev ? {
                ...prev,
                available_boosters: result.available_boosters!,
                next_booster_time: result.next_booster_time ? new Date(result.next_booster_time) : undefined
              } : null);
              setCanOpen(result.available_boosters > 0);
            }
          }
        } catch (error: any) {
          showDialog({
            title: 'Erreur',
            message: error.message || 'Erreur lors de l\'achat du booster',
            type: 'error',
            confirmText: 'OK',
            showCancel: false,
            onConfirm: () => {
              handleClose();
              setAnimationPhase('idle');
            }
          });
        }
      }
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-white text-xl">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <Link
          to="/"
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all duration-300 backdrop-blur-xl text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          <span>Retour à l'accueil</span>
        </Link>

        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-white font-semibold text-sm sm:text-base">
            Boosters: {boosterStatus?.available_boosters || 0}/3
          </div>
          <div className="text-yellow-400 font-semibold flex items-center sm:justify-end gap-1 mt-1 text-sm sm:text-base">
            <Coins size={16} />
            {berrysBalance} Berrys
          </div>
          {timeUntilNext > 0 && boosterStatus && (
            <Timer
              targetTime={boosterStatus.next_booster_time || null}
              className="sm:justify-end text-xs sm:text-sm"
            />
          )}
        </div>
      </div>

      {/* Mur de Posters - Affichage uniquement en phase idle */}
      {animationPhase === 'idle' && (
        <div className="px-2">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Mur des Boosters
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Chaque booster contient 5 cartes avec au moins 1 carte rare ! Cliquez sur un poster pour l'ouvrir.
            </p>
            {!canOpen && timeUntilNext > 0 && boosterStatus && (
              <div className="mt-3 text-slate-300 text-xs sm:text-sm">
                Prochain booster gratuit dans{' '}
                <Timer targetTime={boosterStatus.next_booster_time || null} />
              </div>
            )}
          </div>

          <BoosterWall
            boosters={availableBoosters}
            canOpenFree={canOpen}
            berrysBalance={berrysBalance}
            isDisabled={animationPhase !== 'idle'}
            onBoosterSelect={handleBoosterSelect}
            selectedBoosterId={animationPhase === 'idle' ? selectedBooster?.id : undefined}
          />
        </div>
      )}

      {animationPhase === 'opening' && (
        <div className="text-center space-y-8">
          <WantedPosterAnimation
            isOpening={true}
            animationPhase={animationPhase}
            cards={boosterResult?.cards}
            onClick={() => {}}
          />
        </div>
      )}

      {animationPhase === 'deck' && boosterResult && (
        <div className="w-full max-w-6xl mx-auto px-2">
          <WantedPosterAnimation
            isOpening={true}
            animationPhase={animationPhase}
            cards={boosterResult.cards}
            onAnimationComplete={handleDeckComplete}
            onClick={() => {}}
          />

          <div className="text-center mt-6">
            <button
              onClick={handleDeckComplete}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold transition-all duration-300 shadow-2xl hover:scale-105 border-2 border-ocean-400/30 backdrop-blur-xl text-sm sm:text-base"
            >
              Voir le résumé →
            </button>
          </div>
        </div>
      )}

      {animationPhase === 'complete' && boosterResult && (
        <div className="space-y-6 sm:space-y-8 px-2">
          <div className="text-center">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Félicitations !
            </h2>
            <div className="text-slate-300 text-base sm:text-lg mb-2">
              Vous avez révélé toutes vos cartes !
            </div>
            {boosterResult.new_cards.length > 0 && (
              <div className="text-emerald-400 font-semibold text-sm sm:text-base">
                {boosterResult.new_cards.length} nouvelle(s) carte(s) ajoutée(s) !
              </div>
            )}
          </div>

          {/* Affichage des 5 cartes obtenues */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border-2 border-white/10 max-w-4xl mx-auto shadow-2xl">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 text-center">
              🃏 Vos cartes obtenues
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {boosterResult.cards.map((card, index) => (
                <div key={`summary-${card.id}-${index}`} className="relative group">
                  <Card
                    card={card}
                    showStats={false}
                    onCardClick={handleCardClick}
                    className="cursor-pointer hover:scale-105 transition-transform"
                  />
                  {boosterResult.new_cards.includes(card.id) && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg">
                      NEW
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Résumé des raretés */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-3 text-center">
                📊 Résumé des raretés
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 text-center text-xs sm:text-sm">
                {Object.entries(
                  boosterResult.cards.reduce((acc, card) => {
                    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([rarity, count]) => (
                  <div key={rarity} className="p-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                    <div className="text-white font-bold">{count}x</div>
                    <div className={`${
                      rarity === 'secret_rare' ? 'text-yellow-300' :
                      rarity === 'super_rare' ? 'text-purple-300' :
                      rarity === 'rare' ? 'text-blue-300' :
                      rarity === 'uncommon' ? 'text-green-300' :
                      'text-gray-300'
                    }`}>
                      {rarity === 'secret_rare' ? 'Secrète' :
                       rarity === 'super_rare' ? 'Super' :
                       rarity === 'rare' ? 'Rare' :
                       rarity === 'uncommon' ? 'Peu Com.' :
                       'Commune'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <button
                onClick={resetAnimation}
                className="btn-primary text-sm sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
              >
                {canOpen ? '🎲 Ouvrir un autre' : '← Retour'}
              </button>

              <Link
                to="/collection"
                className="inline-block bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 text-sm sm:text-lg shadow-lg hover:shadow-emerald-500/40 hover:scale-105 border border-emerald-400/30 backdrop-blur-xl"
              >
                📚 Voir collection
              </Link>
            </div>

            <div className="text-blue-300 text-xs sm:text-sm">
              Cartes ajoutées à votre collection
            </div>
          </div>
        </div>
      )}


      {isModalOpen && selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}

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
    </div>
  );
};

export default Boosters;