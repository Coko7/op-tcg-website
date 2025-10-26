import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Lock, Save, Eye, EyeOff, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GameService } from '../services/gameService';
import { UserCard } from '../types';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';

const ProfileSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Changement de mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    loadUserCards();
  }, []);

  const loadUserCards = async () => {
    try {
      setLoading(true);
      const cards = await GameService.getUserCards();
      setUserCards(cards);
    } catch (error) {
      console.error('Erreur lors du chargement des cartes:', error);
      toast.error('Erreur lors du chargement de vos cartes');
    } finally {
      setLoading(false);
    }
  };

  const handleSetFavoriteCard = async (cardId: string | null) => {
    try {
      setSaving(true);
      await GameService.setProfileFavoriteCard(cardId);
      // Rafraîchir les données utilisateur pour mettre à jour le contexte et la carte favorite
      await refreshUser();
      toast.success(cardId ? 'Carte de profil mise à jour !' : 'Carte de profil retirée');
    } catch (error) {
      console.error('Erreur lors de la définition de la carte favorite:', error);
      toast.error('Erreur lors de la mise à jour de votre carte de profil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.warning('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.warning('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setSaving(true);
      // Appel API pour changer le mot de passe
      await apiService.changePassword(passwordData.currentPassword, passwordData.newPassword);

      toast.success('Mot de passe modifié avec succès !');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  // Filtrer les cartes selon la recherche
  const filteredCards = userCards.filter((card: any) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      card.name?.toLowerCase().includes(query) ||
      card.character?.toLowerCase().includes(query)
    );
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center space-x-2 text-blue-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour à l'accueil</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Paramètres du profil</h1>
          <div className="w-32"></div> {/* Spacer pour centrer le titre */}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Section Carte de profil */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Star className="text-yellow-400" size={24} />
              <h2 className="text-xl font-bold text-white">Carte de profil</h2>
            </div>

            {/* Carte actuelle */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3">Carte actuellement sélectionnée :</p>
              {user?.favorite_card ? (
                <div className="bg-slate-700/50 rounded-lg p-4 flex flex-col items-center">
                  <img
                    src={user.favorite_card.image_url}
                    alt={user.favorite_card.name}
                    className="w-48 h-auto rounded-lg shadow-2xl mb-3"
                  />
                  <p className="text-white font-semibold text-lg">{user.favorite_card.name}</p>
                  <p className="text-gray-400 text-sm mb-3">{user.favorite_card.rarity}</p>
                  <button
                    onClick={() => handleSetFavoriteCard(null)}
                    disabled={saving}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors disabled:opacity-50"
                  >
                    Retirer cette carte
                  </button>
                </div>
              ) : (
                <div className="bg-slate-700/50 rounded-lg p-8 text-center">
                  <p className="text-gray-400">Aucune carte sélectionnée</p>
                </div>
              )}
            </div>

            {/* Grille de sélection */}
            <div>
              <p className="text-gray-400 text-sm mb-3">Choisir une nouvelle carte :</p>

              {/* Champ de recherche */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom ou personnage..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                {searchQuery && (
                  <p className="text-gray-400 text-xs mt-2">
                    {filteredCards.length} carte{filteredCards.length !== 1 ? 's' : ''} trouvée{filteredCards.length !== 1 ? 's' : ''} sur {userCards.length}
                  </p>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 mt-2">Chargement...</p>
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="bg-slate-900/50 rounded-lg p-8 text-center">
                  <p className="text-gray-400">Aucune carte trouvée</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
                    >
                      Effacer la recherche
                    </button>
                  )}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto bg-slate-900/50 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-3">
                    {filteredCards.map((card: any) => (
                      <button
                        key={card.card_id}
                        onClick={() => handleSetFavoriteCard(card.card_id)}
                        disabled={saving}
                        className={`relative group hover:scale-105 transition-transform disabled:opacity-50 ${
                          user?.favorite_card_id === card.card_id ? 'ring-2 ring-yellow-400' : ''
                        }`}
                      >
                        <img
                          src={card.image_url || card.fallback_image_url}
                          alt={card.name}
                          className="w-full rounded-lg shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xs text-center px-2">
                            Sélectionner
                          </span>
                        </div>
                        {user?.favorite_card_id === card.card_id && (
                          <div className="absolute top-1 right-1 bg-yellow-500 rounded-full p-1">
                            <Star size={12} className="text-white fill-current" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Sécurité */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="text-blue-400" size={24} />
              <h2 className="text-xl font-bold text-white">Sécurité</h2>
            </div>

            {!showPasswordForm ? (
              <div>
                <p className="text-gray-400 mb-4">
                  Modifiez votre mot de passe pour sécuriser votre compte.
                </p>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full py-3 bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-ocean-500/40 hover:scale-105 border border-ocean-400/30 backdrop-blur-xl"
                >
                  <Lock size={18} />
                  Changer mon mot de passe
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Mot de passe actuel */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Minimum 6 caractères</p>
                </div>

                {/* Confirmer mot de passe */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-xl"
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-ocean-500/40 hover:scale-105 border border-ocean-400/30 backdrop-blur-xl"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Enregistrer
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
