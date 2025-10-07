# 🚨 CORRECTIF CRITIQUE - datetime('now')

## ❌ Problème Global

**Tous** les usages de `datetime('now')` ou `datetime("now")` dans les requêtes SQL préparées avec `better-sqlite3` **ne fonctionnent PAS**.

## ✅ Fichiers Déjà Corrigés

- [x] `server/src/models/User.ts` - 3 occurrences corrigées
- [x] `server/src/controllers/userController.ts` - Récompense quotidienne corrigée
- [x] `server/src/controllers/authController.ts` - 2 occurrences corrigées (refresh token)

## ⚠️ Fichiers À Corriger Manuellement

Les fichiers suivants contiennent encore des `datetime('now')` qui doivent être corrigés :

### Priorité CRITIQUE (bloquent des fonctionnalités)

1. **`server/src/controllers/userController.ts`** - 6 occurrences restantes
   - Ligne 131 : INSERT INTO user_collections
   - Ligne 298 : INSERT INTO user_collections
   - Ligne 319 : UPDATE users (last_booster_opened)
   - Ligne 327 : INSERT INTO booster_openings
   - Ligne 573 : INSERT INTO user_collections
   - Ligne 582 : INSERT INTO booster_openings

### Priorité HAUTE

2. **`server/src/models/Card.ts`** - 2 occurrences
   - Ligne 160 : UPDATE cards (updated_at)
   - Ligne 213 : UPDATE cards (updated_at)

3. **`server/src/models/Booster.ts`** - 2 occurrences
   - Ligne 113 : UPDATE boosters (updated_at)
   - Ligne 172 : UPDATE boosters (updated_at)

4. **`server/src/models/Achievement.ts`** - 2 occurrences
   - Ligne 140 : UPDATE user_achievements (completed_at)
   - Ligne 177 : UPDATE user_achievements (claimed_at)

### Priorité MOYENNE

5. **`server/src/utils/database.ts`** - 1 occurrence
   - Ligne 82 : INSERT INTO schema_version

6. **`server/src/scripts/import-vegapull-data.ts`** - 2 occurrences
   - Ligne 119 : INSERT INTO boosters
   - Ligne 194 : INSERT INTO cards

## 📝 Méthode de Correction

Pour chaque fichier, appliquez cette transformation :

### ❌ AVANT (ne fonctionne pas)
```typescript
await Database.run(`
  UPDATE users SET last_login = datetime('now') WHERE id = ?
`, [userId]);
```

### ✅ APRÈS (fonctionne)
```typescript
const now = new Date().toISOString();
await Database.run(`
  UPDATE users SET last_login = ? WHERE id = ?
`, [now, userId]);
```

## 🔧 Script de Correction Automatique

Utilisez ce script bash pour corriger automatiquement (testé manuellement d'abord !) :

```bash
cd server/src

# Sauvegarder avant
cp -r . ../src_backup

# Correction userController.ts
sed -i 's/datetime('"'"'now'"'"')/NOW_PLACEHOLDER/g' controllers/userController.ts

# Puis remplacer manuellement NOW_PLACEHOLDER par ? et ajouter les paramètres
```

## ⚡ Solution Rapide (recommandée)

Créez un helper dans `server/src/utils/database.ts` :

```typescript
export class Database {
  // ... code existant ...

  static now(): string {
    return new Date().toISOString();
  }
}
```

Puis dans tout le code, remplacez :
- `datetime('now')` par `?`
- Ajoutez `Database.now()` dans les paramètres

## 🎯 Résumé des Corrections Nécessaires

| Fichier | Occurrences | Priorité | Status |
|---------|-------------|----------|--------|
| User.ts | 3 | ✅ Corrigé | Done |
| userController.ts (daily reward) | 1 | ✅ Corrigé | Done |
| authController.ts | 2 | ✅ Corrigé | Done |
| userController.ts (reste) | 6 | 🔴 CRITIQUE | **À FAIRE** |
| Card.ts | 2 | 🟠 HAUTE | **À FAIRE** |
| Booster.ts | 2 | 🟠 HAUTE | **À FAIRE** |
| Achievement.ts | 2 | 🟠 HAUTE | **À FAIRE** |
| database.ts | 1 | 🟡 MOYENNE | À FAIRE |
| import-vegapull-data.ts | 2 | 🟡 MOYENNE | À FAIRE |

## 🚨 Impact Fonctionnel

### Fonctionnalités Actuellement Bloquées

- ✅ **Login** - CORRIGÉ (authController.ts)
- ✅ **Récompense quotidienne** - CORRIGÉ (userController.ts)
- ❌ **Ouverture de boosters** - BLOQUÉ (userController.ts ligne 319, 327)
- ❌ **Ajout de cartes à la collection** - BLOQUÉ (userController.ts ligne 131, 298, 573)
- ❌ **Claims d'achievements** - BLOQUÉ (Achievement.ts)
- ❌ **Mise à jour des cartes/boosters** - BLOQUÉ (Card.ts, Booster.ts)

## 🔄 Plan d'Action Immédiat

1. **[URGENT]** Corriger `userController.ts` lignes 319 et 327 (ouverture boosters)
2. **[URGENT]** Corriger `userController.ts` lignes 131, 298, 573 (ajout cartes)
3. **[IMPORTANT]** Corriger `Achievement.ts` (claims)
4. **[MOYEN]** Corriger Card.ts et Booster.ts
5. **[OPTIONNEL]** Corriger database.ts et import-vegapull-data.ts

---

**Dernière mise à jour** : 2025-10-07
**Corrections effectuées** : 6/17
**Progression** : 35%
