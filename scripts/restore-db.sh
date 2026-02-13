#!/bin/bash
# ================================================
# Bellor MVP - Database Restore Script
# ================================================
# Usage: bash scripts/restore-db.sh [backup_file]
# If no file specified, uses the latest backup
# ================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/bellor/backups}"
CONTAINER_NAME="${DB_CONTAINER:-bellor-postgres}"
DB_USER="${POSTGRES_USER:-bellor}"
DB_NAME="${POSTGRES_DB:-bellor}"

BACKUP_FILE="${1:-}"

# If no file specified, use latest
if [ -z "${BACKUP_FILE}" ]; then
  BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/bellor_backup_*.sql.gz 2>/dev/null | head -1)
  if [ -z "${BACKUP_FILE}" ]; then
    echo "ERROR: No backup files found in ${BACKUP_DIR}"
    exit 1
  fi
  echo "Using latest backup: ${BACKUP_FILE}"
fi

# Verify backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo ""
echo "=== Database Restore ==="
echo "File: ${BACKUP_FILE}"
echo "Size: ${BACKUP_SIZE}"
echo "Target: ${DB_NAME}@${CONTAINER_NAME}"
echo ""
echo "WARNING: This will OVERWRITE the current database!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[$(date)] Starting database restore..."

# Check container
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "ERROR: Container ${CONTAINER_NAME} is not running"
  exit 1
fi

# Restore from backup
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --single-transaction \
  --set ON_ERROR_STOP=on

echo "[$(date)] Database restore completed successfully"
echo ""
echo "Next steps:"
echo "  1. Verify data: docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c 'SELECT count(*) FROM \"User\"'"
echo "  2. Restart API: docker restart bellor-api"
