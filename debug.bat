@echo off
echo DEBUG - One Piece Booster Game
echo.

echo 1. Repertoire actuel:
cd

echo.
echo 2. Contenu du repertoire:
dir

echo.
echo 3. Test Node.js:
node --version

echo.
echo 4. Test npm:
npm --version

echo.
echo 5. package.json existe?
if exist package.json (
    echo OUI - package.json trouve
) else (
    echo NON - package.json manquant!
)

echo.
echo 6. node_modules existe?
if exist node_modules (
    echo OUI - node_modules existe
) else (
    echo NON - node_modules n'existe pas
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul

echo.
echo 7. Test installation simple:
npm install react

echo.
echo Debug termine!
pause