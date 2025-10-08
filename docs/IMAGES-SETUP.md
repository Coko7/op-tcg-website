# 📸 Configuration des Images One Piece

Ce guide explique comment télécharger et utiliser les vraies images des cartes One Piece avec l'outil Vegapull.

## 🚀 Installation rapide

```bash
# 1. Compiler l'outil Vegapull
npm run build-vegapull

# 2. Télécharger toutes les images
npm run download-images

# 3. Ou faire les deux en une commande
npm run setup-images
```

## 🔧 Installation manuelle

### Étape 1: Compiler Vegapull

```bash
cd vegapull
cargo build --release
```

### Étape 2: Télécharger les images

```bash
# Avec le script automatique
node scripts/download-images.js

# Ou manuellement avec Vegapull
./vegapull/target/release/vegapull.exe pack op01 --images --output public/images/cards
./vegapull/target/release/vegapull.exe pack st01 --images --output public/images/cards
# ... répéter pour chaque pack
```

## 📁 Structure des fichiers

```
public/
  images/
    cards/
      OP01-001.png
      OP01-002.png
      ST01-001.png
      ...
      index.json  ← Index automatique des images
```

## 🔍 Boosters supportés

Le script télécharge automatiquement les images pour ces boosters :

- **OP-01** : Romance Dawn
- **OP-02** : Paramount War
- **OP-03** : Pillars of Strength
- **OP-04** : Kingdoms of Intrigue
- **OP-05** : Awakening of the New Era
- **ST-01** à **ST-05** : Starter Decks
- **EB-01** : Extra Boosters
- **PR-01** : Promo Cards

## 🐛 Dépannage

### Vegapull ne compile pas
```bash
# Vérifier Rust
cargo --version

# Mettre à jour Rust si nécessaire
rustup update
```

### Images non trouvées
```bash
# Vérifier le dossier
ls public/images/cards/

# Relancer le téléchargement
npm run download-images
```

### Erreurs de réseau
```bash
# Télécharger pack par pack
./vegapull/target/release/vegapull.exe pack op01 --images --output public/images/cards
```

## 📊 Vérification

Après téléchargement, vous devriez voir :

```bash
# Vérifier les fichiers
ls public/images/cards/ | wc -l  # Nombre d'images
cat public/images/cards/index.json | jq length  # Nombre dans l'index
```

## 🔄 Fonctionnement dans l'application

1. **ImageService** : Gère les images locales et les placeholders
2. **Chargement automatique** : L'application cherche `index.json` au démarrage
3. **Fallback** : Si pas d'image locale, affiche un placeholder coloré
4. **Cache intelligent** : Les URLs sont mises en cache pour les performances

## 📝 Logs

Les logs de téléchargement sont dans `download-images.log` :

```bash
tail -f download-images.log
```

## ⚡ Performance

- **Images locales** : Chargement instantané
- **Placeholders** : Générés à la volée avec couleurs par série
- **Index JSON** : ~1KB, chargé une seule fois
- **Cache navigateur** : Images mises en cache automatiquement

## 🎨 Placeholders

En attendant le téléchargement, l'application affiche des placeholders colorés :

- **OP** (bleu) : Cartes One Piece principales
- **ST** (rouge) : Starter Decks
- **EB** (vert) : Extra Boosters
- **PR** (violet) : Cartes Promo

## 🔮 Prochaines étapes

- [ ] Download automatique en arrière-plan
- [ ] Compression d'images pour des performances optimales
- [ ] Mise à jour incrémentale des nouvelles cartes
- [ ] Interface de gestion des images dans l'app