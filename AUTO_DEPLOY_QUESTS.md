# 🚀 Déploiement Automatique des Mises à Jour de Quêtes

## ✅ Système 100% Automatique

Le système est maintenant **complètement automatique**. Aucune intervention manuelle n'est nécessaire !

## 📋 Ce qui se passe automatiquement

### Au démarrage du Docker

1. **Détection du fichier JSON** ✅
   - Le fichier `server/config/world-map-quests.json` est automatiquement copié dans l'image Docker
   - Le script d'entrypoint vérifie qu'il existe bien

2. **Migration automatique** ✅
   - Le script `migrate-quests-from-json.js` s'exécute automatiquement
   - Met à jour les 36 quêtes avec les nouvelles récompenses
   - Préserve toute la progression des joueurs

3. **Vérification automatique** ✅
   - Le script `verify-quest-updates.js` vérifie que tout est correct
   - Compare les valeurs en DB avec le JSON
   - Affiche un rapport détaillé dans les logs

4. **Frontend PWA** ✅
   - Version mise à jour automatiquement à 1.1.0
   - Service Worker régénéré avec nouveau hash
   - Notification de mise à jour pour les utilisateurs

## 🔄 Pour Déployer

### Commande Simple

```bash
docker-compose up -d --build
```

C'est tout ! Le reste est automatique.

### Avec Rebuild Complet (Recommandé après modifications)

```bash
# Rebuild complet pour s'assurer que tout est à jour
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Vérification des Logs

### Après le déploiement, vérifier les logs :

```bash
docker-compose logs backend | grep -A 20 "Migration des quêtes"
```

### Sortie attendue :

```
🗺️ Migration des quêtes depuis JSON...
   Fichier trouvé: /app/config/world-map-quests.json
   Quêtes dans le JSON: 108
✅ Migration des quêtes réussie!

🔍 Vérification des mises à jour des quêtes...

✅ Fichier JSON chargé: 36 quêtes

📋 Vérification des récompenses:
──────────────────────────────────────────────────────────────────────
✅ Chercher de la viande          50 berrys
✅ Combattre Buggy                375 berrys
✅ Déjouer le plan de Kuro        900 berrys
✅ Sauver Robin                   4000 berrys
──────────────────────────────────────────────────────────────────────

📊 Total quêtes actives en DB: 36

══════════════════════════════════════════════════════════════════════
✅ SUCCÈS: Toutes les quêtes sont correctement mises à jour !
══════════════════════════════════════════════════════════════════════

✅ Vérification réussie: Les quêtes sont à jour!
```

## 🎯 Que vérifier côté utilisateur

### Backend - API

```bash
# Tester l'endpoint des quêtes
curl http://localhost:5000/api/map/data | jq '.islands[2].quests[1].reward_berrys'
# Devrait retourner: 375
```

### Frontend - Interface

1. Ouvrir http://localhost:3000/map
2. Cliquer sur "Orange Town"
3. Vérifier que "Combattre Buggy" affiche **375 berrys**
4. Vérifier la section **"Récompense de Complétion"** s'affiche

### PWA - Version

1. Ouvrir la console du navigateur
2. Vérifier le manifest :
```javascript
fetch('/manifest.webmanifest').then(r => r.json()).then(console.log)
// Devrait afficher: version: "1.1.0"
```

## ❌ Si quelque chose ne fonctionne pas

### Problème : Les valeurs n'ont pas changé

**Vérifier dans les logs** :
```bash
docker-compose logs backend > backend.log
grep -i "erreur\|error\|échec\|fail" backend.log
```

**Solutions** :

1. **Rebuild complet** :
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

2. **Vérifier que le JSON est bien dans l'image** :
```bash
docker exec $(docker-compose ps -q backend) cat /app/config/world-map-quests.json | grep "quest_orange_2"
# Devrait afficher: "reward_berrys": 375
```

3. **Exécuter la migration manuellement** :
```bash
docker exec $(docker-compose ps -q backend) node dist/scripts/migrate-quests-from-json.js
```

### Problème : L'interface ne change pas

**Cause probable** : Cache PWA

**Solution utilisateur** :
- Hard refresh : **Ctrl + Shift + R**
- Ou désinstaller/réinstaller le PWA

**Solution serveur** :
```bash
# Rebuild le frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 🔧 Fichiers Importants

| Fichier | Rôle |
|---------|------|
| `server/config/world-map-quests.json` | Source de vérité pour les quêtes |
| `server/scripts/docker-entrypoint.sh` | Orchestration du démarrage (exécute la migration) |
| `server/src/scripts/migrate-quests-from-json.ts` | Script de migration (compilé en JS) |
| `server/scripts/verify-quest-updates.js` | Vérification automatique post-migration |
| `Dockerfile.backend` | Copie tous les fichiers nécessaires |
| `Dockerfile.frontend` | Build le frontend avec Map.tsx mis à jour |

## 📝 Modifications Apportées pour l'Automatisation

### 1. docker-entrypoint.sh
- ✅ Affichage détaillé du processus de migration
- ✅ Vérification automatique post-migration
- ✅ Messages d'erreur clairs si échec

### 2. Dockerfile.backend
- ✅ Copie du script de vérification

### 3. verify-quest-updates.js (Nouveau)
- ✅ Vérifie automatiquement que les bonnes valeurs sont en DB
- ✅ Compare avec le JSON source
- ✅ Rapport détaillé dans les logs

## 🎉 Résumé

**Ce qui est automatique** :
- ✅ Copie du JSON dans Docker
- ✅ Migration des quêtes au démarrage
- ✅ Vérification des valeurs
- ✅ Mise à jour du frontend
- ✅ Version PWA incrémentée
- ✅ Logs détaillés

**Ce que vous devez faire** :
- ✅ `docker-compose up -d --build`

**C'est tout !** 🚀

---

**Version** : 1.1.0
**Date** : 20 octobre 2025
**Status** : ✅ Production Ready
