# 🏴‍☠️ One Piece Booster Game

Application web de jeu d'ouverture de boosters One Piece TCG inspirée de Pokemon TCG Pocket. Ouvrez des boosters, collectionnez 2,628+ cartes authentiques, complétez vos sets et échangez avec d'autres joueurs !

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation Rapide](#-installation-rapide)
- [Déploiement Docker](#-déploiement-docker)
- [Déploiement Raspberry Pi / Portainer](#-déploiement-raspberry-pi--portainer)
- [Architecture Technique](#️-architecture-technique)
- [Documentation des Fonctionnalités](#-documentation-des-fonctionnalités)
- [Sécurité](#-sécurité)
- [Administration](#️-administration)
- [Base de Données](#️-base-de-données)
- [API REST](#-api-rest)
- [Design System](#-design-system)
- [Dépannage](#-dépannage)
- [Corrections Appliquées](#-corrections-appliquées)

---

## 🎯 Fonctionnalités

### Système de Boosters
- **3 boosters gratuits par jour** - Régénération automatique toutes les 8 heures
- **Achat de boosters** - 100 Berrys par booster
- **5 cartes par booster** - Distribution garantie par rareté
- **36+ boosters officiels** - Sets ST-01 à OP-09+
- **Animations fluides** - Ouverture avec révélation progressive

### Collection de Cartes
- **2,628+ cartes authentiques** - Vraies cartes du One Piece TCG
- **6 niveaux de rareté** - Common, Uncommon, Rare, Leader, Super Rare, Secret Rare
- **Système de favoris** - Marquez vos cartes préférées
- **Recherche & filtres** - Par nom, personnage, rareté, booster
- **Vente de cartes** - Convertissez les doublons en Berrys
- **Carte vitrine profil** - Affichez votre carte favorite sur le leaderboard

### Marketplace P2P
- **Échanges entre joueurs** - Achetez et vendez des cartes
- **Prix personnalisés** - Fixez vos propres prix (1-999,999 Berrys)
- **Protection complète** - Impossible de vendre la dernière copie
- **Limite de 3 annonces** - Par joueur
- **Transactions atomiques** - Sécurité garantie

### Système d'Achievements
- **10+ achievements** - Ouverture de boosters, collection
- **Récompenses en Berrys** - Jusqu'à 4,550+ Berrys au total
- **Suivi de progression** - Pourcentages en temps réel
- **Achievements par booster** - Complétez chaque set (20%, 50%, 100%)

### Récompenses Quotidiennes
- **10 Berrys par jour** - Connexion quotidienne récompensée
- **Protection anti-triche** - Triple vérification (frontend + backend + DB)
- **Modal automatique** - Popup à la première visite du jour

### Leaderboard
- **Top 3 joueurs** - Classés par cartes rares
- **Système de tiebreak** - Secret Rare > Super Rare > Rare > Uncommon > Common
- **Carte vitrine** - Affichage de la carte favorite du profil

### Notifications Globales (Admin)
- **Annonces à tous les joueurs**
- **Récompenses incluses** - Jusqu'à 10,000 Berrys + 10 boosters
- **Dates d'expiration** - Optionnelles
- **Réclamation unique** - Une seule fois par joueur

### Sécurité Avancée
- **Score: A+** - Protection complète contre les attaques
- **Rate Limiting** - Protection contre le spam
- **Anti-Cheat** - Détection de bots et patterns suspects
- **Audit Logging** - Traçabilité complète
- **JWT avec Refresh Tokens** - Authentification sécurisée
- **Transactions atomiques** - Prévention des conditions de course

---

## 🚀 Installation Rapide

### Option 1: Docker (Recommandé)

```bash
# 1. Cloner le projet
git clone <repository-url>
cd OP_game_claude

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env et définir:
# - JWT_SECRET (générer avec: openssl rand -base64 32)
# - JWT_REFRESH_SECRET (générer différent)
# - ADMIN_PASSWORD

# 3. Lancer avec Docker Compose
docker-compose up -d

# 4. Vérifier le statut
docker ps
docker logs op-game-backend
docker logs op-game-frontend

# 5. Accéder à l'application
# Frontend: http://localhost
# Backend: http://localhost:5000
# Admin: http://localhost/admin
```

### Option 2: Développement Local

**Backend:**
```bash
cd server
npm install
cp .env.example .env
# Éditer .env avec vos secrets
npm run dev
```

**Frontend:**
```bash
npm install
npm run dev
```

---

## 🐳 Déploiement Docker

### Structure des Fichiers

```
OP_game_claude/
├── docker-compose.yml              # Configuration locale
├── docker-compose.portainer.yml    # Configuration Portainer
├── Dockerfile.backend              # Multi-stage optimisé
├── Dockerfile.frontend             # Multi-stage optimisé
├── .dockerignore                   # Exclusions
└── .env                            # Variables d'environnement
```

### Variables d'Environnement Requises

**Critiques (OBLIGATOIRES en production):**
```env
JWT_SECRET=<générer avec openssl rand -base64 32>
JWT_REFRESH_SECRET=<générer différent>
ADMIN_PASSWORD=VotreMotDePasseSecurisé123!
```

**Optionnelles:**
```env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ALLOWED_ORIGINS=http://localhost,http://your-domain.com
COOKIE_DOMAIN=.yourdomain.com
NODE_ENV=production
BACKEND_PORT=5000
FRONTEND_PORT=80
```

### Build des Images

**Local (x86_64):**
```bash
docker-compose build
docker-compose up -d
```

**Cross-compilation pour ARM64 (Raspberry Pi):**
```bash
# Activer buildx
docker buildx create --use

# Build backend
docker buildx build --platform linux/arm64 \
  -t op-game-backend:latest \
  -f Dockerfile.backend \
  --load \
  .

# Build frontend
docker buildx build --platform linux/arm64 \
  -t op-game-frontend:latest \
  -f Dockerfile.frontend \
  --build-arg VITE_API_URL=/api \
  --load \
  .
```

### Volumes Persistants

```yaml
volumes:
  op_game_data:       # Base de données SQLite
  op_game_backups:    # Backups automatiques
  op_game_logs:       # Logs d'audit et serveur
```

**Localisation des données:**
- Backend: `/app/data/database.sqlite`
- Backups: `/app/backups/`
- Logs: `/app/logs/`

### Healthchecks

**Backend:**
```bash
curl http://localhost:5000/health
# Doit retourner: {"status":"ok"}
```

**Frontend:**
```bash
curl http://localhost/
# Doit retourner: HTML de l'application
```

---

## 🥧 Déploiement Raspberry Pi / Portainer

### Prérequis

- **Raspberry Pi 4** (4GB RAM minimum, 8GB recommandé)
- **SD Card 32GB+** (Class 10 ou supérieure)
- **Raspberry Pi OS 64-bit**
- **Connexion internet stable**

### Étape 1: Préparation du Raspberry Pi

```bash
# 1. Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# 2. Augmenter le swap (pour les Pi avec peu de RAM)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Changer CONF_SWAPSIZE=100 à CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# 3. (Optionnel) Configurer une IP statique
sudo nano /etc/dhcpcd.conf
# Ajouter:
# interface eth0
# static ip_address=192.168.1.XXX/24
# static routers=192.168.1.1
# static domain_name_servers=192.168.1.1 8.8.8.8

# 4. Redémarrer
sudo reboot
```

### Étape 2: Installation de Docker

```bash
# 1. Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# 3. Activer Docker au démarrage
sudo systemctl enable docker

# 4. Redémarrer pour appliquer les changements
sudo reboot
```

### Étape 3: Installation de Portainer

```bash
# 1. Créer le volume Portainer
docker volume create portainer_data

# 2. Lancer Portainer
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# 3. Vérifier le statut
docker ps | grep portainer
```

**Accéder à Portainer:** `https://<raspberry-ip>:9443`

Créez votre compte admin au premier accès.

### Étape 4: Build et Transfer des Images

**Sur votre machine de développement (Windows/Mac/Linux):**

```bash
cd C:\Users\ppccl\Desktop\OP_game_claude

# Build backend pour ARM64
docker buildx build --platform linux/arm64 \
  -t op-game-backend:latest \
  -f Dockerfile.backend \
  --load \
  .

# Build frontend pour ARM64
docker buildx build --platform linux/arm64 \
  -t op-game-frontend:latest \
  -f Dockerfile.frontend \
  --build-arg VITE_API_URL=/api \
  --load \
  .

# Exporter les images
docker save op-game-backend:latest | gzip > op-game-backend.tar.gz
docker save op-game-frontend:latest | gzip > op-game-frontend.tar.gz

# Transférer vers le Raspberry Pi
scp op-game-backend.tar.gz pi@<raspberry-ip>:~/
scp op-game-frontend.tar.gz pi@<raspberry-ip>:~/
```

**Sur le Raspberry Pi:**

```bash
# Charger les images
docker load < ~/op-game-backend.tar.gz
docker load < ~/op-game-frontend.tar.gz

# Vérifier
docker images | grep op-game
```

### Étape 5: Configuration de l'Environnement

```bash
# Créer le répertoire de configuration
mkdir -p ~/op-game-stack
cd ~/op-game-stack

# Créer le fichier .env
nano .env
```

**Contenu du `.env`:**

```env
# CRITIQUES - Générer des secrets uniques
JWT_SECRET=<générer avec: openssl rand -base64 32>
JWT_REFRESH_SECRET=<générer différent du JWT_SECRET>
ADMIN_PASSWORD=VotreMotDePasseSécurisé123!

# Configuration réseau
ALLOWED_ORIGINS=http://localhost,http://raspberry-op-game.local,http://192.168.1.XXX

# Autres paramètres
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
NODE_ENV=production
```

### Étape 6: Déploiement via Portainer

1. **Accéder à Portainer** : `https://<raspberry-ip>:9443`

2. **Naviguer vers Stacks** : Menu latéral > Stacks > Add stack

3. **Nommer le stack** : `op-game`

4. **Web editor** : Copier le contenu de `docker-compose.portainer.yml`

5. **Environment variables** : Ajouter toutes les variables du fichier `.env`

6. **Deploy the stack** : Cliquer sur "Deploy the stack"

### Étape 7: Vérification du Déploiement

```bash
# Vérifier les conteneurs
docker ps

# Vérifier les logs
docker logs op-game-backend
docker logs op-game-frontend

# Tester l'API
curl http://localhost:5000/health
# Devrait retourner: {"status":"ok"}

# Tester le frontend
curl http://localhost/
```

**Accéder à l'application:**
- Frontend: `http://<raspberry-ip>/`
- Admin: `http://<raspberry-ip>/admin`

### Étape 8: Configuration Post-Déploiement

**Créer un utilisateur admin (si nécessaire):**

```bash
docker exec -it op-game-backend node scripts/make-admin.js <username>
```

**Backup automatique:**

```bash
# Créer un cron job pour les backups quotidiens
docker exec op-game-backend sh -c 'crontab -l | { cat; echo "0 2 * * * node /app/scripts/backup-database.js"; } | crontab -'
```

**Monitoring:**

```bash
# Voir les ressources utilisées
docker stats

# Voir les logs en temps réel
docker logs -f op-game-backend
```

### Optimisations pour Raspberry Pi

**1. Réduire les limites de ressources**

Éditer `docker-compose.portainer.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
```

**2. Activer log rotation**

```bash
# Limiter la taille des logs Docker
sudo nano /etc/docker/daemon.json
```

Ajouter:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

---

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS (Design system glassmorphism)
- React Router DOM
- Lucide React (icônes)
- Vite (build tool)
- Vite PWA Plugin

**Backend:**
- Node.js 20 + Express + TypeScript
- SQLite3 avec better-sqlite3
- JWT + Refresh Tokens
- bcryptjs (hashing)
- Helmet + CORS (sécurité)
- express-rate-limit
- Zod (validation)

**Infrastructure:**
- Docker + Docker Compose
- Multi-stage builds optimisés
- Nginx (reverse proxy frontend)
- Healthchecks automatiques
- Volumes persistants

### Structure du Projet

```
OP_game_claude/
├── src/                          # Frontend React
│   ├── components/               # Composants réutilisables
│   │   ├── ui/                   # Design system
│   │   ├── Card.tsx
│   │   ├── DailyRewardModal.tsx
│   │   └── ...
│   ├── pages/                    # Pages principales
│   │   ├── Home.tsx
│   │   ├── Boosters.tsx
│   │   ├── Collection.tsx
│   │   ├── Achievements.tsx
│   │   ├── Marketplace.tsx
│   │   ├── Leaderboard.tsx
│   │   └── Admin.tsx
│   ├── services/                 # Services API
│   │   ├── api.ts
│   │   ├── gameService.ts
│   │   └── vegapullService.ts
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   └── types/                    # Types TypeScript
│
├── server/                       # Backend Node.js
│   ├── src/
│   │   ├── controllers/          # Contrôleurs API
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── cardController.ts
│   │   │   ├── achievementController.ts
│   │   │   ├── marketplaceController.ts
│   │   │   ├── leaderboardController.ts
│   │   │   ├── dashboardController.ts
│   │   │   └── notificationController.ts
│   │   ├── models/               # Modèles de données
│   │   │   ├── User.ts
│   │   │   ├── Card.ts
│   │   │   ├── Booster.ts
│   │   │   ├── Achievement.ts
│   │   │   └── MarketplaceListing.ts
│   │   ├── services/             # Services métier
│   │   │   ├── BoosterService.ts
│   │   │   ├── AchievementService.ts
│   │   │   └── CardUpdateService.ts
│   │   ├── middleware/           # Middlewares
│   │   │   ├── auth.ts
│   │   │   ├── security.ts
│   │   │   ├── antiCheat.ts
│   │   │   └── validation.ts
│   │   ├── routes/               # Routes API
│   │   ├── utils/                # Utilitaires
│   │   │   ├── database.ts
│   │   │   ├── migrations.ts
│   │   │   ├── auditLogger.ts
│   │   │   └── logger.ts
│   │   └── scripts/              # Scripts d'administration
│   ├── data/                     # Base de données
│   ├── backups/                  # Backups automatiques
│   └── logs/                     # Logs d'audit
│
├── public/                       # Assets statiques
│   ├── data/vegapull/            # Données des cartes
│   └── images/                   # Images des cartes
│
├── docker-compose.yml            # Config Docker locale
├── docker-compose.portainer.yml  # Config Docker Portainer
├── Dockerfile.backend            # Image backend
├── Dockerfile.frontend           # Image frontend
└── .dockerignore                 # Exclusions Docker
```

### Flux de Données

```
User → Frontend (React)
  ↓
API Service (axios)
  ↓
Backend (Express)
  ↓
Middleware (Auth, Security, Anti-Cheat)
  ↓
Controller
  ↓
Service (Business Logic)
  ↓
Model (Database)
  ↓
SQLite Database
```

---

## 📚 Documentation des Fonctionnalités

### 1. Authentification & Gestion Utilisateur

#### Inscription & Connexion

**Description:** Création de compte et connexion sécurisée avec JWT.

**Endpoints:**
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/logout` - Se déconnecter
- `POST /api/auth/refresh` - Renouveler le token
- `GET /api/auth/me` - Informations utilisateur

**Sécurité:**
- Hashing bcrypt (12 rounds configurables)
- Username 3-30 caractères
- Password minimum 6 caractères
- Vérification unicité username/email
- Audit logging de toutes les tentatives

**Base de données:** `users`, `user_sessions`

**Fichiers:**
- `server/src/controllers/authController.ts`
- `server/src/models/User.ts`
- `src/pages/Login.tsx`, `src/pages/Register.tsx`

---

#### JWT avec Refresh Tokens

**Description:** Authentification moderne avec tokens courts et longs.

**Fonctionnement:**
- **Access Token:** 15 minutes (pour les requêtes API)
- **Refresh Token:** 7 jours (pour obtenir de nouveaux access tokens)
- Stockage en cookies httpOnly (XSS-safe)
- Session tracking en base de données

**Sécurité:**
- Secrets obligatoires en production
- HttpOnly + Secure + SameSite cookies
- Rotation des refresh tokens
- Invalidation à la déconnexion

**Fichiers:**
- `server/src/controllers/authController.ts`
- `server/src/middleware/auth.ts`

---

#### Rôle Admin

**Description:** Comptes avec privilèges élevés pour l'administration.

**Création d'un admin:**

```bash
# Méthode 1: Script (recommandé)
docker exec -it op-game-backend node scripts/make-admin.js <username>

# Méthode 2: SQL direct
docker exec -it op-game-backend sqlite3 /app/data/database.sqlite
UPDATE users SET is_admin = 1 WHERE username = 'username';

# Méthode 3: Variable d'environnement
# Définir ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD dans .env
# L'admin est créé automatiquement au démarrage
```

**Fichiers:**
- `server/src/middleware/auth.ts` (requireAdmin)
- `src/pages/Admin.tsx`

---

### 2. Système de Boosters

#### Boosters Gratuits Quotidiens

**Description:** 3 boosters gratuits qui se régénèrent toutes les 8 heures.

**Endpoints:**
- `GET /api/users/boosters/status` - Statut des boosters
- `POST /api/users/boosters/open` - Ouvrir un booster gratuit

**Fonctionnement:**
- Maximum 3 boosters stockés
- 1 booster régénéré toutes les 8 heures
- Timer démarre quand < 3 boosters
- Calcul côté serveur uniquement

**Sécurité:**
- Validation serveur du timer
- Transaction atomique pour déduction
- Anti-cheat: max 10/min, 100/h
- Vérification timestamps futurs

**Base de données:** `users` (available_boosters, next_booster_time)

**Fichiers:**
- `server/src/controllers/userController.ts`
- `src/pages/Home.tsx`

---

#### Ouverture de Boosters

**Description:** Ouvre un booster et génère 5 cartes avec distribution par rareté.

**Endpoints:**
- `POST /api/users/boosters/open`

**Distribution des Raretés:**
- **Common:** 58%
- **Uncommon:** 26%
- **Rare:** 10%
- **Leader:** 3%
- **Super Rare:** 2.5%
- **Secret Rare:** 0.5%

**Fonctionnement:**
1. Vérifier disponibilité du booster
2. Déduire 1 booster (transaction atomique)
3. Générer 5 cartes (BoosterService)
4. Ajouter à la collection (ou incrémenter quantité)
5. Enregistrer l'historique
6. Mettre à jour les achievements

**Sécurité:**
- Génération serveur (pas de manipulation client)
- Transaction atomique (rollback si erreur)
- Rate limiting via anti-cheat
- Audit logging

**Base de données:** `boosters`, `cards`, `user_collections`, `booster_openings`

**Fichiers:**
- `server/src/services/BoosterService.ts`
- `server/src/controllers/userController.ts`
- `src/pages/Boosters.tsx`

---

#### Achat de Boosters avec Berrys

**Description:** Acheter des boosters supplémentaires avec la monnaie du jeu.

**Endpoints:**
- `POST /api/users/boosters/buy`
- `GET /api/users/berrys`

**Prix:** 100 Berrys = 1 booster

**Fonctionnement:**
1. Vérifier solde (≥ 100 Berrys)
2. Déduire 100 Berrys (transaction atomique)
3. Même génération que booster gratuit

**Sécurité:**
- Calcul prix côté serveur
- Transaction atomique avec vérification solde
- Maximum Berrys: 999,999,999
- Audit logging

**Fichiers:**
- `server/src/controllers/userController.ts`

---

### 3. Gestion de la Collection

#### Visualisation de la Collection

**Description:** Vue complète des cartes possédées avec métadonnées.

**Endpoints:**
- `GET /api/users/collection`
- `GET /api/users/stats`

**Données affichées:**
- Nom, personnage, rareté, type, couleur
- Attaque, défense, coût, pouvoir, counter
- Description, capacités spéciales
- Image + image de secours
- Quantité possédée
- Date d'obtention
- Statut favori

**Filtres disponibles:**
- Par rareté
- Par booster
- Par nom/personnage (recherche)
- Favoris uniquement

**Base de données:** `user_collections`, `cards`

**Fichiers:**
- `server/src/controllers/userController.ts`
- `src/pages/Collection.tsx`

---

#### Vente de Cartes

**Description:** Convertir les doublons en Berrys.

**Endpoints:**
- `POST /api/users/cards/sell`

**Prix de Vente par Rareté:**
- **Common:** 10 Berrys
- **Uncommon:** 25 Berrys
- **Rare:** 50 Berrys
- **Leader:** 100 Berrys
- **Super Rare:** 150 Berrys
- **Secret Rare:** 500 Berrys

**Règles:**
- Doit posséder au moins 2 copies (garde toujours 1 minimum)
- Quantité max par transaction: 1-1000
- Transaction atomique

**Sécurité:**
- Calcul prix serveur uniquement
- Vérification propriété
- Contrainte minimum 1 copie
- Cap Berrys respecté
- Audit logging

**Fichiers:**
- `server/src/controllers/userController.ts`

---

#### Système de Favoris

**Description:** Marquer des cartes comme favorites pour accès rapide.

**Endpoints:**
- `POST /api/users/collection/favorite/:cardId`

**Fonctionnement:**
- Toggle on/off avec un seul endpoint
- Plusieurs favoris autorisés
- Indépendant de la carte vitrine profil

**Base de données:** `user_collections` (is_favorite)

**Fichiers:**
- `server/src/controllers/userController.ts`
- `src/pages/Collection.tsx`

---

#### Carte Vitrine Profil

**Description:** Une carte favorite affichée sur le profil et le leaderboard.

**Endpoints:**
- `PUT /api/users/profile/favorite-card`
- `GET /api/users/me`

**Règles:**
- Une seule carte à la fois
- Doit posséder la carte
- Carte doit être active
- Peut être effacée (null)

**Base de données:** `users` (favorite_card_id)

**Fichiers:**
- `server/src/controllers/userController.ts`
- `src/pages/ProfileSettings.tsx`

---

### 4. Achievements

#### Système d'Achievements

**Description:** Défis avec récompenses en Berrys pour progresser dans le jeu.

**Endpoints:**
- `GET /api/achievements` - Liste avec progression
- `GET /api/achievements/stats` - Statistiques
- `POST /api/achievements/:id/claim` - Réclamer récompense

**Types d'Achievements:**

1. **Ouverture de Boosters (5 niveaux):**
   - First Booster (1) → 50 Berrys
   - Novice Collector (10) → 100 Berrys
   - Dedicated Collector (50) → 250 Berrys
   - Master Collector (100) → 500 Berrys
   - Legend of Boosters (250) → 1000 Berrys

2. **Collection (5 niveaux):**
   - First Collection (10 cartes uniques) → 50 Berrys
   - Growing Collection (50) → 150 Berrys
   - Impressive Library (100) → 300 Berrys
   - Epic Collection (200) → 600 Berrys
   - Ultimate Collector (500) → 1500 Berrys

3. **Complétion de Boosters (par set):**
   - Explorer (20%) → 100 Berrys
   - Collector (50%) → 250 Berrys
   - Complete Master (100%) → 500 Berrys

**Total Potential:** 4,550+ Berrys

**Progression:**
- Mise à jour automatique après chaque action
- Pourcentage affiché en temps réel
- Complétion quand progress ≥ threshold

**Réclamation:**
- Manuelle (bouton "Claim")
- Une seule fois par achievement
- Transaction atomique
- Ajout immédiat des Berrys

**Sécurité:**
- Calcul serveur uniquement
- Vérification complétion avant claim
- Protection double-claim
- Tolérance +10% sur progress
- Audit logging

**Base de données:** `achievements`, `user_achievements`

**Fichiers:**
- `server/src/models/Achievement.ts`
- `server/src/services/AchievementService.ts`
- `server/src/controllers/achievementController.ts`
- `src/pages/Achievements.tsx`

---

### 5. Récompenses Quotidiennes

**Description:** 10 Berrys gratuits chaque jour à la connexion.

**Endpoints:**
- `POST /api/users/daily-reward`
- `GET /api/users/daily-reward/status`

**Fonctionnement:**
- Une fois par jour calendaire (UTC)
- Récompense: 10 Berrys
- Modal automatique à la première visite
- Bouton manuel disponible

**Protection Triple:**
1. **Frontend:** localStorage pour UX
2. **Backend:** Comparaison de dates
3. **Database:** Clause WHERE atomique

```sql
UPDATE users
SET berrys = berrys + 10, last_daily_reward = ?
WHERE id = ? AND (last_daily_reward IS NULL OR date(last_daily_reward) < date(?))
```

**Sécurité:**
- Protection race condition
- Vérification date côté serveur
- Cap Berrys respecté
- Audit logging (succès et échecs)

**Base de données:** `users` (last_daily_reward)

**Fichiers:**
- `server/src/controllers/userController.ts`
- `src/components/DailyRewardModal.tsx`
- `src/pages/Home.tsx`

---

### 6. Marketplace P2P

#### Création d'Annonces

**Description:** Vendre des cartes à d'autres joueurs avec prix personnalisé.

**Endpoints:**
- `POST /api/marketplace/listings`

**Règles:**
- Doit posséder au moins 2 copies de la carte
- Prix: 1-999,999 Berrys
- Maximum 3 annonces actives par joueur
- Pas de double annonce pour la même carte
- Carte reste en inventaire jusqu'à vente

**Sécurité:**
- Vérification propriété
- Vérification quantité minimum (2+)
- Validation prix
- Limite annonces (3 max)
- Vérification carte active
- Transaction atomique
- Audit logging

**Base de données:** `marketplace_listings`

**Fichiers:**
- `server/src/controllers/marketplaceController.ts`
- `src/pages/Marketplace.tsx`

---

#### Achats sur le Marketplace

**Description:** Acheter des cartes listées par d'autres joueurs.

**Endpoints:**
- `GET /api/marketplace/listings` - Toutes les annonces actives
- `GET /api/marketplace/my-listings` - Mes annonces
- `POST /api/marketplace/listings/:id/purchase` - Acheter

**Fonctionnement (Transaction Atomique):**
1. Vérifier annonce active
2. Vérifier solde acheteur
3. Empêcher auto-achat
4. Vérifier propriété vendeur
5. Déduire Berrys acheteur
6. Ajouter Berrys vendeur
7. Retirer carte vendeur
8. Ajouter carte acheteur
9. Marquer annonce comme vendue
10. Rollback complet si erreur

**Sécurité:**
- Transaction atomique multi-étapes
- Prévention auto-achat
- Vérification solde
- Vérification propriété vendeur
- Rollback automatique
- Audit logging

**Fichiers:**
- `server/src/controllers/marketplaceController.ts`
- `server/src/models/MarketplaceListing.ts`

---

#### Annulation d'Annonces

**Description:** Retirer une annonce du marketplace.

**Endpoints:**
- `DELETE /api/marketplace/listings/:id`

**Règles:**
- Seul le vendeur peut annuler
- Annonce doit être active
- Pas de pénalité
- Carte reste en inventaire

**Fichiers:**
- `server/src/controllers/marketplaceController.ts`

---

### 7. Leaderboard

**Description:** Classement des top 3 joueurs par rareté des cartes.

**Endpoints:**
- `GET /api/leaderboard`

**Algorithme de Classement:**

```
Priorité 1: Nombre de Secret Rare
Priorité 2: Nombre de Super Rare
Priorité 3: Nombre de Rare
Priorité 4: Nombre de Uncommon
Priorité 5: Nombre de Common
```

**Affichage:**
- Username
- Nombre de cartes par rareté
- Carte vitrine profil
- Top 3 uniquement

**Base de données:** `users`, `user_collections`, `cards`

**Fichiers:**
- `server/src/controllers/leaderboardController.ts`
- `src/pages/Leaderboard.tsx`

---

### 8. Notifications Globales (Admin)

**Description:** Annonces envoyées à tous les joueurs avec récompenses optionnelles.

**Endpoints Admin:**
- `POST /api/admin/notifications` - Créer
- `GET /api/admin/notifications` - Lister toutes
- `DELETE /api/admin/notifications/:id` - Désactiver

**Endpoints Utilisateur:**
- `GET /api/notifications` - Non lues
- `POST /api/notifications/:id/claim` - Réclamer

**Paramètres:**
- **Titre:** 3-100 caractères
- **Message:** 10-1000 caractères
- **Récompense Berrys:** 0-10,000
- **Récompense Boosters:** 0-10
- **Date d'expiration:** Optionnelle

**Fonctionnement:**
1. Admin crée notification
2. Tous les utilisateurs la voient
3. Réclamation une seule fois par utilisateur
4. Récompenses ajoutées immédiatement
5. Marque comme lue

**Sécurité:**
- Création admin uniquement
- Validation longueur titre/message
- Limites récompenses
- Protection double-claim
- Vérification expiration
- Transaction atomique
- Audit logging

**Base de données:** `notifications`, `user_notifications`

**Fichiers:**
- `server/src/controllers/notificationController.ts`

---

## 🔒 Sécurité

### Score de Sécurité: A+

Toutes les vulnérabilités majeures sont mitigées avec des mesures complètes.

### Protection contre les Injections SQL

**Méthodes de Protection:**
- ✅ **Requêtes paramétrées** - 100% des requêtes utilisent des placeholders
- ✅ **Détection de patterns** - Middleware bloque les keywords SQL suspects
- ✅ **Validation d'entrées** - Taille max 10,000 caractères
- ✅ **Blacklist de commandes** - ATTACH, PRAGMA bloqués
- ✅ **Audit logging** - Toutes les tentatives enregistrées

**Patterns Détectés:**
```
SELECT, INSERT, UPDATE, DELETE, DROP, UNION
--, #, /*, */
OR 1=1, AND 1=1
```

**Fichiers:**
- `server/src/middleware/security.ts`
- `server/src/utils/database.ts`

---

### Protection XSS & Path Traversal

**Protection XSS:**
- ✅ Content-Security-Policy headers
- ✅ X-XSS-Protection header
- ✅ Sanitization des inputs
- ✅ HTML entity encoding

**Protection Path Traversal:**
- ✅ Détection `../`, `.\`, encodages URL
- ✅ Validation paths, query params, body
- ✅ Audit logging

**Headers de Sécurité:**
```
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

### Rate Limiting

**Limites par Endpoint:**

| Endpoint | Production | Dev | Fenêtre |
|----------|-----------|-----|---------|
| Global | 200 req | 1000 req | 15 min |
| Auth (`/api/auth/*`) | 10 req | 50 req | 15 min |
| Admin (`/api/admin/*`) | 20 req | 100 req | 15 min |

**Implémentation:**
- express-rate-limit
- Tracking par IP
- Headers informatifs
- Réponses 429 automatiques

**Fichiers:**
- `server/src/app.ts`

---

### Anti-Cheat System

**Détection Multi-Couches:**

**1. Limites par Action:**

```typescript
{
  open_booster: { maxPerMin: 10, maxPerHour: 100, minDelay: 1000 },
  buy_booster: { maxPerMin: 5, maxPerHour: 50, minDelay: 2000 },
  sell_card: { maxPerMin: 20, maxPerHour: 200, minDelay: 500 },
  claim_achievement: { maxPerMin: 10, maxPerHour: 100, minDelay: 1000 },
  claim_daily_reward: { maxPerMin: 2, maxPerHour: 5, minDelay: 5000 }
}
```

**2. Système de Score de Suspicion:**

- Limite minute dépassée: +10 points
- Limite heure dépassée: +20 points
- Délai minimum violé: +5 points
- Pattern de bot détecté: +30 points
- **Auto-block à 100 points pendant 30 minutes**

**3. Détection de Bots:**

Analyse statistique des intervalles entre actions:
- Écart-type < 100ms et moyenne < 2s = bot probable

**4. Vérifications de Cohérence:**

**Ressources:**
- Berrys: 0 à 999,999,999
- Boosters: 0 à 10
- Auto-correction + audit log si anomalie

**Temporelles:**
- Pas de timestamps futurs (tolérance 1 min)
- Auto-correction + audit log

**Fichiers:**
- `server/src/middleware/antiCheat.ts`

---

### Transactions Atomiques

**Opérations Protégées:**

Toutes les opérations critiques utilisent `Database.transaction()` avec clauses WHERE:

```typescript
await Database.transaction(async () => {
  const result = await Database.run(`
    UPDATE users
    SET available_boosters = available_boosters - 1
    WHERE id = ? AND available_boosters > 0
  `, [userId]);

  if (result.changes === 0) {
    throw new Error('No boosters available');
  }
  // ... suite de la transaction
});
```

**Liste des Opérations:**
- Ouverture de booster
- Achat de booster
- Vente de carte
- Réclamation daily reward
- Réclamation achievement
- Achat marketplace
- Réclamation notification

---

### CORS & Cookies

**Configuration CORS:**
- Whitelist d'origins (ALLOWED_ORIGINS env var)
- Credentials autorisés uniquement pour whitelist
- Logging des origins bloquées
- Blocage automatique des origins non autorisées

**Configuration Cookies:**
```typescript
{
  httpOnly: true,           // Protection XSS
  secure: NODE_ENV === 'production',  // HTTPS uniquement en prod
  sameSite: 'lax',         // Protection CSRF
  domain: COOKIE_DOMAIN,   // Partage entre sous-domaines
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 jours
}
```

**Fichiers:**
- `server/src/app.ts`

---

### Audit Logging

**Actions Loggées:**

**Authentification:**
- Login, logout, register
- Token refresh
- Échecs de login

**Gameplay:**
- Ouverture booster
- Achat booster
- Vente carte
- Achievement complété/réclamé
- Daily reward

**Marketplace:**
- Création annonce
- Achat
- Annulation

**Admin:**
- Toutes les actions admin

**Sécurité:**
- Tentatives injection SQL
- Tentatives XSS
- Path traversal
- Rate limits
- Auto-blocks

**Niveaux de Sévérité:**
- **INFO:** Opérations normales
- **WARNING:** Tentatives échouées
- **ERROR:** Erreurs système
- **CRITICAL:** Violations sécurité, auto-blocks

**Données Capturées:**
- user_id
- action
- details (JSON)
- severity
- ip_address
- user_agent
- timestamp

**Rétention:** 90 jours (configurable)

**Base de données:** `audit_logs`

**Fichiers:**
- `server/src/utils/auditLogger.ts`

---

### Validation User-Agent

**User-Agents Bloqués:**

```
sqlmap, nikto, nmap, masscan, burp,
dirbuster, acunetix
```

**Réponse:** 403 Forbidden + audit log

**Fichiers:**
- `server/src/middleware/security.ts`

---

### Tests de Sécurité

**Scripts Disponibles:**

```bash
cd server

# Test complet de pénétration
node security-penetration-tests.js

# Vérification configuration sécurité
node security-check.js

# Test sécurité notifications
node test-notification-security.js
```

**Tests Couverts:**
- 5 payloads SQL injection
- 5 payloads XSS
- 4 payloads path traversal
- Rate limiting
- Auth bypass
- User-agents malveillants
- Limites requêtes
- Exploits business logic

---

### Checklist Production

**Avant Déploiement:**
- [ ] Changer TOUS les secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- [ ] NODE_ENV=production
- [ ] Configurer ALLOWED_ORIGINS avec domaines réels
- [ ] Activer HTTPS avec certificat SSL valide
- [ ] Vérifier .env dans .gitignore
- [ ] npm audit et correction vulnérabilités
- [ ] Tester backups database
- [ ] Configurer retention logs
- [ ] Limiter accès SSH/admin
- [ ] Exécuter security-check.js
- [ ] Exécuter security-penetration-tests.js

**Après Déploiement:**
- [ ] Vérifier headers sécurité présents
- [ ] Tester rate limiting
- [ ] Vérifier audit logs
- [ ] Tester rotation tokens JWT
- [ ] Vérifier HTTPS fonctionne
- [ ] Tester disaster recovery

---

## 🛡️ Administration

### Accès Admin

**Créer un Admin:**

```bash
# Méthode 1: Script
docker exec -it op-game-backend node scripts/make-admin.js <username>

# Méthode 2: SQL Direct
docker exec -it op-game-backend sqlite3 /app/data/database.sqlite
UPDATE users SET is_admin = 1 WHERE username = 'username';

# Méthode 3: Variables d'Environnement
# Dans .env:
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123!
# Admin créé automatiquement au premier démarrage
```

**Accès Interface:**
- Direct: `http://localhost:5000/admin`
- Via frontend: `http://localhost/admin`

---

### Dashboard Admin

**Accès:** `/admin`

**Statistiques Disponibles:**

**Utilisateurs:**
- Total utilisateurs
- Admins
- Actifs aujourd'hui
- Actifs cette semaine
- Nouveaux cette semaine

**Économie:**
- Total Berrys en circulation
- Moyenne par joueur
- Distribution

**Boosters:**
- Total ouverts
- Ouverts aujourd'hui
- Ouverts cette semaine

**Cartes:**
- Total cartes
- Cartes actives
- Cartes en collections
- Moyenne par joueur

**Achievements:**
- Total achievements
- Complétions
- Réclamations
- Taux de complétion

**Sécurité (24h):**
- Échecs de login
- Activités suspectes
- Événements critiques

**Top 10:**
- Joueurs par Berrys

**Fichiers:**
- `server/src/controllers/dashboardController.ts`
- `src/pages/Admin.tsx`

---

### Gestion des Notifications

**Créer une Notification:**

```bash
curl -X POST http://localhost:5000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Événement Weekend !",
    "message": "Profitez de 500 Berrys et 1 booster gratuit ! Merci de jouer !",
    "reward_berrys": 500,
    "reward_boosters": 1,
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

**Endpoints:**
- `POST /api/admin/notifications` - Créer
- `GET /api/admin/notifications` - Lister toutes
- `DELETE /api/admin/notifications/:id` - Désactiver

**Paramètres:**
- **title:** 3-100 caractères
- **message:** 10-1000 caractères
- **reward_berrys:** 0-10,000
- **reward_boosters:** 0-10
- **expires_at:** ISO 8601 (optionnel)

---

### Utilisateurs en Ligne

**Endpoint:** `GET /api/admin/dashboard/online`

**Définition "En ligne":** Dernière activité < 5 minutes

**Affichage:**
- Username
- Dernier login
- Berrys
- Boosters disponibles

---

### Activité Récente

**Endpoint:** `GET /api/admin/dashboard/activity?limit=100`

**Actions Suivies:**
- user_login
- user_register
- booster_opened
- booster_purchased
- achievement_claimed
- daily_reward_claimed
- marketplace_purchase
- card_sold

**Données:**
- User ID
- Action
- Details
- Timestamp

---

### Scripts Admin Utiles

**Créer Admin:**
```bash
docker exec -it op-game-backend node scripts/make-admin.js <username>
```

**Backup Database:**
```bash
docker exec -it op-game-backend node scripts/backup-database.js
```

**Réinitialiser Password:**
```bash
docker exec -it op-game-backend node scripts/reset-password.bat <username>
```

**Envoyer Compensation:**
```bash
docker exec -it op-game-backend node scripts/send-compensation.js <userId> <berrys> <boosters>
```

**Rotation Logs:**
```bash
docker exec -it op-game-backend node scripts/log-rotation.js
```

---

## 🗄️ Base de Données

### Technologie

- **SQLite3** avec better-sqlite3
- **Mode WAL** (Write-Ahead Logging) - lectures concurrentes
- **Foreign keys** activées
- **Auto-backup** avant migrations
- **Version:** 16+ (schéma)

### Localisation

**Local:**
- `server/data/database.sqlite`

**Docker:**
- `/app/data/database.sqlite`
- Volume: `op_game_data`

### Migrations

**Système:**
- Migrations incrémentales avec version tracking
- Auto-exécution au démarrage serveur
- Backup avant chaque migration
- Rollback si erreur
- Cleanup vieux backups (garde 5 derniers)

**Fichiers:**
- `server/src/utils/migrations.ts` - Définitions
- `server/scripts/run-migrations.js` - Runner
- `server/src/utils/database.ts` - Utilitaires

**Exécution Manuelle:**
```bash
cd server
node scripts/run-migrations.js
```

---

### Schéma des Tables

#### users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  berrys INTEGER DEFAULT 0,
  available_boosters INTEGER DEFAULT 3,
  boosters_opened_today INTEGER DEFAULT 0,
  next_booster_time TEXT,
  last_booster_opened TEXT,
  last_daily_reward TEXT,
  last_login TEXT,
  is_admin INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  favorite_card_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (favorite_card_id) REFERENCES cards(id),
  CHECK(berrys >= 0 AND berrys <= 999999999),
  CHECK(available_boosters >= 0 AND available_boosters <= 10),
  CHECK(is_admin IN (0, 1)),
  CHECK(is_active IN (0, 1))
);
```

#### cards

```sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  character_name TEXT,
  rarity TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT,
  cost INTEGER,
  power INTEGER,
  counter INTEGER,
  attack INTEGER,
  defense INTEGER,
  description TEXT,
  special_ability TEXT,
  image_url TEXT,
  fallback_image_url TEXT,
  booster_id TEXT,
  vegapull_id TEXT UNIQUE,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  CHECK(is_active IN (0, 1))
);
```

#### user_collections

```sql
CREATE TABLE user_collections (
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  obtained_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_favorite INTEGER DEFAULT 0,

  PRIMARY KEY (user_id, card_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,

  CHECK(quantity > 0),
  CHECK(is_favorite IN (0, 1))
);
```

#### boosters

```sql
CREATE TABLE boosters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  series TEXT NOT NULL,
  release_date TEXT,
  total_cards INTEGER,
  description TEXT,
  image_url TEXT,
  vegapull_id TEXT UNIQUE,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### booster_openings

```sql
CREATE TABLE booster_openings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  booster_id TEXT,
  cards_obtained TEXT,
  opened_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### achievements

```sql
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  threshold INTEGER NOT NULL,
  reward_berrys INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  booster_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  CHECK(threshold > 0),
  CHECK(reward_berrys >= 0)
);
```

#### user_achievements

```sql
CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed_at TEXT,
  is_claimed INTEGER DEFAULT 0,
  claimed_at TEXT,

  UNIQUE(user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);
```

#### marketplace_listings

```sql
CREATE TABLE marketplace_listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  buyer_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sold_at TEXT,

  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL,

  CHECK(price > 0),
  CHECK(status IN ('active', 'sold', 'cancelled'))
);
```

#### notifications

```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reward_berrys INTEGER DEFAULT 0,
  reward_boosters INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  CHECK(reward_berrys >= 0 AND reward_berrys <= 10000),
  CHECK(reward_boosters >= 0 AND reward_boosters <= 10)
);
```

#### user_notifications

```sql
CREATE TABLE user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  read_at TEXT,
  reward_claimed INTEGER DEFAULT 0,
  claimed_at TEXT,

  UNIQUE(user_id, notification_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);
```

#### user_sessions

```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_active INTEGER DEFAULT 1,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### audit_logs

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  severity TEXT DEFAULT 'info',
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

### Index de Performance

```sql
-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_favorite_card_id ON users(favorite_card_id);

-- Cards
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_type ON cards(type);
CREATE INDEX idx_cards_booster_id ON cards(booster_id);
CREATE UNIQUE INDEX idx_cards_vegapull_id ON cards(vegapull_id);

-- Collections
CREATE INDEX idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX idx_user_collections_card_id ON user_collections(card_id);

-- Booster Openings
CREATE INDEX idx_booster_openings_user_id ON booster_openings(user_id);
CREATE INDEX idx_booster_openings_booster_id ON booster_openings(booster_id);
CREATE INDEX idx_booster_openings_opened_at ON booster_openings(opened_at);

-- Achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Marketplace
CREATE INDEX idx_marketplace_seller_id ON marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_buyer_id ON marketplace_listings(buyer_id);
CREATE INDEX idx_marketplace_card_id ON marketplace_listings(card_id);
CREATE INDEX idx_marketplace_status ON marketplace_listings(status);

-- Notifications
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_notification_id ON user_notifications(notification_id);

-- Sessions
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON user_sessions(refresh_token);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

### Backup & Restore

**Backup Manuel:**
```bash
# Local
cp server/data/database.sqlite backups/database_$(date +%Y%m%d_%H%M%S).sqlite

# Docker
docker exec op-game-backend node scripts/backup-database.js
```

**Backup Automatique:**
```bash
# Configurer cron pour backup quotidien à 2h00
docker exec op-game-backend sh -c 'crontab -l | { cat; echo "0 2 * * * node /app/scripts/backup-database.js"; } | crontab -'
```

**Restore:**
```bash
# Local
cp backups/database_20251007_120000.sqlite server/data/database.sqlite

# Docker
docker run --rm -v op_game_data:/data -v ~/backups:/backup \
  alpine cp /backup/database.sqlite /data/database.sqlite
```

---

### Requêtes SQL Utiles

**Statistiques Utilisateurs:**
```sql
SELECT
  COUNT(*) as total_users,
  SUM(is_admin) as total_admins,
  SUM(CASE WHEN datetime(last_login) > datetime('now', '-1 day') THEN 1 ELSE 0 END) as active_today,
  SUM(berrys) as total_berrys,
  AVG(berrys) as avg_berrys
FROM users
WHERE is_active = 1;
```

**Top Collectionneurs:**
```sql
SELECT
  u.username,
  COUNT(DISTINCT uc.card_id) as unique_cards,
  SUM(uc.quantity) as total_cards
FROM users u
LEFT JOIN user_collections uc ON u.id = uc.user_id
WHERE u.is_active = 1
GROUP BY u.id
ORDER BY unique_cards DESC
LIMIT 10;
```

**Leaderboard:**
```sql
SELECT
  username,
  berrys,
  (SELECT COUNT(DISTINCT card_id) FROM user_collections WHERE user_id = users.id) as unique_cards,
  (SELECT SUM(quantity) FROM user_collections WHERE user_id = users.id) as total_cards
FROM users
WHERE is_active = 1
ORDER BY berrys DESC
LIMIT 10;
```

---

## 🔌 API REST

### Structure des Endpoints

Tous les endpoints backend sont préfixés par `/api`.

### Routes Publiques (Sans Auth)

```
POST /api/auth/register    - Créer un compte
POST /api/auth/login       - Se connecter
POST /api/auth/logout      - Se déconnecter
POST /api/auth/refresh     - Renouveler token
```

### Routes Authentifiées

**Auth:**
```
GET  /api/auth/me          - Info utilisateur courant
```

**Utilisateur:**
```
GET  /api/users/me                      - Profil complet
GET  /api/users/collection              - Collection de cartes
GET  /api/users/stats                   - Statistiques
GET  /api/users/boosters/status         - Statut boosters
POST /api/users/boosters/open           - Ouvrir booster
POST /api/users/boosters/buy            - Acheter booster
POST /api/users/cards/sell              - Vendre carte
POST /api/users/collection/favorite/:id - Toggle favori
GET  /api/users/berrys                  - Solde Berrys
GET  /api/users/daily-reward/status     - Statut daily reward
POST /api/users/daily-reward            - Réclamer daily reward
PUT  /api/users/profile/favorite-card   - Définir carte vitrine
PUT  /api/users/password                - Changer password
```

**Cartes:**
```
GET  /api/cards             - Liste toutes les cartes
GET  /api/cards/:id         - Détail carte
GET  /api/cards/boosters    - Liste boosters
GET  /api/cards/boosters/:id - Détail booster
```

**Achievements:**
```
GET  /api/achievements         - Liste avec progression
GET  /api/achievements/stats   - Statistiques
POST /api/achievements/:id/claim - Réclamer récompense
```

**Marketplace:**
```
GET    /api/marketplace/listings           - Toutes annonces actives
GET    /api/marketplace/my-listings        - Mes annonces
POST   /api/marketplace/listings           - Créer annonce
POST   /api/marketplace/listings/:id/purchase - Acheter
DELETE /api/marketplace/listings/:id       - Annuler
```

**Notifications:**
```
GET  /api/notifications          - Non lues
POST /api/notifications/:id/claim - Réclamer
```

**Leaderboard:**
```
GET  /api/leaderboard            - Top 3 joueurs
```

### Routes Admin

```
GET    /api/admin/dashboard/stats      - Statistiques globales
GET    /api/admin/dashboard/online     - Utilisateurs en ligne
GET    /api/admin/dashboard/activity   - Activité récente
POST   /api/admin/notifications        - Créer notification
GET    /api/admin/notifications        - Toutes notifications
DELETE /api/admin/notifications/:id    - Désactiver notification
```

---

### Exemples de Requêtes

**Inscription:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "luffy",
    "password": "goingmerry123",
    "email": "luffy@onepiece.com"
  }'
```

**Connexion:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "luffy",
    "password": "goingmerry123"
  }'
```

**Ouvrir Booster:**
```bash
curl -X POST http://localhost:5000/api/users/boosters/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boosterId": "booster-id"}'
```

**Acheter Booster:**
```bash
curl -X POST http://localhost:5000/api/users/boosters/buy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boosterId": "booster-id"}'
```

**Vendre Carte:**
```bash
curl -X POST http://localhost:5000/api/users/cards/sell \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "card-id",
    "quantity": 1
  }'
```

**Créer Annonce Marketplace:**
```bash
curl -X POST http://localhost:5000/api/marketplace/listings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "card-id",
    "price": 500
  }'
```

---

## 🎨 Design System

### Philosophie

**Glassmorphism Modern** - Tendance 2025 avec surfaces translucides, effets de flou et animations subtiles.

### Palette de Couleurs

**Ocean (Bleu - Grand Line):**
```css
ocean-50 à ocean-950
Usage: Boutons primaires, liens actifs, éléments interactifs
```

**Treasure (Or/Ambre - Trésors):**
```css
treasure-50 à treasure-900
Usage: Récompenses, achievements, highlights
```

**Danger (Rouge - Aventure):**
```css
danger-50 à danger-900
Usage: Suppression, alertes, notifications importantes
```

**Secondaires:**
- **Slate:** Fonds, cartes, surfaces
- **Emerald:** Succès, collection, progression
- **Purple:** Admin, premium

### Effets Glassmorphism

**Base Glass Card:**
```css
backdrop-blur-xl           /* Flou 24px */
bg-white/5                 /* Opacité 5% */
border border-white/10     /* Bordure subtile */
rounded-3xl                /* Coins arrondis */
shadow-2xl                 /* Ombre douce */
```

**Hover Effect:**
```css
hover:bg-white/10
hover:border-white/20
hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]
hover:-translate-y-0.5
transition-all duration-300
```

### Composants UI

**Localisation:** `src/components/ui/`

**Button** (`Button.tsx`)
- Variants: primary, secondary, danger, treasure, ghost
- Sizes: sm, md, lg
- Props: isLoading, leftIcon, rightIcon, disabled

**GameCard** (`GameCard.tsx`)
- Variants: default, ocean, treasure, danger, success
- Props: hover, glow

**ProgressBar** (`ProgressBar.tsx`)
- Variants: ocean, treasure, success, danger
- Props: value, max, showLabel, label, animated

**StatDisplay** (`StatDisplay.tsx`)
- Variants: default, ocean, treasure, success, danger
- Sizes: sm, md, lg

**Dialog** (`Dialog.tsx`)
- Types: info, success, warning, error, confirm
- Hook: useDialog

### Typographie

```css
/* Titres */
text-4xl font-bold          /* Hero */
text-3xl font-bold          /* Page */
text-2xl font-bold          /* Section */
text-xl font-semibold       /* Subsection */

/* Corps */
text-base font-medium       /* Normal */
text-sm font-medium         /* Small */
text-xs font-medium         /* Tiny */

/* Labels */
text-sm font-medium uppercase tracking-wider
```

### Animations

```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Background

**Gradient Principal:**
```css
background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
```

**Orbes Animées:**
- Multiple orbes semi-transparentes colorées
- Animation float
- Effet blur
- Position absolute

**Grid Overlay:**
```css
background-image:
  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
background-size: 50px 50px;
```

### Breakpoints Responsive

```css
xs:  475px   /* Petits téléphones */
sm:  640px   /* Téléphones */
md:  768px   /* Tablettes */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large */
```

---

## 🔧 Dépannage

### Frontend

**Problème: "npm install" échoue**

```bash
# Solution 1: Réinstallation complète
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solution 2: Avec legacy peer deps
npm install --legacy-peer-deps --no-optional

# Solution 3: Installation par étapes
npm install react@19.0.0 react-dom@19.0.0
npm install react-router-dom@^7.1.3
npm install lucide-react@^0.469.0
npm install -D vite@^6.0.7 @vitejs/plugin-react@^4.3.4
npm install -D typescript@^5.7.3
npm install -D tailwindcss@^3.4.17 autoprefixer@^10.4.20 postcss@^8.5.3
```

**Problème: "npm run dev" échoue**

```bash
# Vérifier Vite installé
npm list vite

# Réinstaller si nécessaire
npm install -D vite@^6.0.7

# Vérifier config
cat vite.config.ts
```

**Problème: Tailwind CSS ne fonctionne pas**

```bash
# Vérifier fichiers de config
ls tailwind.config.js
ls postcss.config.js

# Vérifier imports Tailwind dans index.css
cat src/index.css
# Doit contenir:
# @tailwind base;
# @tailwind components;
# @tailwind utilities;
```

---

### Backend

**Problème: Migrations échouent**

```bash
# Vérifier chemin database
ls server/data/database.sqlite

# Vérifier version schéma
sqlite3 server/data/database.sqlite "PRAGMA user_version"

# Exécuter migrations manuellement
cd server
node scripts/run-migrations.js
```

**Problème: "database is locked"**

```bash
# Docker
docker-compose restart backend

# Local
# Tuer tous les processus node et redémarrer
```

**Problème: Collection vide après rebuild**

```bash
# Exécuter diagnostic
node server/diagnose-database.js

# Vérifier données existent
sqlite3 server/data/database.sqlite "SELECT COUNT(*) FROM user_collections"

# Si données existent mais query échoue, rebuild backend
docker-compose build backend
docker-compose up -d backend
```

---

### Docker

**Problème: Conteneur ne démarre pas**

```bash
# Vérifier logs
docker logs op-game-backend
docker logs op-game-frontend

# Vérifier images existent
docker images | grep op-game

# Vérifier variables d'environnement
docker inspect op-game-backend | grep -A 20 Env
```

**Problème: Status "Unhealthy"**

```bash
# Tester health backend
docker exec op-game-backend curl http://localhost:5000/health

# Tester health frontend
docker exec op-game-frontend curl http://localhost/

# Vérifier logs
docker logs op-game-backend -f
```

**Problème: Problèmes réseau entre conteneurs**

```bash
# Vérifier réseau
docker network inspect op-game-network

# Tester connectivité
docker exec op-game-frontend ping backend

# Vérifier config CORS
docker exec op-game-backend sh -c 'echo $ALLOWED_ORIGINS'
```

**Problème: Données volume perdues**

```bash
# Lister volumes
docker volume ls | grep op_game

# Inspecter volume
docker volume inspect op_game_data

# Restore depuis backup
docker run --rm -v op_game_data:/data -v ~/backups:/backup \
  alpine cp /backup/database.sqlite /data/database.sqlite
```

---

### Raspberry Pi

**Problème: Build trop long**

```bash
# Builder sur Windows, transférer vers Pi
docker buildx build --platform linux/arm64 ...
docker save ... | gzip > image.tar.gz
scp image.tar.gz pi@raspberry:~/

# Sur Pi
docker load < image.tar.gz
```

**Problème: Manque de mémoire**

```bash
# Augmenter swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Définir CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Problème: Performance lente**

```bash
# Vérifier ressources
docker stats

# Réduire limites mémoire
# Éditer docker-compose:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

### Authentification

**Problème: Impossible de se connecter**

```bash
# Vérifier secrets JWT configurés
docker exec op-game-backend sh -c 'echo $JWT_SECRET'

# Réinitialiser password
cd server
node scripts/make-admin.js <username>

# Ou SQL direct
sqlite3 data/database.sqlite
UPDATE users SET password_hash = 'NEW_BCRYPT_HASH' WHERE username = 'user';
```

**Problème: Token expire immédiatement**

```bash
# Vérifier JWT_EXPIRES_IN
docker exec op-game-backend sh -c 'echo $JWT_EXPIRES_IN'

# Devrait être '15m' ou similaire
# Mettre à jour dans .env ou docker-compose.yml
```

---

### Scripts de Diagnostic

**Collection:**
```bash
cd server
node diagnose-database.js
node verify-migration-state.js
node test-collections.js
```

**Sécurité:**
```bash
cd server
node security-check.js
node security-penetration-tests.js
```

**Notifications:**
```bash
cd server
node test-notification-security.js
```

**Raretés:**
```bash
cd server
npx tsx src/scripts/diagnose-rarity-issues.ts
npx tsx src/scripts/fix-all-rarities.ts
```

---

## 🐛 Corrections Appliquées

### Bug Critique Datetime (2025-10-07)

**Problème:** `datetime('now')` ne fonctionne pas dans les requêtes paramétrées avec better-sqlite3.

**Impact:** ❌ Login, Daily reward, Booster opening, Collection, Achievements - Tout cassé

**Solution:** Remplacement de tous les `datetime('now')` par `new Date().toISOString()` en JavaScript.

**Fichiers corrigés:**
- `server/src/models/User.ts` - 3 occurrences
- `server/src/controllers/authController.ts` - 2 occurrences
- `server/src/controllers/userController.ts` - 8 occurrences

**Résultat:** ✅ Toutes les fonctionnalités restaurées

---

### Bug Collection Vide (2025-10-07)

**Problème:** Utilisateurs voyaient Berrys/boosters mais AUCUNE carte dans la collection après rebuild Docker.

**Cause:** Requête SQL manquait des colonnes essentielles dans le SELECT.

**Solution:** Ajout colonnes manquantes:
```sql
SELECT
  uc.user_id, uc.card_id, uc.quantity, uc.obtained_at, uc.is_favorite,
  c.id, c.name, c.character_name, c.rarity, c.type, c.color,
  c.cost, c.power, c.counter,
  c.attack, c.defense,  -- AJOUTÉ
  c.description, c.special_ability,
  c.image_url, c.fallback_image_url,
  c.booster_id, c.vegapull_id, c.is_active  -- AJOUTÉ
FROM user_collections uc
JOIN cards c ON uc.card_id = c.id
```

**Fichier:** `server/src/controllers/userController.ts`

---

### Bug Double Daily Reward

**Problème:** Utilisateurs pouvaient réclamer 10 Berrys infiniment en rafraîchissant la page.

**Cause:** Colonne `last_daily_reward` jamais mise à jour (bug datetime).

**Solution:** Clause WHERE atomique:
```sql
UPDATE users
SET berrys = COALESCE(berrys, 0) + ?,
    last_daily_reward = ?
WHERE id = ?
  AND (last_daily_reward IS NULL OR date(last_daily_reward) < date(?))
```

**Résultat:** Protection triple (frontend + backend + database) empêche doubles réclamations.

---

### Bug Consommation Boosters

**Problème:** Boosters gratuits non consommés lors de l'ouverture.

**Cause:** Race condition entre vérification et transaction.

**Solution:** Vérification DANS la transaction avec UPDATE atomique:
```typescript
await Database.transaction(async () => {
  const currentUser = await Database.get(`
    SELECT available_boosters FROM users WHERE id = ?
  `, [userId]);

  if (!currentUser || currentUser.available_boosters <= 0) {
    throw new Error('No boosters available');
  }

  const updateResult = await Database.run(`
    UPDATE users
    SET available_boosters = available_boosters - 1
    WHERE id = ? AND available_boosters > 0
  `, [userId]);

  if (updateResult.changes === 0) {
    throw new Error('No boosters available');
  }
});
```

---

### Bugs Raretés (2025-10-12)

**Problème 1:** Toutes les cartes Leader importées avec `rarity='common'` au lieu de `rarity='leader'`.

**Cause:** RARITY_MAPPING manquait `'Leader': 'leader'`.

**Problème 2:** Raretés manquantes dans le mapping:
- `'Special'` → devrait être `'super_rare'` (était `'common'`)
- `'Promo'` → devrait être `'rare'` (était `'common'`)
- `'TreasureRare'` → devrait être `'secret_rare'` (était `'common'`)

**Solution:** RARITY_MAPPING complet:
```typescript
const RARITY_MAPPING: Record<string, string> = {
  'Leader': 'leader',
  'SuperRare': 'super_rare',
  'Rare': 'rare',
  'Uncommon': 'uncommon',
  'Common': 'common',
  'SecretRare': 'secret_rare',
  'SpecialRare': 'secret_rare',
  'TreasureRare': 'secret_rare',  // AJOUTÉ
  'Special': 'super_rare',        // AJOUTÉ
  'Promo': 'rare'                 // AJOUTÉ
};
```

**Auto-correction:** Script s'exécute automatiquement au démarrage Docker via `docker-entrypoint.sh`.

**Problème 3:** Leaders affichés dans le mauvais ordre dans la Collection.

**Cause:** `rarityOrder` array manquait `'leader'`.

**Solution:**
```typescript
const rarityOrder = ['secret_rare', 'super_rare', 'leader', 'rare', 'uncommon', 'common'];
```

**Fichiers:**
- `server/src/scripts/import-vegapull-data.ts`
- `server/src/scripts/fix-all-rarities.ts`
- `src/pages/Collection.tsx`

---

### Bug Auth Marketplace

**Problème:** Toutes les actions marketplace retournaient 401 Unauthorized.

**Cause:** Page utilisait `fetch` avec `localStorage.getItem('token')` au lieu de `apiService` avec gestion appropriée des tokens.

**Solution:** Remplacement de tous les fetch par apiService:
```typescript
// Avant
const response = await fetch(`${API_URL}/marketplace/listings`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Après
const response = await apiService.getMarketplaceListings();
```

**Fichiers:**
- `src/services/api.ts` - Ajout 5 méthodes marketplace
- `src/pages/Marketplace.tsx` - Remplacement tous fetch

---

### Bug "No Sellable Cards" Marketplace

**Problème:** Message "No sellable cards" même avec doublons.

**Cause:** Requête SQL utilisait `c.character` mais colonne nommée `character_name`.

**Solution:**
```sql
-- Avant
SELECT c.character, ...

-- Après
SELECT c.character_name as character, ...
```

**Fichier:** `server/src/controllers/userController.ts`

---

### Bug Limite Affichage Cartes

**Problème:** Seulement 100 cartes affichées au lieu des 2,628.

**Cause:** Backend imposait limite artificielle de 100 cartes par requête.

**Solution:** Retrait limite artificielle:
```typescript
// Avant
const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 50, 100));

// Après
const limit = parseInt(req.query.limit as string) || 10000;
```

**Fichiers:**
- `server/src/controllers/cardController.ts`
- `src/services/gameService.ts`

---

## 📝 Variables d'Environnement

### Obligatoires (Production)

```env
JWT_SECRET=<générer avec: openssl rand -base64 32>
JWT_REFRESH_SECRET=<générer différent>
ADMIN_PASSWORD=VotreMotDePasseSécurisé123!
```

### Optionnelles

```env
# JWT
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_ROUNDS=10

# Admin
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com

# CORS
ALLOWED_ORIGINS=http://localhost,http://your-domain.com

# Cookies
COOKIE_DOMAIN=.yourdomain.com

# Environment
NODE_ENV=production

# Ports
BACKEND_PORT=5000
FRONTEND_PORT=80
```

---

## 📄 Licence

Ce projet est une application de démonstration. Les cartes et images One Piece TCG appartiennent à leurs propriétaires respectifs.

---

## 🤝 Contribution

Contributions, issues et feature requests sont les bienvenues !

---

## 👏 Remerciements

- **Bandai Namco** - One Piece Trading Card Game
- **Vegapull** - Données des cartes
- **React Community**
- **Tailwind CSS Team**

---

🏴‍☠️ **Bon voyage sur Grand Line, moussaillon !**
