# Fix: Ordre d'Affichage des Raretés dans la Collection

## 🐛 Problème Identifié

Les cartes **Leader** apparaissaient à des positions incorrectes dans la page Collection :
- Parfois avant les cartes Secret Rare
- Ordre incohérent et illogique
- Filtres dans le mauvais ordre

**Cause** : L'ordre de tri `rarityOrder` dans `Collection.tsx` ne contenait pas `'leader'`, ce qui faisait que les cartes Leader n'avaient pas de position définie dans le tri.

## ✅ Hiérarchie Correcte

Les cartes Leader sont **plus rares que Rare, mais moins rares que Super Rare** :

```
1. Secret Rare    (secret_rare)  - 500 Berrys
2. Super Rare     (super_rare)   - 150 Berrys
3. ⭐ Leader      (leader)        - 100 Berrys  ← Position corrigée
4. Rare           (rare)          - 50 Berrys
5. Uncommon       (uncommon)      - 25 Berrys
6. Common         (common)        - 10 Berrys
```

### Justification

- **Distribution** : Leaders uniquement dans Starter Decks (pas en boosters)
- **Unicité** : Une seule carte Leader par deck
- **Gameplay** : Rôle central, mérite position élevée
- **Prix** : 100 Berrys (entre Rare et Super Rare)

## 🔧 Corrections Appliquées

### 1. Ordre de Tri (Collection.tsx:102)

**Avant** :
```typescript
const rarityOrder = ['secret_rare', 'super_rare', 'rare', 'uncommon', 'common'];
// Leader manquant = position aléatoire !
```

**Après** :
```typescript
const rarityOrder = ['secret_rare', 'super_rare', 'leader', 'rare', 'uncommon', 'common'];
// Leader entre Super Rare et Rare ✅
```

### 2. Ordre des Filtres (Collection.tsx:185-192)

Les filtres dans le menu déroulant ont été réorganisés pour correspondre à l'ordre de tri :

```typescript
// Raretés (du plus rare au plus commun, cohérent avec l'ordre de tri)
// Leader est plus rare que Rare mais moins rare que SuperRare
{ value: 'secret_rare', label: RARITY_LABELS.secret_rare, ... },
{ value: 'super_rare', label: RARITY_LABELS.super_rare, ... },
{ value: 'leader', label: RARITY_LABELS.leader, ... },  // ← Position corrigée
{ value: 'rare', label: RARITY_LABELS.rare, ... },
{ value: 'uncommon', label: RARITY_LABELS.uncommon, ... },
{ value: 'common', label: RARITY_LABELS.common, ... },
```

### 3. Prix de Vente Backend (userController.ts:12-19)

**Avant** :
```typescript
const CARD_SELL_PRICES: Record<string, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  super_rare: 150,
  secret_rare: 500,
  // leader: manquant !
};
```

**Après** :
```typescript
const CARD_SELL_PRICES: Record<string, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  leader: 100,        // ← Ajouté
  super_rare: 150,
  secret_rare: 500,
};
```

## 📊 Résultats Attendus

Après cette correction, dans la page Collection :

1. ✅ Les cartes s'affichent dans l'ordre : Secret Rare → Super Rare → **Leader** → Rare → Uncommon → Common
2. ✅ Les filtres apparaissent dans le même ordre logique
3. ✅ Les cartes Leader peuvent être vendues pour 100 Berrys (prix cohérent)
4. ✅ Ordre cohérent sur toute l'application

## 🔍 Vérification

Pour tester que la correction fonctionne :

1. Ouvrir la page Collection
2. Observer l'ordre d'affichage des cartes (les Leaders doivent être après les Super Rare)
3. Ouvrir le menu des filtres → section "Rareté"
4. Vérifier que l'ordre est : Secret Rare, Super Rare, Leader, Rare, Uncommon, Common
5. Tester la vente d'une carte Leader (doit rapporter 100 Berrys)

## 📝 Fichiers Modifiés

- ✅ `src/pages/Collection.tsx` - Ordre de tri (ligne 102)
- ✅ `src/pages/Collection.tsx` - Ordre des filtres (lignes 185-192)
- ✅ `server/src/controllers/userController.ts` - Prix Leader (ligne 16)
- ✅ `docs/RARITY_HIERARCHY.md` - Documentation créée

## 📚 Documentation

Pour référence future, consulter :
- `docs/RARITY_HIERARCHY.md` - Guide complet de la hiérarchie des raretés
- `src/types/index.ts` - Types et constantes (CARD_SELL_PRICES)

## ⚠️ Important pour les Futurs Développements

Lors de l'ajout de nouvelles fonctionnalités qui trient ou affichent des cartes par rareté :

1. **Toujours utiliser l'ordre canonique** : `['secret_rare', 'super_rare', 'leader', 'rare', 'uncommon', 'common']`
2. **Ne jamais oublier** `leader` dans les ordres de tri
3. **Maintenir la cohérence** entre frontend et backend
4. **Documenter** tout changement dans `docs/RARITY_HIERARCHY.md`

## 📅 Historique

- **2025-10-12** : Correction de l'ordre - Leader positionné entre Super Rare et Rare
  - Tri des cartes dans Collection
  - Ordre des filtres
  - Prix de vente backend
  - Documentation créée
