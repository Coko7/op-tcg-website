# 🔧 Guide de dépannage - One Piece Booster Game

## Problèmes courants et solutions

### 🚨 Erreur : "npm install" échoue

**Causes possibles :**
- Connexion internet lente/instable
- Cache npm corrompu
- Conflits de versions
- Espace disque insuffisant

**Solutions par ordre de priorité :**

#### Solution 1 : Nettoyage complet
```bash
# 1. Supprimer les fichiers temporaires
del package-lock.json
rmdir /s /q node_modules

# 2. Nettoyer le cache npm
npm cache clean --force

# 3. Réinstaller
npm install
```

#### Solution 2 : Installation avec options
```bash
# Installation sans dépendances optionnelles
npm install --no-optional --legacy-peer-deps

# Ou avec timeout étendu
npm install --timeout=300000
```

#### Solution 3 : Installation manuelle étape par étape
```bash
# 1. Dépendances React
npm install react@^18.3.1 react-dom@^18.3.1

# 2. Router
npm install react-router-dom@^6.26.0

# 3. Icônes
npm install lucide-react@^0.400.0

# 4. Dev tools
npm install -D vite@^5.3.0 @vitejs/plugin-react@^4.3.0

# 5. TypeScript
npm install -D typescript@^5.5.0 @types/react@^18.3.0 @types/react-dom@^18.3.0

# 6. Tailwind CSS
npm install -D tailwindcss@^3.4.4 autoprefixer@^10.4.19 postcss@^8.4.38
```

#### Solution 4 : Version minimale
```bash
# Copier le package simplifié
copy package-simple.json package.json
npm install
```

### 🚨 Erreur : "Node.js not found"

**Solution :**
1. Téléchargez Node.js depuis https://nodejs.org/
2. Choisissez la version LTS (recommandée)
3. Installez en suivant l'assistant
4. Redémarrez votre terminal/invite de commande
5. Vérifiez : `node --version`

### 🚨 Erreur : "npm run dev" échoue

**Vérifications :**
```bash
# 1. Vérifier que Vite est installé
npm list vite

# 2. Si manquant, installer
npm install -D vite@^5.3.0

# 3. Vérifier la configuration
type vite.config.ts
```

### 🚨 Erreur : "Module not found"

**Solutions :**
```bash
# 1. Réinstaller la dépendance manquante
npm install [nom-du-module]

# 2. Vérifier les imports dans le code
# Exemple : import React from 'react' (et non from 'React')

# 3. Clear du cache TypeScript
npx tsc --build --clean
```

### 🚨 Erreur : Tailwind CSS ne fonctionne pas

**Vérifications :**
```bash
# 1. Vérifier que les fichiers de config existent
dir tailwind.config.js
dir postcss.config.js

# 2. Vérifier que index.css importe Tailwind
type src\index.css
```

## 🛠 Scripts de dépannage disponibles

1. **diagnostic.bat** - Diagnostic complet de l'environnement
2. **install-step-by-step.bat** - Installation progressive
3. **start.bat** - Lancement avec gestion d'erreurs

## 📞 Solutions d'urgence

### Option 1 : Version CDN (sans npm)
Si npm ne fonctionne vraiment pas, vous pouvez utiliser une version CDN :

```html
<!-- Remplacer le contenu de index.html -->
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <!-- Version simplifiée du jeu -->
</body>
</html>
```

### Option 2 : GitHub Codespaces
1. Créez un repository GitHub
2. Uploadez les fichiers
3. Lancez GitHub Codespaces
4. Exécutez `npm install` dans l'environnement cloud

### Option 3 : Stackblitz
1. Allez sur https://stackblitz.com
2. Créez un nouveau projet Vite + React + TS
3. Copiez-collez les fichiers source

## 📋 Checklist de vérification

- [ ] Node.js installé (version 18+)
- [ ] npm fonctionnel (`npm --version`)
- [ ] Connexion internet stable
- [ ] Espace disque suffisant (>500MB)
- [ ] Antivirus non bloquant
- [ ] Droits administrateur si nécessaire

## 💡 Optimisations de performance

```bash
# Configuration npm pour de meilleures performances
npm config set registry https://registry.npmjs.org/
npm config set cache-min 3600
npm config set timeout 300000
```

---

Si aucune solution ne fonctionne, le jeu peut être testé directement dans le navigateur en ouvrant les fichiers HTML statiques.