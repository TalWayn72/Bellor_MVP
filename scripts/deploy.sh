#!/bin/bash
# ================================================
# Bellor MVP - Universal Deployment Script
# ================================================
# Works on any cloud provider with Docker or Kubernetes
#
# Usage:
#   ./scripts/deploy.sh docker [dev|prod]
#   ./scripts/deploy.sh k8s [dev|prod]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check requirements
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_info "Docker found: $(docker --version)"
}

check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    log_info "kubectl found: $(kubectl version --client --short 2>/dev/null)"
}

# Docker Compose Deployment
deploy_docker() {
    local ENV=$1
    log_info "Deploying with Docker Compose (${ENV})"

    check_docker

    # Select compose file
    if [ "$ENV" = "prod" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_FILE=".env.production"
    else
        COMPOSE_FILE="docker-compose.yml"
        ENV_FILE=".env.development"
    fi

    # Check env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found!"
        log_info "Create it from .env.example"
        exit 1
    fi

    log_info "Using compose file: $COMPOSE_FILE"
    log_info "Using env file: $ENV_FILE"

    # Pull latest images
    log_info "Pulling latest images..."
    docker compose -f $COMPOSE_FILE pull

    # Stop old containers
    log_info "Stopping old containers..."
    docker compose -f $COMPOSE_FILE down

    # Start new containers
    log_info "Starting new containers..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

    # Show status
    log_info "Deployment complete!"
    docker compose -f $COMPOSE_FILE ps

    log_info "Check logs with: docker compose -f $COMPOSE_FILE logs -f"
}

# Kubernetes Deployment
deploy_k8s() {
    local ENV=$1
    log_info "Deploying to Kubernetes (${ENV})"

    check_kubectl

    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    log_info "Connected to cluster: $(kubectl config current-context)"

    # Create namespace if not exists
    kubectl create namespace bellor --dry-run=client -o yaml | kubectl apply -f -

    # Apply secrets (should be created separately)
    if [ ! -f "infrastructure/kubernetes/secrets.yaml" ]; then
        log_warn "secrets.yaml not found. Create it from secrets.yaml.example"
        log_warn "Skipping secrets creation..."
    else
        log_info "Applying secrets..."
        kubectl apply -f infrastructure/kubernetes/secrets.yaml
    fi

    # Apply all manifests
    log_info "Applying Kubernetes manifests..."
    kubectl apply -f infrastructure/kubernetes/namespace.yaml
    kubectl apply -f infrastructure/kubernetes/api-deployment.yaml
    kubectl apply -f infrastructure/kubernetes/web-deployment.yaml
    kubectl apply -f infrastructure/kubernetes/ingress.yaml

    # Wait for rollout
    log_info "Waiting for rollout to complete..."
    kubectl rollout status deployment/bellor-api -n bellor --timeout=5m
    kubectl rollout status deployment/bellor-web -n bellor --timeout=5m

    # Show status
    log_info "Deployment complete!"
    kubectl get pods -n bellor
    kubectl get svc -n bellor
    kubectl get ingress -n bellor

    log_info "Check logs with: kubectl logs -f deployment/bellor-api -n bellor"
}

# Main
if [ $# -lt 1 ]; then
    echo "Usage: $0 [docker|k8s] [dev|prod]"
    echo ""
    echo "Examples:"
    echo "  $0 docker dev    # Deploy with Docker Compose (development)"
    echo "  $0 docker prod   # Deploy with Docker Compose (production)"
    echo "  $0 k8s prod      # Deploy to Kubernetes (production)"
    exit 1
fi

DEPLOY_TYPE=$1
ENV=${2:-prod}

case $DEPLOY_TYPE in
    docker)
        deploy_docker $ENV
        ;;
    k8s)
        deploy_k8s $ENV
        ;;
    *)
        log_error "Unknown deployment type: $DEPLOY_TYPE"
        echo "Use 'docker' or 'k8s'"
        exit 1
        ;;
esac
