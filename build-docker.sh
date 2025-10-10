#!/bin/bash

# Script de build Docker avec retry et fallbacks
# Usage: ./build-docker.sh [frontend|backend|all]

set -e  # Exit on error

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=3
BUILDKIT_ENABLED=1

# Fonction pour afficher des messages
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."

    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    log_success "Docker installé"

    # Vérifier Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon n'est pas démarré"
        exit 1
    fi
    log_success "Docker daemon actif"

    # Vérifier les fichiers
    if [ ! -f "package.json" ]; then
        log_error "package.json introuvable"
        exit 1
    fi
    log_success "Fichiers nécessaires présents"
}

# Fonction pour nettoyer Docker
cleanup_docker() {
    log_info "Nettoyage Docker..."
    docker system prune -f > /dev/null 2>&1 || true
    log_success "Nettoyage terminé"
}

# Fonction pour builder le frontend
build_frontend() {
    local retry_count=0
    local success=false

    log_info "Build du frontend..."

    while [ $retry_count -lt $MAX_RETRIES ] && [ "$success" = false ]; do
        if [ $retry_count -gt 0 ]; then
            log_warning "Tentative ${retry_count}/${MAX_RETRIES}..."
            sleep 5
        fi

        # Activer BuildKit
        export DOCKER_BUILDKIT=$BUILDKIT_ENABLED

        # Essayer le build
        if docker build \
            --progress=plain \
            --build-arg BUILDKIT_INLINE_CACHE=1 \
            -f Dockerfile.frontend \
            -t op-game-frontend:latest \
            . 2>&1 | tee build-frontend.log; then
            success=true
            log_success "Frontend build avec succès!"
        else
            log_warning "Build échoué (tentative ${retry_count}/${MAX_RETRIES})"
            retry_count=$((retry_count + 1))

            # Nettoyer après échec
            if [ $retry_count -eq 2 ]; then
                log_info "Nettoyage du cache Docker..."
                docker builder prune -f > /dev/null 2>&1 || true
            fi
        fi
    done

    if [ "$success" = false ]; then
        log_error "Échec du build frontend après $MAX_RETRIES tentatives"
        log_info "Essayez le build local : npm run build"
        return 1
    fi

    return 0
}

# Fonction pour builder le backend
build_backend() {
    log_info "Build du backend..."

    if docker build \
        --progress=plain \
        -f Dockerfile.backend \
        -t op-game-backend:latest \
        .; then
        log_success "Backend build avec succès!"
        return 0
    else
        log_error "Échec du build backend"
        return 1
    fi
}

# Fonction pour vérifier le build local
check_local_build() {
    log_info "Vérification de la possibilité de build local..."

    if [ ! -d "node_modules" ]; then
        log_warning "node_modules absent, installation..."
        npm ci || npm install
    fi

    log_info "Test du build local..."
    if npm run build; then
        log_success "Build local réussi!"
        log_info "Vous pouvez utiliser le fichier dist/ pour un Dockerfile simplifié"
        return 0
    else
        log_error "Le build local a également échoué"
        return 1
    fi
}

# Fonction pour afficher le résumé
show_summary() {
    echo ""
    echo "═══════════════════════════════════════════════"
    log_info "RÉSUMÉ DU BUILD"
    echo "═══════════════════════════════════════════════"

    # Lister les images
    echo ""
    log_info "Images Docker créées:"
    docker images | grep "op-game" || log_warning "Aucune image op-game trouvée"

    echo ""
    log_info "Prochaines étapes:"
    echo "  1. Démarrer les containers: docker-compose up -d"
    echo "  2. Vérifier les logs: docker-compose logs -f"
    echo "  3. Accéder à l'app: http://localhost:3000"
    echo ""
}

# Fonction principale
main() {
    local target="${1:-all}"

    echo "═══════════════════════════════════════════════"
    echo "  🏴‍☠️  ONE PIECE TCG - BUILD DOCKER"
    echo "═══════════════════════════════════════════════"
    echo ""

    check_prerequisites

    case $target in
        frontend)
            build_frontend || {
                log_warning "Tentative de build local..."
                check_local_build
            }
            ;;
        backend)
            build_backend
            ;;
        all)
            build_frontend || {
                log_warning "Tentative de build local du frontend..."
                check_local_build
            }
            echo ""
            build_backend
            ;;
        clean)
            cleanup_docker
            exit 0
            ;;
        *)
            log_error "Usage: $0 [frontend|backend|all|clean]"
            exit 1
            ;;
    esac

    show_summary
}

# Gestion des interruptions
trap 'log_warning "Build interrompu par l'\''utilisateur"; exit 130' INT TERM

# Exécution
main "$@"
