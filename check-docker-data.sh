#!/bin/bash

echo "======================================"
echo "Diagnostic des données Vegapull"
echo "======================================"
echo ""

echo "1. Vérification des fichiers JSON dans le container:"
echo "   Nombre de fichiers cards_*.json :"
docker exec op-game-backend ls -1 /app/data/vegapull/cards_*.json 2>/dev/null | wc -l

echo ""
echo "   Fichier packs.json existe :"
docker exec op-game-backend ls -lh /app/data/vegapull/packs.json 2>/dev/null || echo "   ❌ FICHIER INTROUVABLE"

echo ""
echo "   Nombre de packs dans packs.json :"
docker exec op-game-backend sh -c 'cat /app/data/vegapull/packs.json | grep -o "\"id\":" | wc -l' 2>/dev/null

echo ""
echo "   Vérification OP-11 et OP-12 dans packs.json :"
docker exec op-game-backend grep -E "569111|569112" /app/data/vegapull/packs.json 2>/dev/null && echo "   ✅ Trouvés" || echo "   ❌ NON TROUVÉS"

echo ""
echo "2. Vérification de la base de données:"
echo "   Nombre de boosters en base :"
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM boosters WHERE is_active = 1;" 2>/dev/null

echo ""
echo "   Boosters OP-11 et OP-12 en base :"
docker exec op-game-backend sqlite3 /app/data/database.sqlite "SELECT id, code, name FROM boosters WHERE code IN ('OP-11', 'OP-12');" 2>/dev/null

echo ""
echo "3. Logs du dernier import :"
docker logs op-game-backend 2>&1 | grep -A 10 "Import.*Vegapull" | tail -20

echo ""
echo "======================================"
