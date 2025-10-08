# Guide de Construction des Images Docker

Ce guide vous aide � construire les images Docker pour d�ployer l'application sur votre Raspberry Pi.

---

## Pr�requis

- **Docker Desktop** install� sur votre machine Windows
- **Git Bash** ou **PowerShell** pour ex�cuter les commandes
- Environ **10 GB d'espace disque libre**
- Connexion internet stable

---

## M�thode Rapide - Construction Locale

### 1. Ouvrez un terminal dans le dossier du projet

```bash
cd C:\Users\ppccl\Desktop\OP_game_claude
```

### 2. Construisez l'image Backend

```bash
docker build -t op-game-backend:latest -f Dockerfile.backend .
```

**Temps estim� :** 5-10 minutes
**Taille finale :** ~200-300 MB

### 3. Construisez l'image Frontend

```bash
docker build -t op-game-frontend:latest -f Dockerfile.frontend --build-arg VITE_API_URL=/api .
```

**Temps estim� :** 3-5 minutes
**Taille finale :** ~50-100 MB

### 4. V�rifiez que les images sont cr��es

```bash
docker images | grep op-game
```

Vous devriez voir :
```
op-game-backend    latest    xxxxxxxxxxxx    X minutes ago    XXX MB
op-game-frontend   latest    xxxxxxxxxxxx    X minutes ago    XX MB
```

---

## =� Exportation des Images pour la Raspberry Pi

### M�thode A : Export/Import via fichiers tar (Recommand�)

Cette m�thode est id�ale si vous n'avez pas de registry Docker.

#### 1. Exportez les images en fichiers

```bash
docker save op-game-backend:latest | gzip > op-game-backend.tar.gz
docker save op-game-frontend:latest | gzip > op-game-frontend.tar.gz
```

#### 2. Transf�rez les fichiers vers la Raspberry Pi

```bash
# Via SCP (si SSH est activ� sur la Raspberry Pi)
scp op-game-backend.tar.gz pi@raspberry-op-game.local:~/
scp op-game-frontend.tar.gz pi@raspberry-op-game.local:~/
```

Ou utilisez un outil comme **WinSCP** ou **FileZilla**.

#### 3. Sur la Raspberry Pi, chargez les images

```bash
# Connectez-vous � la Raspberry Pi
ssh pi@raspberry-op-game.local

# Chargez les images
docker load < ~/op-game-backend.tar.gz
docker load < ~/op-game-frontend.tar.gz

# V�rifiez
docker images | grep op-game
```

### M�thode B : Via Docker Registry (Avanc�)

Si vous avez acc�s � Docker Hub ou un registry priv� :

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

### 1. Activez buildx (si pas d�j� fait)

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

Vous pouvez tester les images localement avant de les d�ployer sur la Raspberry Pi.

### 1. Cr�ez un fichier .env local

```bash
cp .env.example .env
# �ditez .env avec vos valeurs de test
```

### 2. Lancez avec docker-compose

```bash
docker-compose up
```

### 3. Testez l'application

- Frontend : http://localhost
- Backend API : http://localhost:5000/health

### 4. Arr�tez les conteneurs

```bash
docker-compose down
```

---

## R�solution de Probl�mes

### Erreur : "npm ci" failed

**Cause :** `package-lock.json` manquant

**Solution :**
```bash
# G�n�rez le package-lock.json
npm install

# Puis reconstruisez
docker build -t op-game-backend:latest -f Dockerfile.backend .
```

### Erreur : Build �choue avec des erreurs TypeScript

**Cause :** Code TypeScript avec des erreurs

**Solution :** Les erreurs ont d�j� �t� corrig�es dans cette version. Si vous en rencontrez d'autres :
```bash
# Testez la compilation TypeScript en local
cd server
npm run build
```

### Images trop volumineuses

**Cause :** node_modules inclus dans l'image

**Solution :** Le `.dockerignore` est d�j� configur� pour exclure les fichiers inutiles.

### �chec du transfert vers la Raspberry Pi

**Cause :** Fichier trop gros, connexion lente

**Solutions :**
- Utilisez une connexion Ethernet plut�t que WiFi
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

## Checklist avant D�ploiement

- [ ] Les deux images sont construites avec succ�s
- [ ] Les images ont �t� transf�r�es sur la Raspberry Pi
- [ ] Les images apparaissent dans `docker images`
- [ ] Le fichier `.env` est configur� (voir `.env.example`)
- [ ] Les secrets JWT ont �t� g�n�r�s
- [ ] Le mot de passe admin a �t� chang�

---

## Prochaines �tapes

Une fois les images construites et transf�r�es :

1. **Configurez votre stack Portainer** en suivant le guide `DEPLOIEMENT-RASPBERRY-PI.md`
2. **D�ployez le stack** avec les images que vous avez cr��es
3. **Testez l'application** sur votre Raspberry Pi

---

## Besoin d'Aide ?

- V�rifiez les logs Docker : `docker logs <container_name>`
- Consultez le guide de d�ploiement : `DEPLOIEMENT-RASPBERRY-PI.md`
- V�rifiez la documentation Docker : https://docs.docker.com

---

**Version du guide** : 1.0
**Derni�re mise � jour** : 2025-01-29
