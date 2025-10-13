#!/bin/sh
set -e

echo "🚀 Démarrage du backend One Piece Booster Game..."

# Vérifier si la base de données existe
if [ ! -f "/app/data/database.sqlite" ]; then
  echo "📦 Base de données non trouvée. Initialisation..."

  # Exécuter les migrations
  echo "🔄 Exécution des migrations..."
  node scripts/run-migrations.js

  # Initialiser les achievements
  echo "🏆 Initialisation des achievements..."
  node scripts/init-achievements.js

  echo "✅ Initialisation terminée!"
else
  echo "✅ Base de données existante trouvée"

  # Diagnostic de la base de données
  echo "🔍 Diagnostic de la base de données..."
  node diagnose-database.js || echo "⚠️ Diagnostic échoué (non bloquant)"
  echo ""

  # Exécuter les migrations pour s'assurer que la DB est à jour
  echo "🔄 Vérification et exécution des migrations..."
  node scripts/run-migrations.js || echo "⚠️ Erreur lors des migrations (peut être normale si déjà à jour)"

  # Correction des raretés des cartes Leader
  echo "🎴 Vérification et correction des raretés Leader..."
  node dist/scripts/fix-leader-rarity.js || echo "⚠️ Erreur correction raretés (non bloquant)"

  # Vérifier si les achievements existent
  ACHIEVEMENT_COUNT=$(sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM achievements;" 2>/dev/null || echo "0")

  if [ "$ACHIEVEMENT_COUNT" = "0" ]; then
    echo "🏆 Aucun achievement trouvé. Initialisation..."
    node scripts/init-achievements.js
  else
    echo "✅ $ACHIEVEMENT_COUNT achievements trouvés dans la base"
  fi
fi

# Configurer les tâches cron pour les backups et le nettoyage
echo "⏰ Configuration des tâches cron..."
sh scripts/setup-cron-backup.sh || echo "⚠️ Erreur configuration cron backup (non bloquant)"
sh scripts/setup-cron-cleanup.sh || echo "⚠️ Erreur configuration cron cleanup (non bloquant)"

# Nettoyer les fichiers temporaires et logs anciens au démarrage
echo "🧹 Nettoyage initial..."
node scripts/log-rotation.js || echo "⚠️ Erreur nettoyage initial (non bloquant)"

# Envoyer la notification de compensation (si pas déjà envoyée)
echo "🎁 Vérification notification de compensation..."
node scripts/send-compensation.js || echo "⚠️ Erreur envoi compensation (non bloquant)"

echo ""
echo "🎮 Démarrage du serveur..."
echo ""

# Lancer l'application
exec node dist/index.js
