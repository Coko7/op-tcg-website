# 🚀 Déploiement - Mise à Jour v1.1.0

## ✅ Résumé des Modifications

### Système de Quêtes Rééquilibré

**Formule** : `(durée × membres × 5) + bonus multi-membre (+25% par membre supplémentaire)`

**Exemples** :
- 1h + 1 membre = **5 berrys**
- 3h + 2 membres = **40 berrys** (bonus +25%)
- 4h + 3 membres = **90 berrys** (bonus +50%)
- 8h + 5 membres = **400 berrys** (bonus +100%)

### Nouvelle Interface

- Affichage de la **récompense de complétion d'île** avant de la terminer
- Visible dans la modal de détails d'île

### Version PWA

- Version mise à jour : **1.1.0**
- Auto-update configuré

---

## 🎯 DÉPLOIEMENT EN UNE COMMANDE

```bash
docker-compose build --no-cache && docker-compose up -d
```

**C'est tout !** Le système fait automatiquement :

1. ✅ Build le backend avec le JSON mis à jour
2. ✅ Build le frontend avec Map.tsx mis à jour
3. ✅ Exécute la migration des quêtes au démarrage
4. ✅ Vérifie que les valeurs sont correctes
5. ✅ Affiche un rapport dans les logs

---

## 📊 Vérifier que Tout Fonctionne

### 1. Vérifier les logs de migration

```bash
docker-compose logs backend | grep -A 20 "Migration des quêtes"
```

**Sortie attendue** :
```
🗺️ Migration des quêtes depuis JSON...
   Fichier trouvé: /app/config/world-map-quests.json
   Quêtes dans le JSON: 108
✅ Migration des quêtes réussie!

🔍 Vérification des mises à jour des quêtes...
✅ Fichier JSON chargé: 36 quêtes

📋 Vérification des récompenses:
✅ Chercher de la viande          5 berrys
✅ Combattre Buggy                40 berrys
✅ Déjouer le plan de Kuro        90 berrys
✅ Sauver Robin                   400 berrys

✅ SUCCÈS: Toutes les quêtes sont correctement mises à jour !
```

### 2. Tester l'API

```bash
curl http://localhost:5000/api/map/data | jq '.islands[2].quests[1]'
```

**Devrait afficher** :
```json
{
  "id": "quest_orange_2",
  "name": "Combattre Buggy",
  "reward_berrys": 40,
  ...
}
```

### 3. Vérifier l'interface

1. Ouvrir **http://localhost:3000/map**
2. Cliquer sur **"Orange Town"**
3. Vérifier :
   - ✅ "Combattre Buggy" affiche **40 berrys**
   - ✅ Section "Récompense de Complétion" visible
   - ✅ Affiche "Nami" comme récompense

---

## ❓ Si Quelque Chose Ne Fonctionne Pas

### Problème : Les valeurs n'ont pas changé

```bash
# 1. Vérifier que le JSON est dans l'image
docker exec $(docker-compose ps -q backend) cat /app/config/world-map-quests.json | grep "quest_orange_2"
# Doit afficher: "reward_berrys": 40

# 2. Vérifier la base de données
docker exec $(docker-compose ps -q backend) sqlite3 /app/data/database.sqlite \
  "SELECT name, reward_berrys FROM quests WHERE id = 'quest_orange_2';"
# Doit afficher: Combattre Buggy|40

# 3. Re-migrer manuellement si besoin
docker exec $(docker-compose ps -q backend) node dist/scripts/migrate-quests-from-json.js
```

### Problème : L'interface ne change pas

**Cause** : Cache PWA

**Solution utilisateur** :
- **Ctrl + Shift + R** (hard refresh)
- Ou attendre la notification "Mise à jour disponible" et cliquer

**Solution serveur** :
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

## 📁 Fichiers Modifiés

```
✅ Backend
   - server/config/world-map-quests.json (36 quêtes rééquilibrées)
   - server/src/scripts/rebalance-quest-rewards.ts (formule 5 berrys/h/membre)
   - server/scripts/verify-quest-updates.js (vérification auto)
   - server/scripts/docker-entrypoint.sh (logs améliorés)
   - Dockerfile.backend (copie verify script)

✅ Frontend
   - src/pages/Map.tsx (affichage récompense d'île)
   - package.json (version 1.1.0)
   - vite.config.ts (manifest version)
   - Dockerfile.frontend (npm ci fixé)

✅ Documentation
   - QUEST_BALANCE_UPDATE.md
   - AUTO_DEPLOY_QUESTS.md
   - CHANGELOG.md
   - README_DEPLOIEMENT.md (ce fichier)
```

---

## 📚 Documentation Complète

| Document | Contenu |
|----------|---------|
| **README_DEPLOIEMENT.md** (ce fichier) | 👈 Guide de déploiement rapide |
| **AUTO_DEPLOY_QUESTS.md** | Documentation détaillée du déploiement automatique |
| **QUEST_BALANCE_UPDATE.md** | Détails de la formule et statistiques |
| **CHANGELOG.md** | Historique des versions |
| **RECAP_FINAL_MISE_A_JOUR.md** | Récapitulatif complet |

---

## ✨ C'est Prêt !

Tout est configuré pour un déploiement 100% automatique.

**Une seule commande suffit** :
```bash
docker-compose build --no-cache && docker-compose up -d
```

Les utilisateurs verront :
- ✅ Nouvelles récompenses équilibrées
- ✅ Récompenses d'île visibles
- ✅ Notification de mise à jour PWA (version 1.1.0)

**Aucune intervention manuelle nécessaire !** 🎉

---

**Version** : 1.1.0
**Date** : 20 octobre 2025
**Status** : ✅ Production Ready
