# Guide de Construction des Images Docker

Ce guide vous aide à construire les images Docker pour déployer l'application sur votre Raspberry Pi.

---

## Prérequis

- **Docker Desktop** installé sur votre machine Windows
- **Git Bash** ou **PowerShell** pour exécuter les commandes
- Environ **10 GB d'espace disque libre**
- Connexion internet stable

---

## Méthode Rapide - Construction Locale

### 1. Ouvrez un terminal dans le dossier du projet

```bash
cd C:\Users\ppccl\Desktop\OP_game_claude
```

### 2. Construisez l'image Backend

```bash
docker build -t op-game-backend:latest -f Dockerfile.backend .
```

**Temps estimé :** 5-10 minutes
**Taille finale :** ~200-300 MB

### 3. Construisez l'image Frontend

```bash
docker build -t op-game-frontend:latest -f Dockerfile.frontend --build-arg VITE_API_URL=/api .
```

**Temps estimé :** 3-5 minutes
**Taille finale :** ~50-100 MB

### 4. Vérifiez que les images sont créées

```bash
docker images | grep op-game
```

Vous devriez voir :
```
op-game-backend    latest    xxxxxxxxxxxx    X minutes ago    XXX MB
op-game-frontend   latest    xxxxxxxxxxxx    X minutes ago    XX MB
```

---

## =æ Exportation des Images pour la Raspberry Pi

### Méthode A : Export/Import via fichiers tar (Recommandé)

Cette méthode est idéale si vous n'avez pas de registry Docker.

#### 1. Exportez les images en fichiers

```bash
docker save op-game-backend:latest | gzip > op-game-backend.tar.gz
docker save op-game-frontend:latest | gzip > op-game-frontend.tar.gz
```

#### 2. Transférez les fichiers vers la Raspberry Pi

```bash
# Via SCP (si SSH est activé sur la Raspberry Pi)
scp op-game-backend.tar.gz pi@raspberry-op-game.local:~/
scp op-game-frontend.tar.gz pi@raspberry-op-game.local:~/
```

Ou utilisez un outil comme **WinSCP** ou **FileZilla**.

#### 3. Sur la Raspberry Pi, chargez les images

```bash
# Connectez-vous à la Raspberry Pi
ssh pi@raspberry-op-game.local

# Chargez les images
docker load < ~/op-game-backend.tar.gz
docker load < ~/op-game-frontend.tar.gz

# Vérifiez
docker images | grep op-game
```

### Méthode B : Via Docker Registry (Avancé)

Si vous avez accès à Docker Hub ou un registry privé :

#### 1. Taguez les images

```bash
# Remplacez "votre-username" par votre nom d'utilisateur Docker Hub
docker tag op-game-backend:latest votre-username/op-game-backend:latest
docker tag op-game-frontend:latest votre-username/op-game-frontend:latest
```

#### 2. Connectez-vous et poussez

```bash
docker login
docker push votre-username/op-game-backend:latest
docker push votre-username/op-game-frontend:latest
```

#### 3. Sur la Raspberry Pi, tirez les images

```bash
docker pull votre-username/op-game-backend:latest
docker pull votre-username/op-game-frontend:latest

# Retaguez en local
docker tag votre-username/op-game-backend:latest op-game-backend:latest
docker tag votre-username/op-game-frontend:latest op-game-frontend:latest
```

---

## Construction Multi-Architecture (Pour ARM64)

Si vous voulez construire directement pour l'architecture ARM64 de la Raspberry Pi :

### 1. Activez buildx (si pas déjà fait)

```bash
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap
```

### 2. Construisez pour ARM64

```bash
# Backend
docker buildx build --platform linux/arm64 \
  -t op-game-backend:latest \
  -f Dockerfile.backend \
  --load \
  .

# Frontend
docker buildx build --platform linux/arm64 \
  -t op-game-frontend:latest \
  -f Dockerfile.frontend \
  --build-arg VITE_API_URL=/api \
  --load \
  .
```

**Note :** `--load` charge l'image dans Docker Desktop. Sinon, utilisez `--push` pour pousser directement vers un registry.

---

## Test Local (Optionnel)

Vous pouvez tester les images localement avant de les déployer sur la Raspberry Pi.

### 1. Créez un fichier .env local

```bash
cp .env.example .env
# Éditez .env avec vos valeurs de test
```

### 2. Lancez avec docker-compose

```bash
docker-compose up
```

### 3. Testez l'application

- Frontend : http://localhost
- Backend API : http://localhost:5000/health

### 4. Arrêtez les conteneurs

```bash
docker-compose down
```

---

## Résolution de Problèmes

### Erreur : "npm ci" failed

**Cause :** `package-lock.json` manquant

**Solution :**
```bash
# Générez le package-lock.json
npm install

# Puis reconstruisez
docker build -t op-game-backend:latest -f Dockerfile.backend .
```

### Erreur : Build échoue avec des erreurs TypeScript

**Cause :** Code TypeScript avec des erreurs

**Solution :** Les erreurs ont déjà été corrigées dans cette version. Si vous en rencontrez d'autres :
```bash
# Testez la compilation TypeScript en local
cd server
npm run build
```

### Images trop volumineuses

**Cause :** node_modules inclus dans l'image

**Solution :** Le `.dockerignore` est déjà configuré pour exclure les fichiers inutiles.

### Échec du transfert vers la Raspberry Pi

**Cause :** Fichier trop gros, connexion lente

**Solutions :**
- Utilisez une connexion Ethernet plutôt que WiFi
- Compressez davantage : `gzip -9 op-game-backend.tar`
- Divisez le fichier : `split -b 100M op-game-backend.tar.gz`

### Erreur "No space left on device"

**Cause :** Carte SD de la Raspberry Pi pleine

**Solution :**
```bash
# Sur la Raspberry Pi, nettoyez Docker
docker system prune -a --volumes
```

---

## Checklist avant Déploiement

- [ ] Les deux images sont construites avec succès
- [ ] Les images ont été transférées sur la Raspberry Pi
- [ ] Les images apparaissent dans `docker images`
- [ ] Le fichier `.env` est configuré (voir `.env.example`)
- [ ] Les secrets JWT ont été générés
- [ ] Le mot de passe admin a été changé

---

## Prochaines Étapes

Une fois les images construites et transférées :

1. **Configurez votre stack Portainer** en suivant le guide `DEPLOIEMENT-RASPBERRY-PI.md`
2. **Déployez le stack** avec les images que vous avez créées
3. **Testez l'application** sur votre Raspberry Pi

---

## Besoin d'Aide ?

- Vérifiez les logs Docker : `docker logs <container_name>`
- Consultez le guide de déploiement : `DEPLOIEMENT-RASPBERRY-PI.md`
- Vérifiez la documentation Docker : https://docs.docker.com

---

**Version du guide** : 1.0
**Dernière mise à jour** : 2025-01-29
