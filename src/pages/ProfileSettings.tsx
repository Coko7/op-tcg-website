import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GameService } from '../services/gameService';
import { UserCard } from '../types';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [favoriteCardId, setFavoriteCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      // Récupérer la carte favorite actuelle
      const favoriteCardId = (user as any)?.favorite_card_id;
      setFavoriteCardId(favoriteCardId || null);
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
      setFavoriteCardId(cardId);
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

  const favoriteCard = userCards.find(c => c.card_id === favoriteCardId);

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
              {favoriteCard ? (
                <div className="bg-slate-700/50 rounded-lg p-4 flex flex-col items-center">
                  <img
                    src={(favoriteCard as any).image_url || (favoriteCard as any).fallback_image_url}
                    alt={(favoriteCard as any).name}
                    className="w-48 h-auto rounded-lg shadow-2xl mb-3"
                  />
                  <p className="text-white font-semibold text-lg">{(favoriteCard as any).name}</p>
                  <p className="text-gray-400 text-sm mb-3">{(favoriteCard as any).rarity}</p>
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
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 mt-2">Chargement...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto bg-slate-900/50 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-3">
                    {userCards.map((card: any) => (
                      <button
                        key={card.card_id}
                        onClick={() => handleSetFavoriteCard(card.card_id)}
                        disabled={saving}
                        className={`relative group hover:scale-105 transition-transform disabled:opacity-50 ${
                          favoriteCardId === card.card_id ? 'ring-2 ring-yellow-400' : ''
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
                        {favoriteCardId === card.card_id && (
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
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
