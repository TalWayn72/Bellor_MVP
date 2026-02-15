#!/bin/bash
# ================================================
# Bellor MVP - Push & Deploy to Oracle Cloud Server
# ================================================
# Run from local machine after VM is ready
# Usage: bash scripts/push-to-server.sh [IP_ADDRESS]
# ================================================

set -euo pipefail

SSH_KEY="$HOME/.ssh/oracle_bellor"
SSH_USER="ubuntu"

# Get server IP from argument or saved file
if [ -n "${1:-}" ]; then
  SERVER_IP="$1"
elif [ -f "$HOME/.oci/server_ip.txt" ]; then
  SERVER_IP=$(cat "$HOME/.oci/server_ip.txt")
else
  echo "Usage: bash scripts/push-to-server.sh <SERVER_IP>"
  echo "Or save IP to ~/.oci/server_ip.txt"
  exit 1
fi

SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP"
SCP_CMD="scp -i $SSH_KEY -o StrictHostKeyChecking=no"

echo "=========================================="
echo " Bellor - Push to Server: $SERVER_IP"
echo "=========================================="

# Step 1: Test SSH connection
echo "[1/4] Testing SSH connection..."
$SSH_CMD "echo 'SSH connection OK'" || {
  echo "ERROR: Cannot connect to $SERVER_IP"
  echo "Wait a few minutes after VM creation, then retry."
  exit 1
}

# Step 2: Copy deploy script
echo "[2/4] Copying deployment script..."
$SCP_CMD scripts/deploy-oracle.sh "$SSH_USER@$SERVER_IP:/tmp/deploy-oracle.sh"

# Step 3: Run deployment
echo "[3/4] Running deployment on server..."
echo "  This will take 5-15 minutes (Docker build + DB setup)..."
$SSH_CMD "chmod +x /tmp/deploy-oracle.sh && bash /tmp/deploy-oracle.sh"

# Step 4: Verify
echo "[4/4] Verifying deployment..."
sleep 5
HEALTH=$(curl -s --connect-timeout 10 "http://$SERVER_IP:3000/health" 2>/dev/null || echo "FAILED")
echo ""
if echo "$HEALTH" | grep -qi "ok\|healthy\|alive"; then
  echo "=========================================="
  echo " DEPLOYMENT SUCCESSFUL!"
  echo "=========================================="
  echo ""
  echo " Frontend: http://$SERVER_IP"
  echo " API:      http://$SERVER_IP:3000"
  echo " Health:   http://$SERVER_IP:3000/health"
  echo ""
  echo " Next: Setup domain + SSL"
  echo "   sudo bash scripts/setup-ssl.sh YOUR_DOMAIN"
else
  echo "WARNING: Health check returned: $HEALTH"
  echo "SSH into server to debug:"
  echo "  ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
  echo "  cd /opt/bellor && docker compose -f docker-compose.oracle-free.yml logs"
fi
