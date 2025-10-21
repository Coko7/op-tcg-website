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

  # Importer les données Vegapull (packs et cartes)
  echo "🏴‍☠️ Import des données Vegapull..."
  if node dist/scripts/import-vegapull-data.js; then
    echo "✅ Données Vegapull importées avec succès!"
  else
    echo "⚠️ Erreur lors de l'import Vegapull (non bloquant)"
  fi

  # Migration initiale des quêtes depuis JSON (si le fichier existe)
  if [ -f "/app/config/world-map-quests.json" ]; then
    echo "🗺️ Migration initiale des quêtes depuis JSON..."
    node dist/scripts/migrate-quests-from-json.js || echo "⚠️ Erreur migration quêtes (non bloquant)"
  else
    echo "ℹ️ Fichier world-map-quests.json non trouvé, les quêtes seront créées par le seed initial"
  fi

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

  # Correction de TOUTES les raretés des cartes
  echo "🎴 Vérification et correction de toutes les raretés..."
  node dist/scripts/fix-all-rarities.js || echo "⚠️ Erreur correction raretés (non bloquant)"

  # Migration des quêtes depuis JSON (si le fichier existe)
  if [ -f "/app/config/world-map-quests.json" ]; then
    echo "🗺️ Migration des quêtes depuis JSON..."
    echo "   Fichier trouvé: /app/config/world-map-quests.json"

    # Afficher le nombre de quêtes dans le JSON
    QUEST_COUNT=$(grep -o '"id":' /app/config/world-map-quests.json | wc -l)
    echo "   Quêtes dans le JSON: $QUEST_COUNT"

    # Exécuter la migration avec sortie complète
    if node dist/scripts/migrate-quests-from-json.js; then
      echo "✅ Migration des quêtes réussie!"

      # Vérifier que les mises à jour sont bien appliquées
      echo ""
      if node scripts/verify-quest-updates.js; then
        echo ""
        echo "✅ Vérification réussie: Les quêtes sont à jour!"
      else
        echo ""
        echo "⚠️  ATTENTION: Les quêtes n'ont pas les bonnes valeurs!"
        echo "   La migration s'est exécutée mais les valeurs ne correspondent pas."
      fi
    else
      echo "❌ ERREUR: Échec de la migration des quêtes!"
      echo "   La migration a échoué mais le serveur va démarrer quand même."
      echo "   Vérifiez les logs ci-dessus pour plus de détails."
    fi
  else
    echo "⚠️ ATTENTION: Fichier world-map-quests.json NON TROUVÉ!"
    echo "   Chemin attendu: /app/config/world-map-quests.json"
    echo "   La migration des quêtes sera ignorée."
  fi

  # Vérifier si les achievements existent
  ACHIEVEMENT_COUNT=$(sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM achievements;" 2>/dev/null || echo "0")

  if [ "$ACHIEVEMENT_COUNT" = "0" ]; then
    echo "🏆 Aucun achievement trouvé. Initialisation..."
    node scripts/init-achievements.js
  else
    echo "✅ $ACHIEVEMENT_COUNT achievements trouvés dans la base"
  fi

  # Importer/mettre à jour les données Vegapull (packs et cartes)
  echo "🏴‍☠️ Import/mise à jour des données Vegapull..."
  if node dist/scripts/import-vegapull-data.js; then
    echo "✅ Données Vegapull importées avec succès!"
  else
    echo "⚠️ Erreur lors de l'import Vegapull (non bloquant)"
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
