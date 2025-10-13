@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==================================
echo   Réinitialisation de mot de passe
echo ==================================
echo.

REM Demander le username
set /p username="Nom d'utilisateur: "

REM Demander le nouveau mot de passe
set /p password="Nouveau mot de passe: "

REM Demander confirmation
set /p confirm="Confirmer le mot de passe: "

if not "!password!"=="!confirm!" (
    echo.
    echo ERREUR: Les mots de passe ne correspondent pas!
    pause
    exit /b 1
)

echo.
echo Génération du hash bcrypt...

REM Générer le hash avec Node.js
for /f "delims=" %%i in ('node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('!password!', 12).then(h => console.log(h));"') do set hash=%%i

if "!hash!"=="" (
    echo.
    echo ERREUR: Impossible de générer le hash!
    echo Assurez-vous que Node.js et bcryptjs sont installés.
    pause
    exit /b 1
)

echo.
echo Hash généré avec succès!
echo.
echo Username: !username!
echo Hash: !hash!
echo.
echo Requête SQL à exécuter:
echo.
echo UPDATE users
echo SET password_hash = '!hash!',
echo     updated_at = datetime('now'^)
echo WHERE username = '!username!';
echo.

REM Créer un fichier SQL temporaire
set sqlfile=%TEMP%\reset_password.sql
echo UPDATE users > "!sqlfile!"
echo SET password_hash = '!hash!', >> "!sqlfile!"
echo     updated_at = datetime('now') >> "!sqlfile!"
echo WHERE username = '!username!'; >> "!sqlfile!"

set /p execute="Voulez-vous exécuter cette requête maintenant? (o/n): "

if /i "!execute!"=="o" (
    REM Chemin vers la base de données
    set dbpath=%~dp0..\database.sqlite

    if not exist "!dbpath!" (
        echo.
        echo ERREUR: Base de données non trouvée
        pause
        exit /b 1
    )

    REM Exécuter avec sqlite3 (si disponible)
    sqlite3 "!dbpath!" < "!sqlfile!" 2>nul

    if !errorlevel! equ 0 (
        echo.
        echo Mot de passe mis à jour avec succès!
        echo.
        echo Vous pouvez maintenant vous connecter avec:
        echo   Username: !username!
        echo   Password: !password!
    ) else (
        echo.
        echo ATTENTION: sqlite3 n'est pas disponible.
        echo Copiez et exécutez manuellement la requête SQL ci-dessus.
    )

    del "!sqlfile!" 2>nul
)

echo.
echo Terminé!
pause
