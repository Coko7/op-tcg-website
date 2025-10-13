# Script PowerShell pour réinitialiser le mot de passe d'un utilisateur
# Usage: .\reset-password.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Réinitialisation de mot de passe" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Demander le username
$username = Read-Host "Nom d'utilisateur"

# Demander le nouveau mot de passe
$password = Read-Host "Nouveau mot de passe"

# Demander confirmation
$confirm = Read-Host "Confirmer le mot de passe"

if ($password -ne $confirm) {
    Write-Host ""
    Write-Host "ERREUR: Les mots de passe ne correspondent pas!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Génération du hash bcrypt..." -ForegroundColor Yellow

# Générer le hash avec Node.js
$hash = node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$password', 12).then(h => console.log(h));"

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($hash)) {
    Write-Host ""
    Write-Host "ERREUR: Impossible de générer le hash!" -ForegroundColor Red
    Write-Host "Assurez-vous que Node.js et bcryptjs sont installés." -ForegroundColor Yellow
    exit 1
}

# Afficher les informations
Write-Host ""
Write-Host "Hash généré avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "Username: $username" -ForegroundColor Cyan
Write-Host "Hash: $hash" -ForegroundColor Gray
Write-Host ""

# Générer la requête SQL
$sqlQuery = @"
UPDATE users
SET password_hash = '$hash',
    updated_at = datetime('now')
WHERE username = '$username';
"@

Write-Host "Requête SQL à exécuter:" -ForegroundColor Yellow
Write-Host $sqlQuery -ForegroundColor White
Write-Host ""

# Proposer d'exécuter directement la requête
$execute = Read-Host "Voulez-vous exécuter cette requête maintenant? (o/n)"

if ($execute -eq "o" -or $execute -eq "O") {
    # Chemin vers la base de données
    $dbPath = Join-Path $PSScriptRoot "..\database.sqlite"

    if (-not (Test-Path $dbPath)) {
        Write-Host ""
        Write-Host "ERREUR: Base de données non trouvée à: $dbPath" -ForegroundColor Red
        exit 1
    }

    # Exécuter la requête avec sqlite3
    $result = sqlite3 $dbPath $sqlQuery 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Mot de passe mis à jour avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Vous pouvez maintenant vous connecter avec:" -ForegroundColor Cyan
        Write-Host "  Username: $username" -ForegroundColor White
        Write-Host "  Password: $password" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "ERREUR lors de la mise à jour:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Requête SQL copiée dans le presse-papier (si disponible)" -ForegroundColor Yellow
    $sqlQuery | Set-Clipboard -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Terminé!" -ForegroundColor Green
