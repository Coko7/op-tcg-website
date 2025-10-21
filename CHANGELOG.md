# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [1.1.0] - 2025-10-20

### ✨ Ajouté

- **Système de quêtes rééquilibré** avec formule mathématique
  - Base: 5 berrys par heure et par membre
  - Bonus multi-membre: +25% par membre supplémentaire après le premier
  - Les quêtes avec plusieurs membres sont maintenant plus rentables proportionnellement

- **Affichage des récompenses de complétion d'île**
  - Nouvelle section dans la modal de détails d'île
  - Montre la récompense AVANT que l'île soit complétée
  - Affichage clair du type de récompense (berrys ou membre d'équipage)
  - Design cohérent avec le style de l'application

- **Scripts de gestion des quêtes**
  - `npm run rebalance-quests` - Recalcule automatiquement les récompenses
  - Documentation complète dans `server/QUEST_SCRIPTS_README.md`

### 🔧 Modifié

- **Récompenses de toutes les quêtes** (36 quêtes)
  - Total des récompenses: 15,550 → 3,744 berrys (-76%)
  - Moyenne par quête: 432 → 104 berrys
  - Récompenses plus équilibrées et réalistes
  - Exemples notables:
    - "Combattre Buggy" (3h, 2p): 175 → 40 berrys
    - "Déjouer le plan de Kuro" (4h, 3p): 250 → 90 berrys
    - "Sauver Robin" (8h, 5p): 1,000 → 400 berrys

- **Version de l'application**: 0.0.0 → 1.1.0
- **Manifest PWA**: Ajout de la version dans le manifest

### 📚 Documentation

- `QUEST_BALANCE_UPDATE.md` - Détails de la formule et statistiques
- `DEPLOYMENT_QUEST_UPDATE.md` - Guide de déploiement
- `server/QUEST_SCRIPTS_README.md` - Documentation des scripts
- `QUEST_UPDATE_SUMMARY.md` - Résumé global des modifications
- `CHANGELOG.md` - Ce fichier

### 🐳 Infrastructure

- Migration automatique au démarrage Docker
- Préservation de la progression des joueurs lors de la migration
- Fichier `world-map-quests.json` comme source de vérité
- Build Docker optimisé pour inclure les nouvelles données

## [1.0.0] - Date précédente

### Version initiale

- Système de quêtes de la carte du monde
- Collecte de cartes One Piece
- Système d'achievements
- PWA avec notifications
- Système de marketplace
- Leaderboard

---

## Format des Versions

Le projet suit le [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x): Changements incompatibles avec les versions précédentes
- **MINOR** (x.1.x): Nouvelles fonctionnalités compatibles
- **PATCH** (x.x.1): Corrections de bugs compatibles

## Types de Changements

- **Ajouté** - Nouvelles fonctionnalités
- **Modifié** - Changements dans les fonctionnalités existantes
- **Déprécié** - Fonctionnalités qui seront retirées prochainement
- **Retiré** - Fonctionnalités retirées
- **Corrigé** - Corrections de bugs
- **Sécurité** - Corrections de vulnérabilités
