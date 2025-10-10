# 🔧 Résolution des Problèmes de Build Docker

## Erreur: `npm ci` - ECONNRESET / Network Error

### Symptômes
```
npm error code ECONNRESET
npm error network aborted
npm error network This is a problem related to network connectivity.
```

### Causes
1. **Connexion réseau instable** lors du téléchargement des packages npm
2. **Timeout** sur les packages volumineux
3. **Proxy/Firewall** qui bloque certaines requêtes
4. **Registry npm** temporairement indisponible

---

## ✅ Solutions Implémentées dans le Dockerfile

Le fichier `Dockerfile.frontend` inclut maintenant plusieurs mécanismes de protection :

### 1. Configuration npm optimisée
```dockerfile
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000
```

### 2. Fallback automatique
```dockerfile
RUN npm ci --prefer-offline --no-audit || \
    (echo "npm ci failed, trying npm install..." && \
     rm -rf node_modules package-lock.json && \
     npm install --no-audit)
```

Si `npm ci` échoue, le build essaiera automatiquement `npm install`.

---

## 🚀 Solutions Alternatives

### Option 1: Build avec Cache Docker

Utilisez BuildKit pour le cache des layers :

```bash
# Activer BuildKit
export DOCKER_BUILDKIT=1

# Build avec cache
docker build --progress=plain -f Dockerfile.frontend -t op-game-frontend .
```

### Option 2: Build en plusieurs étapes

Si le problème persiste, essayez de builder localement puis copier :

```bash
# 1. Installer les dépendances localement
npm ci

# 2. Builder localement
npm run build

# 3. Utiliser un Dockerfile simplifié qui copie juste le build
```

Créez `Dockerfile.frontend.simple` :
```dockerfile
FROM nginx:alpine

# Configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build local
COPY dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 3: Utiliser un registre npm local/miroir

Si vous avez des problèmes récurrents :

```bash
# Utiliser un miroir npm (exemple: Taobao pour l'Asie)
docker build \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com \
  -f Dockerfile.frontend \
  -t op-game-frontend .
```

Modifiez le Dockerfile pour accepter l'argument :
```dockerfile
ARG NPM_REGISTRY=https://registry.npmjs.org/
RUN npm config set registry ${NPM_REGISTRY}
```

### Option 4: Build sans cache

Forcer un rebuild complet :

```bash
docker build --no-cache -f Dockerfile.frontend -t op-game-frontend .
```

### Option 5: Augmenter les ressources Docker

Si vous utilisez Docker Desktop :
- Allouez plus de RAM (minimum 4GB recommandé)
- Allouez plus de CPU (minimum 2 cores)

---

## 🔍 Debug du Build

### Voir les logs détaillés

```bash
docker build --progress=plain -f Dockerfile.frontend -t op-game-frontend . 2>&1 | tee build.log
```

### Vérifier la connectivité réseau dans le container

```bash
# Tester un build interactif
docker run -it --rm node:20-alpine sh

# Dans le container :
apk add curl
curl -I https://registry.npmjs.org/
npm config list
```

### Vérifier le package-lock.json

```bash
# S'assurer que le package-lock.json est valide
npm ci --dry-run
```

---

## 📋 Checklist de Résolution

- [ ] Vérifier la connexion internet
- [ ] Vérifier que `package-lock.json` existe et est valide
- [ ] Essayer le build avec `--no-cache`
- [ ] Augmenter les ressources Docker
- [ ] Utiliser le Dockerfile mis à jour avec fallback
- [ ] Si échec : builder localement puis copier le `dist/`
- [ ] Vérifier les logs Docker : `docker logs <container-id>`

---

## 🆘 Si Rien ne Fonctionne

### Build Local + Copie Manuelle

```bash
# 1. Build localement
npm ci
npm run build

# 2. Créer une image simple
cat > Dockerfile.local <<'EOF'
FROM nginx:alpine
RUN apk add --no-cache curl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD curl -f http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
EOF

# 3. Créer nginx.conf simplifié
cat > nginx.conf <<'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://framboise.lan:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# 4. Build l'image
docker build -f Dockerfile.local -t op-game-frontend .
```

---

## 📊 Monitoring du Build

Pour suivre la progression en temps réel :

```bash
# Terminal 1 : Build
docker build --progress=plain -f Dockerfile.frontend -t op-game-frontend .

# Terminal 2 : Stats Docker
watch -n 1 'docker stats --no-stream'
```

---

## 🔄 Rebuild après Modifications

Si vous modifiez le code :

```bash
# Rebuild uniquement les layers modifiés
docker build -f Dockerfile.frontend -t op-game-frontend .

# Le cache Docker réutilisera les layers inchangés (node_modules)
```

---

## 📞 Support

Si les problèmes persistent :

1. **Vérifier les issues GitHub** du projet
2. **Consulter les logs** : `docker build --progress=plain ...`
3. **Tester la connectivité** : `curl -I https://registry.npmjs.org/`
4. **Vérifier l'espace disque** : `docker system df`
5. **Nettoyer Docker** : `docker system prune -a`

---

## ✨ Améliorations Futures

Pour un build encore plus robuste :

- [ ] Utiliser un registre npm privé/local
- [ ] Mettre en place un cache npm partagé
- [ ] Utiliser des volumes Docker pour node_modules
- [ ] Configurer un proxy npm si nécessaire
- [ ] Utiliser pnpm au lieu de npm (plus rapide et fiable)

---

**Dernière mise à jour** : Octobre 2025
