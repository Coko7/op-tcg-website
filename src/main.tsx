import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Variable pour éviter les rechargements multiples
let isUpdating = false;

// Register service worker for PWA with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Éviter les mises à jour multiples simultanées
    if (isUpdating) {
      console.log('⏭️ Mise à jour déjà en cours, ignorée')
      return;
    }

    isUpdating = true;
    console.log('🔄 Nouvelle version détectée, application de la mise à jour...')

    // Afficher une notification temporaire
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-slide-in-right';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <span class="font-medium">Mise à jour en cours...</span>
      </div>
    `;
    document.body.appendChild(notification);

    // Attendre un court instant pour que la notification soit visible
    setTimeout(() => {
      updateSW(true);
    }, 500);
  },
  onOfflineReady() {
    console.log('✅ L\'application est prête à fonctionner hors ligne')
  },
  onRegistered(registration) {
    console.log('✅ Service Worker enregistré')
    // Vérifier les mises à jour toutes les heures
    if (registration) {
      setInterval(() => {
        console.log('🔍 Vérification des mises à jour...')
        registration.update()
      }, 60 * 60 * 1000) // 1 heure
    }
  },
  immediate: true
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)