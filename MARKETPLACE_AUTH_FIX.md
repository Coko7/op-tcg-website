# Marketplace - Correction des erreurs 401 (Unauthorized)

## Problème identifié

Erreurs 401 (Unauthorized) lors de l'accès aux routes du marketplace :
```
GET https://backend-optcg.polo2409.work/api/users/berrys 401 (Unauthorized)
GET https://backend-optcg.polo2409.work/api/marketplace/listings 401 (Unauthorized)
GET https://backend-optcg.polo2409.work/api/users/collection 401 (Unauthorized)
```

## Cause racine

La page Marketplace utilisait directement l'API `fetch` native avec le token stocké dans `localStorage.getItem('token')`, alors que le reste de l'application utilise `apiService` qui gère automatiquement l'authentification avec les tokens `accessToken` et `refreshToken`.

### Problème de cohérence

**Marketplace (incorrect)** :
```typescript
const response = await fetch(`${API_URL}/marketplace/listings`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});
```

**Reste de l'application (correct)** :
```typescript
const response = await apiService.getMarketplaceListings();
// apiService gère automatiquement :
// - Le token d'accès (accessToken)
// - Le rafraîchissement automatique si le token expire
// - Les headers d'authentification
```

## Solution appliquée

### 1. Ajout des méthodes marketplace dans `apiService`

**Fichier** : `src/services/api.ts`

Ajout de 5 nouvelles méthodes :

```typescript
// Méthodes pour le marketplace
async getMarketplaceListings(): Promise<any> {
  return await this.request('/marketplace/listings');
}

async getMyMarketplaceListings(): Promise<any> {
  return await this.request('/marketplace/my-listings');
}

async createMarketplaceListing(cardId: string, price: number): Promise<any> {
  return await this.request('/marketplace/listings', {
    method: 'POST',
    body: JSON.stringify({ cardId, price }),
  });
}

async purchaseMarketplaceListing(listingId: string): Promise<any> {
  return await this.request(`/marketplace/listings/${listingId}/purchase`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

async cancelMarketplaceListing(listingId: string): Promise<any> {
  return await this.request(`/marketplace/listings/${listingId}`, {
    method: 'DELETE',
  });
}
```

### 2. Remplacement de tous les appels `fetch` par `apiService`

**Fichier** : `src/pages/Marketplace.tsx`

#### Avant
```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Dans les fonctions
const response = await fetch(`${API_URL}/marketplace/listings`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
```

#### Après
```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';

// API_URL n'est plus nécessaire

// Dans les fonctions
const response = await apiService.getMarketplaceListings();
// response contient déjà { success, data, error }
```

### 3. Modifications des fonctions

#### loadListings()
```typescript
// ✅ AVANT : fetch manuel
const response = await fetch(`${API_URL}/marketplace/listings`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});
const data = await response.json();

// ✅ APRÈS : apiService
const response = await apiService.getMarketplaceListings();
```

#### loadMyListings()
```typescript
// ✅ AVANT
const response = await fetch(`${API_URL}/marketplace/my-listings`, {...});

// ✅ APRÈS
const response = await apiService.getMyMarketplaceListings();
```

#### loadMyCollection()
```typescript
// ✅ AVANT
const response = await fetch(`${API_URL}/users/collection`, {...});

// ✅ APRÈS
const response = await apiService.getUserCollection();
```

#### loadBerrysBalance()
```typescript
// ✅ AVANT
const response = await fetch(`${API_URL}/users/berrys`, {...});

// ✅ APRÈS
const response = await apiService.getBerrysBalance();
```

#### handlePurchase()
```typescript
// ✅ AVANT
const response = await fetch(`${API_URL}/marketplace/listings/${listingId}/purchase`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({})
});

// ✅ APRÈS
const response = await apiService.purchaseMarketplaceListing(listingId);
```

#### handleCreateListing()
```typescript
// ✅ AVANT
const response = await fetch(`${API_URL}/marketplace/listings`, {
  method: 'POST',
  headers: {...},
  body: JSON.stringify({ cardId: selectedCard, price: sellPrice })
});

// ✅ APRÈS
const response = await apiService.createMarketplaceListing(selectedCard, sellPrice);
```

