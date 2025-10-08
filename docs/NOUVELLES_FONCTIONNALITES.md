# Nouvelles Fonctionnalités - One Piece TCG

## 🎁 Système de Récompense Quotidienne

### Description
Les joueurs peuvent maintenant recevoir **10 Berrys gratuits** en se connectant pour la première fois chaque jour.

### Fonctionnement
- Un modal s'affiche automatiquement sur la page d'accueil lorsque la récompense quotidienne est disponible (une seule fois par jour)
- L'utilisateur peut réclamer 10 Berrys gratuitement une fois par jour
- Un bouton permanent sur la page d'accueil permet de :
  - **Voir si la récompense est disponible** (bouton doré avec icône 🎁)
  - **Réclamer la récompense manuellement** si le modal a été fermé
  - **Voir l'état "Déjà réclamée"** avec un message pour revenir demain
- La récompense se réinitialise chaque jour à minuit

### Protection contre les abus
- **Côté frontend** :
  - Le modal ne s'affiche qu'une seule fois par jour (localStorage : `dailyRewardModalLastShown`)
  - L'état de disponibilité est revérifié après chaque réclamation
  - Le bouton se met à jour automatiquement après réclamation
- **Côté backend** :
  - L'API vérifie la colonne `last_daily_reward` dans la base de données
  - Comparaison de dates (jour uniquement, pas l'heure)
  - Mise à jour automatique de `last_daily_reward` lors de la réclamation
  - Retourne une erreur 400 si déjà réclamée aujourd'hui
- **Triple sécurité** : Impossible de réclamer plusieurs fois même en :
  - Rechargeant la page
  - Ouvrant plusieurs onglets
  - Manipulant le localStorage

### Mise en place
1. Exécutez les migrations pour ajouter la colonne `last_daily_reward` :
   ```bash
   cd server
   npm run migrate
   ```

### API Endpoints
- `GET /api/users/daily-reward/check` - Vérifier si la récompense est disponible
- `POST /api/users/daily-reward/claim` - Réclamer la récompense quotidienne

## 🏆 Achievements de Complétion des Boosters

### Description
De nouveaux achievements ont été ajoutés pour récompenser les joueurs qui complètent les boosters.

### Types d'Achievements
Pour chaque booster, 3 achievements sont disponibles :

1. **Explorateur (20%)** 🔍
   - Débloquer 20% des cartes du booster
   - Récompense : 100 Berrys

2. **Collectionneur (50%)** 🎯
   - Débloquer 50% des cartes du booster
   - Récompense : 250 Berrys

3. **Maître Complet (100%)** 👑
   - Débloquer 100% des cartes du booster
   - Récompense : 500 Berrys

### Mise en place
1. Exécutez le script d'initialisation des achievements :
   ```bash
   cd server
   npm run init-achievements
   ```

Ce script va :
- Créer les achievements génériques (boosters ouverts, cartes uniques, etc.)
- Créer automatiquement les achievements de complétion pour tous les boosters existants

### Mise à jour automatique
Les achievements de complétion se mettent à jour automatiquement après chaque ouverture de booster.

## 📝 Instructions d'installation complète

### Backend
```bash
cd server

# Installer les dépendances
npm install

# Exécuter les migrations
npm run migrate

# Initialiser les achievements
npm run init-achievements

# Démarrer le serveur
npm run dev
```

### Frontend
```bash
# Depuis la racine du projet
npm install

# Démarrer l'application
npm run dev
```

## 🎮 Utilisation

### Récompense Quotidienne
1. Connectez-vous à votre compte
2. Accédez à la page d'accueil
3. Si la récompense est disponible, un modal apparaîtra automatiquement
4. Cliquez sur "Réclamer 10 Berrys" pour obtenir votre récompense
5. Revenez le lendemain pour une nouvelle récompense !

### Achievements
1. Ouvrez des boosters pour progresser dans vos achievements
2. Accédez à la page "Achievements" depuis le menu
3. Consultez votre progression pour chaque booster
4. Réclamez vos récompenses en Berrys lorsque les achievements sont complétés

## 🔧 Configuration

### Modifier la récompense quotidienne
Pour changer le montant de la récompense quotidienne, modifiez la constante dans :
- `server/src/controllers/userController.ts` ligne 667 : `const DAILY_REWARD_BERRYS = 10;`

### Modifier les récompenses d'achievements
Pour changer les récompenses des achievements, modifiez :
- `server/src/services/AchievementService.ts` dans la méthode `createBoosterAchievements()`

## 📊 Structure de la base de données

### Nouvelle colonne
```sql
ALTER TABLE users ADD COLUMN last_daily_reward TEXT;
```

Cette colonne stocke la date et l'heure de la dernière réclamation de la récompense quotidienne.

### Tables d'achievements
Les tables `achievements` et `user_achievements` gèrent le système d'achievements :
- `achievements` : Liste des achievements disponibles
- `user_achievements` : Progression des joueurs sur chaque achievement

## 🚀 Améliorations futures possibles

- Système de streak (bonus pour connexions consécutives)
- Récompenses progressives (augmentation selon le nombre de jours consécutifs)
- Notifications push pour rappeler aux joueurs de réclamer leur récompense
- Achievements supplémentaires (vendre X cartes, obtenir X cartes rares, etc.)
- Leaderboard pour les achievements
