import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

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
  name: string;
  character: string;
  rarity: string;
  quantity: number;
  image_url?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Marketplace: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

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
      const response = await fetch(`${API_URL}/marketplace/listings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setListings(data.data);
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
      const response = await fetch(`${API_URL}/marketplace/my-listings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMyListings(data.data);
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
      const response = await fetch(`${API_URL}/users/collection`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Filtrer uniquement les cartes avec quantity >= 2
        const sellableCards = data.data
          .filter((card: any) => card.quantity >= 2)
          .map((card: any) => ({
            card_id: card.card_id || card.id,
            name: card.name,
            character: card.character,
            rarity: card.rarity,
            quantity: card.quantity,
            image_url: card.image_url || card.fallback_image_url
          }));
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
      const response = await fetch(`${API_URL}/users/berrys`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setBerrysBalance(data.data.berrys);
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

    if (!confirm('Confirmer l\'achat de cette carte ?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/marketplace/listings/${listingId}/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({})
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('success', `Carte achetée avec succès! Nouveau solde: ${data.data.new_balance} ฿`);
        setBerrysBalance(data.data.new_balance);
        loadListings();
        refreshUser();
      } else {
        showToast('error', data.error || 'Erreur lors de l\'achat');
      }
    } catch (error: any) {
      console.error('Erreur achat:', error);
      showToast('error', error.message || 'Erreur lors de l\'achat');
    } finally {
      setLoading(false);
    }
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
      const response = await fetch(
        `${API_URL}/marketplace/listings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            cardId: selectedCard,
            price: sellPrice
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('success', 'Annonce créée avec succès!');
        setSelectedCard('');
        setSellPrice(10);
        setActiveTab('myListings');
        loadMyListings();
      } else {
        showToast('error', data.error || 'Erreur lors de la création de l\'annonce');
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
    if (!confirm('Confirmer l\'annulation de cette annonce ?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/marketplace/listings/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('success', 'Annonce annulée avec succès');
        loadMyListings();
      } else {
        showToast('error', data.error || 'Erreur lors de l\'annulation');
      }
    } catch (error: any) {
      console.error('Erreur annulation:', error);
      showToast('error', error.message || 'Erreur lors de l\'annulation');
    } finally {
      setLoading(false);
    }
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
            <div className="bg-gray-800 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Créer une annonce</h2>
              <form onSubmit={handleCreateListing} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Sélectionner une carte</label>
                  <select
                    value={selectedCard}
                    onChange={(e) => setSelectedCard(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- Choisir une carte --</option>
                    {myCards.map((card) => (
                      <option key={card.card_id} value={card.card_id}>
                        {card.name} ({card.character}) - Quantité: {card.quantity} - {card.rarity}
                      </option>
                    ))}
                  </select>
                  {myCards.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">
                      Vous n'avez aucune carte vendable (minimum 2 exemplaires requis)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Prix (Berrys)</label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseInt(e.target.value) || 0)}
                    min="1"
                    max="999999"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Entre 1 et 999,999 Berrys</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedCard || myListings.filter(l => l.status === 'active').length >= 3}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                    loading || !selectedCard || myListings.filter(l => l.status === 'active').length >= 3
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {myListings.filter(l => l.status === 'active').length >= 3
                    ? 'Limite de 3 annonces atteinte'
                    : 'Créer l\'annonce'}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myCards.map((card) => (
                <div
                  key={card.card_id}
                  className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700"
                >
                  <img
                    src={card.image_url || '/placeholder-card.png'}
                    alt={card.name}
                    className="w-full h-64 object-contain mb-3 rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-card.png';
                    }}
                  />
                  <h3 className="font-bold text-lg mb-1">{card.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{card.character}</p>
                  <p className={`text-sm font-semibold mb-2 ${getRarityColor(card.rarity)}`}>
                    {card.rarity}
                  </p>
                  <p className="text-xs text-gray-400">Quantité: {card.quantity}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
