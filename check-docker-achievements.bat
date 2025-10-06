@echo off
echo ========================================
echo Vérification des Achievements Docker
echo ========================================
echo.

echo 📊 Nombre d'achievements dans la base:
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM achievements;" 2>nul

echo.
echo 📋 Liste des achievements:
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT name, threshold, reward_berrys FROM achievements ORDER BY category, threshold;" 2>nul

echo.
echo 📈 Version de la base de données:
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT MAX(version) as current_version FROM schema_version;" 2>nul

echo.
pause
