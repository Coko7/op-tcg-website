# 🛠 Installation Manuelle - One Piece Booster Game

## Problème : Les fichiers .bat se ferment immédiatement

Si les scripts batch ne fonctionnent pas, voici comment procéder manuellement :

## 🚀 Solution 1 : Installation manuelle par étapes

### Étape 1 : Ouvrir l'invite de commande
1. Appuyez sur `Windows + R`
2. Tapez `cmd` et appuyez sur Entrée
3. Naviguez vers le dossier :
   ```
   cd C:\Users\ppccl\Desktop\OP_game_claude
   ```

### Étape 2 : Vérifier Node.js
```bash
node --version
npm --version
```

Si vous obtenez une erreur :
- Téléchargez Node.js depuis https://nodejs.org/
- Installez la version LTS
- Redémarrez l'invite de commande

### Étape 3 : Installation des dépendances
```bash
npm install
```

Si ça échoue, essayez :
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### Étape 4 : Lancer l'application
```bash
npm run dev
```

## 🌐 Solution 2 : Version standalone (RECOMMANDÉE)

**Cette solution fonctionne à 100% sans installation !**

1. Ouvrez votre navigateur (Chrome, Firefox, Edge...)
2. Faites glisser le fichier `index-standalone.html` dans le navigateur
3. **OU** double-cliquez sur `index-standalone.html`
4. Le jeu se lance immédiatement !

### Fonctionnalités de la version standalone :
- ✅ Système de boosters complet
- ✅ Timer de 8 heures
- ✅ Collection de cartes
- ✅ 10 cartes One Piece
- ✅ Sauvegarde locale
- ✅ Interface responsive
- ✅ Animations

## 🔧 Solution 3 : PowerShell (alternative)

Si l'invite de commande ne fonctionne pas :

1. Appuyez sur `Windows + X`
2. Choisissez "Windows PowerShell"
3. Naviguez vers le dossier :
   ```powershell
   cd "C:\Users\ppccl\Desktop\OP_game_claude"
   ```
4. Exécutez :
   ```powershell
   npm install
   npm run dev
   ```

## 🌟 Solution 4 : VS Code (pour développeurs)

1. Téléchargez VS Code (gratuit)
2. Ouvrez le dossier du projet
3. Ouvrez le terminal intégré (Ctrl + `)
4. Tapez : `npm install` puis `npm run dev`

## 📱 Solution 5 : En ligne (StackBlitz)

1. Allez sur https://stackblitz.com
2. Créez un nouveau projet "Vite + React + TypeScript"
3. Copiez-collez les fichiers du projet
4. L'application se lance automatiquement !

## ❓ Diagnostic des problèmes

### Problème : "node n'est pas reconnu"
**Solution :** Node.js n'est pas installé ou pas dans le PATH
- Réinstallez Node.js depuis nodejs.org
- Redémarrez l'ordinateur si nécessaire

### Problème : "npm install" échoue
**Solutions :**
```bash
# Nettoyage
npm cache clean --force

# Installation alternative
npm install --no-optional --legacy-peer-deps

# Installation forcée
npm install --force
```

### Problème : Port 3000 déjà utilisé
**Solution :**
```bash
# Utiliser un autre port
npx vite --port 3001
```

## 🎯 Recommandation finale

**Pour un test immédiat : Utilisez `index-standalone.html`**

Cette version :
- Ne nécessite aucune installation
- Fonctionne sur tous les navigateurs modernes
- Contient toutes les fonctionnalités du jeu
- Se lance en 2 secondes

C'est la solution la plus simple et la plus fiable !

---

💡 **Astuce :** Si vous voulez développer ou modifier le code, utilisez l'installation npm. Pour juste jouer, la version standalone est parfaite.