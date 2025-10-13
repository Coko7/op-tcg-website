import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';
import { useDialog } from '../hooks/useDialog';
import { Dialog } from '../components/ui';

interface MarketplaceListing {
  id: string;
  seller_id: string;
  seller_username: string;
  card_id: string;
  card_name: string;
  card_rarity: string;
  card_character: string;
  card_image_url?: string;
  price: number;
  created_at: string;
  status: 'active' | 'sold' | 'cancelled';
}

interface UserCard {
  card_id: string;
  id: string;
  name: string;
  character: string;
  rarity: string;
  quantity: number;
  image_url?: string;
  fallback_image_url?: string;
  type?: string;
  cost?: number;
  power?: number;
}

// API_URL n'est plus nécessaire car on utilise apiService

const Marketplace: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { dialogState, showDialog, hideDialog, handleConfirm, handleClose } = useDialog();

  const [activeTab, setActiveTab] = useState<'browse' | 'myListings' | 'sell'>('browse');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [myCards, setMyCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [berrysBalance, setBerrysBalance] = useState(0);

  // Pour le formulaire de vente
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<number>(10);

  // Charger les annonces actives
  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMarketplaceListings();

      if (response.success) {
        setListings(response.data);
      }
    } catch (error: any) {
      console.error('Erreur chargement annonces:', error);
      showToast('error', error.message || 'Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  // Charger mes annonces
  const loadMyListings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyMarketplaceListings();

      if (response.success) {
        setMyListings(response.data);
      }
    } catch (error: any) {
      console.error('Erreur chargement mes annonces:', error);
      showToast('error', error.message || 'Erreur lors du chargement de vos annonces');
    } finally {
      setLoading(false);
    }
  };

  // Charger ma collection pour vendre
  const loadMyCollection = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserCollection();

      if (response.success) {
        console.log('Collection complète reçue:', response.data.length, 'cartes');
        console.log('Exemple de carte:', response.data[0]);

        // Filtrer uniquement les cartes avec quantity >= 2
        const sellableCards = response.data
          .filter((card: any) => {
            console.log(`Carte ${card.name}: quantity = ${card.quantity}, type = ${typeof card.quantity}`);
            return card.quantity >= 2;
          })
          .map((card: any) => ({
            card_id: card.card_id || card.id,
            id: card.id || card.card_id,
            name: card.name,
            character: card.character,
            rarity: card.rarity,
            quantity: card.quantity,
            image_url: card.image_url,
            fallback_image_url: card.fallback_image_url,
            type: card.type,
            cost: card.cost,
            power: card.power
          }));

        console.log('Cartes vendables après filtre (quantity >= 2):', sellableCards.length);
        setMyCards(sellableCards);
      }
    } catch (error: any) {
      console.error('Erreur chargement collection:', error);
      showToast('error', error.message || 'Erreur lors du chargement de votre collection');
    } finally {
      setLoading(false);
    }
  };

  // Charger le solde de Berrys
  const loadBerrysBalance = async () => {
    try {
      const response = await apiService.getBerrysBalance();

      if (response.success) {
        setBerrysBalance(response.data.berrys);
      }
    } catch (error) {
      console.error('Erreur chargement solde:', error);
    }
  };

  // Acheter une carte
  const handlePurchase = async (listingId: string, price: number) => {
    if (berrysBalance < price) {
      showToast('error', `Berrys insuffisants! Vous avez ${berrysBalance} ฿, mais ${price} ฿ sont nécessaires.`);
      return;
    }

    showDialog({
      title: 'Confirmer l\'achat',
      message: `Êtes-vous sûr de vouloir acheter cette carte pour ${price} ฿ ?`,
      type: 'confirm',
      confirmText: 'Acheter',
      cancelText: 'Annuler',
      showCancel: true,
      onConfirm: async () => {
        hideDialog();
        try {
          setLoading(true);
          const response = await apiService.purchaseMarketplaceListing(listingId);

          if (response.success) {
            showToast('success', `Carte achetée avec succès! Nouveau solde: ${response.data.new_balance} ฿`);
            setBerrysBalance(response.data.new_balance);
            loadListings();
            refreshUser();
          } else {
            showToast('error', response.error || 'Erreur lors de l\'achat');
          }
        } catch (error: any) {
          console.error('Erreur achat:', error);
          showToast('error', error.message || 'Erreur lors de l\'achat');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Créer une annonce
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCard) {
      showToast('error', 'Veuillez sélectionner une carte');
      return;
    }

    if (sellPrice < 1 || sellPrice > 999999) {
      showToast('error', 'Le prix doit être entre 1 et 999999 Berrys');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.createMarketplaceListing(selectedCard, sellPrice);

      if (response.success) {
        showToast('success', 'Annonce créée avec succès!');
        setSelectedCard('');
        setSellPrice(10);
        setActiveTab('myListings');
        loadMyListings();
      } else {
        showToast('error', response.error || 'Erreur lors de la création de l\'annonce');
      }
    } catch (error: any) {
      console.error('Erreur création annonce:', error);
      showToast('error', error.message || 'Erreur lors de la création de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  // Annuler une annonce
  const handleCancelListing = async (listingId: string) => {
    showDialog({
      title: 'Annuler l\'annonce',
      message: 'Êtes-vous sûr de vouloir annuler cette annonce ? La carte sera retournée dans votre collection.',
      type: 'warning',
      confirmText: 'Annuler l\'annonce',
      cancelText: 'Garder l\'annonce',
      showCancel: true,
      onConfirm: async () => {
        hideDialog();
        try {
          setLoading(true);
          const response = await apiService.cancelMarketplaceListing(listingId);

          if (response.success) {
            showToast('success', 'Annonce annulée avec succès');
            loadMyListings();
          } else {
            showToast('error', response.error || 'Erreur lors de l\'annulation');
          }
        } catch (error: any) {
          console.error('Erreur annulation:', error);
          showToast('error', error.message || 'Erreur lors de l\'annulation');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Charger les données selon l'onglet actif
  useEffect(() => {
    loadBerrysBalance();

    if (activeTab === 'browse') {
      loadListings();
    } else if (activeTab === 'myListings') {
      loadMyListings();
    } else if (activeTab === 'sell') {
      loadMyCollection();
    }
  }, [activeTab]);

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      super_rare: 'text-purple-400',
      secret_rare: 'text-yellow-400'
    };
    return colors[rarity] || 'text-white';
  };

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

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Marketplace</h1>
          <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400">Votre solde</p>
              <p className="text-2xl font-bold text-yellow-400">{berrysBalance} ฿</p>
            </div>
            <div className="text-sm text-gray-400">
              <p>• Maximum 3 annonces actives</p>
              <p>• Minimum 2 exemplaires pour vendre</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Parcourir
          </button>
          <button
            onClick={() => setActiveTab('myListings')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'myListings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Mes annonces
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'sell'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Vendre
          </button>
        </div>

        {/* Contenu selon l'onglet */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Chargement...</p>
          </div>
        )}

        {/* Onglet Parcourir */}
        {!loading && activeTab === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg">Aucune carte en vente pour le moment</p>
              </div>
            ) : (
              listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700 hover:border-blue-500 transition-all"
                >
                  <img
                    src={listing.card_image_url || '/placeholder-card.png'}
                    alt={listing.card_name}
                    className="w-full h-64 object-contain mb-3 rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-card.png';
                    }}
                  />
                  <h3 className="font-bold text-lg mb-1">{listing.card_name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{listing.card_character}</p>
                  <p className={`text-sm font-semibold mb-3 ${getRarityColor(listing.card_rarity)}`}>
                    {listing.card_rarity}
                  </p>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-xs text-gray-400 mb-2">Vendeur: {listing.seller_username}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-yellow-400">{listing.price} ฿</span>
                      {listing.seller_id !== user?.id && (
                        <button
                          onClick={() => handlePurchase(listing.id, listing.price)}
                          disabled={loading || berrysBalance < listing.price}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            berrysBalance < listing.price
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          Acheter
                        </button>
                      )}
                      {listing.seller_id === user?.id && (
                        <span className="text-xs text-gray-500 italic">Votre annonce</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Onglet Mes annonces */}
        {!loading && activeTab === 'myListings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myListings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg">Vous n'avez aucune annonce active</p>
              </div>
            ) : (
              myListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700"
                >
                  <img
                    src={listing.card_image_url || '/placeholder-card.png'}
                    alt={listing.card_name}
                    className="w-full h-64 object-contain mb-3 rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-card.png';
                    }}
                  />
                  <h3 className="font-bold text-lg mb-1">{listing.card_name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{listing.card_character}</p>
                  <p className={`text-sm font-semibold mb-3 ${getRarityColor(listing.card_rarity)}`}>
                    {listing.card_rarity}
                  </p>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-yellow-400">{listing.price} ฿</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        listing.status === 'active'
                          ? 'bg-green-600 text-white'
                          : listing.status === 'sold'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {listing.status === 'active' ? 'Active' : listing.status === 'sold' ? 'Vendue' : 'Annulée'}
                      </span>
                    </div>
                    {listing.status === 'active' && (
                      <button
                        onClick={() => handleCancelListing(listing.id)}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                      >
                        Annuler l'annonce
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Onglet Vendre */}
        {!loading && activeTab === 'sell' && (
          <div>
            {/* Formulaire de prix si une carte est sélectionnée */}
            {selectedCard && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6 max-w-2xl mx-auto border-2 border-blue-500">
                <h2 className="text-2xl font-bold mb-4">Créer une annonce</h2>
                <div className="flex items-center gap-4 mb-4">
                  {(() => {
                    const card = myCards.find(c => c.card_id === selectedCard);
                    return card ? (
                      <>
                        <img
                          src={card.image_url || card.fallback_image_url || '/placeholder-card.png'}
                          alt={card.name}
                          className="w-24 h-32 object-contain rounded border border-gray-700"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-card.png';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-xl">{card.name}</h3>
                          <p className="text-gray-400">{card.character}</p>
                          <p className={`text-sm font-semibold ${getRarityColor(card.rarity)}`}>
                            {card.rarity}
                          </p>
                          <p className="text-sm text-gray-400">Quantité possédée: {card.quantity}</p>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
                <form onSubmit={handleCreateListing} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Prix de vente (Berrys)</label>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(parseInt(e.target.value) || 0)}
                      min="1"
                      max="999999"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-lg"
                      required
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1">Entre 1 et 999,999 Berrys</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCard('');
                        setSellPrice(10);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading || myListings.filter(l => l.status === 'active').length >= 3}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                        loading || myListings.filter(l => l.status === 'active').length >= 3
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {myListings.filter(l => l.status === 'active').length >= 3
                        ? 'Limite de 3 annonces atteinte'
                        : 'Mettre en vente'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Instructions si aucune carte sélectionnée */}
            {!selectedCard && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
                <h2 className="text-2xl font-bold mb-2">Vendre une carte</h2>
                <p className="text-gray-400 mb-4">
                  Sélectionnez une carte ci-dessous pour la mettre en vente sur le marketplace
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Minimum 2 exemplaires requis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">ℹ</span>
                    <span>Maximum 3 annonces actives</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grille des cartes vendables */}
            {myCards.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg mb-2">Aucune carte vendable</p>
                <p className="text-sm text-gray-500">
                  Vous devez posséder au moins 2 exemplaires d'une carte pour la vendre
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myCards.map((card) => (
                  <div
                    key={card.card_id}
                    onClick={() => {
                      setSelectedCard(card.card_id);
                      setSellPrice(10);
                    }}
                    className={`bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer hover:scale-105 ${
                      selectedCard === card.card_id
                        ? 'border-blue-500 shadow-lg shadow-blue-500/50'
                        : 'border-gray-700 hover:border-blue-400'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={card.image_url || card.fallback_image_url || '/placeholder-card.png'}
                        alt={card.name}
                        className="w-full h-64 object-contain mb-3 rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-card.png';
                        }}
                      />
                      {selectedCard === card.card_id && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-gray-900/80 text-white px-2 py-1 rounded text-xs font-semibold">
                        x{card.quantity}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1 truncate">{card.name}</h3>
                    <p className="text-sm text-gray-400 mb-2 truncate">{card.character}</p>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${getRarityColor(card.rarity)}`}>
                        {card.rarity}
                      </p>
                      {card.power && (
                        <p className="text-xs text-gray-400">
                          {card.cost && `${card.cost} / `}{card.power}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Marketplace;
