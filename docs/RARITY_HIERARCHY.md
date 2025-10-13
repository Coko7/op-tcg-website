# Hiérarchie des Raretés - One Piece TCG

## 📊 Ordre des Raretés (du plus rare au plus commun)

1. **Secret Rare** (`secret_rare`) ⭐⭐⭐⭐⭐
   - La rareté la plus élevée
   - Cartes ultra-rares et spéciales
   - Mapping Vegapull : `SecretRare`, `SpecialRare`

2. **Super Rare** (`super_rare`) ⭐⭐⭐⭐
   - Très rare, puissantes
   - Mapping Vegapull : `SuperRare`

3. **Leader** (`leader`) 🎖️
   - Cartes Leader du jeu
   - **Plus rare que Rare, moins rare que Super Rare**
   - Une seule par deck, distribuées dans les Starter Decks
   - Mapping Vegapull : `Leader`

4. **Rare** (`rare`) ⭐⭐⭐
   - Rare, bonne qualité
   - Mapping Vegapull : `Rare`

5. **Uncommon** (`uncommon`) ⭐⭐
   - Peu commune
   - Mapping Vegapull : `Uncommon`

6. **Common** (`common`) ⭐
   - Commune, la plus fréquente
   - Mapping Vegapunk : `Common`

## 🔧 Implémentation dans le Code

### Ordre de Tri (Collection.tsx)

```typescript
const rarityOrder = ['secret_rare', 'super_rare', 'leader', 'rare', 'uncommon', 'common'];
```

Cet ordre est utilisé pour :
- ✅ Trier les cartes dans la page Collection
- ✅ Afficher les filtres dans le bon ordre
- ✅ Organiser l'affichage des cartes par priorité

### Mapping depuis Vegapull (import-vegapull-data.ts)

```typescript
const RARITY_MAPPING: Record<string, string> = {
  'Leader': 'leader',
  'SuperRare': 'super_rare',
  'Rare': 'rare',
  'Uncommon': 'uncommon',
  'Common': 'common',
  'SecretRare': 'secret_rare',
  'SpecialRare': 'secret_rare'
};
```

## 📋 Notes Importantes

### Pourquoi Leader est entre Super Rare et Rare ?

1. **Distribution** : Les Leaders ne sont pas dans les boosters normaux, mais dans les Starter Decks
2. **Unicité** : Une seule carte Leader par deck (règle du jeu)
3. **Valeur** : Plus spéciales que les Rares mais moins rares que les Super Rares en termes de disponibilité
4. **Gameplay** : Rôle central dans le jeu, méritent une position élevée dans la hiérarchie

### Cohérence dans l'Application

L'ordre **DOIT** être identique partout :
- ✅ Page Collection (tri et filtres)
- ✅ Statistiques
- ✅ Leaderboard (si applicable)
- ✅ Marketplace (si applicable)
- ✅ Système de prix de vente

### Modification de l'Ordre

Si vous devez modifier l'ordre de rareté :

1. **Mettre à jour** `Collection.tsx` ligne ~102 (rarityOrder)
2. **Mettre à jour** `Collection.tsx` ligne ~187-192 (filterOptions)
3. **Vérifier** tous les fichiers qui utilisent un ordre de tri par rareté
4. **Tester** l'affichage dans la Collection
5. **Documenter** le changement dans ce fichier

## 🎯 Utilisation

### Frontend

```typescript
// Trier des cartes par rareté
const sortedCards = cards.sort((a, b) => {
  const rarityOrder = ['secret_rare', 'super_rare', 'leader', 'rare', 'uncommon', 'common'];
  return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
});
```

### Backend

```sql
-- Trier en SQL (avec CASE WHEN)
SELECT * FROM cards
ORDER BY
  CASE rarity
    WHEN 'secret_rare' THEN 1
    WHEN 'super_rare' THEN 2
    WHEN 'leader' THEN 3
    WHEN 'rare' THEN 4
    WHEN 'uncommon' THEN 5
    WHEN 'common' THEN 6
    ELSE 7
  END,
  name;
```

## 📅 Historique

- **2025-10-12** : Correction de l'ordre - Leader déplacé entre Super Rare et Rare
  - Avant : `['secret_rare', 'super_rare', 'rare', 'uncommon', 'common']` (Leader manquant)
  - Après : `['secret_rare', 'super_rare', 'leader', 'rare', 'uncommon', 'common']`

## 🔗 Références

- Fichier : `src/pages/Collection.tsx` (lignes 102, 187-192)
- Types : `src/types/index.ts` (type Rarity)
- Labels : `src/data/cards.ts` (RARITY_LABELS)
- Import : `server/src/scripts/import-vegapull-data.ts` (RARITY_MAPPING)
