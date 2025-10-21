# Guide de Déploiement - Mise à Jour des Récompenses de Quêtes

## 📦 Ce qui va se passer lors du déploiement

Lors du prochain déploiement Docker, le système va **automatiquement** :

1. ✅ Détecter le fichier `config/world-map-quests.json` mis à jour
2. ✅ Exécuter le script `migrate-quests-from-json.js`
3. ✅ Mettre à jour toutes les récompenses de quêtes dans la base de données
4. ✅ **Préserver la progression de tous les joueurs** (îles débloquées, membres d'équipage, quêtes en cours, historique)

## 📱 Mise à Jour du PWA

### Version de l'Application

La version de l'application a été mise à jour de `0.0.0` à `1.1.0` pour refléter cette nouvelle fonctionnalité majeure.

**Fichiers modifiés**:
- `package.json` → `version: "1.1.0"`
- `vite.config.ts` → `manifest.version: "1.1.0"`

### Comportement Automatique

Lorsque les utilisateurs visiteront l'application après le déploiement :

1. ✅ Le nouveau Service Worker sera automatiquement téléchargé
2. ✅ Une notification s'affichera : "Mise à jour disponible"
3. ✅ L'utilisateur pourra cliquer sur "Mettre à jour" pour rafraîchir
4. ✅ Ou attendre, et la mise à jour se fera au prochain rechargement

Le système PWA est configuré avec `registerType: 'autoUpdate'` donc **pas d'intervention manuelle nécessaire** !

## 🔍 Vérification du Docker-Entrypoint

Le script `docker-entrypoint.sh` est déjà configuré pour gérer cette mise à jour :

```bash
# Lignes 43-49 du docker-entrypoint.sh
if [ -f "/app/config/world-map-quests.json" ]; then
  echo "🗺️ Migration des quêtes depuis JSON..."
  node dist/scripts/migrate-quests-from-json.js || echo "⚠️ Erreur migration quêtes (non bloquant)"
else
  echo "ℹ️ Fichier world-map-quests.json non trouvé, migration des quêtes ignorée"
fi
```

## 🚀 Étapes de Déploiement

### 1. Build de l'image Docker

```bash
docker-compose build backend
```

Le Dockerfile copie automatiquement :
- Le fichier `server/config/world-map-quests.json` mis à jour
- Le script compilé `dist/scripts/migrate-quests-from-json.js`

### 2. Déploiement

```bash
docker-compose up -d
```

### 3. Vérification des Logs

Vérifiez que la migration s'est bien déroulée :

```bash
docker-compose logs backend | grep "Migration des quêtes"
```

Vous devriez voir :
```
🗺️ Migration des quêtes depuis JSON...
✅ 36 quêtes migrées
✅ La progression des joueurs est préservée
🎉 Migration terminée avec succès !
```

## 📊 Impact sur les Joueurs

### Quêtes en cours
- Les quêtes déjà démarrées gardent leur récompense d'origine
- Les nouvelles quêtes lancées après le déploiement auront les nouvelles récompenses

### Progression préservée
- ✅ Îles débloquées → conservées
- ✅ Membres d'équipage → conservés
- ✅ Quêtes actives → conservées
- ✅ Historique de quêtes → conservé

### Nouvelles récompenses visibles
- Immédiatement après le déploiement
- Dans l'interface de sélection de quêtes
- Dans la modal de détails d'île

## 🔄 Rollback (en cas de problème)

Si nécessaire, vous pouvez revenir en arrière :

1. Restaurer l'ancien fichier `world-map-quests.json`
2. Rebuild et redéployer
3. La migration réappliquera les anciennes valeurs

## ✅ Checklist de Déploiement

- [x] Fichier `server/config/world-map-quests.json` mis à jour
- [x] Script `migrate-quests-from-json.ts` testé en local
- [x] Dockerfile configuré pour copier le fichier JSON
- [x] docker-entrypoint.sh configuré pour exécuter la migration
- [ ] Build Docker effectué
- [ ] Déploiement en production
- [ ] Logs vérifiés
- [ ] Interface testée

## 🧪 Test Local avant Production (Optionnel)

Pour tester localement avec Docker avant de déployer :

```bash
# Build local
docker-compose -f docker-compose.yml build backend

# Run local
docker-compose -f docker-compose.yml up backend

# Vérifier les logs
docker-compose logs -f backend
```

## 📝 Notes Importantes

1. **La migration est non-bloquante** : si elle échoue, le serveur démarrera quand même
2. **Pas de perte de données** : la migration préserve toutes les données utilisateurs
3. **Idempotente** : peut être exécutée plusieurs fois sans problème
4. **Rapide** : prend quelques secondes pour 36 quêtes

## 🎮 Après le Déploiement

Les joueurs verront immédiatement :
- Les nouvelles récompenses dans la liste des quêtes
- L'affichage des récompenses de complétion d'île
- Le bonus pour les quêtes multi-membres clairement visible

---

**Date de préparation**: 20 octobre 2025
**Prêt pour déploiement**: ✅ OUI
