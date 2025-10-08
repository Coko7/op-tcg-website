# 🚀 Quick Start Sécurité

## Configuration rapide pour sécuriser l'application

### 1. Configuration des secrets (CRITIQUE - 5 minutes)

```bash
cd server

# Copier le template
cp .env.example .env

# Générer les secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Copier ces valeurs dans votre fichier .env
```

### 2. Vérifier la configuration

```bash
cd server
node security-check.js
```

### 3. Installer les dépendances

```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

### 4. Vérifier les vulnérabilités

```bash
# Backend
cd server
npm audit

# Frontend
cd ..
npm audit
```

### 5. Configuration minimale du .env

```env
NODE_ENV=production
PORT=5000

JWT_SECRET=<votre_secret_généré>
JWT_REFRESH_SECRET=<votre_autre_secret_généré>

ALLOWED_ORIGINS=https://votredomaine.com

DATABASE_PATH=./data/database.sqlite
BCRYPT_ROUNDS=12
```

## ⚠️ AVANT DE DÉPLOYER EN PRODUCTION

- [ ] Changer TOUS les secrets
- [ ] Configurer HTTPS
- [ ] Configurer ALLOWED_ORIGINS avec votre vrai domaine
- [ ] Vérifier que .env n'est PAS commité
- [ ] Exécuter `npm audit` et corriger les problèmes
- [ ] Tester les backups de base de données

## 🔍 Vérification rapide de sécurité

```bash
# Headers de sécurité
curl -I https://votredomaine.com/health

# Vérifier que vous voyez:
# - Content-Security-Policy
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - Strict-Transport-Security
```

## 📞 Support

Pour les questions de sécurité : [security@votredomaine.com]

**Documentation complète** : Voir [SECURITY.md](./SECURITY.md)
