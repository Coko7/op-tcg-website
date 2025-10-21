import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import Button from './ui/Button';

/**
 * Composant pour notifier l'utilisateur des mises à jour PWA disponibles
 * et permettre de les installer automatiquement
 */
const PWAUpdateNotification: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Vérifier si le navigateur supporte les Service Workers
    if ('serviceWorker' in navigator) {
      // Enregistrer le service worker
      registerServiceWorker();

      // Vérifier les mises à jour toutes les heures
      const updateCheckInterval = setInterval(() => {
        checkForUpdates();
      }, 60 * 60 * 1000); // 1 heure

      return () => clearInterval(updateCheckInterval);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);

      // Vérifier immédiatement s'il y a une mise à jour
      registration.update();

      // Écouter les changements d'état du service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Une nouvelle version est disponible
              console.log('[PWA] Nouvelle version disponible !');
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        }
      });

      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('[PWA] Mise à jour détectée:', event.data.version);
        }
      });

      // Si un worker est en attente, afficher la notification
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdatePrompt(true);
      }

    } catch (error) {
      console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
    }
  };

  const checkForUpdates = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('[PWA] Vérification des mises à jour effectuée');
      }
    } catch (error) {
      console.error('[PWA] Erreur lors de la vérification des mises à jour:', error);
    }
  };

  const handleUpdate = () => {
    if (waitingWorker) {
      setIsUpdating(true);

      // Fonction de rechargement à appeler une seule fois
      const reloadPage = () => {
        console.log('[PWA] Nouvelle version activée, rechargement...');
        window.location.reload();
      };

      // Écouter le contrôle par le nouveau service worker (une seule fois)
      navigator.serviceWorker.addEventListener('controllerchange', reloadPage, { once: true });

      // Envoyer un message au service worker pour qu'il s'active
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    // L'utilisateur pourra toujours mettre à jour en rechargeant la page
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="backdrop-blur-xl bg-gradient-to-br from-ocean-500/90 to-ocean-600/90 border border-ocean-400/30 rounded-2xl shadow-2xl p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Mise à jour disponible</h3>
              <p className="text-white/80 text-xs mt-0.5">
                Une nouvelle version de l'application est prête
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors"
            disabled={isUpdating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleUpdate}
            variant="primary"
            className="flex-1 text-sm"
            isLoading={isUpdating}
            disabled={isUpdating}
          >
            {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="text-sm"
            disabled={isUpdating}
          >
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;
