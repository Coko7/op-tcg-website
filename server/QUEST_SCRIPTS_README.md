# Scripts de Gestion des Quêtes

Ce document explique comment utiliser les scripts de gestion des quêtes de la carte du monde.

## 📜 Scripts Disponibles

### 1. `rebalance-quests` - Rééquilibrer les récompenses

**Commande**:
```bash
npm run rebalance-quests
```

**Ce qu'il fait**:
- Lit toutes les quêtes depuis `config/world-map-quests.json`
- Recalcule les récompenses selon la formule : `(durée × membres × 50) × (1 + bonus)`
- Met à jour le fichier JSON avec les nouvelles récompenses
- Affiche un rapport détaillé des changements

**Quand l'utiliser**:
- Quand vous voulez ajuster la formule de récompenses
- Après avoir ajouté de nouvelles quêtes
- Pour rééquilibrer l'économie du jeu

**Output exemple**:
```
📋 Combattre Buggy
   ⏰ Durée: 3h | 👥 Membres: 2
   💰 175 → 375 berrys (+200, +114%)

✅ Récompenses rééquilibrées avec succès !
```

### 2. `migrate-quests` - Migrer vers la base de données

**Commande**:
```bash
npm run migrate-quests
```

**Ce qu'il fait**:
- Lit les données depuis `config/world-map-quests.json`
- Met à jour la base de données SQLite
- **Préserve** toute la progression des joueurs
- Met à jour les îles, membres d'équipage et quêtes

**Quand l'utiliser**:
- Après avoir modifié le fichier JSON
- Pour déployer de nouvelles quêtes ou récompenses
- Après avoir utilisé `rebalance-quests`

**Output exemple**:
```
🗺️ Migration des quêtes depuis JSON...
✅ 36 quêtes migrées
✅ La progression des joueurs est préservée
🎉 Migration terminée avec succès !
```

### 3. `seed-world` - Initialiser les données

**Commande**:
```bash
npm run seed-world
```

**Ce qu'il fait**:
- Crée les îles, membres d'équipage et quêtes depuis zéro
- **SUPPRIME** toutes les données existantes
- Initialise tous les utilisateurs avec Luffy et la première île

**⚠️ ATTENTION**: Ce script supprime toutes les données ! N'utilisez que pour :
- Développement local
- Tests
- Réinitialisation complète

## 🔄 Workflow Recommandé

### Pour modifier les récompenses des quêtes existantes:

```bash
# 1. Rééquilibrer les récompenses
cd server
npm run rebalance-quests

# 2. Vérifier les changements dans config/world-map-quests.json
# (optionnel) git diff config/world-map-quests.json

# 3. Migrer vers la base de données
npm run migrate-quests

# 4. Tester l'application
npm run dev
```

### Pour ajouter de nouvelles quêtes:

```bash
# 1. Éditer manuellement config/world-map-quests.json
# Ajouter vos nouvelles quêtes

# 2. (Optionnel) Rééquilibrer toutes les récompenses
npm run rebalance-quests

# 3. Migrer vers la base de données
npm run migrate-quests

# 4. Tester
npm run dev
```

## 📊 Formule de Calcul des Récompenses

La formule actuelle dans `rebalance-quest-rewards.ts`:

```typescript
// Base: 50 berrys par heure par membre
const baseReward = durationHours * requiredCrewCount * 50;

// Bonus multi-membre: +25% par membre supplémentaire
if (requiredCrewCount > 1) {
  const bonusPercentage = (requiredCrewCount - 1) * 0.25;
  multiCrewBonus = baseReward * bonusPercentage;
}

// Total arrondi au multiple de 5
const totalReward = Math.ceil((baseReward + multiCrewBonus) / 5) * 5;
```

### Exemples:

| Durée | Membres | Base | Bonus | Total |
|-------|---------|------|-------|-------|
| 1h | 1 | 50 | 0% | **50** |
| 3h | 2 | 300 | +25% | **375** |
| 4h | 3 | 600 | +50% | **900** |
| 8h | 5 | 2000 | +100% | **4,000** |

## 🔧 Personnalisation

### Modifier la formule de récompense

Éditez `src/scripts/rebalance-quest-rewards.ts`:

```typescript
function calculateQuestReward(durationHours: number, requiredCrewCount: number): number {
  // Modifiez ici pour changer la formule
  const baseReward = durationHours * requiredCrewCount * 50; // Changez 50 pour ajuster la base

  // Modifiez le bonus
  if (requiredCrewCount > 1) {
    const bonusPercentage = (requiredCrewCount - 1) * 0.25; // Changez 0.25 pour ajuster le bonus
    multiCrewBonus = baseReward * bonusPercentage;
  }

  return Math.ceil((baseReward + multiCrewBonus) / 5) * 5;
}
```

### Ajouter une nouvelle île

Éditez `config/world-map-quests.json`:

```json
{
  "islands": [
    // ... îles existantes
    {
      "id": "island_nouvelle",
      "name": "Nouvelle Île",
      "order_index": 13,
      "description": "Description de la nouvelle île",
      "latitude": 20,
      "longitude": 90,
      "unlock_requirement_island_id": "island_sabaody",
      "final_reward_type": "berrys",
      "final_reward_value": 15000,
      "final_reward_crew_member_id": null
    }
  ],
  "quests": [
    // ... quêtes existantes
    {
      "id": "quest_nouvelle_1",
      "island_id": "island_nouvelle",
      "name": "Première Quête",
      "description": "Description",
      "duration_hours": 5,
      "reward_berrys": 0, // Sera recalculé par rebalance-quests
      "required_crew_count": 3,
      "specific_crew_member_id": null,
      "order_index": 1,
      "is_repeatable": true
    }
  ]
}
```

Puis exécutez:
```bash
npm run rebalance-quests  # Calcule la récompense automatiquement
npm run migrate-quests    # Met à jour la DB
```

## 📝 Fichiers Importants

- `config/world-map-quests.json` - Source de vérité pour les quêtes
- `src/scripts/rebalance-quest-rewards.ts` - Calcul des récompenses
- `src/scripts/migrate-quests-from-json.ts` - Migration vers DB
- `src/scripts/seed-world-map-data.ts` - Initialisation complète

## 🐳 Déploiement Docker

Le système Docker est configuré pour automatiquement migrer les quêtes au démarrage.

Voir `DEPLOYMENT_QUEST_UPDATE.md` pour plus de détails.

---

*Dernière mise à jour: 20 octobre 2025*
