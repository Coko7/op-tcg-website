#!/bin/bash

# Script pour initialiser les achievements dans le container Docker

echo "🚀 Initialisation des achievements dans Docker..."
echo ""

# 1. Exécuter les migrations
echo "📦 Étape 1/2 : Exécution des migrations..."
docker exec op-game-backend npm run migrate

echo ""
echo "🏆 Étape 2/2 : Initialisation des achievements..."
docker exec op-game-backend npm run init-achievements

echo ""
echo "✅ Terminé ! Les achievements sont maintenant disponibles dans Docker."
