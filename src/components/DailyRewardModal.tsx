import { useState, useEffect } from 'react';
import { X, Coins } from 'lucide-react';
import { Gem } from 'lucide-react';
import { apiService } from '../services/api';
import { useDialog } from '../hooks/useDialog';
import Dialog from './ui/Dialog';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
}

export default function DailyRewardModal({ isOpen, onClose, onClaim }: DailyRewardModalProps) {
  const { dialogState, showAlert, handleClose, handleConfirm } = useDialog();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [berrysEarned, setBerrysEarned] = useState(0);
  const [newBalance, setNewBalance] = useState(0);

  // Réinitialiser l'état quand le modal s'ouvre/ferme
  useEffect(() => {
    if (!isOpen) {
      // Reset l'état quand le modal se ferme
      setClaimed(false);
      setBerrysEarned(0);
      setNewBalance(0);
    }
  }, [isOpen]);

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const response = await apiService.claimDailyReward();

      if (response.success) {
        setBerrysEarned(response.data.berrys_earned);
        setNewBalance(response.data.new_balance);
        setClaimed(true);
        onClaim();

        // Fermer automatiquement après 3 secondes
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erreur lors de la réclamation de la récompense quotidienne:', error);
      await showAlert('Erreur', error.message || 'Erreur lors de la réclamation de la récompense', 'error');
      // Fermer le modal en cas d'erreur
      onClose();
    } finally {
      setClaiming(false);
    }
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
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-treasure-400/30 relative animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          {!claimed ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="p-6 bg-gradient-to-br from-treasure-500/20 to-treasure-600/20 rounded-2xl border border-treasure-400/30 backdrop-blur-xl">
                  <Gem className="w-20 h-20 text-treasure-300 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Récompense Quotidienne
              </h2>
              <p className="text-lg text-white/80 mb-6">
                Réclamez vos <span className="font-bold text-treasure-300">10 Berrys</span> gratuits !
              </p>
              <p className="text-sm text-white/60 mb-8">
                Connectez-vous chaque jour pour recevoir votre récompense quotidienne.
              </p>

              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full bg-gradient-to-r from-treasure-500/90 to-treasure-600/90 hover:from-treasure-600 hover:to-treasure-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-treasure-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl border border-treasure-400/30 backdrop-blur-xl"
              >
                {claiming ? 'Réclamation...' : 'Réclamer 10 Berrys'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl border border-emerald-400/30 backdrop-blur-xl">
                  <Coins className="w-20 h-20 text-treasure-300" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-emerald-400 mb-4">
                Félicitations !
              </h2>
              <p className="text-xl text-white mb-4">
                Vous avez gagné <span className="font-bold text-treasure-300">{berrysEarned} Berrys</span> !
              </p>
              <p className="text-lg text-white/80 mb-6">
                Nouveau solde : <span className="font-bold text-treasure-300">{newBalance} ฿</span>
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-white/80 bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <Gem className="w-5 h-5 text-treasure-300" />
                <span>Revenez demain pour une nouvelle récompense !</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
