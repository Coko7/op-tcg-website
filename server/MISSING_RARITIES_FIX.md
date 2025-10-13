# Fix Critique : Raretés Manquantes dans le Mapping

## 🚨 Problème Critique Identifié

**Plusieurs cartes ont été importées avec une rareté incorrecte** car le `RARITY_MAPPING` ne contenait PAS toutes les raretés présentes dans les fichiers Vegapull.

### Exemple de Cartes Affectées

- `OP09-004 (Shanks)` : devrait être `SuperRare` mais était `common`
- Toutes les cartes avec rareté `Special`, `Promo` ou `TreasureRare` dans Vegapull
- Potentiellement **des centaines de cartes** impactées

## 🔍 Analyse

### Raretés Trouvées dans Vegapull

Après analyse complète des fichiers `data/vegapull/cards_*.json` :

```
"rarity":"Common"       ✅ Dans le mapping
"rarity":"Leader"       ✅ Dans le mapping
"rarity":"Promo"        ❌ MANQUANT !
"rarity":"Rare"         ✅ Dans le mapping
"rarity":"SecretRare"   ✅ Dans le mapping
"rarity":"Special"      ❌ MANQUANT !
"rarity":"SuperRare"    ✅ Dans le mapping
"rarity":"TreasureRare" ❌ MANQUANT !
"rarity":"Uncommon"     ✅ Dans le mapping
```

### Raretés Manquantes

3 raretés n'étaient PAS dans le mapping original :

1. **`"Special"`** - Cartes spéciales
   - Fallback actuel : `'common'` ❌
   - Correct : `'super_rare'` ✅

2. **`"Promo"`** - Cartes promotionnelles
   - Fallback actuel : `'common'` ❌
   - Correct : `'rare'` ✅

3. **`"TreasureRare"`** - Treasure Rares
   - Fallback actuel : `'common'` ❌
   - Correct : `'secret_rare'` ✅

### Impact

Toutes les cartes avec ces raretés dans Vegapull ont été importées comme `'common'` à cause du fallback :

```typescript
const rarity = RARITY_MAPPING[vegapullCard.rarity] || 'common';
                                                      ^^^^^^^^ Fallback utilisé !
```

## ✅ Solution Appliquée

### Mapping Complet

**Fichiers modifiés** :
- `server/src/scripts/import-vegapull-data.ts`
- `server/src/scripts/fix-all-rarities.ts`
- `server/src/scripts/diagnose-rarity-issues.ts`

**Nouveau mapping** :

```typescript
const RARITY_MAPPING: Record<string, string> = {
  'Leader': 'leader',            // Cartes Leader
  'SuperRare': 'super_rare',     // Super Rares
  'Rare': 'rare',                // Rares
  'Uncommon': 'uncommon',        // Peu communes
  'Common': 'common',            // Communes
  'SecretRare': 'secret_rare',   // Secret Rares
  'SpecialRare': 'secret_rare',  // Special Rares (alias)
  'TreasureRare': 'secret_rare', // Treasure Rares ← AJOUTÉ
  'Special': 'super_rare',       // Cartes Special ← AJOUTÉ
  'Promo': 'rare'                // Promos ← AJOUTÉ
};
```

### Justification des Mappings

| Vegapull | DB | Raison |
|----------|-------|---------|
| `TreasureRare` | `secret_rare` | Très rares, même niveau que Secret |
| `Special` | `super_rare` | Spéciales mais pas ultra-rares |
| `Promo` | `rare` | Promotionnelles, niveau rare standard |

## 🔄 Correction des Données Existantes

### Script Automatique

Le script `fix-all-rarities.ts` corrigera automatiquement toutes les cartes :

```bash
# Sur votre serveur de production
cd server
npm run build
node dist/scripts/fix-all-rarities.js
```

### Exécution Automatique

Le script s'exécute **automatiquement au démarrage Docker** :
- Fichier : `server/scripts/docker-entrypoint.sh`
- Ligne : `node dist/scripts/fix-all-rarities.js`
- Mode : Non-bloquant (le serveur démarre même en cas d'échec)

## 📊 Vérification

### Avant le Fix

```sql
SELECT rarity, COUNT(*) FROM cards
WHERE vegapull_id IN (
  SELECT id FROM vegapull_cards
  WHERE rarity IN ('Special', 'Promo', 'TreasureRare')
)
GROUP BY rarity;
```

**Résultat attendu** : Toutes ces cartes auront `rarity='common'` ❌

### Après le Fix

**Résultat attendu** :
- Cartes `Special` → `rarity='super_rare'` ✅
- Cartes `Promo` → `rarity='rare'` ✅
- Cartes `TreasureRare` → `rarity='secret_rare'` ✅

## 🚀 Prochaines Étapes

1. ✅ **Mapping corrigé** dans tous les scripts
2. ✅ **Script de diagnostic** créé (`analyze-vegapull-rarities.ts`)
3. ✅ **Script de correction** mis à jour (`fix-all-rarities.ts`)
4. ⏳ **Rebuild Docker** pour appliquer les corrections
5. ⏳ **Vérifier les logs** au démarrage pour voir les statistiques

## 📝 Commandes Utiles

### Analyser les Raretés Vegapull

```bash
cd server
npx tsx src/scripts/analyze-vegapull-rarities.ts
```

Ce script affiche :
- Toutes les raretés trouvées dans Vegapull
- Lesquelles sont dans le mapping
- Lesquelles sont manquantes
- Exemples de cartes pour chaque rareté

### Diagnostiquer les Problèmes

```bash
cd server
npx tsx src/scripts/diagnose-rarity-issues.ts
```

Compare la DB avec Vegapull et liste toutes les divergences.

### Corriger les Données

```bash
cd server
npx tsx src/scripts/fix-all-rarities.ts
```

Corrige automatiquement toutes les raretés incorrectes.

## ⚠️ Important pour l'Avenir

**Lors de l'ajout de nouveaux boosters** :

1. Vérifier s'il y a de nouvelles raretés :
   ```bash
   cd data/vegapull
   cat cards_*.json | grep -oP '"rarity":"[^"]*"' | sort -u
   ```

2. Ajouter les nouvelles raretés au `RARITY_MAPPING`

3. Exécuter le script d'analyse pour vérifier :
   ```bash
   npx tsx src/scripts/analyze-vegapull-rarities.ts
   ```

4. Si des raretés manquent, mettre à jour le mapping dans **TOUS** les scripts :
   - `import-vegapull-data.ts`
   - `fix-all-rarities.ts`
   - `diagnose-rarity-issues.ts`

## 📚 Fichiers Associés

- `server/src/scripts/import-vegapull-data.ts` - Import principal
- `server/src/scripts/fix-all-rarities.ts` - Correction automatique
- `server/src/scripts/diagnose-rarity-issues.ts` - Diagnostic
- `server/src/scripts/analyze-vegapull-rarities.ts` - Analyse des raretés (NOUVEAU)
- `server/scripts/docker-entrypoint.sh` - Exécution auto au démarrage
- `server/RARITY_FIX_SUMMARY.md` - Guide général sur les raretés
- `RARITY_ORDER_FIX.md` - Fix de l'ordre d'affichage

## 📅 Historique

- **2025-10-12** : Découverte du problème (cartes comme OP09-004 avec mauvaise rareté)
- **2025-10-12** : Analyse complète - 3 raretés manquantes identifiées
- **2025-10-12** : Mapping corrigé avec `Special`, `Promo`, `TreasureRare`
- **2025-10-12** : Scripts de correction et diagnostic mis à jour
