#!/bin/bash
# ================================================
# Bellor MVP - Database Backup Script
# ================================================
# Usage: bash scripts/backup-db.sh
# Cron:  0 3 * * * /opt/bellor/scripts/backup-db.sh >> /var/log/bellor-backup.log 2>&1
# ================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/bellor/backups}"
CONTAINER_NAME="${DB_CONTAINER:-bellor-postgres}"
DB_USER="${POSTGRES_USER:-bellor}"
DB_NAME="${POSTGRES_DB:-bellor}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bellor_backup_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting database backup..."

# Check if PostgreSQL container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[$(date)] ERROR: Container ${CONTAINER_NAME} is not running"
  exit 1
fi

# Create backup with compression
docker exec "${CONTAINER_NAME}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_FILE}"

# Verify backup file exists and has content
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "[$(date)] ERROR: Backup file is empty or was not created"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Remove old backups (keep last N days)
DELETED=$(find "${BACKUP_DIR}" -name "bellor_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -type f -print -delete | wc -l)
if [ "${DELETED}" -gt 0 ]; then
  echo "[$(date)] Cleaned up ${DELETED} old backup(s)"
fi

# Show remaining backups
TOTAL=$(find "${BACKUP_DIR}" -name "bellor_backup_*.sql.gz" -type f | wc -l)
echo "[$(date)] Backup complete. ${TOTAL} backup(s) stored in ${BACKUP_DIR}"
