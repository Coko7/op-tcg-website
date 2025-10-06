@echo off
echo =====================================
echo  Diagnostic One Piece Booster Game
echo =====================================
echo.

echo === Verification de l'environnement ===
echo.

echo Version de Node.js:
node --version
if errorlevel 1 (
    echo PROBLEME: Node.js non trouve
    echo Solution: Installez Node.js depuis https://nodejs.org/
    echo.
) else (
    echo OK: Node.js detecte
)

echo.
echo Version de npm:
npm --version
if errorlevel 1 (
    echo PROBLEME: npm non trouve
) else (
    echo OK: npm detecte
)

echo.
echo === Verification des fichiers ===
echo.

if exist package.json (
    echo OK: package.json trouve
) else (
    echo PROBLEME: package.json manquant
)

if exist src\main.tsx (
    echo OK: Fichiers source detectes
) else (
    echo PROBLEME: Fichiers source manquants
)

if exist tailwind.config.js (
    echo OK: Configuration Tailwind presente
) else (
    echo PROBLEME: Configuration Tailwind manquante
)

echo.
echo === Test d'installation ===
echo.

echo Test de connexion npm...
npm ping
if errorlevel 1 (
    echo PROBLEME: Connexion npm echouee
    echo Solution: Verifiez votre connexion internet
) else (
    echo OK: Connexion npm fonctionnelle
)

echo.
echo === Verification de l'espace disque ===
echo.
echo Espace disque disponible:
dir

echo.
echo === Recommandations ===
echo.
echo 1. Si Node.js est manquant: installez-le depuis nodejs.org
echo 2. Si npm echoue: essayez 'npm cache clean --force'
echo 3. Si l'espace disque est faible: liberez de l'espace
echo 4. Pour une installation minimale: utilisez install-step-by-step.bat
echo 5. Pour ignorer les dependances optionnelles: npm install --no-optional
echo.

pause