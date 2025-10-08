# Troubleshooting - Collections Vides

## 🔍 Diagnostic Étape par Étape

### Étape 1: Vérifier l'état de la base de données

```bash
node server/verify-migration-state.js
```

**Ce qu'on cherche**:
- ✅ Version schéma >= 12
- ✅ Table `users` avec 14 colonnes
- ✅ Table `user_collections` existe
- ✅ `COUNT(user_collections) > 0`
- ✅ Pas de données orphelines

### Étape 2: Test direct de la requête

```bash
node server/test-collections.js
```

**Ce qu'on cherche**:
- ✅ Utilisateur avec cartes trouvé
- ✅ Requête retourne des résultats
- ✅ Toutes les colonnes présentes

### Étape 3: Vérifier les logs Docker

```bash
docker logs op-game-backend
```

**Ce qu'on cherche**:
- ✅ Migration 12 exécutée sans erreur
- ✅ Diagnostic montre des collections
- ⚠️ Erreurs lors des migrations

## 🐛 Problèmes Possibles et Solutions

### Problème 1: Table `user_collections` vide

**Symptômes**:
- `verify-migration-state.js` montre `Total collections: 0`
- Les utilisateurs voient leurs Berrys et boosters mais pas les cartes

**Causes possibles**:
1. Migration 12 a échoué et supprimé les données
2. Volume Docker non persistant
3. Mauvaise base de données utilisée

**Solution**:
```bash
# 1. Vérifier le volume Docker
docker volume ls | grep op_game_data

# 2. Vérifier le contenu du volume
docker run --rm -v op_game_data:/data alpine ls -lh /data

# 3. Restaurer depuis un backup
node server/restore-from-backup.js
```

### Problème 2: Migration 12 a échoué silencieusement

**Symptômes**:
- Table `users` n'a pas toutes les colonnes
- Version schéma bloquée à 11

**Solution**:
```bash
# 1. Vérifier la version actuelle
sqlite3 /path/to/database.sqlite "PRAGMA user_version"

# 2. Si < 12, rollback et retry
# Restaurer backup migration_backup_v11_*.sqlite
cp migration_backup_v11_*.sqlite database.sqlite

# 3. Corriger la migration et relancer
node server/scripts/run-migrations.js
```

### Problème 3: Requête `getCollection` ne retourne rien

**Symptômes**:
- `verify-migration-state.js` montre des collections
- `test-collections.js` fonctionne
- Mais l'API retourne vide

**Causes possibles**:
- Problème d'authentification (userId incorrect)
- Cache frontend
- CORS bloque la réponse

**Solution**:
```bash
# 1. Tester l'API directement
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://YOUR_DOMAIN/api/users/collection

# 2. Vérifier les logs serveur
docker logs op-game-backend --tail 100

# 3. Vider le cache frontend
# Dans le navigateur: Ctrl+Shift+R ou vider localStorage
```

### Problème 4: Colonnes manquantes dans la requête

**Symptômes**:
- `test-collections.js` indique colonnes manquantes
- Frontend affiche cartes mais sans certaines infos

**Solution**:
Déjà corrigé dans `userController.ts` lignes 67-96, rebuild nécessaire:

```bash
docker-compose build backend
docker-compose up -d backend
```

## 🔄 Procédure de Restauration Complète

Si tout est perdu, voici la procédure de récupération :

### Option A: Restaurer depuis un Backup de Migration

```bash
# 1. Lister les backups disponibles
ls -lh server/migration_backup_*.sqlite

# 2. Choisir le plus récent AVANT la migration 12
# Exemple: migration_backup_v11_*.sqlite

# 3. Restaurer
cp server/migration_backup_v11_*.sqlite server/database.sqlite

# 4. Relancer les migrations
node server/scripts/run-migrations.js
```

### Option B: Restaurer depuis un Backup du Volume Docker

```bash
# 1. Arrêter le conteneur
docker-compose stop backend

# 2. Restaurer le volume
docker run --rm -v op_game_data:/data -v $(pwd):/backup \
  alpine cp /backup/database-backup.sqlite /data/database.sqlite

# 3. Redémarrer
docker-compose up -d backend
```

### Option C: Réinitialiser Complètement (DERNIER RECOURS)

⚠️ **ATTENTION: Cela supprime TOUTES les données utilisateur !**

```bash
# 1. Backup de la DB actuelle
docker cp op-game-backend:/app/data/database.sqlite ./database-before-reset.sqlite

# 2. Supprimer le volume
docker-compose down
docker volume rm op_game_data

# 3. Recréer
docker-compose up -d
```

## 📊 Checklist de Vérification

Avant de déployer en production, vérifier :

- [ ] `verify-migration-state.js` retourne ✅ sur tous les tests
- [ ] `test-collections.js` retourne ✅
- [ ] `diagnose-database.js` montre des collections
- [ ] Test API manuel fonctionne
- [ ] Version schéma = 12
- [ ] Backup de la base créé

## 🆘 Demande d'Aide

Si le problème persiste, fournir :

1. Output de `verify-migration-state.js`
2. Output de `diagnose-database.js`
3. Output de `test-collections.js`
4. Logs Docker: `docker logs op-game-backend --tail 200`
5. Version schéma: `sqlite3 database.sqlite "PRAGMA user_version"`

## 📞 Scripts de Diagnostic

| Script | Usage | Ce qu'il fait |
|--------|-------|---------------|
| `verify-migration-state.js` | Vérification complète | Structure DB, intégrité, test requête |
| `diagnose-database.js` | Stats générales | Compteurs, stats utilisateurs |
| `test-collections.js` | Test requête getCollection | Simule l'API réelle |
| `restore-from-backup.js` | Restauration | Restaure depuis backup migration |

---

**Dernière mise à jour**: 2025-10-07
