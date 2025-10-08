#!/bin/bash

# Script d'initialisation Docker
# Vérifie et corrige les problèmes au démarrage du conteneur

echo "🚀 Initialisation du conteneur..."

# Vérifier que la base de données existe
if [ ! -f "/app/data/database.sqlite" ]; then
  echo "⚠️  Base de données introuvable, elle sera créée au premier démarrage"
else
  echo "✅ Base de données trouvée: /app/data/database.sqlite"

  # Afficher la taille
  SIZE=$(du -h /app/data/database.sqlite | cut -f1)
  echo "   Taille: $SIZE"

  # Diagnostic rapide
  echo ""
  echo "📊 Diagnostic rapide..."
  node /app/diagnose-database.js || echo "⚠️  Diagnostic échoué (non bloquant)"
fi

echo ""
echo "✅ Initialisation terminée, démarrage du serveur..."
echo ""

# Démarrer le serveur
exec "$@"
