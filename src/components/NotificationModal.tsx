import React, { useState } from 'react';
import { X, Gift, Coins, Zap, Clock, CheckCircle } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import Dialog from './ui/Dialog';

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
  const { dialogState, showAlert, handleClose, handleConfirm } = useDialog();
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const handleClaim = async (notification: Notification) => {
    try {
      setClaiming(notification.id);
      const result = await onClaimReward(notification.id);

      if (result) {
        setClaimedIds(prev => new Set(prev).add(notification.id));

        // Afficher un message de succès
        const rewardText = `${result.berrys_earned > 0 ? `+ ${result.berrys_earned} Berrys\n` : ''}${result.boosters_earned > 0 ? `+ ${result.boosters_earned} Booster(s)\n` : ''}Nouveau solde: ${result.new_balance} Berrys`;
        await showAlert('Récompense réclamée !', rewardText, 'success');

        // Rafraîchir les notifications
        setTimeout(() => {
          onRefresh();
        }, 500);
      }
    } catch (error: any) {
      console.error('Erreur lors de la réclamation:', error);
      await showAlert('Erreur', error.message || 'Erreur lors de la réclamation de la récompense', 'error');
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

      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border-2 border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-3">
            <Gift className="text-treasure-400" size={24} />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4 opacity-50" />
              <p className="text-slate-300 text-base sm:text-lg">Aucune notification pour le moment</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">Les nouvelles notifications apparaîtront ici</p>
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
                    className={`bg-white/5 backdrop-blur-xl rounded-2xl p-4 border-2 transition-all duration-300 shadow-lg ${
                      expired ? 'border-slate-600/30 opacity-60' : 'border-white/10 hover:border-white/20'
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
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {notification.reward_berrys > 0 && (
                          <div className="flex items-center gap-2 bg-treasure-500/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-treasure-400/30">
                            <Coins className="text-treasure-300" size={16} />
                            <span className="text-treasure-200 font-bold text-sm">
                              +{notification.reward_berrys} ฿
                            </span>
                          </div>
                        )}
                        {notification.reward_boosters > 0 && (
                          <div className="flex items-center gap-2 bg-ocean-500/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-ocean-400/30">
                            <Zap className="text-ocean-300" size={16} />
                            <span className="text-ocean-200 font-bold text-sm">
                              +{notification.reward_boosters} Booster(s)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={12} />
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
                          className="px-3 sm:px-4 py-2 bg-gradient-to-r from-treasure-500/90 to-treasure-600/90 hover:from-treasure-600 hover:to-treasure-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-treasure-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm border border-treasure-400/30 backdrop-blur-xl"
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
                        <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold">
                          <CheckCircle size={14} />
                          <span>Réclamé</span>
                        </div>
                      )}

                      {expired && !isClaimed && (
                        <div className="text-red-400 text-xs sm:text-sm font-bold">
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
        <div className="p-4 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-ocean-500/40 border border-ocean-400/30 backdrop-blur-xl"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default NotificationModal;
