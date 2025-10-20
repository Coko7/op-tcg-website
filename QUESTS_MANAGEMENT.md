# Gestion des Quêtes - One Piece Booster Game

## Vue d'ensemble

Ce document explique le système de gestion des quêtes mis en place pour résoudre les problèmes de cohérence et faciliter la maintenance.

## Problème identifié

Sur l'île 2 (Shells Town), une quête nécessitait 2 membres d'équipage alors qu'un seul (Luffy) était disponible à ce stade. Zoro n'est débloqué qu'après avoir terminé l'île.

## Solution implémentée

### 1. Fichier JSON centralisé

**Fichier:** `server/data/world-map-quests.json`

Ce fichier contient toutes les données de la carte du monde :
- Îles (12 îles)
- Membres d'équipage (9 membres)
- Quêtes (36 quêtes)

**Avantages:**
- Facilité de modification sans toucher au code
- Vue d'ensemble claire des dépendances
- Format lisible et modifiable
- Versionnable avec Git

### 2. Script de migration

**Fichier:** `server/src/scripts/migrate-quests-from-json.ts`

**Commande:** `npm run migrate-quests` (dans le dossier server)

**Fonctionnalités:**
- Lit les données depuis `world-map-quests.json`
- Met à jour la base de données
- **PRÉSERVE** la progression des joueurs :
  - Îles débloquées (`user_islands`)
  - Membres d'équipage obtenus (`user_crew_members`)
  - Quêtes actives (`active_quests`)
  - Historique des quêtes (`quest_history`)
- Désactive les anciennes données au lieu de les supprimer
- Initialise automatiquement les nouveaux utilisateurs

**Gestion des contraintes de clés étrangères:**
Le script procède en 2 étapes pour éviter les erreurs de contraintes :
1. Insertion des membres d'équipage sans `unlock_island_id`
2. Insertion des îles
3. Mise à jour des `unlock_island_id` des membres d'équipage

### 3. Corrections apportées

Les quêtes suivantes ont été corrigées pour correspondre aux membres d'équipage disponibles :

#### Île 2 - Shells Town
- **quest_shells_1** : "Libérer Zoro" - `required_crew_count: 1` (Luffy uniquement)
- **quest_shells_2** : "Affronter le Capitaine Morgan" - `required_crew_count: 1` ✅ (corrigé de 2 à 1)
- **quest_shells_3** : "Réparer le navire" - `required_crew_count: 1`

#### Autres quêtes rendues non-répétables
Certaines quêtes importantes de l'histoire ont été marquées comme non-répétables :
- quest_shells_1 (Libérer Zoro)
- quest_syrup_3 (Obtenir le Going Merry)
- quest_baratie_3 (Duel avec Mihawk)
- quest_arlong_3 (Vaincre Arlong)
- quest_drum_3 (Soigner Nami)
- quest_alabasta_3 (Vaincre Crocodile)
- quest_water7_2 (Sauver Robin)
- quest_water7_3 (Obtenir le Thousand Sunny)
- quest_thriller_3 (Vaincre Oz et Moria)
- quest_sabaody_3 (Se préparer au Nouveau Monde)

## Comment modifier les quêtes

### Étape 1 : Modifier le JSON

Éditez `server/data/world-map-quests.json` avec vos modifications.

**Exemple - Changer la durée d'une quête:**
```json
{
  "id": "quest_fuchsia_1",
  "island_id": "island_windmill_village",
  "name": "Chercher de la viande",
  "description": "Luffy a toujours faim ! Trouvez de la viande pour le repas.",
  "duration_hours": 2,  // ← Changé de 1 à 2
  "reward_berrys": 50,
  "required_crew_count": 1,
  "specific_crew_member_id": "crew_luffy",
  "order_index": 1,
  "is_repeatable": true
}
```

### Étape 2 : Exécuter la migration

```bash
cd server
npm run migrate-quests
```

### Étape 3 : Vérifier

La migration affichera un résumé avec :
- Nombre d'îles, membres et quêtes migrés
- Confirmation que la progression des joueurs est préservée
- Nombre d'utilisateurs vérifiés

## Structure des données

