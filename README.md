# One Piece Booster Game MVP

Application web de jeu d'ouverture de boosters One Piece inspirée de Pokemon TCG Pocket.

## 🎯 Fonctionnalités du MVP

### ✅ Implémenté
- **Système de boosters** : 3 boosters par jour, cooldown de 8h
- **Collection de cartes** : 18 cartes One Piece avec 5 niveaux de rareté
- **Animations** : Ouverture de boosters avec révélation progressive
- **Filtres et recherche** : Par rareté, nom, personnage, favoris
- **Persistence** : Sauvegarde locale avec localStorage
- **Timer en temps réel** : Affichage du temps restant
- **Interface responsive** : Design adaptatif mobile/desktop

### 📊 Cartes disponibles
- **Communes (60%)** : Luffy Gear 2, Zoro, Nami, Usopp, Chopper
- **Peu Communes (25%)** : Sanji, Robin, Franky, Brook
- **Rares (10%)** : Luffy Gear 4, Zoro Ashura, Sanji Diable Jambe, Ace
- **Super Rares (4%)** : Luffy Gear 5, Shanks, Mihawk
- **Secrètes Rares (1%)** : Gol D. Roger, Barbe Blanche

## 🚀 Installation et lancement

### Méthode 1 : Script automatique (Windows)
```bash
# Double-cliquez sur le fichier ou exécutez :
start.bat
```

### Méthode 2 : Installation manuelle
```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

### 🛠 En cas de problèmes d'installation

**Problème 1 : Erreurs de dépendances**
```bash
# Solution 1 : Nettoyage et réinstallation
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solution 2 : Installation avec flags
npm install --legacy-peer-deps --no-optional

# Solution 3 : Installation étape par étape
install-step-by-step.bat
```

**Problème 2 : Version simplifiée**
```bash
# Copier le fichier package-simple.json
copy package-simple.json package.json
npm install
```

**Problème 3 : Node.js non installé**
- Téléchargez Node.js depuis https://nodejs.org/
- Version recommandée : 18.x ou 20.x
- Redémarrez votre terminal après installation

## 🎮 Utilisation

1. **Page d'accueil** : Vue d'ensemble des boosters disponibles et statistiques
2. **Page Boosters** : Ouverture interactive avec animations
3. **Page Collection** : Gestion complète des cartes avec filtres

### Système de timer
- 3 boosters maximum par jour
- Cooldown de 8 heures entre chaque booster
- Timer en temps réel dans l'interface

### Fonctionnalités avancées
- Marquer des cartes comme favorites ⭐
- Recherche par nom/personnage 🔍
- Filtres par rareté et statut
- Statistiques de collection détaillées

## 🛠 Architecture technique

### Stack
- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS avec thème One Piece
- **Routing** : React Router DOM
- **Icônes** : Lucide React
- **Build** : Vite
- **Storage** : localStorage (pas de backend)

### Structure du projet
```
src/
├── components/     # Composants réutilisables
├── pages/         # Pages principales
├── services/      # Logique métier et localStorage
├── types/         # Types TypeScript
└── data/          # Données des cartes
```

## 🎨 Design

Interface One Piece avec :
- Dégradés bleu océan
- Animations CSS fluides
- Couleurs par rareté
- Responsive design
- Thème pirate cohérent

## 📱 Responsive

- Mobile-first design
- Grilles adaptatives
- Navigation optimisée
- Touch-friendly

## 🔄 Évolutions possibles

### Phase 2
- Authentification utilisateur
- Backend avec API
- Échanges entre joueurs
- Nouvelles séries de cartes

### Phase 3
- Mode bataille
- Défis quotidiens
- Classements
- Effets sonores

## 📝 Notes techniques

- Données persistantes via localStorage
- Système de timer résistant au rafraîchissement
- Génération aléatoire avec distribution garantie
- Interface temps réel avec hooks React

## 🐛 Test & Debug

L'application inclut des outils de debug :
- Console logs pour les actions importantes
- Validation des données localStorage
- Gestion d'erreurs pour les cas limites

Pour réinitialiser les données :
```javascript
// Dans la console du navigateur
localStorage.clear();
location.reload();
```

---

🏴‍☠️ **Bon voyage sur Grand Line, moussaillon !**