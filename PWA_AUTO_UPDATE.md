# Mises à jour automatiques PWA - One Piece Booster Game

## Vue d'ensemble

Ce document explique le système de Progressive Web App (PWA) avec mises à jour automatiques implémenté dans l'application.

## Fonctionnalités

### 1. Progressive Web App (PWA)

L'application peut maintenant être installée sur les appareils mobiles et desktop comme une application native.

**Avantages:**
- Installation sur l'écran d'accueil
- Fonctionnement hors ligne (cache intelligent)
- Notifications de mises à jour automatiques
- Expérience utilisateur améliorée
- Pas besoin de télécharger depuis un store

### 2. Service Worker

**Fichier:** `public/service-worker.js`

Le Service Worker gère :
- **Mise en cache** : Stockage des ressources pour utilisation hors ligne
- **Stratégie Network First** : Toujours essayer le réseau d'abord, puis utiliser le cache
- **Mises à jour automatiques** : Détection et installation des nouvelles versions
- **Gestion des API** : Pas de cache pour les requêtes API (toujours à jour)

**Stratégies de cache:**

1. **Ressources statiques** (HTML, CSS, JS, images)
   - Tentative de récupération depuis le réseau
   - Si échec, utilisation du cache
   - Mise à jour du cache si succès

2. **Requêtes API** (`/api/*`)
   - Jamais mis en cache
   - Toujours récupérées depuis le serveur
   - Retourne une erreur si hors ligne

### 3. Manifest PWA

**Fichier:** `public/manifest.json`

Définit les métadonnées de l'application :
- Nom de l'application : "One Piece Booster Game"
- Nom court : "OP Booster"
- Icône : `/icon.svg`
- Couleur du thème : `#0f172a`
- Mode d'affichage : `standalone` (plein écran)

### 4. Notifications de mise à jour

**Composant:** `src/components/PWAUpdateNotification.tsx`

Interface utilisateur pour les mises à jour :
- Notification automatique quand une nouvelle version est disponible
- Bouton "Mettre à jour" pour installer immédiatement
- Bouton "Plus tard" pour reporter
- Animation et design cohérent avec l'application
- Rechargement automatique après l'installation

## Comment utiliser

### Pour les utilisateurs

#### Installation de la PWA

**Sur mobile (iOS/Android):**
1. Ouvrir l'application dans Safari (iOS) ou Chrome (Android)
2. Appuyer sur le bouton "Partager" / menu
3. Sélectionner "Ajouter à l'écran d'accueil"
4. Confirmer

**Sur desktop (Chrome/Edge):**
1. Ouvrir l'application
2. Cliquer sur l'icône d'installation dans la barre d'adresse
3. Confirmer l'installation

#### Recevoir les mises à jour

Les mises à jour sont **automatiques** :
1. L'application vérifie les mises à jour toutes les heures
2. Quand une nouvelle version est disponible, une notification apparaît
3. Cliquer sur "Mettre à jour" pour installer
4. L'application se recharge automatiquement avec la nouvelle version

**Vous n'avez rien à faire manuellement !**

### Pour les développeurs

#### Publier une nouvelle version

1. **Modifier le numéro de version** dans `public/service-worker.js` :
   ```javascript
   const CACHE_VERSION = 'v1.0.1'; // ← Incrémenter ici
   ```

2. **Déployer l'application** :
   ```bash
   npm run build
   # Déployer le dossier dist/
   ```

3. **Les utilisateurs seront notifiés automatiquement** lors de leur prochaine visite

#### Ajouter des fichiers au cache initial

Modifier `PRECACHE_URLS` dans `service-worker.js` :
```javascript
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/strawhat.svg',
  '/nouveau-fichier.png' // ← Ajouter ici
];
```

#### Exclure des URLs du cache

Modifier `NO_CACHE_URLS` dans `service-worker.js` :
```javascript
const NO_CACHE_URLS = [
  '/api/',
  'chrome-extension://',
  '/admin/' // ← Ajouter ici
];
```

## Architecture technique

### Flux de mise à jour

