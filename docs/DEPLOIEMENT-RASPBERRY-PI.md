# Guide de Déploiement sur Raspberry Pi avec Portainer

Ce guide détaille toutes les étapes nécessaires pour déployer l'application **One Piece Booster Game** sur une Raspberry Pi en utilisant Docker et Portainer.

---

## Table des Matières

1. [Prérequis](#-prérequis)
2. [Préparation de la Raspberry Pi](#-préparation-de-la-raspberry-pi)
3. [Installation de Docker et Portainer](#-installation-de-docker-et-portainer)
4. [Construction des Images Docker](#-construction-des-images-docker)
5. [Déploiement via Portainer](#-déploiement-via-portainer)
6. [Configuration Post-Déploiement](#-configuration-post-déploiement)
7. [Vérification et Tests](#-vérification-et-tests)
8. [Maintenance](#-maintenance)
9. [Dépannage](#-dépannage)

---

## Prérequis

### Matériel
- **Raspberry Pi 3B+, 4, ou 5** (recommandé : Pi 4 avec 4GB RAM minimum)
- **Carte SD** : 32GB minimum (64GB recommandé)
- **Alimentation** appropriée pour votre modèle
- **Connexion réseau** (Ethernet recommandé pour les meilleures performances)

### Logiciels sur votre machine de développement
- Git
- Docker Desktop (pour construire les images)
- Un éditeur de texte
- SSH client (pour se connecter à la Raspberry Pi)

### Connaissances requises
- Utilisation basique de la ligne de commande Linux
- Concepts de base de Docker
- Navigation dans Portainer

---

## Préparation de la Raspberry Pi

### 1. Installation du système d'exploitation

1. **Téléchargez Raspberry Pi Imager** depuis [raspberrypi.com](https://www.raspberrypi.com/software/)

2. **Flashez une carte SD** avec :
   - **OS recommandé** : Raspberry Pi OS Lite (64-bit) pour de meilleures performances
   - Alternative : Raspberry Pi OS (64-bit) avec desktop si vous préférez une interface graphique

3. **Configuration initiale** (via Raspberry Pi Imager) :
   - Activez SSH
   - Configurez le nom d'utilisateur et mot de passe
   - Configurez le WiFi (si nécessaire)
   - Définissez le nom d'hôte (ex: `raspberry-op-game`)

4. **Insérez la carte SD** dans la Raspberry Pi et démarrez

### 2. Première connexion

```bash
# Depuis votre ordinateur, connectez-vous en SSH
ssh pi@raspberry-op-game.local
# ou utilisez l'adresse IP
ssh pi@192.168.1.XXX
```

### 3. Mise à jour du système

```bash
# Mettez à jour les paquets
sudo apt update && sudo apt upgrade -y

# Redémarrez si nécessaire
sudo reboot
```

### 4. Configuration recommandée

```bash
# Augmenter la swap (recommandé pour les Pi avec peu de RAM)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Changez CONF_SWAPSIZE=100 en CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Optionnel : Configurer un IP statique
sudo nano /etc/dhcpcd.conf
# Ajoutez à la fin :
# interface eth0
# static ip_address=192.168.1.XXX/24
# static routers=192.168.1.1
# static domain_name_servers=192.168.1.1 8.8.8.8
```

---

## Installation de Docker et Portainer

### 1. Installation de Docker

```bash
# Installation de Docker via le script officiel
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Activer Docker au démarrage
sudo systemctl enable docker

# Redémarrer pour appliquer les changements
sudo reboot
```

### 2. Vérification de Docker

```bash
# Après le redémarrage, reconnectez-vous et testez
docker --version
docker ps
```

### 3. Installation de Portainer

```bash
# Créer un volume pour Portainer
docker volume create portainer_data

# Démarrer Portainer
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### 4. Accès à Portainer

1. Ouvrez votre navigateur et accédez à : `https://raspberry-op-game.local:9443`
   - Ou utilisez l'adresse IP : `https://192.168.1.XXX:9443`
   - Acceptez le certificat auto-signé

2. **Première configuration** :
   - Créez un compte administrateur
   - Mot de passe : minimum 12 caractères
   - Connectez-vous à l'environnement local

---

## Construction des Images Docker

### Méthode 1 : Construction sur votre machine de développement (Recommandé)

Cette méthode est plus rapide et évite de surcharger la Raspberry Pi.

```bash
# 1. Sur votre machine de développement, clonez le projet
cd C:\Users\ppccl\Desktop\OP_game_claude

# 2. Construisez les images pour ARM64 (architecture Raspberry Pi)
# Backend
docker buildx build --platform linux/arm64 \
  -t op-game-backend:latest \
  -f Dockerfile.backend \
  .

# Frontend
docker buildx build --platform linux/arm64 \
  -t op-game-frontend:latest \
  -f Dockerfile.frontend \
  --build-arg VITE_API_URL=/api \
  .

# 3. Sauvegardez les images en fichiers tar
docker save op-game-backend:latest | gzip > op-game-backend.tar.gz
docker save op-game-frontend:latest | gzip > op-game-frontend.tar.gz

# 4. Transférez les images vers la Raspberry Pi
scp op-game-backend.tar.gz pi@raspberry-op-game.local:~/
scp op-game-frontend.tar.gz pi@raspberry-op-game.local:~/

# 5. Sur la Raspberry Pi, chargez les images
ssh pi@raspberry-op-game.local
docker load < ~/op-game-backend.tar.gz
docker load < ~/op-game-frontend.tar.gz

# Vérifiez que les images sont chargées
docker images | grep op-game
```

### Méthode 2 : Construction directement sur la Raspberry Pi

**Attention** : Cette méthode est plus lente et peut prendre 30-60 minutes.

```bash
# 1. Sur la Raspberry Pi, clonez ou transférez le projet
git clone <votre-repo> ~/op-game
# OU transférez les fichiers
scp -r C:\Users\ppccl\Desktop\OP_game_claude pi@raspberry-op-game.local:~/op-game

# 2. Naviguez dans le dossier
cd ~/op-game

# 3. Construisez les images
docker build -t op-game-backend:latest -f Dockerfile.backend .
docker build -t op-game-frontend:latest -f Dockerfile.frontend --build-arg VITE_API_URL=/api .
```

---

## =æ Déploiement via Portainer

### 1. Préparation de la configuration

1. **Créez un fichier de configuration** sur la Raspberry Pi :

```bash
# Créez un dossier pour votre stack
mkdir -p ~/op-game-stack
cd ~/op-game-stack

# Créez le fichier .env avec vos variables
nano .env
```

2. **Copiez et adaptez le contenu** du fichier `.env.example` :

```env
# VARIABLES CRITIQUES - À MODIFIER OBLIGATOIREMENT
JWT_SECRET=VOTRE_SECRET_JWT_GENERE
JWT_REFRESH_SECRET=VOTRE_SECRET_REFRESH_GENERE
ADMIN_PASSWORD=VotreMotDePasseSecurise123!

# CONFIGURATION RÉSEAU
ALLOWED_ORIGINS=http://localhost,http://raspberry-op-game.local,http://192.168.1.XXX

# AUTRES VARIABLES (valeurs par défaut OK)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@votredomaine.com
```

3. **Générez des secrets sécurisés** :

```bash
# Génération de secrets aléatoires
openssl rand -base64 32
# Copiez le résultat dans JWT_SECRET

openssl rand -base64 32
# Copiez le résultat dans JWT_REFRESH_SECRET
```

### 2. Création du Stack dans Portainer

1. **Dans Portainer**, allez dans :
   - **Stacks** **Add stack**

2. **Nom du stack** : `op-game`

3. **Web editor** : Copiez le contenu du fichier `docker-compose.portainer.yml`

4. **Variables d'environnement** :
   - Cliquez sur **Add an environment variable**
   - Ajoutez TOUTES les variables de votre fichier `.env` :

   ```
   JWT_SECRET=votre_secret_genere
   JWT_REFRESH_SECRET=votre_secret_refresh_genere
   ADMIN_PASSWORD=votre_mot_de_passe
   ALLOWED_ORIGINS=http://localhost,http://raspberry-op-game.local
   ADMIN_USERNAME=admin
   ADMIN_EMAIL=admin@votredomaine.com
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10
   ```

5. **Déploiement** :
   - Cliquez sur **Deploy the stack**
   - Attendez que les deux conteneurs démarrent (vérifiez les logs)

### 3. Vérification du déploiement

Dans Portainer :
- Allez dans **Containers**
- Vérifiez que les deux conteneurs sont **running** :
  - `op-game-backend` : Healthy
  - `op-game-frontend` : Healthy

---

## Configuration Post-Déploiement

### 1. Vérification des volumes

```bash
# Listez les volumes créés
docker volume ls | grep op_game

# Inspectez le volume de données
docker volume inspect op_game_data
```

### 2. Initialisation de la base de données

La base de données est automatiquement initialisée au premier démarrage du backend.

```bash
# Vérifiez les logs du backend
docker logs op-game-backend

# Vous devriez voir :
# "Database initialized successfully"
# "Admin user created"
```

### 3. Configuration réseau (optionnel)

Si vous voulez accéder à l'application depuis l'extérieur de votre réseau local :

1. **Configuration du routeur** :
   - Redirigez le port 80 (HTTP) vers l'IP de votre Raspberry Pi
   - Redirigez le port 5000 (API) si nécessaire

2. **Utilisez un nom de domaine** (optionnel) :
   - Services comme DuckDNS, No-IP (DNS dynamique gratuit)
   - Configurez le DNS dynamique sur votre Raspberry Pi

3. **SSL/TLS avec Let's Encrypt** (recommandé pour la production) :

```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx

# Générez un certificat SSL
sudo certbot --nginx -d votredomaine.com
```

---

## Vérification et Tests

### 1. Test de l'API Backend

```bash
# Depuis la Raspberry Pi
curl http://localhost:5000/health

# Depuis un autre ordinateur sur le réseau
curl http://raspberry-op-game.local:5000/health

# Réponse attendue : {"status":"ok"}
```

### 2. Test du Frontend

1. Ouvrez votre navigateur
2. Accédez à : `http://raspberry-op-game.local` ou `http://192.168.1.XXX`
3. Vous devriez voir la page d'accueil de l'application

### 3. Test de connexion

1. Cliquez sur "Connexion"
2. Utilisez les identifiants admin :
   - Nom d'utilisateur : `admin` (ou celui configuré)
   - Mot de passe : celui que vous avez défini dans `.env`
3. Vérifiez que vous pouvez vous connecter

### 4. Vérification des logs

```bash
# Logs du backend
docker logs op-game-backend -f

# Logs du frontend
docker logs op-game-frontend -f

# Logs en temps réel de tous les conteneurs
docker logs -f --tail=50 op-game-backend
```

---

## Maintenance

### Mise à jour de l'application

#### Méthode 1 : Reconstruction des images

```bash
# 1. Sur votre machine de développement, reconstruisez les images
docker buildx build --platform linux/arm64 -t op-game-backend:latest -f Dockerfile.backend .
docker buildx build --platform linux/arm64 -t op-game-frontend:latest -f Dockerfile.frontend --build-arg VITE_API_URL=/api .

# 2. Sauvegardez et transférez
docker save op-game-backend:latest | gzip > op-game-backend.tar.gz
docker save op-game-frontend:latest | gzip > op-game-frontend.tar.gz
scp op-game-backend.tar.gz op-game-frontend.tar.gz pi@raspberry-op-game.local:~/

# 3. Sur la Raspberry Pi, chargez les nouvelles images
ssh pi@raspberry-op-game.local
docker load < ~/op-game-backend.tar.gz
docker load < ~/op-game-frontend.tar.gz

# 4. Dans Portainer, redéployez le stack
# Stacks op-game Update the stack
```

#### Méthode 2 : Via Portainer

1. Dans Portainer : **Stacks** **op-game**
2. Cliquez sur **Editor**
3. Modifiez si nécessaire
4. Cliquez sur **Update the stack**
5. Cochez **Pull latest image** si vous utilisez un registry
6. Cliquez sur **Update**

### Sauvegarde de la base de données

```bash
# Créez un script de sauvegarde
nano ~/backup-db.sh
```

```bash
#!/bin/bash
# Script de sauvegarde automatique

BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Créez le dossier de sauvegarde
mkdir -p $BACKUP_DIR

# Copiez la base de données depuis le volume Docker
docker run --rm \
  -v op_game_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine \
  cp /data/database.sqlite /backup/database_${DATE}.sqlite

# Gardez seulement les 7 dernières sauvegardes
cd $BACKUP_DIR
ls -t database_*.sqlite | tail -n +8 | xargs -r rm

echo "Sauvegarde créée : database_${DATE}.sqlite"
```

```bash
# Rendez le script exécutable
chmod +x ~/backup-db.sh

# Ajoutez une tâche cron pour sauvegarder quotidiennement
crontab -e
# Ajoutez cette ligne :
# 0 2 * * * /home/pi/backup-db.sh >> /home/pi/backup.log 2>&1
```

### Restauration de la base de données

```bash
# Restaurez depuis une sauvegarde
docker run --rm \
  -v op_game_data:/data \
  -v ~/backups:/backup \
  alpine \
  cp /backup/database_YYYYMMDD_HHMMSS.sqlite /data/database.sqlite

# Redémarrez le backend
docker restart op-game-backend
```

### Surveillance des ressources

```bash
# Surveillez l'utilisation des ressources
docker stats

# Surveillez les ressources système
htop
# (installez avec : sudo apt install htop)
```

---

## Dépannage

### Problème : Les conteneurs ne démarrent pas

**Symptômes** : État "Exited" dans Portainer

**Solutions** :
```bash
# Vérifiez les logs
docker logs op-game-backend
docker logs op-game-frontend

# Vérifiez que les images sont présentes
docker images | grep op-game

# Vérifiez les variables d'environnement
docker inspect op-game-backend | grep -A 20 Env
```

### Problème : "Unhealthy" status

**Symptômes** : Le conteneur démarre mais le healthcheck échoue

**Solutions** :
```bash
# Backend unhealthy
docker exec op-game-backend curl http://localhost:5000/health
# Si ça échoue, vérifiez les logs

# Frontend unhealthy
docker exec op-game-frontend curl http://localhost/
```

### Problème : Impossible de se connecter

**Symptômes** : Erreur 401 ou "Invalid credentials"

**Solutions** :
1. Vérifiez que `ADMIN_PASSWORD` est bien défini dans les variables d'environnement
2. Réinitialisez le mot de passe admin :

```bash
# Accédez au conteneur backend
docker exec -it op-game-backend sh

# Lancez le script de réinitialisation (si disponible)
# Ou consultez les logs pour voir le mot de passe initial
```

### Problème : L'application est lente

**Causes possibles** :
- Raspberry Pi surchargée
- Pas assez de RAM
- Carte SD lente

**Solutions** :
```bash
# Vérifiez l'utilisation des ressources
docker stats

# Réduisez les limites de mémoire dans docker-compose.portainer.yml
# Ajoutez plus de swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=4096
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Problème : Erreurs réseau

**Symptômes** : Le frontend ne peut pas communiquer avec le backend

**Solutions** :
```bash
# Vérifiez que les deux conteneurs sont sur le même réseau
docker network inspect op-game-network

# Vérifiez la configuration CORS
docker exec op-game-backend sh -c 'echo $ALLOWED_ORIGINS'

# Testez la connectivité entre conteneurs
docker exec op-game-frontend ping backend
```

### Problème : Volume de données perdu

**Solutions** :
```bash
# Listez tous les volumes
docker volume ls

# Si le volume existe mais les données sont vides
# Restaurez depuis une sauvegarde (voir section Maintenance)

# Si le volume n'existe pas
docker volume create op_game_data
# Puis redéployez le stack
```

### Logs de débogage complets

```bash
# Activez le mode debug dans le backend
# Ajoutez une variable d'environnement dans Portainer :
# LOG_LEVEL=debug

# Exportez tous les logs
docker logs op-game-backend > backend.log 2>&1
docker logs op-game-frontend > frontend.log 2>&1

# Inspectez la configuration complète
docker inspect op-game-backend > backend-config.json
docker inspect op-game-frontend > frontend-config.json
```

---

## Surveillance et Monitoring (Optionnel)

### Installation de Grafana et Prometheus

```bash
# Stack de monitoring avec Portainer
# Créez un nouveau stack avec ce docker-compose :

version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

---

## Félicitations !

Votre application One Piece Booster Game est maintenant déployée sur votre Raspberry Pi !

### Prochaines étapes suggérées

1. Configurez des sauvegardes automatiques
2. Configurez un nom de domaine personnalisé
3. Ajoutez SSL/TLS avec Let's Encrypt
4. Configurez des alertes de monitoring
5. Documentez votre configuration spécifique

---

## Support

Pour toute question ou problème :
- Consultez les logs : `docker logs <container_name>`
- Vérifiez les issues GitHub du projet
- Consultez la documentation Docker et Portainer

---

**Version du guide** : 1.0
**Dernière mise à jour** : 2025-01-29
**Testé sur** : Raspberry Pi 4 (4GB), Raspberry Pi OS Lite (64-bit)
