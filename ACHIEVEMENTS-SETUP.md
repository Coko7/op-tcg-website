# Configuration des Achievements

## Initialisation automatique

Le système d'achievements est maintenant **initialisé automatiquement** au démarrage du container Docker backend.

### Comment ça fonctionne

Au démarrage du container, le script `docker-entrypoint.sh` :

1. ✅ Vérifie si la base de données existe
2. 🔄 Exécute les migrations (création des tables achievements)
3. 🏆 Initialise les achievements par défaut (si aucun n'existe)
4. 🎮 Démarre le serveur

### Achievements par défaut

**10 achievements** sont créés automatiquement :

#### Ouverture de Boosters (5 achievements)
- 🎁 **Premier Booster** : Ouvrez votre premier booster (50 Berrys)
- 📦 **Collectionneur Débutant** : Ouvrez 10 boosters (100 Berrys)
- 🎊 **Collectionneur Assidu** : Ouvrez 50 boosters (250 Berrys)
- 🏆 **Maître Collectionneur** : Ouvrez 100 boosters (500 Berrys)
- 👑 **Légende des Boosters** : Ouvrez 250 boosters (1000 Berrys)

#### Collection de Cartes (5 achievements)
- 🃏 **Première Collection** : Obtenez 10 cartes différentes (50 Berrys)
- 🗂️ **Collection Grandissante** : Obtenez 50 cartes différentes (150 Berrys)
- 📚 **Bibliothèque Impressionnante** : Obtenez 100 cartes différentes (300 Berrys)
- 💎 **Collection Épique** : Obtenez 200 cartes différentes (600 Berrys)
- ⭐ **Collectionneur Ultime** : Obtenez 500 cartes différentes (1500 Berrys)

## Rebuild du container

Si vous avez déjà un container en cours d'exécution, vous devez le reconstruire pour appliquer les modifications :

```bash
# Arrêter les containers
docker-compose down

# Rebuild l'image backend
docker-compose build backend

# Redémarrer tous les services
docker-compose up -d
```

## Initialisation manuelle (si nécessaire)

Si vous souhaitez réinitialiser les achievements manuellement :

```bash
# Se connecter au container
docker exec -it op-game-backend sh

# Exécuter l'initialisation
npm run init-achievements
```

## Vérifier que les achievements existent

```bash
# Compter les achievements dans la base Docker
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM achievements;"

# Voir tous les achievements
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT name, threshold, reward_berrys FROM achievements;"
```

## Troubleshooting

### Aucun achievement ne s'affiche
1. Vérifiez les logs du container : `docker logs op-game-backend`
2. Vérifiez que les migrations ont été exécutées
3. Vérifiez que les achievements ont été initialisés

### Base de données verrouillée
Si vous obtenez une erreur "database is locked", redémarrez le container :
```bash
docker-compose restart backend
```
