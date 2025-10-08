# Guide de D�ploiement sur Raspberry Pi avec Portainer

Ce guide d�taille toutes les �tapes n�cessaires pour d�ployer l'application **One Piece Booster Game** sur une Raspberry Pi en utilisant Docker et Portainer.

---

## Table des Mati�res

1. [Pr�requis](#-pr�requis)
2. [Pr�paration de la Raspberry Pi](#-pr�paration-de-la-raspberry-pi)
3. [Installation de Docker et Portainer](#-installation-de-docker-et-portainer)
4. [Construction des Images Docker](#-construction-des-images-docker)
5. [D�ploiement via Portainer](#-d�ploiement-via-portainer)
6. [Configuration Post-D�ploiement](#-configuration-post-d�ploiement)
7. [V�rification et Tests](#-v�rification-et-tests)
8. [Maintenance](#-maintenance)
9. [D�pannage](#-d�pannage)

---

## Pr�requis

### Mat�riel
- **Raspberry Pi 3B+, 4, ou 5** (recommand� : Pi 4 avec 4GB RAM minimum)
- **Carte SD** : 32GB minimum (64GB recommand�)
- **Alimentation** appropri�e pour votre mod�le
- **Connexion r�seau** (Ethernet recommand� pour les meilleures performances)

### Logiciels sur votre machine de d�veloppement
- Git
- Docker Desktop (pour construire les images)
- Un �diteur de texte
- SSH client (pour se connecter � la Raspberry Pi)

### Connaissances requises
- Utilisation basique de la ligne de commande Linux
- Concepts de base de Docker
- Navigation dans Portainer

---

## Pr�paration de la Raspberry Pi

### 1. Installation du syst�me d'exploitation

1. **T�l�chargez Raspberry Pi Imager** depuis [raspberrypi.com](https://www.raspberrypi.com/software/)

2. **Flashez une carte SD** avec :
   - **OS recommand�** : Raspberry Pi OS Lite (64-bit) pour de meilleures performances
   - Alternative : Raspberry Pi OS (64-bit) avec desktop si vous pr�f�rez une interface graphique

3. **Configuration initiale** (via Raspberry Pi Imager) :
   - Activez SSH
   - Configurez le nom d'utilisateur et mot de passe
   - Configurez le WiFi (si n�cessaire)
   - D�finissez le nom d'h�te (ex: `raspberry-op-game`)

4. **Ins�rez la carte SD** dans la Raspberry Pi et d�marrez

### 2. Premi�re connexion

```bash
# Depuis votre ordinateur, connectez-vous en SSH
ssh pi@raspberry-op-game.local
# ou utilisez l'adresse IP
ssh pi@192.168.1.XXX
```

### 3. Mise � jour du syst�me

```bash
# Mettez � jour les paquets
sudo apt update && sudo apt upgrade -y

# Red�marrez si n�cessaire
sudo reboot
```

### 4. Configuration recommand�e

```bash
# Augmenter la swap (recommand� pour les Pi avec peu de RAM)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Changez CONF_SWAPSIZE=100 en CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Optionnel : Configurer un IP statique
sudo nano /etc/dhcpcd.conf
# Ajoutez � la fin :
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

# Activer Docker au d�marrage
sudo systemctl enable docker

# Red�marrer pour appliquer les changements
sudo reboot
```

### 2. V�rification de Docker

```bash
# Apr�s le red�marrage, reconnectez-vous et testez
docker --version
docker ps
```

### 3. Installation de Portainer

```bash
# Cr�er un volume pour Portainer
docker volume create portainer_data

# D�marrer Portainer
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### 4. Acc�s � Portainer

1. Ouvrez votre navigateur et acc�dez � : `https://raspberry-op-game.local:9443`
   - Ou utilisez l'adresse IP : `https://192.168.1.XXX:9443`
   - Acceptez le certificat auto-sign�

2. **Premi�re configuration** :
   - Cr�ez un compte administrateur
   - Mot de passe : minimum 12 caract�res
   - Connectez-vous � l'environnement local

---

## Construction des Images Docker

### M�thode 1 : Construction sur votre machine de d�veloppement (Recommand�)

Cette m�thode est plus rapide et �vite de surcharger la Raspberry Pi.

```bash
# 1. Sur votre machine de d�veloppement, clonez le projet
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

# 4. Transf�rez les images vers la Raspberry Pi
scp op-game-backend.tar.gz pi@raspberry-op-game.local:~/
scp op-game-frontend.tar.gz pi@raspberry-op-game.local:~/

# 5. Sur la Raspberry Pi, chargez les images
ssh pi@raspberry-op-game.local
docker load < ~/op-game-backend.tar.gz
docker load < ~/op-game-frontend.tar.gz

# V�rifiez que les images sont charg�es
docker images | grep op-game
```

### M�thode 2 : Construction directement sur la Raspberry Pi

**Attention** : Cette m�thode est plus lente et peut prendre 30-60 minutes.

```bash
# 1. Sur la Raspberry Pi, clonez ou transf�rez le projet
git clone <votre-repo> ~/op-game
# OU transf�rez les fichiers
scp -r C:\Users\ppccl\Desktop\OP_game_claude pi@raspberry-op-game.local:~/op-game

# 2. Naviguez dans le dossier
cd ~/op-game

# 3. Construisez les images
docker build -t op-game-backend:latest -f Dockerfile.backend .
docker build -t op-game-frontend:latest -f Dockerfile.frontend --build-arg VITE_API_URL=/api .
```

---

## =� D�ploiement via Portainer

### 1. Pr�paration de la configuration

1. **Cr�ez un fichier de configuration** sur la Raspberry Pi :

```bash
# Cr�ez un dossier pour votre stack
mkdir -p ~/op-game-stack
cd ~/op-game-stack

# Cr�ez le fichier .env avec vos variables
nano .env
```

2. **Copiez et adaptez le contenu** du fichier `.env.example` :

```env
# VARIABLES CRITIQUES - � MODIFIER OBLIGATOIREMENT
JWT_SECRET=VOTRE_SECRET_JWT_GENERE
JWT_REFRESH_SECRET=VOTRE_SECRET_REFRESH_GENERE
ADMIN_PASSWORD=VotreMotDePasseSecurise123!

# CONFIGURATION R�SEAU
ALLOWED_ORIGINS=http://localhost,http://raspberry-op-game.local,http://192.168.1.XXX

# AUTRES VARIABLES (valeurs par d�faut OK)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@votredomaine.com
```

3. **G�n�rez des secrets s�curis�s** :

```bash
# G�n�ration de secrets al�atoires
openssl rand -base64 32
# Copiez le r�sultat dans JWT_SECRET

openssl rand -base64 32
# Copiez le r�sultat dans JWT_REFRESH_SECRET
```

### 2. Cr�ation du Stack dans Portainer

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

5. **D�ploiement** :
   - Cliquez sur **Deploy the stack**
   - Attendez que les deux conteneurs d�marrent (v�rifiez les logs)

### 3. V�rification du d�ploiement

Dans Portainer :
- Allez dans **Containers**
- V�rifiez que les deux conteneurs sont **running** :
  - `op-game-backend` : Healthy
  - `op-game-frontend` : Healthy

---

## Configuration Post-D�ploiement

### 1. V�rification des volumes

```bash
# Listez les volumes cr��s
docker volume ls | grep op_game

# Inspectez le volume de donn�es
docker volume inspect op_game_data
```

### 2. Initialisation de la base de donn�es

La base de donn�es est automatiquement initialis�e au premier d�marrage du backend.

```bash
# V�rifiez les logs du backend
docker logs op-game-backend

# Vous devriez voir :
# "Database initialized successfully"
# "Admin user created"
```

### 3. Configuration r�seau (optionnel)

Si vous voulez acc�der � l'application depuis l'ext�rieur de votre r�seau local :

1. **Configuration du routeur** :
   - Redirigez le port 80 (HTTP) vers l'IP de votre Raspberry Pi
   - Redirigez le port 5000 (API) si n�cessaire

2. **Utilisez un nom de domaine** (optionnel) :
   - Services comme DuckDNS, No-IP (DNS dynamique gratuit)
   - Configurez le DNS dynamique sur votre Raspberry Pi

3. **SSL/TLS avec Let's Encrypt** (recommand� pour la production) :

```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx

# G�n�rez un certificat SSL
sudo certbot --nginx -d votredomaine.com
```

---

## V�rification et Tests

### 1. Test de l'API Backend

```bash
# Depuis la Raspberry Pi
curl http://localhost:5000/health

# Depuis un autre ordinateur sur le r�seau
curl http://raspberry-op-game.local:5000/health

# R�ponse attendue : {"status":"ok"}
```

### 2. Test du Frontend

1. Ouvrez votre navigateur
2. Acc�dez � : `http://raspberry-op-game.local` ou `http://192.168.1.XXX`
3. Vous devriez voir la page d'accueil de l'application

### 3. Test de connexion

1. Cliquez sur "Connexion"
2. Utilisez les identifiants admin :
   - Nom d'utilisateur : `admin` (ou celui configur�)
   - Mot de passe : celui que vous avez d�fini dans `.env`
3. V�rifiez que vous pouvez vous connecter

### 4. V�rification des logs

```bash
# Logs du backend
docker logs op-game-backend -f

# Logs du frontend
docker logs op-game-frontend -f

# Logs en temps r�el de tous les conteneurs
docker logs -f --tail=50 op-game-backend
```

---

## Maintenance

### Mise � jour de l'application

#### M�thode 1 : Reconstruction des images

```bash
# 1. Sur votre machine de d�veloppement, reconstruisez les images
docker buildx build --platform linux/arm64 -t op-game-backend:latest -f Dockerfile.backend .
docker buildx build --platform linux/arm64 -t op-game-frontend:latest -f Dockerfile.frontend --build-arg VITE_API_URL=/api .

# 2. Sauvegardez et transf�rez
docker save op-game-backend:latest | gzip > op-game-backend.tar.gz
docker save op-game-frontend:latest | gzip > op-game-frontend.tar.gz
scp op-game-backend.tar.gz op-game-frontend.tar.gz pi@raspberry-op-game.local:~/

# 3. Sur la Raspberry Pi, chargez les nouvelles images
ssh pi@raspberry-op-game.local
docker load < ~/op-game-backend.tar.gz
docker load < ~/op-game-frontend.tar.gz

# 4. Dans Portainer, red�ployez le stack
# Stacks op-game Update the stack
```

#### M�thode 2 : Via Portainer

1. Dans Portainer : **Stacks** **op-game**
2. Cliquez sur **Editor**
3. Modifiez si n�cessaire
4. Cliquez sur **Update the stack**
5. Cochez **Pull latest image** si vous utilisez un registry
6. Cliquez sur **Update**

### Sauvegarde de la base de donn�es

```bash
# Cr�ez un script de sauvegarde
nano ~/backup-db.sh
```

```bash
#!/bin/bash
# Script de sauvegarde automatique

BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Cr�ez le dossier de sauvegarde
mkdir -p $BACKUP_DIR

# Copiez la base de donn�es depuis le volume Docker
docker run --rm \
  -v op_game_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine \
  cp /data/database.sqlite /backup/database_${DATE}.sqlite

# Gardez seulement les 7 derni�res sauvegardes
cd $BACKUP_DIR
ls -t database_*.sqlite | tail -n +8 | xargs -r rm

echo "Sauvegarde cr��e : database_${DATE}.sqlite"
```

```bash
# Rendez le script ex�cutable
chmod +x ~/backup-db.sh

# Ajoutez une t�che cron pour sauvegarder quotidiennement
crontab -e
# Ajoutez cette ligne :
# 0 2 * * * /home/pi/backup-db.sh >> /home/pi/backup.log 2>&1
```

### Restauration de la base de donn�es

```bash
# Restaurez depuis une sauvegarde
docker run --rm \
  -v op_game_data:/data \
  -v ~/backups:/backup \
  alpine \
  cp /backup/database_YYYYMMDD_HHMMSS.sqlite /data/database.sqlite

# Red�marrez le backend
docker restart op-game-backend
```

### Surveillance des ressources

```bash
# Surveillez l'utilisation des ressources
docker stats

# Surveillez les ressources syst�me
htop
# (installez avec : sudo apt install htop)
```

---

## D�pannage

### Probl�me : Les conteneurs ne d�marrent pas

**Sympt�mes** : �tat "Exited" dans Portainer

**Solutions** :
```bash
# V�rifiez les logs
docker logs op-game-backend
docker logs op-game-frontend

# V�rifiez que les images sont pr�sentes
docker images | grep op-game

# V�rifiez les variables d'environnement
docker inspect op-game-backend | grep -A 20 Env
```

### Probl�me : "Unhealthy" status

**Sympt�mes** : Le conteneur d�marre mais le healthcheck �choue

**Solutions** :
```bash
# Backend unhealthy
docker exec op-game-backend curl http://localhost:5000/health
# Si �a �choue, v�rifiez les logs

# Frontend unhealthy
docker exec op-game-frontend curl http://localhost/
```

### Probl�me : Impossible de se connecter

**Sympt�mes** : Erreur 401 ou "Invalid credentials"

**Solutions** :
1. V�rifiez que `ADMIN_PASSWORD` est bien d�fini dans les variables d'environnement
2. R�initialisez le mot de passe admin :

```bash
# Acc�dez au conteneur backend
docker exec -it op-game-backend sh

# Lancez le script de r�initialisation (si disponible)
# Ou consultez les logs pour voir le mot de passe initial
```

### Probl�me : L'application est lente

**Causes possibles** :
- Raspberry Pi surcharg�e
- Pas assez de RAM
- Carte SD lente

**Solutions** :
```bash
# V�rifiez l'utilisation des ressources
docker stats

# R�duisez les limites de m�moire dans docker-compose.portainer.yml
# Ajoutez plus de swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=4096
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Probl�me : Erreurs r�seau

**Sympt�mes** : Le frontend ne peut pas communiquer avec le backend

**Solutions** :
```bash
# V�rifiez que les deux conteneurs sont sur le m�me r�seau
docker network inspect op-game-network

# V�rifiez la configuration CORS
docker exec op-game-backend sh -c 'echo $ALLOWED_ORIGINS'

# Testez la connectivit� entre conteneurs
docker exec op-game-frontend ping backend
```

### Probl�me : Volume de donn�es perdu

**Solutions** :
```bash
# Listez tous les volumes
docker volume ls

# Si le volume existe mais les donn�es sont vides
# Restaurez depuis une sauvegarde (voir section Maintenance)

# Si le volume n'existe pas
docker volume create op_game_data
# Puis red�ployez le stack
```

### Logs de d�bogage complets

```bash
# Activez le mode debug dans le backend
# Ajoutez une variable d'environnement dans Portainer :
# LOG_LEVEL=debug

# Exportez tous les logs
docker logs op-game-backend > backend.log 2>&1
docker logs op-game-frontend > frontend.log 2>&1

# Inspectez la configuration compl�te
docker inspect op-game-backend > backend-config.json
docker inspect op-game-frontend > frontend-config.json
```

---

## Surveillance et Monitoring (Optionnel)

### Installation de Grafana et Prometheus

```bash
# Stack de monitoring avec Portainer
# Cr�ez un nouveau stack avec ce docker-compose :

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

## F�licitations !

Votre application One Piece Booster Game est maintenant d�ploy�e sur votre Raspberry Pi !

### Prochaines �tapes sugg�r�es

1. Configurez des sauvegardes automatiques
2. Configurez un nom de domaine personnalis�
3. Ajoutez SSL/TLS avec Let's Encrypt
4. Configurez des alertes de monitoring
5. Documentez votre configuration sp�cifique

---

## Support

Pour toute question ou probl�me :
- Consultez les logs : `docker logs <container_name>`
- V�rifiez les issues GitHub du projet
- Consultez la documentation Docker et Portainer

---

**Version du guide** : 1.0
**Derni�re mise � jour** : 2025-01-29
**Test� sur** : Raspberry Pi 4 (4GB), Raspberry Pi OS Lite (64-bit)
