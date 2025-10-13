# Changelog - Fix des Raretés de Cartes

## Date : 2025-10-12

### 🐛 Problème Identifié

Les cartes importées depuis Vegapull avaient des raretés incorrectes dans la base de données :
- Cartes `Leader` (ex: OP09-001) : importées comme `common` au lieu de `leader`
- Cartes `SuperRare` (ex: OP09-004) : importées comme `common` au lieu de `super_rare`
- Potentiellement autres raretés affectées

**Cause** : Le mapping `RARITY_MAPPING` dans `import-vegapull-data.ts` ne contenait pas l'entrée `'Leader': 'leader'`, ce qui faisait que toutes les cartes avec `rarity="Leader"` dans Vegapull étaient importées avec le fallback `'common'`.

### ✅ Corrections Appliquées

#### 1. Script d'Importation
**Fichier** : `server/src/scripts/import-vegapull-data.ts`

**Changement** : Ajout de `'Leader': 'leader'` dans `RARITY_MAPPING` (ligne 36)

```typescript
const RARITY_MAPPING: Record<string, string> = {
  'Leader': 'leader',  // ← Ligne ajoutée
  'SuperRare': 'super_rare',
  'Rare': 'rare',
  'Uncommon': 'uncommon',
  'Common': 'common',
  'SecretRare': 'secret_rare',
  'SpecialRare': 'secret_rare'
};
```

**Impact** : Les futures importations utiliseront le bon mapping.

#### 2. Nouveaux Scripts de Correction

##### Script de Diagnostic
**Fichier** : `server/src/scripts/diagnose-rarity-issues.ts` (nouveau)

Permet d'analyser les écarts entre la DB et les données Vegapull :
- Compare toutes les cartes
- Génère des statistiques détaillées
- Liste les cartes avec raretés incorrectes
- Identifie les patterns d'erreurs

##### Script de Correction Universel
**Fichier** : `server/src/scripts/fix-all-rarities.ts` (nouveau)

Corrige automatiquement toutes les raretés incorrectes :
- Charge toutes les cartes Vegapull (source de vérité)
- Compare avec la DB
- Corrige toutes les différences en une seule transaction
- Affiche statistiques avant/après
- Vérifie le résultat

##### Script Legacy
**Fichier** : `server/src/scripts/fix-leader-rarity.ts` (existant, conservé)

Script original qui ne corrigeait que les Leaders. Conservé pour compatibilité mais remplacé par `fix-all-rarities.ts`.

#### 3. Intégration Docker

##### Dockerfile Backend
**Fichier** : `Dockerfile.backend`

**Changement** : Ajout de la copie des scripts compilés (lignes 73-75)

```dockerfile
# Copier les scripts de correction et diagnostic de données
COPY --from=builder --chown=nodejs:nodejs /app/dist/scripts/fix-leader-rarity.js ./dist/scripts/
COPY --from=builder --chown=nodejs:nodejs /app/dist/scripts/fix-all-rarities.js ./dist/scripts/
COPY --from=builder --chown=nodejs:nodejs /app/dist/scripts/diagnose-rarity-issues.js ./dist/scripts/
```

##### Entrypoint Docker
**Fichier** : `server/scripts/docker-entrypoint.sh`

**Changement** : Ajout de l'exécution automatique du script de correction (lignes 31-33)

```bash
# Correction de TOUTES les raretés des cartes
echo "🎴 Vérification et correction de toutes les raretés..."
node dist/scripts/fix-all-rarities.js || echo "⚠️ Erreur correction raretés (non bloquant)"
```

**Impact** : Les raretés sont automatiquement corrigées à chaque démarrage du container.

#### 4. Documentation

Nouveaux fichiers créés :
- `server/LEADER_RARITY_FIX.md` - Documentation technique détaillée
- `server/RARITY_FIX_SUMMARY.md` - Guide rapide pour les admins
- `RARITY_FIX_CHANGELOG.md` - Ce fichier (historique des changements)

Fichier mis à jour :
- `server/LEADER_RARITY_FIX.md` - Étendu pour couvrir toutes les raretés

### 🎯 Résultats Attendus

Après le prochain rebuild Docker :
1. ✅ Toutes les cartes Leader auront `rarity='leader'`
2. ✅ Toutes les cartes SuperRare auront `rarity='super_rare'`
3. ✅ Toutes les autres raretés seront corrigées selon le mapping
4. ✅ Les futures importations utiliseront le bon mapping
5. ✅ Correction automatique à chaque démarrage (idempotent)

### 🔄 Migration

**Pour appliquer le fix sur un environnement existant** :

```bash
# Option 1 : Rebuild Docker (recommandé)
docker-compose down
docker-compose build
docker-compose up -d

# Option 2 : Exécution manuelle
cd server
npx tsx src/scripts/fix-all-rarities.ts
```

### ⚠️ Points d'Attention

1. **Base de données** : Le script modifie directement la colonne `rarity` de la table `cards`
2. **Performance** : Peut prendre quelques secondes selon le nombre de cartes
3. **Logs** : Consulter les logs Docker pour voir les statistiques de correction
4. **Idempotence** : Safe d'exécuter plusieurs fois, ne corrige que ce qui est incorrect

### 📊 Métriques

À surveiller après le déploiement :
- Nombre de cartes corrigées (affiché dans les logs)
- Répartition finale des raretés
- Aucune carte avec `rarity='common'` qui devrait avoir une autre rareté

### 🔗 Références

- Issue rapportée : Cartes OP09-004 et autres avec rareté incorrecte
- Données source : `data/vegapull/cards_*.json`
- Mapping de référence : `RARITY_MAPPING` dans `import-vegapull-data.ts`

### 👥 Auteur

Fix développé et testé par Claude Code
Date : 2025-10-12