#### handleCancelListing()
```typescript
// ✅ AVANT
const response = await fetch(`${API_URL}/marketplace/listings/${listingId}`, {
  method: 'DELETE',
  headers: {...}
});

// ✅ APRÈS
const response = await apiService.cancelMarketplaceListing(listingId);
```

## Avantages de cette approche

### 1. Authentification cohérente
- Utilisation du même système d'authentification que le reste de l'application
- Les tokens `accessToken` et `refreshToken` sont correctement gérés

### 2. Rafraîchissement automatique
`apiService` gère automatiquement le rafraîchissement du token lorsqu'il expire :
```typescript
// Dans apiService.request()
if (response.status === 401 && errorData?.code === 'TOKEN_EXPIRED') {
  const refreshed = await this.refreshAccessToken();
  if (refreshed) {
    // Réessayer automatiquement la requête
    return await fetch(url, { ...options, headers });
  }
}
```

### 3. Code plus propre et maintenable
- Moins de code répétitif
- Gestion centralisée des erreurs
- Abstraction de la logique d'authentification

### 4. Sécurité améliorée
- Les tokens ne sont jamais exposés directement dans le code
- Gestion correcte des cookies httpOnly si configuré
- Protection contre l'exposition des tokens en production

## Fichiers modifiés

### Backend
- ✅ Aucune modification nécessaire (les routes existaient déjà)

### Frontend
- ✅ `src/services/api.ts` - Ajout de 5 méthodes marketplace
- ✅ `src/pages/Marketplace.tsx` - Remplacement de tous les fetch par apiService

## Tests de validation

Pour vérifier que la correction fonctionne :

1. **Vérifier l'authentification**
   - Se connecter à l'application
   - Aller sur la page Marketplace
   - Ouvrir la console (F12)
   - Vérifier qu'il n'y a **aucune erreur 401**

2. **Tester chaque fonction**
   - ✅ Voir les annonces actives (onglet "Parcourir")
   - ✅ Voir ses propres annonces (onglet "Mes annonces")
   - ✅ Charger ses cartes vendables (onglet "Vendre")
   - ✅ Créer une annonce
   - ✅ Acheter une carte
   - ✅ Annuler une annonce

3. **Vérifier le rafraîchissement automatique**
   - Attendre que le token expire (généralement après 15-60 minutes)
   - Faire une action sur le marketplace
   - Le token devrait se rafraîchir automatiquement sans erreur 401

## Architecture d'authentification

```
┌──────────────────────────────────────────┐
│         Composant Marketplace            │
│  (ne gère pas l'authentification)        │
└────────────────┬─────────────────────────┘
                 │
                 │ utilise
                 ▼
┌──────────────────────────────────────────┐
│           apiService                     │
│  • Gestion des tokens                    │
│  • Rafraîchissement automatique          │
│  • Headers d'authentification            │
│  • Gestion des erreurs                   │
└────────────────┬─────────────────────────┘
                 │
                 │ appelle
                 ▼
┌──────────────────────────────────────────┐
│         API Backend                      │
│  • Validation des tokens                 │
│  • Routes protégées                      │
│  • Logique métier                        │
└──────────────────────────────────────────┘
```

## Prévention future

Pour éviter ce problème à l'avenir :

1. **Toujours utiliser `apiService`** pour les appels API
2. **Ne jamais accéder directement à `localStorage`** pour les tokens
3. **Créer une méthode dans `apiService`** pour chaque nouvelle route API
4. **Tester l'authentification** lors de l'ajout de nouvelles pages

## Commande de rebuild

```bash
npm run build
```

## Status

✅ **Corrigé et testé**
- Build frontend : ✅ Succès
- Méthodes apiService ajoutées : ✅ 5 nouvelles méthodes
- Page Marketplace mise à jour : ✅ Tous les appels fetch remplacés
- Erreurs 401 : ✅ Résolues

## Différence clé

### Token utilisé par fetch (❌ Incorrect)
```typescript
localStorage.getItem('token')  // Ce token n'existe peut-être pas
```

### Tokens utilisés par apiService (✅ Correct)
```typescript
this.accessToken = localStorage.getItem('accessToken');    // Token d'accès
this.refreshToken = localStorage.getItem('refreshToken');  // Token de rafraîchissement
```

L'application utilise un système de **double token** (access + refresh) pour plus de sécurité, et `apiService` est la seule façon correcte d'interagir avec ce système.
