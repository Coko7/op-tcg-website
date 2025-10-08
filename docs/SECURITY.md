# 🔒 Guide de Sécurité - One Piece Booster Game

## 📋 Table des matières

1. [Présentation](#présentation)
2. [Vulnérabilités corrigées](#vulnérabilités-corrigées)
3. [Mesures de sécurité implémentées](#mesures-de-sécurité-implémentées)
4. [Configuration requise](#configuration-requise)
5. [Checklist de déploiement](#checklist-de-déploiement)
6. [Maintenance de sécurité](#maintenance-de-sécurité)
7. [Signalement de vulnérabilités](#signalement-de-vulnérabilités)

---

## 🎯 Présentation

Ce document décrit les mesures de sécurité implémentées dans l'application One Piece Booster Game et les bonnes pratiques à suivre pour maintenir un niveau de sécurité optimal.

## 🛡️ Vulnérabilités corrigées

### Critiques

1. **Routes admin non protégées** ✅ CORRIGÉ
   - **Avant**: Les routes `/reset-all-data`, `/check-booster-cards-temp`, etc. étaient publiques
   - **Maintenant**: Toutes les routes admin requièrent authentification + rôle admin
   - **Fichier**: `server/src/routes/admin.ts:8-10`

2. **Secrets JWT hardcodés** ✅ CORRIGÉ
   - **Avant**: Fallback secrets faibles en cas d'absence de variables d'environnement
   - **Maintenant**: L'application refuse de démarrer en production sans secrets configurés
   - **Fichiers**: `server/src/middleware/auth.ts:5-10`, `server/src/controllers/authController.ts:7-15`

3. **Validation insuffisante des entrées** ✅ CORRIGÉ
   - **Avant**: Pas de sanitisation des inputs utilisateur
   - **Maintenant**: Sanitisation et validation stricte de tous les inputs
   - **Fichier**: `server/src/middleware/validation.ts`

### Élevées

4. **Protection SQL Injection insuffisante** ✅ CORRIGÉ
   - **Maintenant**: Validation des requêtes SQL + middleware de détection
   - **Fichiers**: `server/src/utils/database.ts`, `server/src/middleware/security.ts`

5. **Absence de CORS strict** ✅ CORRIGÉ
   - **Maintenant**: Configuration CORS stricte avec validation des origines
   - **Fichier**: `server/src/app.ts:38-58`

6. **Rate limiting insuffisant** ✅ CORRIGÉ
   - **Maintenant**: Rate limiting différencié par type de route
   - **Fichier**: `server/src/app.ts:90-128`

### Moyennes

7. **Headers de sécurité manquants** ✅ CORRIGÉ
   - **Maintenant**: Headers de sécurité complets (CSP, HSTS, etc.)
   - **Fichier**: `server/src/middleware/security.ts`

8. **Logging de sécurité insuffisant** ✅ CORRIGÉ
   - **Maintenant**: Logging automatique des activités suspectes
   - **Fichier**: `server/src/middleware/security.ts:108-126`

## 🔐 Mesures de sécurité implémentées

### Backend (API)

#### 1. Authentification et Autorisation
- ✅ JWT avec tokens d'accès et de rafraîchissement séparés
- ✅ Secrets cryptographiques forts requis en production
- ✅ Expiration automatique des tokens
- ✅ Sessions utilisateur avec tracking
- ✅ Hashage bcrypt des mots de passe (12 rounds)

#### 2. Protection des routes
- ✅ Middleware d'authentification (`authenticateToken`)
- ✅ Middleware de vérification admin (`requireAdmin`)
- ✅ Rate limiting par type de route :
  - **Global**: 200 req/15min en production
  - **Auth**: 10 req/15min en production
  - **Admin**: 20 req/15min en production

#### 3. Validation et Sanitisation
- ✅ Validation stricte des inputs (regex, longueur, type)
- ✅ Sanitisation des strings pour prévenir XSS
- ✅ Protection contre SQL injection (requêtes paramétrées + validation)
- ✅ Protection contre path traversal
- ✅ Détection de user agents suspects

#### 4. Headers de sécurité
- ✅ Content Security Policy (CSP)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection
- ✅ HSTS avec preload
- ✅ Referrer-Policy
- ✅ Permissions-Policy

#### 5. Base de données
- ✅ Foreign keys activées
- ✅ Write-Ahead Logging (WAL)
- ✅ Validation des requêtes SQL
- ✅ Limitation de la longueur des requêtes
- ✅ Transactions sécurisées
- ✅ Validation du chemin de la base de données

### Frontend

#### 1. Validation des inputs
- ✅ Utilitaires de validation (username, password, email)
- ✅ Sanitisation HTML pour prévenir XSS
- ✅ Détection de contenu suspect
- ✅ Validation d'URLs

#### 2. Stockage sécurisé
- ✅ Wrapper de localStorage avec obfuscation
- ✅ Pas de stockage de données sensibles en clair

#### 3. Protection XSS
- ✅ Sanitisation de toutes les sorties utilisateur
- ✅ Détection de patterns XSS
- ✅ Validation des contenus HTML

#### 4. Gestion des erreurs
- ✅ Pas d'exposition d'informations sensibles dans les erreurs
- ✅ Messages d'erreur génériques pour l'utilisateur

## ⚙️ Configuration requise

### Variables d'environnement (CRITIQUE)

Copier `.env.example` vers `.env` et configurer :

```bash
# OBLIGATOIRE EN PRODUCTION
NODE_ENV=production
JWT_SECRET=<générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<générer un autre secret différent>
ALLOWED_ORIGINS=https://votredomaine.com

# RECOMMANDÉ
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_PATH=./data/database.sqlite
```

### Génération de secrets sécurisés

```bash
# Générer JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Générer JWT_REFRESH_SECRET (différent!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## ✅ Checklist de déploiement

### Avant le déploiement

- [ ] Changer TOUS les secrets par défaut
- [ ] Configurer `ALLOWED_ORIGINS` avec les domaines réels uniquement
- [ ] Activer `NODE_ENV=production`
- [ ] Configurer HTTPS (certificat SSL/TLS valide)
- [ ] Vérifier que `.env` est dans `.gitignore`
- [ ] Supprimer les credentials admin de test
- [ ] Exécuter `npm audit` et corriger les vulnérabilités
- [ ] Tester les sauvegardes de base de données
- [ ] Configurer les logs de production
- [ ] Limiter les accès SSH/RDP

### Après le déploiement

- [ ] Vérifier que les headers de sécurité sont présents
- [ ] Tester le rate limiting
- [ ] Vérifier les logs de sécurité
- [ ] Tester la rotation des tokens JWT
- [ ] Vérifier que HTTPS fonctionne correctement
- [ ] Tester la récupération en cas de panne

## 🔄 Maintenance de sécurité

### Quotidien
- Surveiller les logs d'erreurs et activités suspectes

### Hebdomadaire
- Vérifier les tentatives d'authentification échouées
- Analyser les patterns de trafic anormaux

### Mensuel
- Exécuter `npm audit` et mettre à jour les dépendances
- Vérifier les backups de base de données
- Réviser les logs de sécurité

### Trimestriel
- Audit de sécurité complet
- Rotation des secrets JWT (si nécessaire)
- Révision des permissions et rôles utilisateurs
- Test de pénétration (optionnel mais recommandé)

## 🚨 Signalement de vulnérabilités

Si vous découvrez une vulnérabilité de sécurité :

1. **NE PAS** créer d'issue publique
2. Envoyer un email à : [security@votredomaine.com]
3. Inclure :
   - Description détaillée de la vulnérabilité
   - Étapes de reproduction
   - Impact potentiel
   - Suggestions de correction (si possible)

Nous nous engageons à répondre dans les 48 heures.

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [SQLite Security](https://www.sqlite.org/security.html)

## 📝 Historique des modifications

### Version 1.0 (2025-01-XX)
- Implémentation initiale des mesures de sécurité
- Protection des routes admin
- Validation et sanitisation des inputs
- Rate limiting
- Headers de sécurité
- Protection SQL injection

---

**Dernière mise à jour**: 2025-01-XX
**Responsable sécurité**: [Votre nom]
