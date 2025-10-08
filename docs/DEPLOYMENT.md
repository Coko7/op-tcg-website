# 🚀 Guide de déploiement - One Piece Booster Game

Ce guide explique comment déployer l'application One Piece Booster Game sur un Raspberry Pi (ou tout autre serveur Linux) en utilisant Docker.

## 📋 Prérequis

### Matériel recommandé
- **Raspberry Pi 4** (4GB RAM minimum, 8GB recommandé)
- **Carte SD** de 32GB ou plus (Classe 10 ou mieux)
- **Alimentation** officielle Raspberry Pi
- **Connexion internet** stable

### Logiciels requis
- **Raspberry Pi OS** (64-bit recommandé)
- **Docker** et **Docker Compose**
- **Git**

## 🔧 Installation des dépendances

### 1. Mettre à jour le système

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Installer Docker

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer pour appliquer les changements
sudo reboot
```

### 3. Installer Docker Compose

```bash
# Pour Raspberry Pi (ARM64)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4. Vérifier les installations

```bash
docker --version
docker-compose --version
```

## 📦 Déploiement de l'application

### 1. Cloner le projet

```bash
git clone <votre-repo-url> op-game
cd op-game
```

### 2. Configurer l'environnement

```bash
# Copier le fichier d'environnement
cp .env.production .env

# Éditer la configuration (IMPORTANT!)
nano .env
```

**⚠️ IMPORTANT: Modifiez au minimum ces variables dans .env :**

```env
# Changez ces secrets ! (32+ caractères)
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS-IN-PRODUCTION
JWT_REFRESH_SECRET=your-super-secret-refresh-key-CHANGE-THIS-TOO

# Changez le mot de passe admin
ADMIN_PASSWORD=your-secure-admin-password

# Ajustez les origines autorisées
ALLOWED_ORIGINS=http://localhost,http://your-raspberry-pi-ip
```

### 3. Préparer les données (Optionnel)

Si vous avez des données Vegapull locales :

```bash
# Copier les données Vegapull
cp -r /path/to/vegapull-data/* public/data/vegapull/

# Copier les images
cp -r /path/to/card-images/* public/images/cards/
```

### 4. Démarrer l'application

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Démarrer l'application
./deploy.sh start
```

## 🎯 Commandes de gestion

Le script `deploy.sh` fournit plusieurs commandes utiles :

```bash
# Démarrer les services
./deploy.sh start

# Arrêter les services
./deploy.sh stop

# Redémarrer les services
./deploy.sh restart

# Voir les logs en temps réel
./deploy.sh logs

# Vérifier le statut des services
./deploy.sh status

# Reconstruire après des modifications
./deploy.sh rebuild

# Sauvegarder la base de données
./deploy.sh backup

# Voir l'aide complète
./deploy.sh help
```

## 🌐 Accès à l'application

Une fois déployée, l'application sera accessible :

- **Frontend**: http://your-raspberry-pi-ip
- **API Backend**: http://your-raspberry-pi-ip:5000
- **Health Check**: http://your-raspberry-pi-ip:5000/health

### Comptes par défaut

- **Admin**: admin@example.com / (mot de passe configuré dans .env)
- **Test**: user@example.com / user123456

## 📊 Monitoring et maintenance

### Vérifier les logs

```bash
# Logs de tous les services
./deploy.sh logs

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Vérifier l'utilisation des ressources

```bash
# État des conteneurs
docker stats

# Espace disque utilisé
docker system df
```

### Sauvegardes automatiques

Créez un script cron pour les sauvegardes automatiques :

```bash
# Éditer le crontab
crontab -e

# Ajouter une sauvegarde quotidienne à 2h du matin
0 2 * * * cd /path/to/op-game && ./deploy.sh backup
```

## 🔧 Configuration réseau avancée

### Accès depuis Internet (optionnel)

Pour rendre l'application accessible depuis Internet :

1. **Configurer le routeur** :
   - Rediriger le port 80 vers le Raspberry Pi
   - Rediriger le port 5000 vers le Raspberry Pi (si API publique souhaitée)

2. **Sécuriser avec HTTPS** (recommandé) :
   - Utiliser nginx-proxy avec Let's Encrypt
   - Ou configurer un reverse proxy

3. **Sécuriser l'accès** :
   - Changer tous les mots de passe par défaut
   - Configurer un pare-feu
   - Mettre à jour régulièrement

### Configuration IP statique

Pour éviter que l'IP change :

```bash
# Éditer la configuration réseau
sudo nano /etc/dhcpcd.conf

# Ajouter à la fin du fichier :
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 8.8.4.4
```

## 🚨 Résolution des problèmes

### Problèmes courants

#### Services qui ne démarrent pas

```bash
# Vérifier les logs
./deploy.sh logs

# Vérifier l'espace disque
df -h

# Redémarrer Docker
sudo systemctl restart docker
```

#### Problèmes de permissions

```bash
# Corriger les permissions des données
sudo chown -R $USER:$USER data/
sudo chmod -R 755 data/

# Reconstruire les conteneurs
./deploy.sh rebuild
```

#### Problèmes de mémoire

```bash
# Vérifier la mémoire disponible
free -h

# Augmenter le swap si nécessaire
sudo dphys-swapfile swapoff
sudo dphys-swapfile swapon
```

### Nettoyer Docker

Si l'espace disque est limité :

```bash
# Nettoyer les images inutilisées
docker system prune -a

# Nettoyer les volumes inutilisés
docker volume prune
```

## 📈 Optimisations pour Raspberry Pi

### Configuration Docker

Créer `/etc/docker/daemon.json` :

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

### Optimisation SD Card

```bash
# Réduire l'écriture sur la SD
echo 'tmpfs /tmp tmpfs defaults,noatime,nosuid,size=100m 0 0' | sudo tee -a /etc/fstab
echo 'tmpfs /var/tmp tmpfs defaults,noatime,nosuid,size=30m 0 0' | sudo tee -a /etc/fstab
```

## 🔄 Mise à jour de l'application

```bash
# Arrêter l'application
./deploy.sh stop

# Mettre à jour le code
git pull

# Reconstruire et redémarrer
./deploy.sh rebuild
```

## 📞 Support

En cas de problème :

1. Consultez les logs : `./deploy.sh logs`
2. Vérifiez le statut : `./deploy.sh status`
3. Vérifiez la configuration réseau
4. Consultez la documentation Docker