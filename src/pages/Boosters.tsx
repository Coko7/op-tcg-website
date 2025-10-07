import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowLeft, Sparkles, ChevronLeft, ChevronRight, Coins, Gem } from 'lucide-react';
import { GameService } from '../services/gameService';
import { BoosterResult, Card as CardType, BOOSTER_BERRY_PRICE } from '../types';
import { BoosterPack } from '../data/onePieceCards';
import Card from '../components/Card';
import CardDeck from '../components/CardDeck';
import CardModal from '../components/CardModal';
import Timer from '../components/Timer';

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

    setTimeout(async () => {
      const result = await GameService.openBooster(selectedBooster.id);
      if (result) {
        setBoosterResult(result);
        setAnimationPhase('deck');
        setRevealedCards(0);

        // Utiliser le statut retourné par l'API openBooster (plus besoin d'appeler getBoosterStatus)
        if (result.available_boosters !== undefined) {
          setBoosterStatus((prev: any) => prev ? {
            ...prev,
            available_boosters: result.available_boosters!,
            next_booster_time: result.next_booster_time ? new Date(result.next_booster_time) : undefined
          } : null);
          setCanOpen(result.available_boosters > 0);
        }
      }
    }, 2000);
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

    if (!confirm(`Voulez-vous acheter un booster pour ${BOOSTER_BERRY_PRICE} Berrys ?`)) return;

    setAnimationPhase('opening');

    setTimeout(async () => {
      try {
        const result = await GameService.buyBoosterWithBerrys();
        if (result) {
          setBoosterResult(result);
          setAnimationPhase('deck');
          setRevealedCards(0);

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
        alert(error.message || 'Erreur lors de l\'achat du booster');
        setAnimationPhase('idle');
      }
    }, 2000);
  };

  const BoosterPack: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div
      onClick={onClick}
      className={`relative mx-auto cursor-pointer transition-all duration-1000 w-64 h-64 ${
        animationPhase === 'opening' ? 'animate-pulse scale-110' : 'hover:scale-105'
      } ${animationPhase === 'revealing' ? 'opacity-0 scale-0' : ''}`}
    >
      {/* Coffre au trésor */}
      <div className="relative w-full h-full">
        {/* Ombre du coffre */}
        <div className="absolute inset-0 bg-black opacity-20 blur-xl transform translate-y-4"></div>

        {/* Corps du coffre */}
        <div className="relative w-full h-full bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-800 rounded-2xl border-8 border-yellow-900 shadow-2xl overflow-hidden">
          {/* Texture bois */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-900 to-transparent"></div>
          </div>

          {/* Bandes métalliques */}
          <div className="absolute top-1/4 left-0 right-0 h-3 bg-gradient-to-r from-yellow-900 via-yellow-600 to-yellow-900 border-y-2 border-yellow-950"></div>
          <div className="absolute bottom-1/4 left-0 right-0 h-3 bg-gradient-to-r from-yellow-900 via-yellow-600 to-yellow-900 border-y-2 border-yellow-950"></div>

          {/* Serrure centrale */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-16 h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700 rounded-lg border-4 border-yellow-900 flex items-center justify-center shadow-lg">
              <Gem size={40} className="text-yellow-900 animate-pulse" />
            </div>
          </div>

          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-30"></div>

          {/* Animation d'ouverture */}
          {animationPhase === 'opening' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-50 animate-ping"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={48} className="text-yellow-300 animate-spin" />
              </div>
            </>
          )}
        </div>

        {/* Texte en dessous */}
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <div className="text-yellow-400 font-bold text-lg drop-shadow-lg">Coffre au Trésor</div>
          <div className="text-yellow-200 text-sm">Cliquez pour ouvrir</div>
        </div>
      </div>
    </div>
  );

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
          className="flex items-center space-x-2 text-blue-300 hover:text-white transition-colors text-sm sm:text-base"
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

      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
          Ouvrir un Booster Pack
        </h1>
        <p className="text-blue-200 text-sm sm:text-base mb-4 sm:mb-6">
          Chaque booster contient 5 cartes avec au moins 1 carte rare !
        </p>

        {/* Sélecteur de booster */}
        <div className="bg-blue-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-600/30 mb-6 sm:mb-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={prevBooster}
              className="p-1 sm:p-2 text-blue-300 hover:text-white transition-colors shrink-0"
              disabled={animationPhase !== 'idle'}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center flex-1 min-w-0">
              {loading ? (
                <div className="animate-pulse px-2">
                  <div className="h-5 sm:h-6 bg-blue-600 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-blue-700 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-blue-700 rounded mb-3"></div>
                  <div className="h-2 sm:h-3 bg-blue-800 rounded"></div>
                </div>
              ) : selectedBooster ? (
                <>
                  <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2 truncate px-2">{selectedBooster.name}</h3>
                  <div className="text-xs sm:text-sm text-blue-200 mb-1 sm:mb-2">
                    <span className="font-semibold">{selectedBooster.code}</span> • {selectedBooster.series}
                  </div>
                  <p className="text-xs sm:text-sm text-blue-300 mb-2 sm:mb-3 line-clamp-2 px-2">{selectedBooster.description}</p>
                  <div className="text-xs text-blue-400">
                    {selectedBooster.cardCount} cartes • {new Date(selectedBooster.releaseDate).toLocaleDateString('fr-FR')}
                  </div>
                </>
              ) : (
                <div className="text-red-400 text-sm">Erreur de chargement</div>
              )}
            </div>

            <button
              onClick={nextBooster}
              className="p-1 sm:p-2 text-blue-300 hover:text-white transition-colors shrink-0"
              disabled={animationPhase !== 'idle'}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex justify-center mt-3 sm:mt-4 space-x-1">
            {availableBoosters.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === boosterIndex ? 'bg-blue-400' : 'bg-blue-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {animationPhase === 'idle' && (
        <div className="text-center space-y-6 sm:space-y-8">
          <div className="mb-20">
            <BoosterPack onClick={handleOpenBooster} />
          </div>

          <div className="space-y-3 sm:space-y-4 px-4">
            <button
              onClick={handleOpenBooster}
              disabled={!canOpen}
              className={`text-sm sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold transition-all w-full sm:w-auto ${
                canOpen
                  ? 'btn-primary hover:scale-105'
                  : 'btn-disabled cursor-not-allowed'
              }`}
            >
              {canOpen ? (
                <span className="flex items-center justify-center space-x-2">
                  <Sparkles size={18} />
                  <span>Ouvrir le Booster gratuit!</span>
                  <Sparkles size={18} />
                </span>
              ) : (
                'Booster gratuit indisponible'
              )}
            </button>

            {!canOpen && (
              <div className="text-center">
                <div className="text-blue-300 mb-2 text-sm sm:text-base">ou</div>
                <button
                  onClick={handleBuyWithBerrys}
                  disabled={berrysBalance < BOOSTER_BERRY_PRICE}
                  className={`text-sm sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto sm:mx-auto ${
                    berrysBalance >= BOOSTER_BERRY_PRICE
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Coins size={18} />
                  <span>Acheter ({BOOSTER_BERRY_PRICE} Berrys)</span>
                </button>
                {berrysBalance < BOOSTER_BERRY_PRICE && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2">
                    Besoin de {BOOSTER_BERRY_PRICE - berrysBalance} Berrys de plus
                  </p>
                )}
              </div>
            )}

            {!canOpen && timeUntilNext > 0 && boosterStatus && (
              <p className="text-blue-300 text-xs sm:text-sm">
                Prochain booster gratuit dans{' '}
                <Timer targetTime={boosterStatus.next_booster_time || null} />
              </p>
            )}
          </div>
        </div>
      )}

      {animationPhase === 'opening' && (
        <div className="text-center space-y-8">
          <BoosterPack onClick={() => {}} />

          <div className="space-y-4">
            <div className="text-2xl font-bold text-white animate-pulse">
              Ouverture en cours...
            </div>
            <div className="text-blue-300">
              La magie de Grand Line opère... ✨
            </div>
          </div>
        </div>
      )}

      {animationPhase === 'deck' && boosterResult && (
        <div className="w-full max-w-6xl mx-auto px-2">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              🃏 Révélez vos cartes !
            </h2>
            <div className="text-blue-300 text-sm sm:text-base">
              {boosterResult.new_cards.length > 0 && (
                <p>
                  {boosterResult.new_cards.length} nouvelle(s) carte(s) ajoutée(s) !
                </p>
              )}
            </div>
          </div>

          <CardDeck
            cards={boosterResult.cards}
            onCardRevealed={handleCardRevealed}
            onComplete={handleDeckComplete}
          />
        </div>
      )}

      {animationPhase === 'complete' && boosterResult && (
        <div className="space-y-6 sm:space-y-8 px-2">
          <div className="text-center">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Félicitations !
            </h2>
            <div className="text-blue-300 text-base sm:text-lg mb-2">
              Vous avez révélé toutes vos cartes !
            </div>
            {boosterResult.new_cards.length > 0 && (
              <div className="text-green-400 font-semibold text-sm sm:text-base">
                {boosterResult.new_cards.length} nouvelle(s) carte(s) ajoutée(s) !
              </div>
            )}
          </div>

          {/* Affichage des 5 cartes obtenues */}
          <div className="bg-blue-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-600/30 max-w-4xl mx-auto">
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
            <div className="mt-6 border-t border-blue-600/30 pt-4">
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
                  <div key={rarity} className="p-2 bg-blue-700/30 rounded-lg">
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
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-lg"
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

      <div className="bg-blue-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-600/30">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          🎯 Taux de drop
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="text-center">
            <div className="text-gray-300">Commune</div>
            <div className="text-white font-bold">60%</div>
          </div>
          <div className="text-center">
            <div className="text-green-300">Peu Commune</div>
            <div className="text-white font-bold">25%</div>
          </div>
          <div className="text-center">
            <div className="text-blue-300">Rare</div>
            <div className="text-white font-bold">10%</div>
          </div>
          <div className="text-center">
            <div className="text-purple-300">Super Rare</div>
            <div className="text-white font-bold">4%</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-300">Secrète Rare</div>
            <div className="text-white font-bold">1%</div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Boosters;