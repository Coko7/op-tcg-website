import React, { useState, useEffect } from 'react';
import { Coins, Star, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GameService } from '../services/gameService';
import { UserCard } from '../types';

const UserProfile: React.FC = () => {
  const { user, logout, stats } = useAuth();
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [favoriteCard, setFavoriteCard] = useState<UserCard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showCardSelector) {
      loadUserCards();
    }
  }, [showCardSelector]);

  const loadUserCards = async () => {
    try {
      setLoading(true);
      const cards = await GameService.getUserCards();
      setUserCards(cards);

      // Trouver la carte favorite actuelle
      const favoriteCardId = (user as any).favorite_card_id;
      if (favoriteCardId) {
        const favorite = cards.find((c: UserCard) => c.card_id === favoriteCardId);
        if (favorite) {
          setFavoriteCard(favorite);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des cartes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetFavoriteCard = async (cardId: string | null) => {
    try {
      setLoading(true);
      await GameService.setProfileFavoriteCard(cardId);

      // Mettre à jour l'affichage
      if (cardId) {
        const card = userCards.find(c => c.card_id === cardId);
        setFavoriteCard(card || null);
      } else {
        setFavoriteCard(null);
      }

      setShowCardSelector(false);

      // Recharger les infos utilisateur si possible
      // Le contexte devra être rechargé pour afficher la bonne carte
    } catch (error) {
      console.error('Erreur lors de la définition de la carte favorite:', error);
      alert('Erreur lors de la définition de la carte favorite');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="bg-slate-800/95 backdrop-blur-lg rounded-lg border border-white/30 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{user.username}</h3>
            {user.is_admin ? (
              <span className="inline-block bg-yellow-500 text-black text-xs px-2 py-1 rounded mt-1">
                Admin
              </span>
            ) : null}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-colors"
        >
          Déconnexion
        </button>
      </div>

      {stats && (
        <div className="border-t border-white/20 pt-4">
          <h4 className="text-white font-medium mb-2">Statistiques</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-300">Cartes uniques</p>
              <p className="text-white font-semibold">{stats.unique_cards || 0}</p>
            </div>
            <div>
              <p className="text-gray-300">Total cartes</p>
              <p className="text-white font-semibold">{stats.total_cards || 0}</p>
            </div>
            <div>
              <p className="text-gray-300">Boosters ouverts</p>
              <p className="text-white font-semibold">{stats.total_openings || 0}</p>
            </div>
            <div>
              <p className="text-gray-300">Aujourd'hui</p>
              <p className="text-white font-semibold">{stats.today_openings || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between bg-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-400" size={24} />
                <span className="text-white font-medium">Berrys</span>
              </div>
              <div className="text-yellow-400 font-bold text-xl">{user.berrys || 0}</div>
            </div>
          </div>

          {/* Carte favorite de profil */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Star size={18} className="text-yellow-400" />
                Carte de profil
              </h4>
              <button
                onClick={() => setShowCardSelector(!showCardSelector)}
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors"
              >
                {favoriteCard ? 'Changer' : 'Choisir'}
              </button>
            </div>

            {favoriteCard ? (
              <div className="bg-slate-700/50 rounded-lg p-2 flex items-center gap-3">
                {(favoriteCard as any).image_url && (
                  <img
                    src={(favoriteCard as any).image_url || (favoriteCard as any).fallback_image_url}
                    alt={(favoriteCard as any).name}
                    className="w-12 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{(favoriteCard as any).name}</p>
                  <p className="text-gray-400 text-xs">{(favoriteCard as any).rarity}</p>
                </div>
                <button
                  onClick={() => handleSetFavoriteCard(null)}
                  className="text-red-400 hover:text-red-300"
                  title="Retirer"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Aucune carte sélectionnée</p>
            )}
          </div>
        </div>
      )}

      {/* Modal de sélection de carte */}
      {showCardSelector && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Choisir une carte de profil</h3>
              <button
                onClick={() => setShowCardSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-400 mt-2">Chargement...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {userCards.map((card: any) => (
                  <button
                    key={card.card_id}
                    onClick={() => handleSetFavoriteCard(card.card_id)}
                    className="relative group hover:scale-105 transition-transform"
                  >
                    <img
                      src={card.image_url || card.fallback_image_url}
                      alt={card.name}
                      className="w-full rounded-lg shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">Sélectionner</span>
                    </div>
                    {favoriteCard?.card_id === card.card_id && (
                      <div className="absolute top-1 right-1 bg-yellow-500 rounded-full p-1">
                        <Star size={14} className="text-white fill-current" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;