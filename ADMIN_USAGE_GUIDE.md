# Guide d'Utilisation - Interface Administrateur

## 📋 Table des Matières

1. [Connexion Admin](#1-connexion-admin)
2. [Créer des Notifications](#2-créer-des-notifications)
3. [Consulter le Dashboard](#3-consulter-le-dashboard)
4. [Exemples Pratiques](#4-exemples-pratiques)
5. [Interface Web (TODO)](#5-interface-web-todo)

---

## 1. Connexion Admin

### 🔑 Identifiants par Défaut

Les identifiants admin sont définis dans `.env` :

```env
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=VotreMotDePasseSecurise123!
```

### 📡 Se Connecter via API

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "VotreMotDePasseSecurise123!"
  }'
```

**Réponse** :
```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "username": "admin",
    "is_admin": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Important** : Sauvegarder le `accessToken` pour les requêtes suivantes !

```bash
# Sauvegarder dans une variable
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 2. Créer des Notifications

### 📢 Notification avec Récompense

```bash
curl -X POST http://localhost:5000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Cadeau de Bienvenue !",
    "message": "Merci de jouer à One Piece Booster Game ! Voici 1000 Berrys et 2 boosters gratuits pour bien démarrer votre collection !",
    "reward_berrys": 1000,
    "reward_boosters": 2,
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

**Paramètres** :
- `title` (requis) : 3-100 caractères
- `message` (requis) : 10-1000 caractères
- `reward_berrys` (optionnel) : 0-10000
- `reward_boosters` (optionnel) : 0-10
- `expires_at` (optionnel) : Date d'expiration ISO 8601

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": "notif-uuid-123",
    "title": "Cadeau de Bienvenue !",
    "message": "Merci de jouer...",
    "reward_berrys": 1000,
    "reward_boosters": 2
  }
}
```

### 📝 Notification sans Récompense

```bash
curl -X POST http://localhost:5000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Maintenance Programmée",
    "message": "Une maintenance aura lieu demain de 2h à 4h du matin pour améliorer le jeu. Merci de votre compréhension !",
    "reward_berrys": 0,
    "reward_boosters": 0
  }'
```

### 📋 Lister Toutes les Notifications

```bash
curl http://localhost:5000/api/admin/notifications \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "title": "Cadeau de Bienvenue !",
      "message": "Merci de jouer...",
      "reward_berrys": 1000,
      "reward_boosters": 2,
      "is_active": true,
      "created_at": "2025-10-07T10:00:00Z",
      "expires_at": "2025-12-31T23:59:59Z",
      "created_by_username": "admin",
      "total_claims": 42
    }
  ]
}
```

### 🗑️ Désactiver une Notification

```bash
curl -X DELETE http://localhost:5000/api/admin/notifications/notif-123 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 3. Consulter le Dashboard

### 📊 Statistiques Générales

```bash
curl http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Données retournées** :

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 156,
      "admins": 2,
      "active_today": 42,
      "active_week": 98,
      "new_week": 23,
      "total_berrys": 523000,
      "avg_berrys": 3352
    },
    "cards": {
      "total": 2628,
      "active": 2628
    },
    "collections": {
      "total": 1523,
      "total_cards_owned": 4567,
      "users_with_cards": 142,
      "avg_per_user": 32
    },
    "boosters": {
      "total_openings": 892,
      "opened_today": 67,
      "opened_week": 423
    },
    "achievements": {
      "total": 45,
      "completions": 234,
      "claimed": 198
    },
    "security": {
      "failed_logins_24h": 3,
      "suspicious_activities_24h": 0,
      "critical_events_24h": 0
    },
    "top_players": [
      {
        "username": "luffy_king",
        "berrys": 15420,
        "total_cards": 42,
        "cards_owned": 156
      }
    ]
  }
}
```

### 👥 Utilisateurs en Ligne

```bash
curl http://localhost:5000/api/admin/dashboard/online-users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "count": 12,
    "users": [
      {
        "id": "user-123",
        "username": "luffy_king",
        "last_login": "2025-10-07T14:23:15Z",
        "berrys": 15420,
        "available_boosters": 2
      }
    ]
  }
}
```

### 📜 Activité Récente

```bash
curl "http://localhost:5000/api/admin/dashboard/activity?limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "action": "booster_opened",
      "user_id": "user-123",
      "details": "{\"booster_id\":\"OP-01\",\"cards_obtained\":5}",
      "severity": "info",
      "created_at": "2025-10-07T14:30:00Z"
    },
    {
      "action": "user_login",
      "user_id": "user-456",
      "details": "{\"ip\":\"192.168.1.100\"}",
      "severity": "info",
      "created_at": "2025-10-07T14:28:00Z"
    }
  ]
}
```

---

## 4. Exemples Pratiques

### 🎁 Exemple 1 : Cadeau pour Tous les Joueurs

**Scénario** : Offrir 500 Berrys et 1 booster à tous les joueurs pour un événement spécial.

```bash
curl -X POST http://localhost:5000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "🎉 Événement Week-end !",
    "message": "Ce week-end, profitez de 500 Berrys et 1 booster gratuit ! Merci de votre fidélité !",
    "reward_berrys": 500,
    "reward_boosters": 1,
    "expires_at": "2025-10-10T23:59:59Z"
  }'
```

### 📢 Exemple 2 : Annonce sans Récompense

**Scénario** : Annoncer une nouvelle mise à jour.

```bash
curl -X POST http://localhost:5000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Nouvelle mise à jour disponible !",
    "message": "Le booster OP-08 est maintenant disponible ! Découvrez de nouvelles cartes rares et légendaires !",
    "reward_berrys": 0,
    "reward_boosters": 0
  }'
```

