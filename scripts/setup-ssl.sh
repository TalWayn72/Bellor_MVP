#!/bin/bash
# ================================================
# Bellor MVP - SSL/TLS Setup Script (Let's Encrypt)
# ================================================
# Usage: sudo bash scripts/setup-ssl.sh <domain>
# Example: sudo bash scripts/setup-ssl.sh bellor.app
#
# Prerequisites:
# - Ubuntu 20.04+ on Oracle Cloud
# - Domain DNS pointing to server IP
# - Ports 80 and 443 open in security list
# ================================================

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-admin@${DOMAIN}}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
DOCKER_CERT_DIR="./infrastructure/docker/ssl"

if [ -z "$DOMAIN" ]; then
  echo "Usage: sudo bash scripts/setup-ssl.sh <domain> [email]"
  exit 1
fi

echo "=== Installing certbot ==="
apt-get update
apt-get install -y certbot

echo "=== Stopping containers to free port 80 ==="
docker compose down 2>/dev/null || true

echo "=== Obtaining SSL certificate for ${DOMAIN} ==="
certbot certonly --standalone \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  -d "api.${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --non-interactive

echo "=== Copying certificates to Docker directory ==="
mkdir -p "${DOCKER_CERT_DIR}"
cp "${CERT_DIR}/fullchain.pem" "${DOCKER_CERT_DIR}/fullchain.pem"
cp "${CERT_DIR}/privkey.pem" "${DOCKER_CERT_DIR}/privkey.pem"
chmod 600 "${DOCKER_CERT_DIR}"/*.pem

echo "=== Setting up auto-renewal ==="
# Create renewal hook script
cat > /etc/letsencrypt/renewal-hooks/deploy/bellor-reload.sh << 'HOOK'
#!/bin/bash
# Copy renewed certs and reload nginx
DOMAIN="$(ls /etc/letsencrypt/live/ | head -1)"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
DOCKER_CERT_DIR="/opt/bellor/infrastructure/docker/ssl"

cp "${CERT_DIR}/fullchain.pem" "${DOCKER_CERT_DIR}/fullchain.pem"
cp "${CERT_DIR}/privkey.pem" "${DOCKER_CERT_DIR}/privkey.pem"
chmod 600 "${DOCKER_CERT_DIR}"/*.pem

# Reload nginx without downtime
docker exec bellor-nginx nginx -s reload 2>/dev/null || true
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/bellor-reload.sh

# Test auto-renewal
certbot renew --dry-run

echo ""
echo "=== SSL Setup Complete ==="
echo "Certificate: ${CERT_DIR}/fullchain.pem"
echo "Private Key: ${CERT_DIR}/privkey.pem"
echo "Docker certs: ${DOCKER_CERT_DIR}/"
echo "Auto-renewal: Active (certbot timer)"
echo ""
echo "Next steps:"
echo "  1. Start containers: docker compose -f docker-compose.oracle-free.yml up -d"
echo "  2. Verify HTTPS: curl -I https://${DOMAIN}"
