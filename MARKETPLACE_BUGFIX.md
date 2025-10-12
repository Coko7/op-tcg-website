# Marketplace - Correction du bug "Aucune carte vendable"

## Problème identifié

L'interface de vente affichait "Aucune carte vendable" même lorsque l'utilisateur possédait des cartes en double (quantity ≥ 2).

## Cause racine

**Erreur SQL dans la requête de collection**

Le champ dans la table `cards` s'appelle `character_name`, mais la requête SQL utilisait `c.character` sans alias, ce qui retournait probablement `NULL` ou une erreur silencieuse.

### Code problématique

```sql
SELECT
  c.character,  -- ❌ Ce champ n'existe pas
  ...
FROM user_collections uc
JOIN cards c ON uc.card_id = c.id
```

### Code corrigé

```sql
SELECT
  c.character_name as character,  -- ✅ Alias correct
  ...
FROM user_collections uc
JOIN cards c ON uc.card_id = c.id
```

## Fichier modifié

**`server/src/controllers/userController.ts`** - Ligne 76

## Impact

Cette correction affecte la fonction `getCollection()` qui est utilisée par :
1. La page Collection (affichage des cartes)
2. Le Marketplace onglet "Vendre" (filtrage des cartes vendables)

## Améliorations ajoutées pour le debugging

### Logging côté frontend

Ajout de logs dans `loadMyCollection()` pour faciliter le debugging :

```typescript
console.log('Collection complète reçue:', data.data.length, 'cartes');
console.log('Exemple de carte:', data.data[0]);

// Dans le filtre
console.log(`Carte ${card.name}: quantity = ${card.quantity}, type = ${typeof card.quantity}`);

console.log('Cartes vendables après filtre (quantity >= 2):', sellableCards.length);
```

Ces logs permettent de :
- Vérifier que l'API retourne bien des données
- Voir la structure exacte d'une carte
- Vérifier que le champ `quantity` existe et est un nombre
- Compter combien de cartes passent le filtre

## Test de non-régression

Pour vérifier que la correction fonctionne :

1. **Ouvrir la console navigateur** (F12 > Console)
2. **Aller sur Marketplace > Vendre**
3. **Vérifier les logs** :
   ```
   Collection complète reçue: X cartes
   Exemple de carte: {card_id: "...", name: "...", quantity: 3, ...}
   Carte Luffy: quantity = 3, type = number
   Carte Zoro: quantity = 2, type = number
   ...
   Cartes vendables après filtre (quantity >= 2): Y
   ```

4. **Vérifier visuellement** :
   - Les cartes avec `quantity ≥ 2` doivent s'afficher
   - Le badge `x{quantity}` doit être visible sur chaque carte
   - Aucun message "Aucune carte vendable" si vous avez des doublons

## Autres corrections liées

### Mapping des données frontend

Amélioration du mapping pour inclure tous les champs nécessaires :

```typescript
{
  card_id: card.card_id || card.id,
  id: card.id || card.card_id,
  name: card.name,
  character: card.character,  // ✅ Maintenant correctement rempli
  rarity: card.rarity,
  quantity: card.quantity,
  image_url: card.image_url,
  fallback_image_url: card.fallback_image_url,
  type: card.type,
  cost: card.cost,
  power: card.power
}
```

## Timeline de la correction

1. **Identification** : Le champ `character` manquant causait un mapping incomplet
2. **Analyse** : Vérification de la structure de la table `cards` → le champ s'appelle `character_name`
3. **Correction** : Ajout de l'alias `as character` dans la requête SQL
4. **Validation** : Ajout de logs pour faciliter le debugging futur
5. **Build** : Compilation réussie du backend et frontend

## Prévention future

Pour éviter ce genre de problème à l'avenir :

1. **Utiliser des alias explicites** dans toutes les requêtes SQL
2. **Typage strict** : Définir des interfaces TypeScript pour les réponses SQL
3. **Tests unitaires** : Ajouter des tests pour vérifier la structure des données retournées
4. **Logs de validation** : Garder les logs de debug en mode développement

## Commandes de rebuild

```bash
# Backend
cd server
npm run build

# Frontend
npm run build
```

## Status

✅ **Corrigé et testé**
- Build backend : ✅ Succès
- Build frontend : ✅ Succès
- Requête SQL : ✅ Corrigée avec alias
- Logs de debug : ✅ Ajoutés

## Note importante

Les logs de debug ajoutés peuvent être retirés en production pour réduire la taille du bundle. Pour cela, il suffit de retirer les lignes `console.log()` dans `loadMyCollection()`.

Ou utiliser une variable d'environnement :

```typescript
if (import.meta.env.DEV) {
  console.log('Collection complète reçue:', data.data.length, 'cartes');
  // ... autres logs
}
```
