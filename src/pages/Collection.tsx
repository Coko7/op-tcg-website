import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Heart, X, Star, Coins, DollarSign } from 'lucide-react';
import { GameService } from '../services/gameService';
import { Card as CardType, UserCard, Rarity, CARD_SELL_PRICES } from '../types';
import Card from '../components/Card';
import CardModal from '../components/CardModal';
import { RARITY_LABELS } from '../data/cards';
import { useToast } from '../contexts/ToastContext';

type FilterType = 'all' | 'favorites' | Rarity | string; // string pour les IDs de boosters

const CARDS_PER_PAGE = 30; // Augmenté pour réduire la fréquence de chargement

const Collection: React.FC = () => {
  const toast = useToast();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [allCards, setAllCards] = useState<CardType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [availableBoosters, setAvailableBoosters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [berrysBalance, setBerrysBalance] = useState<number>(0);
  const [sellMode, setSellMode] = useState(false);
  const [displayedCards, setDisplayedCards] = useState(CARDS_PER_PAGE);
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);
  const previousSellMode = useRef(sellMode);

  // States pour le dialog de vente par lot
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [cardToSell, setCardToSell] = useState<{ card: CardType; maxQuantity: number } | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [userCardsData, allCardsData, statsData, boostersData, berrys] = await Promise.all([
          GameService.getUserCards(),
          GameService.getAllCards(),
          GameService.getCollectionStats(),
          GameService.getAllBoosters(),
          GameService.getBerrysBalance()
        ]);

        setUserCards(userCardsData);
        setAllCards(allCardsData);
        setStats(statsData);
        setAvailableBoosters(boostersData);
        setBerrysBalance(berrys);
      } catch (error) {
        console.error('Error loading collection data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredCards = useMemo(() => {
    const ownedCardIds = userCards.map(uc => uc.card_id);
    let filtered = allCards;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(lowercaseQuery) ||
        card.character.toLowerCase().includes(lowercaseQuery) ||
        card.description.toLowerCase().includes(lowercaseQuery) ||
        (card.type && card.type.toLowerCase().includes(lowercaseQuery)) ||
        (card.color && card.color.some(c => c.toLowerCase().includes(lowercaseQuery))) ||
        (card.booster_id && card.booster_id.toLowerCase().includes(lowercaseQuery))
      );
    }

    // Filtre par rareté, favoris ou booster
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'favorites') {
        const favoriteCardIds = userCards
          .filter(uc => uc.is_favorite)
          .map(uc => uc.card_id);
        filtered = filtered.filter(card => favoriteCardIds.includes(card.id));
      } else if (['common', 'uncommon', 'rare', 'leader', 'super_rare', 'secret_rare'].includes(selectedFilter)) {
        filtered = filtered.filter(card => card.rarity === selectedFilter);
      } else {
        // Filtre par booster
        filtered = filtered.filter(card => card.booster_id === selectedFilter);
      }
    }

    // Trier : cartes possédées en premier, puis par rareté
    return filtered.sort((a, b) => {
      const userCardA = userCards.find(uc => uc.card_id === a.id);
      const userCardB = userCards.find(uc => uc.card_id === b.id);

      const isOwnedA = !!userCardA;
      const isOwnedB = !!userCardB;

      // En mode vente, afficher d'abord les cartes vendables (quantité > 1)
      if (sellMode && isOwnedA && isOwnedB) {
        const canSellA = userCardA.quantity > 1;
        const canSellB = userCardB.quantity > 1;

        // Les cartes vendables viennent en premier
        if (canSellA && !canSellB) return -1;
        if (!canSellA && canSellB) return 1;
        // Si les deux sont vendables ou les deux ne sont pas vendables, continuer au tri suivant
      }

      // Les cartes possédées viennent en premier (sauf si on est en mode vente et qu'on a déjà trié)
      if (isOwnedA && !isOwnedB) return -1;
      if (!isOwnedA && isOwnedB) return 1;

      // Ensuite trier par rareté (du plus rare au plus commun)
      // Leader est plus rare que Rare mais moins rare que SuperRare
      const rarityOrder = ['secret_rare', 'super_rare', 'leader', 'rare', 'uncommon', 'common'];
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
    });
  }, [allCards, userCards, searchQuery, selectedFilter, sellMode]);

  // Reset displayedCards when filters change
  useEffect(() => {
    // Sauvegarder la position actuelle avant de reset
    const currentScroll = window.scrollY;
    setDisplayedCards(CARDS_PER_PAGE);

    // Scroller en haut quand on change de filtre
    if (currentScroll < 100) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery, selectedFilter]);

  // Gérer le changement de mode vente
  useEffect(() => {
    // Détecter si le mode vente vient de changer
    const sellModeChanged = previousSellMode.current !== sellMode;

    if (sellModeChanged) {
      previousSellMode.current = sellMode;

      // Si on active le mode vente, compter les cartes vendables et les afficher toutes
      if (sellMode) {
        const sellableCount = filteredCards.filter(card => {
          const userCard = userCards.find(uc => uc.card_id === card.id);
          return userCard && userCard.quantity > 1;
        }).length;

        // Afficher au minimum toutes les cartes vendables + une page normale
        const minCardsToShow = Math.max(sellableCount + CARDS_PER_PAGE, CARDS_PER_PAGE);
        setDisplayedCards(minCardsToShow);
      } else {
        // Retour au mode normal
        setDisplayedCards(CARDS_PER_PAGE);
      }

      // Scroller en haut
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellMode]);

  // Infinite scroll observer simplifié et optimisé
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Ne charger que si on scroll vers le bas et qu'on n'est pas déjà en train de charger
        if (entries[0].isIntersecting &&
            !isLoadingMoreRef.current &&
            displayedCards < filteredCards.length) {

          isLoadingMoreRef.current = true;

          // Attendre que le scroll se stabilise
          setTimeout(() => {
            setDisplayedCards(prev => Math.min(prev + CARDS_PER_PAGE, filteredCards.length));

            // Réinitialiser le flag après un délai plus long
            setTimeout(() => {
              isLoadingMoreRef.current = false;
            }, 1000);
          }, 200);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget && displayedCards < filteredCards.length) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [displayedCards, filteredCards.length]);

  const visibleCards = useMemo(() => {
    return filteredCards.slice(0, displayedCards);
  }, [filteredCards, displayedCards]);

  const toggleFavorite = useCallback(async (cardId: string) => {
    try {
      await GameService.toggleFavorite(cardId);
      const updatedCards = await GameService.getUserCards();
      setUserCards(updatedCards);
    } catch (error) {
      console.error('Erreur lors du basculement favori:', error);
    }
  }, []);

  const handleCardClick = useCallback((card: CardType) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCard(null);
  }, []);

  const openSellDialog = useCallback((card: CardType, maxQuantity: number) => {
    setCardToSell({ card, maxQuantity });
    setSellQuantity(1);
    setShowSellDialog(true);
  }, []);

  const closeSellDialog = useCallback(() => {
    setShowSellDialog(false);
    setCardToSell(null);
    setSellQuantity(1);
  }, []);

  const handleSellCard = useCallback(async () => {
    if (!cardToSell) return;

    try {
      const result = await GameService.sellCard(cardToSell.card.id, sellQuantity);
      setBerrysBalance(result.new_balance);

      // Recharger les cartes de l'utilisateur
      const updatedCards = await GameService.getUserCards();
      setUserCards(updatedCards);

      // Afficher un message de succès
      const totalEarned = result.berrys_earned;
      toast.success(`${sellQuantity}x ${cardToSell.card.name} vendues pour ${totalEarned} Berrys !`);

      closeSellDialog();
    } catch (error: any) {
      console.error('Erreur lors de la vente de la carte:', error);
      toast.error(error.message || 'Impossible de vendre cette carte');
    }
  }, [cardToSell, sellQuantity, toast, closeSellDialog]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setShowFilters(false);
  };

  const filterOptions: { value: FilterType; label: string; count: number; category?: string }[] = [
    { value: 'all', label: 'Toutes', count: allCards.length, category: 'général' },
    { value: 'favorites', label: 'Favoris', count: userCards.filter(uc => uc.is_favorite).length, category: 'général' },
    // Raretés (du plus rare au plus commun, cohérent avec l'ordre de tri)
    // Leader est plus rare que Rare mais moins rare que SuperRare
    { value: 'secret_rare', label: RARITY_LABELS.secret_rare, count: stats?.rarity_breakdown?.secret_rare || 0, category: 'rareté' },
    { value: 'super_rare', label: RARITY_LABELS.super_rare, count: stats?.rarity_breakdown?.super_rare || 0, category: 'rareté' },
    { value: 'leader', label: RARITY_LABELS.leader, count: stats?.rarity_breakdown?.leader || 0, category: 'rareté' },
    { value: 'rare', label: RARITY_LABELS.rare, count: stats?.rarity_breakdown?.rare || 0, category: 'rareté' },
    { value: 'uncommon', label: RARITY_LABELS.uncommon, count: stats?.rarity_breakdown?.uncommon || 0, category: 'rareté' },
    { value: 'common', label: RARITY_LABELS.common, count: stats?.rarity_breakdown?.common || 0, category: 'rareté' },
    // Boosters (ajoutés dynamiquement)
    ...availableBoosters.map(booster => ({
      value: booster.id,
      label: booster.name,
      count: stats?.booster_breakdown?.[booster.id] || 0,
      category: 'booster'
    }))
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <Link
          to="/"
          className="flex items-center space-x-2 text-blue-300 hover:text-white transition-colors text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          <span>Retour à l'accueil</span>
        </Link>

        <div className="text-left sm:text-right w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Ma Collection</h1>
          <p className="text-blue-200 text-sm sm:text-base">
            {stats ? `${stats.unique_cards}/${allCards.length} cartes (${stats.collection_completion}%)` : 'Chargement...'}
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border-2 border-white/10 shadow-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stats?.total_cards || 0}</div>
            <div className="text-blue-200 text-xs sm:text-sm">Cartes totales</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stats?.unique_cards || 0}</div>
            <div className="text-blue-200 text-xs sm:text-sm">Cartes uniques</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stats?.collection_completion || 0}%</div>
            <div className="text-blue-200 text-xs sm:text-sm">Collection</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stats?.missing_cards || 0}</div>
            <div className="text-blue-200 text-xs sm:text-sm">Manquantes</div>
          </div>
          <div className="col-span-2 sm:col-span-1 sm:border-l border-blue-600/30 sm:pl-4">
            <div className="text-xl sm:text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
              <Coins size={18} />
              {berrysBalance}
            </div>
            <div className="text-blue-200 text-xs sm:text-sm">Berrys</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 sm:py-3 text-sm sm:text-base bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-400/40 transition-all"
          />
        </div>

        <button
          onClick={() => setSellMode(!sellMode)}
          className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 rounded-xl transition-all duration-300 backdrop-blur-xl font-semibold shadow-lg ${
            sellMode
              ? 'bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-yellow-500/30 border-yellow-400/30'
              : 'bg-white/5 text-white hover:bg-white/10 border-white/10 hover:border-white/20'
          }`}
        >
          <Coins size={18} />
          <span className="whitespace-nowrap">{sellMode ? 'Annuler' : 'Vendre'}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-full sm:w-auto items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-xl text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 font-semibold shadow-lg"
          >
            <Filter size={18} />
            <span>Filtres</span>
            {(selectedFilter !== 'all' || searchQuery) && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {showFilters && (
            <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto bg-slate-900/95 backdrop-blur-2xl border-2 border-white/10 rounded-2xl shadow-2xl z-10 w-64 sm:min-w-64 max-h-96 overflow-y-auto">
              <div className="p-4 space-y-3">
                {/* Filtres généraux */}
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">Général</div>
                  {filterOptions.filter(opt => opt.category === 'général').map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedFilter(option.value);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-300 flex justify-between items-center font-medium ${
                        selectedFilter === option.value
                          ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className="text-xs opacity-75">{option.count}</span>
                    </button>
                  ))}
                </div>

                {/* Filtres par rareté */}
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">Rareté</div>
                  {filterOptions.filter(opt => opt.category === 'rareté').map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedFilter(option.value);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-300 flex justify-between items-center font-medium ${
                        selectedFilter === option.value
                          ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className="text-xs opacity-75">{option.count}</span>
                    </button>
                  ))}
                </div>

                {/* Filtres par booster */}
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">Boosters</div>
                  {filterOptions.filter(opt => opt.category === 'booster').map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedFilter(option.value);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-300 flex justify-between items-center font-medium ${
                        selectedFilter === option.value
                          ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{option.label}</span>
                      <span className="text-xs opacity-75">{option.count}</span>
                    </button>
                  ))}
                </div>

                {(selectedFilter !== 'all' || searchQuery) && (
                  <div className="pt-2 border-t border-blue-600">
                    <button
                      onClick={clearFilters}
                      className="w-full text-left px-3 py-2 rounded text-red-300 hover:bg-red-600 hover:text-white transition-colors flex items-center space-x-2"
                    >
                      <X size={16} />
                      <span>Effacer filtres</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Aucune carte trouvée</h3>
          <p className="text-blue-200 text-sm sm:text-base">
            {searchQuery || selectedFilter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche.'
              : 'Commencez à ouvrir des boosters pour construire votre collection !'}
          </p>
          {(searchQuery || selectedFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="mt-4 py-2 px-4 sm:py-3 sm:px-6 text-sm sm:text-base rounded-lg font-bold btn-primary"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1">
            <div className="text-blue-200 text-xs sm:text-sm">
              {filteredCards.length} carte(s)
            </div>

            {(searchQuery || selectedFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 sm:space-x-2 text-blue-300 hover:text-white transition-colors text-xs sm:text-sm"
              >
                <X size={14} />
                <span>Effacer filtres</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {visibleCards.map((card) => {
              const userCard = userCards.find(uc => uc.card_id === card.id);
              const isOwned = !!userCard;
              const canSell = isOwned && userCard.quantity > 1;
              const sellPrice = CARD_SELL_PRICES[card.rarity];

              return (
                <div
                  key={card.id}
                  className={`relative transition-all duration-300 ${!isOwned ? 'opacity-40 grayscale md:hover:opacity-60' : ''}`}
                >
                  {isOwned ? (
                    <>
                      <Card
                        card={card}
                        quantity={userCard.quantity}
                        isFavorite={userCard.is_favorite}
                        onToggleFavorite={() => toggleFavorite(card.id)}
                        onCardClick={handleCardClick}
                        className="max-w-xs mx-auto hover:shadow-2xl"
                        showStats={true}
                      />
                      {sellMode && canSell && (
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-11/12">
                          <button
                            onClick={() => openSellDialog(card, userCard.quantity - 1)}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-3 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Coins size={16} />
                            <span>Vendre ({sellPrice} Berrys)</span>
                          </button>
                        </div>
                      )}
                      {sellMode && !canSell && userCard.quantity === 1 && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <div className="text-center text-white p-2 sm:p-4">
                            <div className="text-xl sm:text-2xl mb-1 sm:mb-2">⚠️</div>
                            <div className="font-bold text-xs sm:text-sm">Dernière carte</div>
                            <div className="text-xs text-gray-300 hidden sm:block">Gardez au moins 1 exemplaire</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="relative max-w-xs mx-auto">
                      <Card
                        card={card}
                        onCardClick={handleCardClick}
                        showStats={true}
                        className="hover:shadow-2xl"
                      />
                      <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <div className="text-center text-white p-2 sm:p-4">
                          <div className="text-3xl sm:text-5xl mb-2 sm:mb-3">🔒</div>
                          <div className="font-bold text-sm sm:text-lg mb-1">Non obtenue</div>
                          <div className="text-xs sm:text-sm text-gray-300 hidden sm:block">Ouvrez des boosters</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Infinite scroll trigger */}
          {displayedCards < filteredCards.length && (
            <div ref={observerTarget} className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-blue-300 mt-2">Chargement...</p>
            </div>
          )}
        </>
      )}

      {userCards.some(uc => uc.is_favorite) && selectedFilter !== 'favorites' && (
        <div className="text-center">
          <button
            onClick={() => setSelectedFilter('favorites')}
            className="flex items-center space-x-2 mx-auto text-yellow-300 hover:text-yellow-100 transition-colors text-sm sm:text-base"
          >
            <Star size={14} />
            <span>Voir mes favoris</span>
          </button>
        </div>
      )}

      {isModalOpen && selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}

      {/* Dialog de vente par lot */}
      {showSellDialog && cardToSell && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border-2 border-yellow-500/30">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Coins className="text-yellow-400" />
              Vendre {cardToSell.card.name}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Prix unitaire</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {CARD_SELL_PRICES[cardToSell.card.rarity]} Berrys
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantité à vendre (max: {cardToSell.maxQuantity})
                </label>
                <input
                  type="number"
                  min="1"
                  max={cardToSell.maxQuantity}
                  value={sellQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setSellQuantity(Math.min(Math.max(1, value), cardToSell.maxQuantity));
                  }}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />

                {/* Boutons rapides */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSellQuantity(1)}
                    className="flex-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    1
                  </button>
                  {cardToSell.maxQuantity >= 5 && (
                    <button
                      onClick={() => setSellQuantity(Math.min(5, cardToSell.maxQuantity))}
                      className="flex-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      5
                    </button>
                  )}
                  {cardToSell.maxQuantity >= 10 && (
                    <button
                      onClick={() => setSellQuantity(Math.min(10, cardToSell.maxQuantity))}
                      className="flex-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      10
                    </button>
                  )}
                  <button
                    onClick={() => setSellQuantity(cardToSell.maxQuantity)}
                    className="flex-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-4">
                <div className="text-sm text-green-300 mb-1">Total à recevoir</div>
                <div className="text-3xl font-bold text-green-400">
                  {CARD_SELL_PRICES[cardToSell.card.rarity] * sellQuantity} Berrys
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeSellDialog}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSellCard}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-lg font-bold transition-all shadow-lg"
              >
                Vendre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collection;