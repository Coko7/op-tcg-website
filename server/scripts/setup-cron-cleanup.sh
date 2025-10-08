#!/bin/sh

# Script pour configurer les tâches cron de nettoyage
# Nettoyage quotidien des logs et fichiers temporaires

SCRIPT_DIR=$(dirname "$0")
LOG_ROTATION_SCRIPT="$SCRIPT_DIR/log-rotation.js"

# Vérifier que le script de rotation existe
if [ ! -f "$LOG_ROTATION_SCRIPT" ]; then
  echo "❌ Erreur: Script de rotation de logs non trouvé: $LOG_ROTATION_SCRIPT"
  exit 1
fi

# Rendre le script exécutable
chmod +x "$LOG_ROTATION_SCRIPT"

# Créer le fichier crontab
CRON_FILE="/tmp/app-cron"

# Nettoyage quotidien à 3h du matin
echo "0 3 * * * cd /app && /usr/local/bin/node $LOG_ROTATION_SCRIPT >> /app/logs/cleanup.log 2>&1" > "$CRON_FILE"

# Installer le crontab pour l'utilisateur nodejs
crontab "$CRON_FILE"

# Nettoyer le fichier temporaire
rm -f "$CRON_FILE"

echo "✅ Tâche cron de nettoyage configurée (quotidien à 3h du matin)"

# Afficher le crontab actuel
echo ""
echo "📋 Tâches cron actuelles:"
crontab -l
