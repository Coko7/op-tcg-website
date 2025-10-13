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

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-yellow-500 relative animate-bounce-slow">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {!claimed ? (
            <>
              <div className="mb-4 flex justify-center">
                <Gem className="w-24 h-24 text-yellow-600 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Récompense Quotidienne
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Réclamez vos <span className="font-bold text-yellow-700">10 Berrys</span> gratuits !
              </p>
              <p className="text-sm text-gray-600 mb-8">
                Connectez-vous chaque jour pour recevoir votre récompense quotidienne.
              </p>

              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
              >
                {claiming ? 'Réclamation...' : 'Réclamer 10 Berrys'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <Coins className="w-24 h-24 text-yellow-600 animate-spin-slow" />
              </div>
              <h2 className="text-3xl font-bold text-green-700 mb-4">
                Félicitations !
              </h2>
              <p className="text-xl text-gray-800 mb-4">
                Vous avez gagné <span className="font-bold text-yellow-700">{berrysEarned} Berrys</span> !
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Nouveau solde : <span className="font-bold text-yellow-700">{newBalance} Berrys</span>
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-white bg-opacity-50 rounded-lg p-3">
                <Gem className="w-5 h-5" />
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