```
1. Utilisateur visite l'application
   ↓
2. Service Worker vérifie les mises à jour
   ↓
3. Si nouvelle version détectée
   ↓
4. Téléchargement en arrière-plan
   ↓
5. Affichage de la notification
   ↓
6. Utilisateur clique "Mettre à jour"
   ↓
7. Activation du nouveau Service Worker
   ↓
8. Rechargement de la page
   ↓
9. Application à jour !
```

### Cycle de vie du Service Worker

```
Installation → Activation → Actif
    ↓            ↓          ↓
  Cache      Nettoyage   Interception
  initial    ancien      des requêtes
             cache
```

## Gestion du cache

### Types de cache

1. **Precache** : Fichiers essentiels chargés immédiatement
2. **Runtime cache** : Fichiers mis en cache au fur et à mesure

### Nettoyage automatique

Le Service Worker supprime automatiquement les anciens caches lors de l'activation d'une nouvelle version.

### Taille du cache

Le navigateur alloue automatiquement de l'espace pour le cache. Aucune limite définie par l'application.

## Configuration avancée

### Modifier le délai de vérification des mises à jour

Dans `PWAUpdateNotification.tsx` :
```typescript
const updateCheckInterval = setInterval(() => {
  checkForUpdates();
}, 60 * 60 * 1000); // ← 1 heure (en millisecondes)
```

### Changer la stratégie de cache

Dans `service-worker.js`, modifier le gestionnaire `fetch` :

**Cache First (pour les ressources qui changent rarement):**
```javascript
event.respondWith(
  caches.match(request).then((cachedResponse) => {
    return cachedResponse || fetch(request);
  })
);
```

**Network Only (toujours depuis le réseau):**
```javascript
event.respondWith(fetch(request));
```

## Débogage

### Outils de développement Chrome

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet "Application"
3. Section "Service Workers" pour voir l'état
4. Section "Cache Storage" pour voir le contenu du cache

### Console de logs

Le Service Worker log toutes ses actions :
- `[SW] Installation du Service Worker version: vX.X.X`
- `[SW] Mise en cache des fichiers essentiels`
- `[SW] Activation du Service Worker version: vX.X.X`
- `[SW] Suppression de l'ancien cache: ...`

### Problèmes courants

**La mise à jour ne se déclenche pas:**
- Vérifier que le numéro de version a changé
- Forcer le rechargement (Ctrl+Shift+R)
- Vérifier la console pour les erreurs

**Le cache ne se met pas à jour:**
- Désinstaller le Service Worker dans DevTools
- Vider le cache
- Recharger la page

**L'application ne fonctionne pas hors ligne:**
- Vérifier que les fichiers sont dans `PRECACHE_URLS`
- Consulter "Cache Storage" dans DevTools
- Vérifier la stratégie de cache

## Sécurité

### HTTPS requis

Les Service Workers nécessitent HTTPS en production (localhost fonctionne en HTTP).

### Scope du Service Worker

Le Service Worker contrôle uniquement les pages sous son `scope` (par défaut `/`).

### Pas de données sensibles en cache

Les tokens et données sensibles ne sont **jamais** mis en cache.

## Performance

### Temps de chargement initial

Avec PWA installée :
- **Première visite** : Téléchargement + installation (~2-3s)
- **Visites suivantes** : Instantané (depuis le cache)
- **Hors ligne** : Instantané (cache uniquement)

### Consommation de données

- Première installation : Téléchargement complet
- Mises à jour : Seulement les fichiers modifiés
- Utilisation hors ligne : 0 données

## Compatibilité

### Navigateurs supportés

- ✅ Chrome (Android & Desktop)
- ✅ Edge (Desktop)
- ✅ Safari (iOS & macOS) - Support partiel
- ✅ Firefox (Desktop)
- ✅ Samsung Internet

### Fonctionnalités par navigateur

| Fonctionnalité | Chrome | Safari | Firefox | Edge |
|---------------|--------|--------|---------|------|
| Installation PWA | ✅ | ✅ | ⚠️ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Notifications Update | ✅ | ✅ | ✅ | ✅ |
| Cache API | ✅ | ✅ | ✅ | ✅ |

⚠️ Firefox desktop ne supporte pas l'installation PWA, mais le Service Worker fonctionne.

## Ressources

- [MDN - Progressive Web Apps](https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps)
- [Service Worker API](https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/fr/docs/Web/Manifest)
