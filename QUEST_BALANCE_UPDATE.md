# Mise à Jour de l'Équilibrage des Quêtes

## 📋 Résumé

Le système de quêtes a été rééquilibré pour offrir une progression plus cohérente et encourager les quêtes multi-membres.

## 🧮 Formule de Calcul des Récompenses

### Formule de Base
```
Récompense = (durée_heures × nombre_membres × 50) × (1 + bonus_multi_membre)
```

### Détails
- **Base**: 50 berrys par heure et par membre
  - Exemple: 1h + 1 membre = 50 berrys
  - Exemple: 2h + 1 membre = 100 berrys
  - Exemple: 1h + 2 membres = 100 berrys

- **Bonus Multi-Membre**: +25% par membre supplémentaire après le premier
  - 2 membres: +25% de bonus
  - 3 membres: +50% de bonus
  - 4 membres: +75% de bonus
  - 5 membres: +100% de bonus
  - 6 membres: +125% de bonus

### Exemples Concrets

| Durée | Membres | Calcul | Récompense |
|-------|---------|--------|------------|
| 1h | 1 | 1×1×50 | 50 berrys |
| 2h | 1 | 2×1×50 | 100 berrys |
| 3h | 2 | 3×2×50 × 1.25 | 375 berrys |
| 4h | 3 | 4×3×50 × 1.50 | 900 berrys |
| 5h | 4 | 5×4×50 × 1.75 | 1,750 berrys |
| 8h | 5 | 8×5×50 × 2.00 | 4,000 berrys |
| 10h | 6 | 10×6×50 × 2.25 | 6,750 berrys |

## 📊 Statistiques Avant/Après

- **Total des récompenses**: 15,550 → 37,400 berrys (+140%)
- **Moyenne par quête**: 432 → 1,039 berrys (+140%)
- **Nombre de quêtes**: 36 (inchangé)

## 🎯 Avantages du Nouveau Système

1. **Prévisibilité**: Les joueurs peuvent calculer facilement les récompenses
2. **Équilibre**: Les quêtes longues et difficiles rapportent proportionnellement plus
3. **Encouragement**: Bonus significatif pour les quêtes à plusieurs membres
4. **Progression**: Récompenses croissantes au fil de l'aventure

## 🔧 Changements Techniques

### Nouveau Script: `rebalance-quest-rewards.ts`
- Calcule automatiquement les récompenses selon la formule
- Met à jour le fichier `world-map-quests.json`
- Affiche un rapport détaillé des changements

### Migration de Base de Données
- Utilise le script existant `migrate-quests-from-json.ts`
- Préserve la progression des joueurs
- Met à jour les récompenses dans la base de données

### Interface Utilisateur
- **Nouveau**: Affichage de la récompense de complétion d'île
- Les joueurs peuvent maintenant voir ce qu'ils vont gagner en complétant toutes les quêtes d'une île
- Affiché dans la modal de détails de l'île (avant la complétion)

## 📝 Utilisation Future

Pour rééquilibrer les récompenses à nouveau:

1. Exécuter le script de rééquilibrage:
```bash
cd server
npx tsx src/scripts/rebalance-quest-rewards.ts
```

2. Migrer vers la base de données:
```bash
npx tsx src/scripts/migrate-quests-from-json.ts
```

## 🎮 Impact sur le Gameplay

### Quêtes Solo (1 membre)
- Récompenses plus modestes mais accessibles
- Idéal pour progresser rapidement

### Quêtes Multi-Membres (2-6 membres)
- Récompenses significativement plus élevées grâce au bonus
- Encourage la stratégie et l'utilisation de tout l'équipage
- Plus difficiles car mobilisent plusieurs membres

### Exemples de Quêtes Populaires

**"Combattre Buggy"** (3h, 2 membres)
- Avant: 175 berrys
- Après: 375 berrys (+114%)

**"Déjouer le plan de Kuro"** (4h, 3 membres)
- Avant: 250 berrys
- Après: 900 berrys (+260%)

**"Sauver Robin"** (8h, 5 membres)
- Avant: 1,000 berrys
- Après: 4,000 berrys (+300%)

**"Se préparer au Nouveau Monde"** (10h, 6 membres)
- Avant: 1,500 berrys
- Après: 6,750 berrys (+350%)

## ✅ Checklist de Déploiement

- [x] Formule mathématique implémentée
- [x] Script de rééquilibrage créé
- [x] Fichier JSON mis à jour
- [x] Base de données migrée
- [x] Interface utilisateur mise à jour
- [x] Affichage des récompenses d'île ajouté
- [x] Documentation créée

---

*Mise à jour effectuée le 20 octobre 2025*
