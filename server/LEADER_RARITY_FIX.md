# Fix: Rareté des Cartes Leader

## 🐛 Problème Identifié

Les cartes de type "Leader" ont été importées avec une rareté incorrecte (généralement "common") au lieu de "leader".

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

### 1. Script de Correction de la Base de Données

**Fichier**: `server/src/scripts/fix-leader-rarity.ts`

Ce script :
- ✅ Identifie toutes les cartes avec `type="Leader"` et `rarity != "leader"`
- ✅ Les met à jour avec `rarity="leader"`
- ✅ Affiche des statistiques avant/après
- ✅ Vérifie que la correction a bien fonctionné

**Utilisation** (sur votre environnement de production) :
```bash
cd server
npm run build
node dist/scripts/fix-leader-rarity.js
```

Ou avec ts-node en développement :
```bash
cd server
npx tsx src/scripts/fix-leader-rarity.ts
```

### 2. Correction du Script d'Importation

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

## 🚀 Prochaines Étapes

1. **Exécuter le script de correction** sur votre base de données de production
2. **Réimporter les données** (optionnel) pour vérifier que le script d'importation corrigé fonctionne bien
3. **Vérifier l'interface utilisateur** pour s'assurer que les cartes Leader s'affichent correctement avec leur nouvelle rareté

## 📝 Notes Techniques

### Pourquoi "leader" comme rareté ?

Les cartes Leader dans One Piece TCG ne suivent pas le système de rareté classique. Elles sont distribuées dans les Starter Decks et non dans les boosters réguliers. Utiliser `rarity="leader"` permet de :
- Les distinguer facilement des autres cartes
- Appliquer des règles spécifiques (ex: limite de 1 par deck)
- Les filtrer correctement dans l'interface

### Impact sur le Système de Boosters

Cette correction n'affecte PAS la logique des boosters, car les cartes Leader ne sont généralement pas disponibles dans les boosters aléatoires (elles viennent des Starter Decks).

Si votre système génère des boosters qui incluent des Leaders, vous devrez peut-être ajuster `BoosterService.ts` pour gérer la rareté "leader".
