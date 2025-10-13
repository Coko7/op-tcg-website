# 🎴 Fix des Raretés - Résumé Rapide

## ❓ Quel est le problème ?

Les cartes importées depuis Vegapull ont des **raretés incorrectes** dans la base de données :
- Exemple : `OP09-004 (Shanks)` devrait être `SuperRare` mais est marquée `common`
- Les cartes `Leader` sont marquées `common` au lieu de `leader`
- Potentiellement d'autres raretés affectées

## ✅ La solution (déjà implémentée)

### 1. Correction du script d'importation
Le mapping `RARITY_MAPPING` dans `import-vegapull-data.ts` a été corrigé avec l'ajout de `'Leader': 'leader'`.

### 2. Script de correction automatique
Un script `fix-all-rarities.ts` a été créé qui :
- Compare chaque carte DB avec les données Vegapull (source de vérité)
- Corrige automatiquement toutes les raretés incorrectes
- S'exécute **automatiquement au démarrage Docker**

### 3. Script de diagnostic
Un script `diagnose-rarity-issues.ts` permet de visualiser les problèmes avant correction.

## 🚀 Comment appliquer le fix ?

### Option 1 : Automatique (recommandé)
```bash
# Rebuild et restart les containers Docker
docker-compose down
docker-compose build
docker-compose up -d

# Les raretés seront corrigées automatiquement au démarrage !
# Vérifier les logs pour voir les statistiques
docker-compose logs backend | grep "rareté"
```

### Option 2 : Manuel (pour tester avant)
```bash
cd server

# 1. Diagnostic (voir les problèmes)
npx tsx src/scripts/diagnose-rarity-issues.ts

# 2. Correction
npx tsx src/scripts/fix-all-rarities.ts
```

## 🔍 Vérifier que ça a marché

```sql
-- Exemple : Vérifier OP09-004
SELECT vegapull_id, name, rarity FROM cards WHERE vegapull_id = 'OP09-004';
-- Devrait retourner : rarity = 'super_rare'

-- Voir la répartition des raretés
SELECT rarity, COUNT(*) FROM cards GROUP BY rarity;
```

## 📊 Mapping des Raretés

| Vegapull       | Base de Données |
|----------------|-----------------|
| Leader         | leader          |
| SuperRare      | super_rare      |
| Rare           | rare            |
| Uncommon       | uncommon        |
| Common         | common          |
| SecretRare     | secret_rare     |
| SpecialRare    | secret_rare     |

## 🛡️ Sécurité

- ✅ Le script utilise les champs corrects (`type` pour catégorie, `rarity` pour rareté)
- ✅ Utilise une transaction DB pour rollback en cas d'erreur
- ✅ Mode non-bloquant dans Docker (le serveur démarre même si le script échoue)
- ✅ Idempotent (peut être exécuté plusieurs fois)
- ✅ Ne touche QUE les cartes qui ont effectivement une rareté incorrecte

## 📝 Fichiers Modifiés

- ✅ `server/src/scripts/import-vegapull-data.ts` - Correction du mapping
- ✅ `server/src/scripts/fix-all-rarities.ts` - Script de correction universel
- ✅ `server/src/scripts/diagnose-rarity-issues.ts` - Script de diagnostic
- ✅ `server/scripts/docker-entrypoint.sh` - Exécution auto au démarrage
- ✅ `Dockerfile.backend` - Copie des scripts compilés
- ✅ `server/LEADER_RARITY_FIX.md` - Documentation détaillée

## ❓ FAQ

**Q: Le script va-t-il casser ma base de données ?**
Non, il utilise une transaction et ne modifie QUE les raretés incorrectes.

**Q: Que se passe-t-il si le script échoue au démarrage Docker ?**
Le serveur démarre quand même (mode non-bloquant). Vous pouvez le réexécuter manuellement.

**Q: Combien de cartes seront corrigées ?**
Cela dépend de votre base. Le script affiche le nombre exact au démarrage. Attendez-vous à plusieurs dizaines/centaines de cartes selon l'étendue du problème.

**Q: Est-ce que ça affecte les cartes des joueurs ?**
Oui, mais positivement ! Les cartes qu'ils possèdent auront maintenant la bonne rareté. Pas de perte de cartes.

**Q: Faut-il réimporter toutes les cartes ?**
Non, le script corrige directement dans la DB. Pas besoin de réimporter.
