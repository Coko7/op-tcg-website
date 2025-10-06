# Diagnostic des erreurs - One Piece Booster Game
Write-Host "🔍 Diagnostic des erreurs..." -ForegroundColor Cyan
Write-Host ""

# Vérification des fichiers critiques
$criticalFiles = @(
    "src/main.tsx",
    "src/App.tsx",
    "src/index.css",
    "vite.config.ts",
    "package.json"
)

Write-Host "📁 Vérification des fichiers critiques:" -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MANQUANT!" -ForegroundColor Red
    }
}

Write-Host ""

# Vérification de la structure src/
Write-Host "📂 Structure du dossier src/:" -ForegroundColor Yellow
if (Test-Path "src") {
    Get-ChildItem -Path "src" -Recurse | Select-Object Name, FullName | Format-Table -AutoSize
} else {
    Write-Host "❌ Dossier src/ manquant!" -ForegroundColor Red
}

Write-Host ""

# Test de compilation TypeScript
Write-Host "🔧 Test de compilation TypeScript:" -ForegroundColor Yellow
try {
    $result = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreurs TypeScript:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Impossible de tester TypeScript" -ForegroundColor Red
}

Write-Host ""

# Vérification du contenu package.json
Write-Host "📋 Contenu package.json:" -ForegroundColor Yellow
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "Nom: $($package.name)" -ForegroundColor White
    Write-Host "Scripts disponibles:" -ForegroundColor White
    $package.scripts.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ package.json introuvable" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Recommendations:" -ForegroundColor Cyan
Write-Host "1. Ouvrez le navigateur en mode développeur (F12)" -ForegroundColor White
Write-Host "2. Regardez l'onglet Console pour voir les erreurs" -ForegroundColor White
Write-Host "3. Regardez l'onglet Network pour voir les fichiers qui échouent" -ForegroundColor White
Write-Host "4. Si erreur de module, vérifiez que tous les fichiers src/ existent" -ForegroundColor White

Read-Host "Appuyez sur Entrée pour continuer"