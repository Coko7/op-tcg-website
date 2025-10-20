# Configuration Files

Ce dossier contient les fichiers de configuration de l'application qui **DOIVENT** être versionnés dans Git.

## Fichiers

### world-map-quests.json

Contient la configuration complète de la carte du monde :
- **Îles** : 12 îles avec leurs coordonnées et récompenses
- **Membres d'équipage** : 9 membres avec leurs conditions de déblocage
- **Quêtes** : 36 quêtes avec leurs prérequis et récompenses

**Ce fichier est utilisé pour :**
1. La migration automatique des quêtes au démarrage du serveur
2. La mise à jour des données de jeu en production
3. La cohérence entre tous les environnements (dev, staging, prod)

**Modification :**
Voir le fichier `QUESTS_MANAGEMENT.md` à la racine du projet pour les instructions détaillées.

## Important

⚠️ **Ce dossier NE DOIT PAS être dans `.gitignore`**

Contrairement au dossier `server/data/` qui contient :
- La base de données SQLite (ignorée par Git)
- Les fichiers temporaires

Le dossier `server/config/` contient des fichiers de configuration qui doivent être versionnés pour assurer la cohérence entre les environnements.
