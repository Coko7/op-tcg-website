#!/bin/bash

# Script pour configurer le backup automatique quotidien
# À exécuter une fois pour installer le cron job

BACKUP_TIME="${BACKUP_TIME:-03:00}" # 3h du matin par défaut

echo "📅 Configuration du backup automatique quotidien"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Heure du backup: $BACKUP_TIME"
echo ""

# Créer le script de cron
CRON_SCRIPT="/app/scripts/backup-cron.sh"

cat > $CRON_SCRIPT << 'EOF'
#!/bin/bash
# Script exécuté par cron pour le backup quotidien

# Logger vers un fichier
LOG_FILE="/app/logs/backup.log"
mkdir -p /app/logs

{
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Backup automatique - $(date)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  cd /app
  node scripts/backup-database.js

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
} >> $LOG_FILE 2>&1
EOF

chmod +x $CRON_SCRIPT

echo "✅ Script cron créé: $CRON_SCRIPT"
echo ""

# Convertir l'heure en format cron (HH:MM -> MM HH)
HOUR=$(echo $BACKUP_TIME | cut -d: -f1)
MINUTE=$(echo $BACKUP_TIME | cut -d: -f2)

# Ajouter au crontab
CRON_LINE="$MINUTE $HOUR * * * $CRON_SCRIPT"

echo "📋 Ligne cron à ajouter:"
echo "   $CRON_LINE"
echo ""

# Pour Docker, on ne peut pas modifier crontab directement
# On crée plutôt un fichier que supervisord peut utiliser
echo "$CRON_LINE" > /app/crontab.txt

echo "✅ Configuration terminée!"
echo ""
echo "Pour activer dans Docker, ajoutez à docker-compose.yml:"
echo "  environment:"
echo "    - ENABLE_BACKUP_CRON=true"
echo ""