### Île (Island)
```json
{
  "id": "island_windmill_village",
  "name": "Village de Fuchsia",
  "order_index": 1,
  "description": "Le village natal de Luffy dans East Blue",
  "latitude": 12,
  "longitude": 8,
  "unlock_requirement_island_id": null,
  "final_reward_type": "berrys",
  "final_reward_value": 500,
  "final_reward_crew_member_id": null
}
```

### Membre d'équipage (Crew Member)
```json
{
  "id": "crew_luffy",
  "name": "Monkey D. Luffy",
  "description": "Le capitaine de l'équipage...",
  "image_url": "/images/crew/luffy.png",
  "unlock_island_id": null,
  "order_index": 1
}
```

### Quête (Quest)
```json
{
  "id": "quest_fuchsia_1",
  "island_id": "island_windmill_village",
  "name": "Chercher de la viande",
  "description": "Luffy a toujours faim !",
  "duration_hours": 1,
  "reward_berrys": 50,
  "required_crew_count": 1,
  "specific_crew_member_id": "crew_luffy",
  "order_index": 1,
  "is_repeatable": true
}
```

## Points importants

### Cohérence des membres d'équipage

Avant de créer une quête nécessitant plusieurs membres, vérifiez qu'ils sont disponibles :

**Membres disponibles par île:**
1. Village de Fuchsia : Luffy uniquement
2. Shells Town : Luffy + Zoro (après complétion)
3. Orange Town : Luffy + Zoro + Nami (après complétion)
4. Village de Syrup : Luffy + Zoro + Nami + Usopp (après complétion)
5. Restaurant Baratie : + Sanji (après complétion)
6. Parc Arlong : Tous les précédents
7. Loguetown : Tous les précédents
8. Île de Drum : + Chopper (après complétion)
9. Royaume d'Alabasta : + Robin (après complétion)
10. Water Seven : + Franky (après complétion)
11. Thriller Bark : + Brook (après complétion)
12. Archipel Sabaody : Tous

### Vérification des dépendances

Lors de la création d'une quête, assurez-vous que :
- `island_id` correspond à une île existante
- `required_crew_count` ≤ nombre de membres disponibles sur cette île
- Si `specific_crew_member_id` est défini, ce membre doit être débloqué

## Commandes utiles

### En développement local

```bash
# Migration des quêtes depuis JSON
cd server
npm run migrate-quests

# Réinitialiser complètement les données de la carte du monde
npm run seed-world
```

### En production (Docker)

La migration des quêtes est **automatique** au démarrage du conteneur Docker !

**Ordre d'exécution dans Docker :**

1. ✅ Vérification/création de la base de données
2. ✅ Exécution des migrations de schéma (tables, colonnes)
3. ✅ Initialisation des achievements
4. ✅ **Migration des quêtes depuis JSON** ⬅️ C'EST ICI !
5. ✅ Correction des raretés des cartes
6. ✅ Configuration des tâches cron
7. ✅ Démarrage du serveur

**Pour modifier les quêtes en production :**

1. Modifier `server/data/world-map-quests.json`
2. Rebuild l'image Docker : `docker-compose build backend`
3. Redémarrer le conteneur : `docker-compose restart backend`
4. La migration s'exécutera automatiquement au démarrage ✨

**Logs Docker :**

Pour vérifier que la migration s'est bien exécutée :

```bash
docker logs op-game-backend
```

Vous devriez voir :
```
🗺️ Migration des quêtes depuis JSON...
✅ 36 quêtes migrées
✅ La progression des joueurs est préservée
```

## Maintenance future

1. **Ajout d'une nouvelle île:**
   - Ajouter l'île dans le JSON
   - Ajouter les quêtes associées
   - Optionnellement ajouter un nouveau membre d'équipage
   - Exécuter la migration

2. **Modification des récompenses:**
   - Modifier les valeurs dans le JSON
   - Exécuter la migration

3. **Ajustement de la difficulté:**
   - Modifier `duration_hours` et `required_crew_count`
   - Exécuter la migration

## Sécurité

- La progression des joueurs est **TOUJOURS** préservée
- Les anciennes données sont désactivées, pas supprimées
- Possibilité de rollback en cas de problème
- Logs détaillés pour tracer les modifications
