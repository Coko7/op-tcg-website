# Fix: Rareté des Cartes (Leader, SuperRare, etc.)

## 🐛 Problème Identifié

**TOUTES les raretés** ont potentiellement été importées incorrectement, pas seulement les Leaders :
- Les cartes de type "Leader" importées comme "common" au lieu de "leader"
- Les cartes "SuperRare" importées comme "common" au lieu de "super_rare"
- Et potentiellement d'autres raretés affectées

### Cause Racine

Dans les fichiers JSON Vegapull (par exemple `cards_569001.json`), les cartes Leader ont :
```json
{
  "id": "ST01-001",
  "name": "Monkey.D.Luffy",
  "rarity": "Leader",      // ← Champ rareté = "Leader"
  "category": "Leader",    // ← Champ catégorie = "Leader"
  ...
}
```

Le script d'importation original (`import-vegapull-data.ts:173-177`) utilisait :
```typescript
const rarity = RARITY_MAPPING[vegapullCard.rarity] || 'common';
const cardType = CATEGORY_MAPPING[vegapullCard.category] || 'Character';
```

**Le problème** :
- `RARITY_MAPPING` ne contenait pas de mapping pour `"Leader"` comme rareté
- Le fallback `|| 'common'` faisait que toutes les cartes Leader étaient importées avec `rarity="common"`
- Alors qu'elles auraient dû avoir `rarity="leader"` en mappant directement `vegapullCard.rarity`

## ✅ Solution Implémentée

### 1. Script de Diagnostic

**Fichier**: `server/src/scripts/diagnose-rarity-issues.ts`

Ce script analyse TOUTES les cartes et compare avec les données Vegapull :
- 🔍 Compare chaque carte DB avec sa source Vegapull
- 📊 Génère des statistiques détaillées
- 📋 Liste les cartes avec raretés incorrectes
- 🎯 Identifie les patterns d'erreurs

**Utilisation** :
```bash
cd server
npx tsx src/scripts/diagnose-rarity-issues.ts
```

### 2. Script de Correction Universel

**Fichier**: `server/src/scripts/fix-all-rarities.ts`

Ce script corrige **TOUTES** les raretés incorrectes :
- ✅ Charge toutes les cartes Vegapull (source de vérité)
- ✅ Compare avec chaque carte en DB
- ✅ Corrige automatiquement toutes les différences
- ✅ Utilise une transaction pour la sécurité
- ✅ Affiche des statistiques détaillées avant/après
- ✅ Vérifie que la correction a bien fonctionné

**Utilisation** (sur votre environnement de production) :
```bash
cd server
npm run build
node dist/scripts/fix-all-rarities.js
```

Ou avec ts-node en développement :
```bash
cd server
npx tsx src/scripts/fix-all-rarities.ts
```

### 3. Script Legacy (Leaders uniquement)

**Fichier**: `server/src/scripts/fix-leader-rarity.ts`

Script original qui corrige uniquement les Leaders. Conservé pour compatibilité mais **utilisez fix-all-rarities.ts à la place**.

### 4. Correction du Script d'Importation

**Fichier**: `server/src/scripts/import-vegapull-data.ts:35-43`

Changement appliqué - ajout du mapping `'Leader': 'leader'` dans `RARITY_MAPPING` :
```typescript
const RARITY_MAPPING: Record<string, string> = {
  'Leader': 'leader',  // ← Ajout de cette ligne
  'SuperRare': 'super_rare',
  'Rare': 'rare',
  'Uncommon': 'uncommon',
  'Common': 'common',
  'SecretRare': 'secret_rare',
  'SpecialRare': 'secret_rare'
};
```

Cette correction garantit que lors des **futures importations**, les cartes avec `rarity="Leader"` dans Vegapull seront correctement importées avec `rarity="leader"` dans la base de données.

## 🎯 Raretés Attendues par Type de Carte

| Type de Carte | Rareté Attendue | Exemple |
|---------------|-----------------|---------|
| Leader | `leader` | Monkey.D.Luffy (Leader) |
| Character | `common`, `uncommon`, `rare`, `super_rare`, `secret_rare` | Sanji (Character) |
| Event | `common`, `uncommon`, `rare`, etc. | Gum-Gum Jet Pistol |
| Stage | `common`, `uncommon`, `rare`, etc. | Thousand Sunny |

## 📊 Vérification

Pour vérifier que la correction a fonctionné, vous pouvez exécuter cette requête SQL :

```sql
-- Compter les cartes Leader par rareté
SELECT rarity, COUNT(*) as count
FROM cards
WHERE type = 'Leader'
GROUP BY rarity;
```

**Résultat attendu** :
```
rarity  | count
--------|------
leader  | [nombre de cartes Leader]
```

Si d'autres raretés apparaissent (common, rare, etc.), c'est qu'il y a encore des cartes Leader mal configurées.

## 🚀 Exécution Automatique au Démarrage Docker

Le script `fix-all-rarities.js` est **automatiquement exécuté** au démarrage du container Docker backend :

1. **Dans `Dockerfile.backend`** : Le script compilé est copié dans l'image
2. **Dans `docker-entrypoint.sh`** : Le script s'exécute après les migrations
3. **Mode non-bloquant** : Si le script échoue, le serveur démarre quand même
4. **Idempotent** : Peut être exécuté plusieurs fois sans problème

Lors du prochain démarrage Docker, toutes les raretés seront automatiquement corrigées !

## 🔍 Vérification Manuelle

Pour vérifier manuellement avant un redémarrage Docker :

```bash
# 1. Diagnostic (identifie les problèmes)
cd server
npx tsx src/scripts/diagnose-rarity-issues.ts

# 2. Correction (si des problèmes sont trouvés)
npx tsx src/scripts/fix-all-rarities.ts
```

## 🚀 Prochaines Étapes

1. ✅ **Rebuild et restart Docker** - Les corrections seront appliquées automatiquement
2. **Vérifier les logs** au démarrage pour voir les statistiques de correction
3. **Vérifier l'interface utilisateur** pour confirmer que les raretés s'affichent correctement

## 📝 Notes Techniques

### Pourquoi "leader" comme rareté ?

Les cartes Leader dans One Piece TCG ne suivent pas le système de rareté classique. Elles sont distribuées dans les Starter Decks et non dans les boosters réguliers. Utiliser `rarity="leader"` permet de :
- Les distinguer facilement des autres cartes
- Appliquer des règles spécifiques (ex: limite de 1 par deck)
- Les filtrer correctement dans l'interface

### Impact sur le Système de Boosters

Cette correction n'affecte PAS la logique des boosters, car les cartes Leader ne sont généralement pas disponibles dans les boosters aléatoires (elles viennent des Starter Decks).

Si votre système génère des boosters qui incluent des Leaders, vous devrez peut-être ajuster `BoosterService.ts` pour gérer la rareté "leader".
