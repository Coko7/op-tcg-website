#!/bin/bash

echo "Test du contexte Docker"
echo "======================="
echo ""

echo "1. Fichiers data/vegapull dans le contexte actuel :"
ls -lh data/vegapull/*.json | wc -l

echo ""
echo "2. Contenu du répertoire data/vegapull :"
ls data/vegapull/ | head -10

echo ""
echo "3. Vérification que data/ n'est pas ignoré :"
if grep -q "^data/$" .dockerignore; then
    echo "   ❌ data/ est dans .dockerignore"
else
    echo "   ✅ data/ n'est PAS ignoré"
fi

echo ""
echo "4. Création d'un Dockerfile de test..."
cat > Dockerfile.test <<'EOF'
FROM alpine:latest
WORKDIR /app
COPY data/vegapull ./data/vegapull
RUN ls -la /app/data/vegapull/ || echo "ERREUR: Répertoire vide"
RUN ls -la /app/data/vegapull/*.json | wc -l || echo "0"
EOF

echo "5. Build de test..."
docker build -f Dockerfile.test -t test-vegapull-context . 2>&1 | grep -E "Step|vegapull|COPY"

echo ""
echo "6. Nettoyage..."
rm Dockerfile.test
docker rmi test-vegapull-context 2>/dev/null || true

echo ""
echo "Test terminé."
