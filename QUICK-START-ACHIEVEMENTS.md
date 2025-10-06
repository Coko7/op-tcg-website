# 🚀 Démarrage Rapide - Système d'Achievements

## ✅ Solution au problème "Aucun achievement affiché"

Le problème venait du fait que la base de données Docker était différente de la base locale.

## 🎯 Pour activer les achievements

**Méthode 1 : Rebuild complet (recommandé)**

```bash
.\rebuild-backend.bat
```

**Méthode 2 : Commandes manuelles**

```bash
# Arrêter les containers
docker-compose down

# Rebuild le backend
docker-compose build backend

# Redémarrer
docker-compose up -d
```

## ⏱️ Temps d'attente

Attendez **30-60 secondes** après le démarrage pour que :
1. ✅ Les migrations s'exécutent
2. ✅ Les achievements soient initialisés
3. ✅ Le serveur démarre complètement

## 🔍 Vérifier que ça fonctionne

```bash
.\check-docker-achievements.bat
```

Vous devriez voir **10 achievements** listés.

## 🌐 Tester dans le navigateur

1. Allez sur : `http://votre-domaine/achievements`
2. Vous devriez voir 10 achievements répartis en 2 catégories :
   - **Ouverture de Boosters** (5 achievements)
   - **Collection** (5 achievements)

## 🐛 Troubleshooting

### Les achievements ne s'affichent toujours pas

1. **Vérifiez les logs du container** :
   ```bash
   docker logs op-game-backend
   ```
   Cherchez les lignes :
   - `🏆 Initialisation des achievements...`
   - `✅ 10 achievements trouvés dans la base`

2. **Vérifiez la base de données** :
   ```bash
   docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM achievements;"
   ```

3. **Réinitialisez manuellement** :
   ```bash
   docker exec op-game-backend node scripts/run-migrations.js
   docker exec op-game-backend node scripts/init-achievements.js
   ```

4. **Vérifiez la console du navigateur (F12)** :
   - Recherchez les erreurs réseau
   - Vérifiez que l'API répond

### Erreur "database is locked"

```bash
docker-compose restart backend
```

### Les achievements apparaissent vides (0%)

C'est normal ! Les achievements commencent à 0% de progression. Ils se mettront à jour automatiquement quand vous :
- Ouvrez des boosters
- Obtenez de nouvelles cartes

## 📊 Comment gagner des Berrys avec les achievements

1. **Ouvrez des boosters** pour progresser dans les achievements "Ouverture de Boosters"
2. **Collectionnez des cartes uniques** pour progresser dans les achievements "Collection"
3. Quand un achievement atteint **100%**, un bouton **"Réclamer"** apparaît
4. Cliquez sur **"Réclamer"** pour recevoir vos Berrys !

## 🎮 Liste des achievements

| Nom | Objectif | Récompense |
|-----|----------|------------|
| 🎁 Premier Booster | 1 booster | 50 Berrys |
| 📦 Collectionneur Débutant | 10 boosters | 100 Berrys |
| 🎊 Collectionneur Assidu | 50 boosters | 250 Berrys |
| 🏆 Maître Collectionneur | 100 boosters | 500 Berrys |
| 👑 Légende des Boosters | 250 boosters | 1000 Berrys |
| 🃏 Première Collection | 10 cartes | 50 Berrys |
| 🗂️ Collection Grandissante | 50 cartes | 150 Berrys |
| 📚 Bibliothèque Impressionnante | 100 cartes | 300 Berrys |
| 💎 Collection Épique | 200 cartes | 600 Berrys |
| ⭐ Collectionneur Ultime | 500 cartes | 1500 Berrys |

**Total possible : 4550 Berrys** en complétant tous les achievements ! 💰
