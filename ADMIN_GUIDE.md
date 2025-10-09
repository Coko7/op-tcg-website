# Guide d'utilisation - Interface Admin

## 🔒 Sécurité

L'interface d'administration est **entièrement sécurisée** :

### ✅ Authentification
- Connexion requise avec compte admin uniquement
- JWT Token stocké de manière sécurisée
- Vérification `is_admin = true` côté serveur
- Middleware `requireAdmin` sur toutes les routes admin

### ✅ Protection des routes API
- `/api/admin/*` : Protégées par `authenticateToken` + `requireAdmin`
- Rate limiting strict (20 requêtes/15min en production)
- Validation des données côté serveur (Zod)
- Audit logging de toutes les actions admin

### ✅ Validation des données
- Titre notification: 3-100 caractères
- Message: 10-1000 caractères
- Berrys: 0-10,000 maximum
- Boosters: 0-10 maximum
- Protection contre les injections SQL
- Sanitization des inputs

## 📍 Accès à l'interface

```
http://localhost:5000/admin
```

## 🔑 Connexion

1. Utilisez un compte avec `is_admin = 1` dans la base de données
2. Entrez vos identifiants
3. L'interface vérifie automatiquement les droits admin

### Créer un compte admin (SQL)

```sql
-- Se connecter à la base de données
sqlite3 server/database.sqlite

-- Mettre à jour un utilisateur existant
UPDATE users SET is_admin = 1 WHERE username = 'votre_username';

-- Ou créer un nouveau compte admin directement
-- Note: utilisez le endpoint /api/auth/register puis faites l'update ci-dessus
```

## 📊 Fonctionnalités

### 1. Onglet Statistiques
- **Utilisateurs** : Total, actifs aujourd'hui, cette semaine, nouveaux
- **Économie** : Total Berrys, moyenne par joueur
- **Boosters** : Ouvertures totales, aujourd'hui, cette semaine
- **Cartes** : Total, actives, possédées
- **Sécurité** : Connexions échouées, activités suspectes, événements critiques (24h)
- **Top 10 joueurs** : Classement par Berrys

Auto-refresh disponible avec le bouton 🔄

### 2. Onglet Notifications 📢

**Créer une notification globale** :
- **Titre** : Court et descriptif (ex: "Maintenance planifiée")
- **Message** : Description détaillée pour les joueurs
- **Récompense Berrys** : 0 à 10,000 (optionnel)
- **Récompense Boosters** : 0 à 10 (optionnel)
- **Date d'expiration** : Optionnel, notification active indéfiniment si vide

**Exemples d'utilisation** :
```
Titre: Compensation Maintenance
Message: Suite à la maintenance de ce matin, nous offrons une compensation à tous les joueurs. Merci de votre patience !
Berrys: 1000
Boosters: 2
```

```
Titre: Joyeux Anniversaire One Piece TCG !
Message: Pour célébrer le premier anniversaire du jeu, tous les joueurs reçoivent des récompenses spéciales !
Berrys: 5000
Boosters: 5
Expiration: 2025-10-15 23:59
```

**Historique** :
- Liste de toutes les notifications envoyées
- Statut (Active/Inactive)
- Nombre de réclamations
- Créateur et date

### 3. Onglet Joueurs 👥

**Joueurs en ligne** :
- Liste des joueurs connectés (< 5 minutes)
- Solde Berrys et boosters disponibles
- Dernière activité

Utile pour :
- Voir l'activité en temps réel
- Monitorer les joueurs actifs
- Détecter des pics d'activité

### 4. Onglet Activité 📋

**Activité récente** (50 dernières actions) :
- Connexions
- Inscriptions
- Ouvertures de boosters
- Achats de boosters
- Succès réclamés

Avec timestamps relatifs (Il y a 5 min, 2h, etc.)

## 🔐 Sécurité des notifications

### Protection anti-abus
- **Transaction atomique** : Garantit que la récompense est donnée une seule fois
- **Vérification de réclamation** : Impossible de réclamer 2x la même notification
- **Limites de Berrys** : MAX_BERRYS = 999,999,999 par joueur
- **Limites de boosters** : Maximum 10 boosters en stock
- **Expiration** : Notifications peuvent être désactivées ou expirées automatiquement

### Audit Trail
Toutes les actions admin sont loguées dans `audit_logs` :
```sql
SELECT * FROM audit_logs
WHERE action = 'admin_action'
ORDER BY created_at DESC;
```

## 🎨 Interface

- **Design moderne** : Dark mode, responsive
- **Navigation par onglets** : Stats, Notifications, Joueurs, Activité
- **Refresh manuel** : Boutons 🔄 sur chaque section
- **Messages d'erreur clairs** : Validation en temps réel
- **Auto-logout** : Si le token expire

## 📱 Responsive

L'interface est optimisée pour :
- ✅ Desktop (recommandé)
- ✅ Tablette
- ✅ Mobile (lecture uniquement recommandée)

## 🛡️ Bonnes pratiques

1. **Ne jamais partager** les identifiants admin
2. **Vérifier deux fois** avant d'envoyer une notification à tous les joueurs
3. **Utiliser des récompenses raisonnables** pour ne pas déséquilibrer l'économie
4. **Surveiller les statistiques de sécurité** régulièrement
5. **Consulter l'activité récente** pour détecter des anomalies

## 🔧 API Endpoints utilisés

```
POST   /api/auth/login                    - Connexion admin
GET    /api/admin/dashboard/stats         - Statistiques globales
GET    /api/admin/dashboard/online-users  - Joueurs en ligne
GET    /api/admin/dashboard/activity      - Activité récente
POST   /api/admin/notifications           - Créer une notification
GET    /api/admin/notifications           - Liste des notifications
DELETE /api/admin/notifications/:id       - Désactiver une notification
```

Toutes ces routes nécessitent :
- Header `Authorization: Bearer <token>`
- Compte avec `is_admin = true`

## 📝 Structure de la base de données

### Table `notifications`
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reward_berrys INTEGER DEFAULT 0,
  reward_boosters INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT,
  expires_at TEXT
);
```

### Table `user_notifications`
```sql
CREATE TABLE user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  read_at TEXT,
  reward_claimed INTEGER DEFAULT 0,
  claimed_at TEXT
);
```

## 🚀 Déploiement

En production, assurez-vous de :
1. Définir `JWT_SECRET` dans les variables d'environnement
2. Définir `NODE_ENV=production`
3. Configurer `ALLOWED_ORIGINS` pour CORS
4. Utiliser HTTPS (certificat SSL)
5. Limiter l'accès réseau au port 5000

## 🆘 Support

En cas de problème :
1. Vérifier les logs serveur : `server/logs/`
2. Vérifier la table `audit_logs` pour les actions admin
3. Tester avec les dev tools du navigateur (F12 > Console)
4. Vérifier que le token JWT est valide et non expiré
