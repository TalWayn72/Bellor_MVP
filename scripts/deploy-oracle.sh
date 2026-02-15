#!/bin/bash
# ================================================
# Bellor MVP - Oracle Cloud Free Tier Deploy Script
# ================================================
# Run on the Oracle Cloud ARM A1 VM (Ubuntu 24.04)
# Usage: bash deploy-oracle.sh
#
# Prerequisites:
# - Ubuntu 24.04 ARM64 (Oracle Cloud Free Tier)
# - SSH access to the VM
# - Git repository: https://github.com/TalWayn72/Bellor_MVP.git
# ================================================

set -euo pipefail

# ============= Configuration =============
APP_DIR="/opt/bellor"
REPO_URL="https://github.com/TalWayn72/Bellor_MVP.git"
BRANCH="master"
COMPOSE_FILE="docker-compose.oracle-free.yml"
ENV_FILE=".env.production"

echo "=========================================="
echo " Bellor MVP - Oracle Cloud Deployment"
echo "=========================================="
echo ""

# ============= Step 1: System Update =============
echo "[1/8] Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ============= Step 2: Install Docker =============
echo "[2/8] Installing Docker..."
if command -v docker &>/dev/null; then
  echo "  Docker already installed: $(docker --version)"
else
  # Install Docker using official script
  curl -fsSL https://get.docker.com | sudo sh

  # Add current user to docker group
  sudo usermod -aG docker "$USER"

  echo "  Docker installed: $(docker --version)"
fi

# Ensure Docker is running
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose plugin if missing
if ! docker compose version &>/dev/null; then
  echo "  Installing Docker Compose plugin..."
  sudo apt-get install -y -qq docker-compose-plugin
fi
echo "  Docker Compose: $(docker compose version)"

# ============= Step 3: Install Git =============
echo "[3/8] Ensuring Git is installed..."
if ! command -v git &>/dev/null; then
  sudo apt-get install -y -qq git
fi
echo "  Git: $(git --version)"

# ============= Step 4: Clone Repository =============
echo "[4/8] Setting up application directory..."
if [ -d "$APP_DIR" ]; then
  echo "  Directory exists, pulling latest..."
  cd "$APP_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"
else
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER:$USER" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
  git checkout "$BRANCH"
fi
echo "  Repository ready at $APP_DIR"

# ============= Step 5: Configure Environment =============
echo "[5/8] Setting up environment..."
if [ ! -f "$APP_DIR/$ENV_FILE" ]; then
  echo ""
  echo "  Creating environment file..."
  echo "  Generating secure passwords and secrets..."

  # Generate secure random strings
  JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
  JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
  PG_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)

  # Get server public IP
  SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_SERVER_IP")

  cat > "$APP_DIR/$ENV_FILE" << ENVEOF
# ================================================
# Bellor MVP - Production Environment
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ================================================

# App
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://bellor:${PG_PASSWORD}@postgres:5432/bellor
POSTGRES_USER=bellor
POSTGRES_PASSWORD=${PG_PASSWORD}
POSTGRES_DB=bellor

# Redis
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT (auto-generated secure secrets)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (update after setting up domain)
FRONTEND_URL=http://${SERVER_IP}
VITE_API_URL=http://${SERVER_IP}:3000
VITE_WS_URL=ws://${SERVER_IP}:3000

# Storage (Cloudflare R2 - configure later)
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=bellor-media
CDN_URL=
VITE_CDN_URL=

# Email (SendGrid - configure later)
SENDGRID_API_KEY=

# Google OAuth (configure later)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ENVEOF

  chmod 600 "$APP_DIR/$ENV_FILE"
  echo "  Environment file created: $APP_DIR/$ENV_FILE"
  echo "  Server IP detected: $SERVER_IP"
  echo ""
  echo "  IMPORTANT: Edit $ENV_FILE to add:"
  echo "    - R2 storage credentials"
  echo "    - SendGrid API key"
  echo "    - Google OAuth credentials"
  echo "    - Update FRONTEND_URL when domain is ready"
else
  echo "  Environment file already exists"
fi

# ============= Step 6: Configure Firewall =============
echo "[6/8] Configuring firewall (iptables)..."

# Oracle Cloud Ubuntu images have iptables rules blocking traffic
# Must open ports at OS level (in addition to VCN security lists)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true

# Persist iptables rules
sudo sh -c 'iptables-save > /etc/iptables/rules.v4' 2>/dev/null || {
  sudo apt-get install -y -qq iptables-persistent
  sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
}
echo "  Firewall configured (ports 80, 443, 3000)"

# ============= Step 7: Setup Backup Cron =============
echo "[7/8] Setting up daily database backup..."
mkdir -p /opt/bellor/backups

# Add cron job for daily backup at 3 AM
CRON_JOB="0 3 * * * /opt/bellor/scripts/backup-db.sh >> /var/log/bellor-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "backup-db.sh"; echo "$CRON_JOB") | crontab -
echo "  Daily backup scheduled at 03:00 AM"

# ============= Step 8: Build & Deploy =============
echo "[8/8] Building and deploying containers..."
cd "$APP_DIR"

# Build Docker images
echo "  Building Docker images (this may take 5-10 minutes)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache

# Start containers
echo "  Starting containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for PostgreSQL to be ready
echo "  Waiting for PostgreSQL..."
sleep 10
for i in $(seq 1 30); do
  if docker exec bellor-postgres pg_isready -U bellor &>/dev/null; then
    echo "  PostgreSQL is ready"
    break
  fi
  sleep 2
done

# Run Prisma migrations
echo "  Running database migrations..."
docker exec bellor-api npx prisma migrate deploy 2>/dev/null || {
  echo "  Note: Migrations may need manual run if schema is fresh"
}

echo ""
echo "=========================================="
echo " Deployment Complete!"
echo "=========================================="
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

echo "Services:"
docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "Access:"
echo "  Frontend: http://${SERVER_IP}"
echo "  API:      http://${SERVER_IP}:3000"
echo "  Health:   http://${SERVER_IP}:3000/health"
echo ""
echo "Next steps:"
echo "  1. Verify: curl http://${SERVER_IP}:3000/health"
echo "  2. Configure domain DNS to point to ${SERVER_IP}"
echo "  3. Setup SSL: sudo bash scripts/setup-ssl.sh YOUR_DOMAIN"
echo "  4. Update .env.production with domain URLs"
echo "  5. Add R2/SendGrid/OAuth credentials to .env.production"
echo ""
echo "Useful commands:"
echo "  Logs:    docker compose -f $COMPOSE_FILE logs -f"
echo "  Status:  docker compose -f $COMPOSE_FILE ps"
echo "  Restart: docker compose -f $COMPOSE_FILE restart"
echo "  Stop:    docker compose -f $COMPOSE_FILE down"
echo "  Backup:  bash scripts/backup-db.sh"
echo "=========================================="
