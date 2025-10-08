# Guide de Test - Récompense Quotidienne

## 🧪 Tests à Effectuer

### Test 1 : Première Réclamation
1. Connectez-vous avec un compte
2. Vérifiez que le modal s'affiche automatiquement
3. Cliquez sur "Réclamer 10 Berrys"
4. Vérifiez que :
   - ✅ Le message de félicitations s'affiche
   - ✅ Le solde de Berrys augmente de 10
   - ✅ Le modal se ferme automatiquement après 3 secondes
   - ✅ Le bouton affiche maintenant "Déjà réclamée aujourd'hui"

### Test 2 : Tentative de Réclamation Multiple (Rechargement)
1. Après avoir réclamé, **rechargez la page** (F5)
2. Vérifiez que :
   - ✅ Le modal ne s'affiche PAS automatiquement
   - ✅ Le bouton affiche "Déjà réclamée aujourd'hui"
   - ✅ Le bouton est désactivé (grisé)

### Test 3 : Tentative de Réclamation Multiple (Clic sur bouton)
1. Après avoir réclamé, cliquez sur le bouton "Indisponible"
2. Vérifiez que :
   - ✅ Le bouton ne réagit pas (disabled)
   - ✅ Aucun modal ne s'ouvre

### Test 4 : Vérification Backend (API)
Utilisez un outil comme Postman ou curl :

```bash
# 1. Vérifier l'état de la récompense
curl -X GET http://localhost:5001/api/users/daily-reward/check \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Réclamer la récompense
curl -X POST http://localhost:5001/api/users/daily-reward/claim \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Tenter de réclamer à nouveau (devrait échouer)
curl -X POST http://localhost:5001/api/users/daily-reward/claim \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Résultats attendus :
- **1ère tentative** : `{"success": true, "data": {"berrys_earned": 10, ...}}`
- **2ème tentative** : `{"error": "Récompense quotidienne déjà réclamée aujourd'hui"}`

### Test 5 : Vérification Base de Données
```bash
cd server
sqlite3 database.sqlite "SELECT id, username, berrys, last_daily_reward FROM users;"
```

Vérifiez que :
- ✅ Le champ `berrys` a augmenté de 10
- ✅ Le champ `last_daily_reward` contient la date/heure actuelle

### Test 6 : Multiple Onglets
1. Ouvrez deux onglets de l'application
2. Dans le premier onglet, réclamez la récompense
3. Dans le second onglet, rechargez la page
4. Vérifiez que :
   - ✅ Le second onglet affiche "Déjà réclamée"
   - ✅ Impossible de réclamer depuis le second onglet

### Test 7 : Manipulation localStorage
1. Après avoir réclamé, ouvrez la console (F12)
2. Exécutez : `localStorage.removeItem('dailyRewardModalLastShown')`
3. Rechargez la page
4. Le modal **peut** s'afficher, mais :
   - ✅ Le backend refuse toujours la réclamation
   - ✅ Une erreur s'affiche si on tente de réclamer

## 🔍 Débogage

### Vérifier les Logs Backend
```bash
# Logs du serveur (dans le terminal du serveur)
# Recherchez les messages :
GET /api/users/daily-reward/check
POST /api/users/daily-reward/claim
```

### Vérifier les Logs Frontend
Ouvrez la console du navigateur (F12) et cherchez :
```
Erreur lors de la réclamation de la récompense quotidienne: ...
```

### Vérifier la Base de Données Directement
```bash
cd server
sqlite3 database.sqlite

# Afficher la structure de la table users
.schema users

# Voir les données d'un utilisateur spécifique
SELECT id, username, berrys, last_daily_reward FROM users WHERE username = 'YOUR_USERNAME';

# Réinitialiser manuellement la récompense pour tester (à des fins de développement uniquement)
UPDATE users SET last_daily_reward = NULL WHERE username = 'YOUR_USERNAME';
```

## ✅ Checklist de Validation

- [ ] Le modal s'affiche automatiquement à la première connexion
- [ ] La réclamation ajoute bien 10 Berrys
- [ ] Le bouton se met à jour après réclamation
- [ ] Impossible de réclamer deux fois en rechargeant
- [ ] Impossible de réclamer depuis plusieurs onglets
- [ ] Le backend refuse les tentatives de réclamation multiple
- [ ] Le champ `last_daily_reward` est mis à jour dans la DB
- [ ] Le lendemain, la récompense est à nouveau disponible (si test sur plusieurs jours)

## 🐛 Problèmes Connus et Solutions

### Problème : Le bouton reste "Disponible" après réclamation
**Cause** : L'état frontend n'est pas mis à jour
**Solution** : Vérifiez que `onClaim` appelle bien `checkDailyRewardStatus()`

### Problème : Le modal s'affiche en boucle
**Cause** : localStorage non vérifié
**Solution** : Vérifiez la fonction `checkIfModalShownToday()`

### Problème : Erreur "Récompense déjà réclamée" dès le début
**Cause** : Le champ `last_daily_reward` contient une vieille date d'aujourd'hui
**Solution** : Réinitialisez manuellement : `UPDATE users SET last_daily_reward = NULL WHERE id = 'USER_ID'`

### Problème : Le serveur ne démarre pas
**Cause** : Port 5001 déjà utilisé
**Solution** : Changez le port dans `.env` ou tuez le processus : `taskkill /F /IM node.exe`
