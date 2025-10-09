import React, { useState } from 'react';
import { X, Gift, Coins, Zap, Clock, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  reward_berrys: number;
  reward_boosters: number;
  created_at: string;
  expires_at?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onClaimReward: (notificationId: string) => Promise<any>;
  onRefresh: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClaimReward,
  onRefresh
}) => {
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const handleClaim = async (notification: Notification) => {
    try {
      setClaiming(notification.id);
      const result = await onClaimReward(notification.id);

      if (result) {
        setClaimedIds(prev => new Set(prev).add(notification.id));

        // Afficher un message de succès
        alert(`Récompense réclamée !\n\n${result.berrys_earned > 0 ? `+ ${result.berrys_earned} Berrys\n` : ''}${result.boosters_earned > 0 ? `+ ${result.boosters_earned} Booster(s)\n` : ''}\nNouveau solde: ${result.new_balance} Berrys`);

        // Rafraîchir les notifications
        setTimeout(() => {
          onRefresh();
        }, 500);
      }
    } catch (error: any) {
      console.error('Erreur lors de la réclamation:', error);
      alert(error.message || 'Erreur lors de la réclamation de la récompense');
    } finally {
      setClaiming(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border-2 border-blue-500/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500/30">
          <div className="flex items-center space-x-3">
            <Gift className="text-yellow-300" size={28} />
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-300 text-lg">Aucune notification pour le moment</p>
              <p className="text-gray-400 text-sm mt-2">Les nouvelles notifications apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const isClaimed = claimedIds.has(notification.id);
                const expired = isExpired(notification.expires_at);
                const hasRewards = notification.reward_berrys > 0 || notification.reward_boosters > 0;

                return (
                  <div
                    key={notification.id}
                    className={`bg-blue-800/40 backdrop-blur-sm rounded-lg p-4 border ${
                      expired ? 'border-gray-600/30 opacity-60' : 'border-blue-600/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-blue-200 text-sm mb-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>

                    {/* Rewards */}
                    {hasRewards && (
                      <div className="flex items-center gap-4 mb-3 flex-wrap">
                        {notification.reward_berrys > 0 && (
                          <div className="flex items-center gap-2 bg-yellow-600/20 px-3 py-1.5 rounded-lg">
                            <Coins className="text-yellow-300" size={18} />
                            <span className="text-yellow-200 font-bold">
                              +{notification.reward_berrys} Berrys
                            </span>
                          </div>
                        )}
                        {notification.reward_boosters > 0 && (
                          <div className="flex items-center gap-2 bg-purple-600/20 px-3 py-1.5 rounded-lg">
                            <Zap className="text-purple-300" size={18} />
                            <span className="text-purple-200 font-bold">
                              +{notification.reward_boosters} Booster(s)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-600/20">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={14} />
                        <span>{formatDate(notification.created_at)}</span>
                        {notification.expires_at && (
                          <span className="ml-2">
                            • Expire le {formatDate(notification.expires_at)}
                          </span>
                        )}
                      </div>

                      {hasRewards && !isClaimed && !expired && (
                        <button
                          onClick={() => handleClaim(notification)}
                          disabled={claiming === notification.id}
                          className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {claiming === notification.id ? (
                            'Réclamation...'
                          ) : (
                            <>
                              <Gift className="inline-block mr-1" size={16} />
                              Réclamer
                            </>
                          )}
                        </button>
                      )}

                      {isClaimed && (
                        <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                          <CheckCircle size={16} />
                          <span>Réclamé</span>
                        </div>
                      )}

                      {expired && !isClaimed && (
                        <div className="text-red-400 text-sm font-bold">
                          Expiré
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-500/30 bg-blue-900/50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
