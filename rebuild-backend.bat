@echo off
echo ========================================
echo Rebuild du Backend avec Achievements
echo ========================================
echo.

echo 🛑 Arrêt des containers...
docker-compose down

echo.
echo 🔨 Build de l'image backend (sans cache)...
docker-compose build --no-cache backend

echo.
echo 🚀 Démarrage des services...
docker-compose up -d

echo.
echo ⏳ Attente du démarrage (30 secondes)...
timeout /t 30 /nobreak

echo.
echo 📊 Vérification des achievements...
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT COUNT(*) as total FROM achievements;" 2>nul

echo.
echo 📋 Logs du backend (dernières 20 lignes):
docker logs --tail 20 op-game-backend

echo.
echo ✅ Terminé ! Vérifiez la page Achievements dans votre navigateur.
echo.
pause
