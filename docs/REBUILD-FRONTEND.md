# Reconstruction Rapide de l'Image Frontend

## Probl�me R�solu
L'erreur `ERR_BLOCKED_BY_CLIENT` / `Failed to fetch` �tait caus�e par une mauvaise configuration de l'URL de l'API.

**Correction appliqu�e :**
- Le code utilise maintenant `VITE_API_URL` (au lieu de `VITE_API_BASE_URL`)
- L'URL par d�faut est `/api` pour fonctionner avec le proxy Nginx

---

## Reconstruction de l'Image Frontend

### Sur votre machine Windows

```bash
cd C:\Users\ppccl\Desktop\OP_game_claude

# Reconstruire l'image frontend avec la bonne configuration
docker build -t op-game-frontend:latest -f Dockerfile.frontend --build-arg VITE_API_URL=/api .

# Exporter l'image
docker save op-game-frontend:latest | gzip > op-game-frontend.tar.gz

# Transf�rer vers la Raspberry Pi
scp op-game-frontend.tar.gz pi@framboise.lan:~/
```

### Sur la Raspberry Pi

```bash
# Charger la nouvelle image
docker load < ~/op-game-frontend.tar.gz

# V�rifier l'image
docker images | grep op-game-frontend
```

### Red�ployer dans Portainer

1. **Dans Portainer**, allez dans votre stack `op-game`
2. Cliquez sur **Update the stack**
3. Cochez **Re-pull image and redeploy**
4. Cliquez sur **Update**

OU en ligne de commande :

```bash
# Arr�ter le conteneur frontend
docker stop op-game-frontend

# Supprimer le conteneur
docker rm op-game-frontend

# Red�marrer le stack (dans Portainer ou avec docker-compose)
```

Dans Portainer, vous pouvez simplement cliquer sur le conteneur frontend et faire **Recreate**.

---

## V�rification

Apr�s le red�ploiement :

1. **Ouvrez la console du navigateur** (F12)
2. **Rechargez la page** (Ctrl+F5 pour forcer le rechargement)
3. **Essayez de vous connecter** ou de cr�er un compte
4. **V�rifiez les logs** du backend :
   ```bash
   docker logs op-game-backend -f
   ```

Les requ�tes API devraient maintenant fonctionner !

---

## Debug Suppl�mentaire

Si le probl�me persiste, v�rifiez :

### 1. Le proxy Nginx fonctionne
```bash
# Depuis la Raspberry Pi
curl http://localhost/api/health

# Devrait retourner: {"status":"ok"}
```

### 2. Le backend est accessible
```bash
curl http://backend:5000/health
# Ou
docker exec op-game-frontend curl http://backend:5000/health
```

### 3. Les logs du frontend
```bash
docker logs op-game-frontend
```

### 4. Les logs du backend
```bash
docker logs op-game-backend
```

### 5. Tester l'API directement
Ouvrez la console du navigateur et testez :
```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## Alternative : Build sur la Raspberry Pi

Si vous pr�f�rez construire directement sur la Raspberry Pi (plus lent mais pas besoin de transf�rer) :

```bash
# Sur la Raspberry Pi
cd ~/op-game  # O� se trouve votre code

# Reconstruire
docker build -t op-game-frontend:latest -f Dockerfile.frontend --build-arg VITE_API_URL=/api .

# Puis recr�er le conteneur dans Portainer
```

---

## Note Importante

**Les variables d'environnement Vite** (`VITE_*`) sont compil�es **au moment du build**, pas � l'ex�cution. C'est pourquoi il faut reconstruire l'image frontend apr�s avoir modifi� `VITE_API_URL`.

Le fichier `.env` sur votre machine Windows n'affecte pas l'image Docker - seul l'argument `--build-arg VITE_API_URL=/api` compte lors de la construction de l'image.

---

**Temps estim� :** 5-10 minutes pour reconstruction + transfert + red�ploiement
