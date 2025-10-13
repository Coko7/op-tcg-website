# Réinitialisation de mot de passe

## Méthode 1 : Script PowerShell (recommandé)

```powershell
cd server\scripts
.\reset-password.ps1
```

Le script vous demandera :
1. Le nom d'utilisateur
2. Le nouveau mot de passe
3. Confirmation du mot de passe
4. Si vous voulez exécuter la requête directement

## Méthode 2 : Script Batch (Windows)

```cmd
cd server\scripts
reset-password.bat
```

Même fonctionnement que le script PowerShell.

## Méthode 3 : Commande manuelle (la plus simple)

### Étape 1 : Générer le hash

Ouvrez un terminal dans le dossier `server` et exécutez :

```cmd
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('VOTRE_NOUVEAU_MOT_DE_PASSE', 12).then(h => console.log(h));"
```

**Remplacez** `VOTRE_NOUVEAU_MOT_DE_PASSE` par le mot de passe souhaité.

Exemple :
```cmd
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 12).then(h => console.log(h));"
```

Cette commande va afficher un hash du type :
```
$2a$12$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNO
```

### Étape 2 : Mettre à jour la base de données

#### Option A : Avec sqlite3 en ligne de commande

```bash
sqlite3 database.sqlite
```

Puis dans sqlite3 :
```sql
UPDATE users
SET password_hash = 'LE_HASH_GÉNÉRÉ',
    updated_at = datetime('now')
WHERE username = 'NOM_UTILISATEUR';
```

Tapez `.quit` pour quitter sqlite3.

#### Option B : Avec un client SQLite (DB Browser for SQLite)

1. Téléchargez [DB Browser for SQLite](https://sqlitebrowser.org/dl/)
2. Ouvrez le fichier `server/database.sqlite`
3. Allez dans l'onglet "Execute SQL"
4. Collez la requête :
   ```sql
   UPDATE users
   SET password_hash = 'LE_HASH_GÉNÉRÉ',
       updated_at = datetime('now')
   WHERE username = 'NOM_UTILISATEUR';
   ```
5. Cliquez sur "Execute SQL" (icône ▶️)
6. Sauvegardez (Ctrl+S)

#### Option C : Avec Docker (si votre app est en conteneur)

```bash
# Entrer dans le conteneur
docker exec -it <nom_conteneur> sh

# Accéder à la base
sqlite3 /app/database.sqlite

# Exécuter la requête SQL
UPDATE users
SET password_hash = 'LE_HASH_GÉNÉRÉ',
    updated_at = datetime('now')
WHERE username = 'NOM_UTILISATEUR';

# Quitter
.quit
exit
```

## Méthode 4 : Via l'interface admin (si disponible)

Si vous avez accès à un compte admin :

1. Connectez-vous avec un compte admin
2. Allez dans `/admin`
3. Cherchez l'utilisateur
4. Utilisez la fonction de réinitialisation de mot de passe

## Exemples complets

### Exemple 1 : Réinitialiser le mot de passe de l'utilisateur "john"

**1. Générer le hash**
```cmd
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('nouveauMotDePasse123', 12).then(h => console.log(h));"
```

Résultat (exemple) :
```
$2a$12$XyZ123abc...
```

**2. Mettre à jour en base**
```sql
UPDATE users
SET password_hash = '$2a$12$XyZ123abc...',
    updated_at = datetime('now')
WHERE username = 'john';
```

### Exemple 2 : Créer un mot de passe temporaire

**1. Générer un hash pour "TempPass2024!"**
```cmd
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TempPass2024!', 12).then(h => console.log(h));"
```

**2. Appliquer le hash**
```sql
UPDATE users
SET password_hash = 'HASH_ICI',
    updated_at = datetime('now')
WHERE username = 'utilisateur_perdu';
```

**3. Communiquer le mot de passe temporaire**
Envoyez `TempPass2024!` à l'utilisateur et demandez-lui de le changer via son profil.

## Vérification

Pour vérifier que le nouveau mot de passe fonctionne :

1. Allez sur la page de connexion
2. Entrez le username et le nouveau mot de passe
3. Si la connexion réussit, c'est bon !

## Dépannage

### "bcrypt is not defined" ou "bcryptjs not found"

Installez bcryptjs dans le dossier server :
```bash
cd server
npm install bcryptjs
```

### "sqlite3 not found"

Installez sqlite3 :
- **Windows** : Téléchargez depuis https://www.sqlite.org/download.html
- **Linux** : `sudo apt-get install sqlite3`
- **Mac** : `brew install sqlite3`

Ou utilisez DB Browser for SQLite (interface graphique).

### Le hash ne fonctionne pas

Assurez-vous que :
1. Vous avez bien copié le hash EN ENTIER (commence par `$2a$12$`)
2. Le hash est entre guillemets simples dans la requête SQL
3. Vous n'avez pas d'espaces avant/après le hash
4. Le username est correct

## Informations techniques

- **Algorithme** : bcrypt
- **Rounds** : 12 (défaut, configurable via `BCRYPT_ROUNDS` dans `.env`)
- **Longueur du hash** : Environ 60 caractères
- **Format** : `$2a$12$...` (commence toujours par `$2a$` puis le nombre de rounds)

## Sécurité

⚠️ **Important** :
- Ne partagez JAMAIS le hash généré (c'est équivalent au mot de passe)
- Utilisez des mots de passe forts (min 8 caractères, majuscules, minuscules, chiffres)
- Demandez à l'utilisateur de changer son mot de passe après la réinitialisation
- Gardez une trace des réinitialisations de mot de passe (audit)

## Support

En cas de problème, contactez l'administrateur système ou consultez :
- Documentation bcrypt : https://github.com/kelektiv/node.bcrypt.js
- Documentation SQLite : https://www.sqlite.org/docs.html