### 💰 Exemple 3 : Compensation pour un Bug

**Scénario** : Compenser les joueurs pour un problème technique.

```bash
curl -X POST http://localhost:5000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Compensation - Incident Technique",
    "message": "Nous nous excusons pour le problème technique rencontré hier. En guise de compensation, tous les joueurs reçoivent 1500 Berrys et 3 boosters.",
    "reward_berrys": 1500,
    "reward_boosters": 3
  }'
```

### 🔍 Exemple 4 : Vérifier l'Impact d'une Notification

```bash
# 1. Créer la notification
NOTIF_ID=$(curl -s -X POST http://localhost:5000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Test",
    "message": "Test notification",
    "reward_berrys": 100,
    "reward_boosters": 0
  }' | jq -r '.data.id')

echo "Notification créée: $NOTIF_ID"

# 2. Attendre un peu
sleep 60

# 3. Vérifier combien de joueurs ont réclamé
curl -s http://localhost:5000/api/admin/notifications \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq ".data[] | select(.id == \"$NOTIF_ID\") | .total_claims"
```

---

## 5. Interface Web (TODO)

### 🚧 À Développer

Pour l'instant, il n'y a que l'API. Une interface web serait utile avec :

#### Page Admin Dashboard (`/admin`)

```
┌─────────────────────────────────────────────────┐
│  🎮 One Piece Booster Game - Admin             │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Statistiques                                │
│  ├─ 156 joueurs (42 actifs aujourd'hui)        │
│  ├─ 2,628 cartes disponibles                   │
│  └─ 892 boosters ouverts                       │
│                                                 │
│  👥 Joueurs en ligne: 12                       │
│                                                 │
│  📈 Top Joueurs                                │
│  1. luffy_king - 15,420 Berrys                 │
│  2. zoro_master - 12,890 Berrys                │
│  3. nami_treasure - 11,340 Berrys              │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Page Notifications (`/admin/notifications`)

```
┌─────────────────────────────────────────────────┐
│  📢 Gestion des Notifications                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [+ Créer une notification]                    │
│                                                 │
│  📋 Notifications actives                       │
│  ┌───────────────────────────────────────────┐ │
│  │ 🎁 Cadeau de Bienvenue                    │ │
│  │ 1000 Berrys + 2 Boosters                  │ │
│  │ 42 réclamations                           │ │
│  │ [Désactiver]                              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Formulaire Création Notification

```typescript
interface NotificationForm {
  title: string;          // 3-100 caractères
  message: string;        // 10-1000 caractères
  reward_berrys: number;  // 0-10000
  reward_boosters: number; // 0-10
  expires_at?: string;    // Date optionnelle
}
```

### 📝 Code React Exemple

```typescript
// src/pages/admin/CreateNotification.tsx
import { useState } from 'react';
import { apiService } from '../../services/api';

export function CreateNotification() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    reward_berrys: 0,
    reward_boosters: 0,
    expires_at: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        alert('Notification créée avec succès !');
        // Reset form
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>📢 Créer une Notification</h2>

      <label>
        Titre *
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({...form, title: e.target.value})}
          minLength={3}
          maxLength={100}
          required
        />
      </label>

      <label>
        Message *
        <textarea
          value={form.message}
          onChange={(e) => setForm({...form, message: e.target.value})}
          minLength={10}
          maxLength={1000}
          rows={5}
          required
        />
      </label>

      <label>
        Berrys (0-10000)
        <input
          type="number"
          value={form.reward_berrys}
          onChange={(e) => setForm({...form, reward_berrys: parseInt(e.target.value)})}
          min={0}
          max={10000}
        />
      </label>

      <label>
        Boosters (0-10)
        <input
          type="number"
          value={form.reward_boosters}
          onChange={(e) => setForm({...form, reward_boosters: parseInt(e.target.value)})}
          min={0}
          max={10}
        />
      </label>

      <label>
        Date d'expiration (optionnel)
        <input
          type="datetime-local"
          value={form.expires_at}
          onChange={(e) => setForm({...form, expires_at: e.target.value})}
        />
      </label>

      <button type="submit">Créer la notification</button>
    </form>
  );
}
```

---

## 🔐 Sécurité

### Vérifications Implémentées

✅ **Authentication** : Toutes les routes admin requièrent un token JWT valide
✅ **Authorization** : Seuls les utilisateurs avec `is_admin = true` peuvent accéder
✅ **Rate Limiting** : Max 20 requêtes admin / 15 min
✅ **Validation** : Tous les inputs sont validés (longueur, type, range)
✅ **Audit Logging** : Toutes les actions admin sont loggées

### Bonnes Pratiques

1. **Token Sécurisé** : Ne jamais partager le token admin
2. **HTTPS** : Utiliser HTTPS en production
3. **Rotation Password** : Changer le mot de passe admin régulièrement
4. **Monitoring** : Surveiller les logs d'audit pour détecter les abus

---

## 📞 Support

### Erreurs Courantes

#### 401 Unauthorized
```json
{"error": "Non authentifié"}
```
→ Token manquant ou expiré. Se reconnecter.

#### 403 Forbidden
```json
{"error": "Accès refusé - droits administrateur requis"}
```
→ L'utilisateur n'est pas admin.

#### 400 Bad Request
```json
{"error": "Titre invalide (3-100 caractères requis)"}
```
→ Vérifier les paramètres envoyés.

#### 429 Too Many Requests
```json
{"error": "Trop de requêtes admin, veuillez réessayer plus tard."}
```
→ Rate limit dépassé. Attendre 15 minutes.

---

**Version**: 1.1.0
**Dernière mise à jour**: 7 octobre 2025
