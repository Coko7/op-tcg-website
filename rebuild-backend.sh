#!/bin/bash

echo "========================================"
echo "Rebuild du Backend avec Achievements"
echo "========================================"
echo ""

echo "🛑 Arrêt des containers..."
docker-compose down

echo ""
echo "🔨 Build de l'image backend..."
docker-compose build backend

echo ""
echo "🚀 Démarrage des services..."
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage (30 secondes)..."
sleep 30

echo ""
echo "📊 Vérification des achievements..."
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT COUNT(*) as total FROM achievements;" 2>/dev/null

echo ""
echo "📋 Logs du backend (dernières 20 lignes):"
docker logs --tail 20 op-game-backend

echo ""
echo "✅ Terminé ! Vérifiez la page Achievements dans votre navigateur."
