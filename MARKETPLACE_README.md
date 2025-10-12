# Marketplace - Documentation

## Vue d'ensemble

Le **Marketplace** est une nouvelle fonctionnalité permettant aux joueurs d'échanger des cartes entre eux en utilisant la monnaie du jeu (Berrys).

## Caractéristiques principales

### Sécurité et règles

1. **Limite d'annonces** : Chaque joueur peut avoir maximum **3 annonces actives** simultanément
2. **Protection des cartes** : Impossible de vendre la dernière carte d'un exemplaire (minimum 2 exemplaires requis pour vendre)
3. **Prix encadrés** : Les prix doivent être entre 1 et 999,999 Berrys
4. **Transactions atomiques** : Toutes les transactions sont sécurisées par des transactions SQL atomiques
5. **Validation côté serveur** : Toutes les validations critiques sont effectuées côté serveur
6. **Audit logging** : Toutes les transactions sont enregistrées dans les logs d'audit

### Fonctionnalités utilisateur

#### 1. Parcourir le Marketplace
- Voir toutes les cartes en vente
- Filtrer par rareté, prix, etc.
- Voir le nom du vendeur
- Acheter une carte si vous avez assez de Berrys

#### 2. Mes annonces
- Voir vos annonces actives, vendues et annulées
- Annuler une annonce active
- Statistiques de vos ventes

#### 3. Vendre une carte
- Sélectionner une carte que vous possédez en au moins 2 exemplaires
- Définir un prix entre 1 et 999,999 Berrys
- Créer l'annonce (maximum 3 annonces actives)

## Architecture technique

### Backend

#### Modèles
- **MarketplaceListing** (`server/src/models/MarketplaceListing.ts`)
  - Gestion des annonces du marketplace
  - CRUD sécurisé des listings
  - Validation des données

#### Contrôleurs
- **MarketplaceController** (`server/src/controllers/marketplaceController.ts`)
  - `getListings()` : Récupérer toutes les annonces actives
  - `getMyListings()` : Récupérer les annonces d'un utilisateur
  - `createListing()` : Créer une nouvelle annonce
  - `purchaseListing()` : Acheter une carte
  - `cancelListing()` : Annuler une annonce

#### Routes
- **GET** `/api/marketplace/listings` - Récupérer toutes les annonces actives
- **GET** `/api/marketplace/my-listings` - Récupérer mes annonces
- **POST** `/api/marketplace/listings` - Créer une annonce
- **POST** `/api/marketplace/listings/:listingId/purchase` - Acheter une carte
- **DELETE** `/api/marketplace/listings/:listingId` - Annuler une annonce

#### Base de données
Table `marketplace_listings` avec les colonnes :
- `id` : Identifiant unique
- `seller_id` : ID du vendeur (FK vers users)
- `card_id` : ID de la carte (FK vers cards)
- `price` : Prix en Berrys (> 0)
- `status` : Statut ('active', 'sold', 'cancelled')
- `buyer_id` : ID de l'acheteur (FK vers users, nullable)
- `created_at` : Date de création
- `sold_at` : Date de vente (nullable)

Index créés pour optimiser les performances :
- `idx_marketplace_seller_id`
- `idx_marketplace_buyer_id`
- `idx_marketplace_card_id`
- `idx_marketplace_status`
- `idx_marketplace_created_at`

### Frontend

#### Pages
- **Marketplace** (`src/pages/Marketplace.tsx`)
  - Interface complète avec 3 onglets :
    - Parcourir : Voir et acheter des cartes
    - Mes annonces : Gérer vos annonces
    - Vendre : Créer une nouvelle annonce

#### Navigation
- Ajout du lien Marketplace dans le Header
- Icône panier (ShoppingCart)
- Route protégée nécessitant une authentification

## Sécurité implémentée

### Protection contre les exploits

1. **Validation des quantités**
   - Vérification que l'utilisateur possède au moins 2 exemplaires avant de vendre
   - Empêche la vente de la dernière carte

2. **Transactions atomiques**
   - Toutes les opérations critiques utilisent des transactions SQL
   - Rollback automatique en cas d'erreur
   - Protection contre les race conditions

3. **Validation côté serveur**
   - Jamais de confiance aux données du client
   - Recalcul systématique des prix et disponibilités
   - Vérification de propriété des cartes

4. **Protection contre l'auto-achat**
   - Impossible d'acheter ses propres annonces

5. **Limite de Berrys**
   - Protection contre l'overflow (max 999,999,999)

6. **Audit logging**
   - Toutes les actions sont enregistrées
   - Tracking des échecs de transaction
   - Identification des tentatives de fraude

### Actions d'audit ajoutées
- `MARKETPLACE_LISTING_CREATED` : Création d'une annonce
- `MARKETPLACE_LISTING_CANCELLED` : Annulation d'une annonce
- `MARKETPLACE_PURCHASE` : Achat d'une carte

## Migration de base de données

La migration **#16** (`create_marketplace_listings`) crée :
- La table `marketplace_listings`
- Les index nécessaires
- Les contraintes de sécurité (CHECK constraints)

Pour appliquer la migration :
```bash
cd server
npm run dev
```

La migration s'appliquera automatiquement au démarrage du serveur.

## Utilisation

### Côté joueur

1. **Vendre une carte**
   - Aller dans Marketplace > Vendre
   - Sélectionner une carte (possédée en ≥2 exemplaires)
   - Définir un prix
   - Créer l'annonce

2. **Acheter une carte**
   - Aller dans Marketplace > Parcourir
   - Trouver une carte intéressante
   - Vérifier que vous avez assez de Berrys
   - Cliquer sur "Acheter"

3. **Gérer mes annonces**
   - Aller dans Marketplace > Mes annonces
   - Voir vos annonces actives/vendues/annulées
   - Annuler une annonce si besoin

## Tests recommandés

### Tests fonctionnels
1. Créer une annonce avec une carte possédée en 2+ exemplaires ✓
2. Tenter de vendre une carte possédée en 1 seul exemplaire ✗ (doit échouer)
3. Tenter de créer plus de 3 annonces ✗ (doit échouer)
4. Acheter une carte avec assez de Berrys ✓
5. Tenter d'acheter une carte sans assez de Berrys ✗ (doit échouer)
6. Tenter d'acheter sa propre annonce ✗ (doit échouer)
7. Annuler une annonce ✓
8. Tenter d'acheter une annonce annulée ✗ (doit échouer)

### Tests de sécurité
1. Tester les race conditions (2 achats simultanés)
2. Tenter de manipuler le prix côté client
3. Tenter de vendre une carte non possédée
4. Tenter de dépasser la limite de Berrys

## Améliorations futures possibles

1. **Système de filtres avancés**
   - Filtrer par rareté
   - Filtrer par fourchette de prix
   - Recherche par nom de carte

2. **Historique des transactions**
   - Voir l'historique complet de vos achats/ventes

3. **Système d'offres**
   - Faire des offres inférieures au prix demandé

4. **Notifications**
   - Notification quand votre carte est vendue
   - Notification de nouvelles cartes correspondant à vos critères

5. **Statistiques du marketplace**
   - Prix moyens par rareté
   - Cartes les plus vendues
   - Tendances de prix

## Support

Pour toute question ou problème concernant le Marketplace, vérifiez :
1. Les logs du serveur (`server/logs/`)
2. Les logs d'audit dans la base de données (`audit_logs`)
3. La console navigateur pour les erreurs frontend
