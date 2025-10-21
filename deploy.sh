#!/bin/bash
# Script de déploiement pour Raspberry Pi
# Usage: ./deploy.sh [start|stop|restart|rebuild|logs|status]

set -e

PROJECT_NAME="op-game"
COMPOSE_FILE="docker-compose.yml"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les logs colorés
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si Docker et Docker Compose sont installés
check_dependencies() {
    log_info "Vérification des dépendances..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé. Installez Docker avant de continuer."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé. Installez Docker Compose avant de continuer."
        exit 1
    fi

    log_success "Dépendances vérifiées"
}

# Créer les répertoires nécessaires
setup_directories() {
    log_info "Création des répertoires nécessaires..."

    mkdir -p data
    mkdir -p public/images/cards

    log_success "Répertoires créés"
}

# Configurer l'environnement
setup_environment() {
    if [ ! -f .env ]; then
        log_info "Création du fichier .env..."
        cp .env.production .env
        log_warning "IMPORTANT: Modifiez le fichier .env avec vos propres secrets avant de démarrer en production!"
    fi
}

# Construire les images
build() {
    log_info "Construction des images Docker..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    log_success "Images construites avec succès"
}

# Démarrer les services
start() {
    log_info "Démarrage des services..."
    setup_directories
    setup_environment
    docker-compose -f $COMPOSE_FILE up -d
    log_success "Services démarrés"

    # Attendre que les services soient prêts
    log_info "Attente du démarrage des services..."
    sleep 10

    # Vérifier le statut des services
    status
}

# Arrêter les services
stop() {
    log_info "Arrêt des services..."
    docker-compose -f $COMPOSE_FILE down
    log_success "Services arrêtés"
}

# Redémarrer les services
restart() {
    log_info "Redémarrage des services..."
    stop
    start
}

# Reconstruire et redémarrer
rebuild() {
    log_info "Reconstruction et redémarrage des services..."
    stop
    build
    start
}

# Afficher les logs
logs() {
    docker-compose -f $COMPOSE_FILE logs -f
}

# Afficher le statut
status() {
    log_info "Statut des services:"
    docker-compose -f $COMPOSE_FILE ps

    echo
    log_info "Vérification de la santé des services..."

    # Vérifier le backend
    if curl -s http://localhost:5000/health > /dev/null; then
        log_success "Backend: ✅ Opérationnel (http://localhost:5000)"
    else
        log_error "Backend: ❌ Non accessible"
    fi

    # Vérifier le frontend
    if curl -s http://localhost > /dev/null; then
        log_success "Frontend: ✅ Opérationnel (http://localhost)"
    else
        log_error "Frontend: ❌ Non accessible"
    fi
}

# Nettoyer les données (ATTENTION: supprime la base de données)
clean() {
    log_warning "ATTENTION: Cette action va supprimer toutes les données!"
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Nettoyage des données..."
        stop
        sudo rm -rf data/*
        log_success "Données supprimées"
    else
        log_info "Nettoyage annulé"
    fi
}

# Sauvegarder la base de données
backup() {
    log_info "Sauvegarde de la base de données..."

    if [ ! -f data/database.sqlite ]; then
        log_error "Aucune base de données trouvée"
        exit 1
    fi

    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sqlite"
    cp data/database.sqlite "backups/$BACKUP_FILE"

    mkdir -p backups
    log_success "Base de données sauvegardée: backups/$BACKUP_FILE"
}

# Afficher l'aide
help() {
    echo "Script de déploiement One Piece Booster Game"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commandes disponibles:"
    echo "  start     - Démarrer les services"
    echo "  stop      - Arrêter les services"
    echo "  restart   - Redémarrer les services"
    echo "  rebuild   - Reconstruire et redémarrer les services"
    echo "  logs      - Afficher les logs en temps réel"
    echo "  status    - Afficher le statut des services"
    echo "  backup    - Sauvegarder la base de données"
    echo "  clean     - Nettoyer toutes les données (DANGER)"
    echo "  help      - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 start"
    echo "  $0 logs"
    echo "  $0 status"
}

# Main
main() {
    check_dependencies

    case "${1:-help}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        rebuild)
            rebuild
            ;;
        build)
            build
            ;;
        logs)
            logs
            ;;
        status)
            status
            ;;
        backup)
            backup
            ;;
        clean)
            clean
            ;;
        help|*)
            help
            ;;
    esac
}

main "$@"