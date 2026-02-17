#!/bin/bash
# Bellor Server Watchdog - OOM Prevention & Auto-Recovery
# Install: crontab -e → */5 * * * * /opt/bellor/scripts/server-watchdog.sh >> /var/log/bellor-watchdog.log 2>&1

LOG_PREFIX="[bellor-watchdog $(date '+%Y-%m-%d %H:%M:%S')]"
MEM_THRESHOLD=90  # Restart PM2 if memory usage exceeds this %
API_URL="http://localhost:3000/health"
HEALTH_TIMEOUT=10
RESTART_COUNT_FILE="/tmp/bellor-restart-count"
PM2_LOG_MAX_SIZE=10485760  # 10MB

# Get memory usage percentage
MEM_USED=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')

# Get swap usage percentage (0 if no swap)
SWAP_USED=$(free | awk '/Swap:/ {if ($2 > 0) printf "%.0f", $3/$2 * 100; else print "0"}')

# Get disk usage percentage for root partition
DISK_USED=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')

echo "$LOG_PREFIX Memory: ${MEM_USED}% | Swap: ${SWAP_USED}% | Disk: ${DISK_USED}%"

# Disk space warning
if [ "$DISK_USED" -gt 90 ]; then
  echo "$LOG_PREFIX CRITICAL: Disk usage at ${DISK_USED}%! Cleaning old logs..."
  find /var/log -name "*.gz" -mtime +7 -delete 2>/dev/null
  journalctl --vacuum-time=3d 2>/dev/null
fi

# Truncate PM2 logs if too large
for logfile in /home/ubuntu/.pm2/logs/bellor-api-*.log; do
  if [ -f "$logfile" ]; then
    LOG_SIZE=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null || echo 0)
    if [ "$LOG_SIZE" -gt "$PM2_LOG_MAX_SIZE" ]; then
      echo "$LOG_PREFIX Truncating large log: $logfile ($(( LOG_SIZE / 1024 / 1024 ))MB)"
      tail -n 1000 "$logfile" > "${logfile}.tmp" && mv "${logfile}.tmp" "$logfile"
    fi
  fi
done

# Track restart count (prevent restart loops)
track_restart() {
  local now=$(date +%s)
  echo "$now" >> "$RESTART_COUNT_FILE"
  # Keep only entries from last 15 minutes
  if [ -f "$RESTART_COUNT_FILE" ]; then
    local cutoff=$((now - 900))
    awk -v cutoff="$cutoff" '$1 > cutoff' "$RESTART_COUNT_FILE" > "${RESTART_COUNT_FILE}.tmp"
    mv "${RESTART_COUNT_FILE}.tmp" "$RESTART_COUNT_FILE"
    local count=$(wc -l < "$RESTART_COUNT_FILE")
    if [ "$count" -gt 3 ]; then
      echo "$LOG_PREFIX CRITICAL: ${count} restarts in 15 minutes - possible crash loop!"
    fi
  fi
}

# Check if PM2 bellor-api is running
PM2_STATUS=$(pm2 jlist 2>/dev/null | node -e "
  const d=require('fs').readFileSync('/dev/stdin','utf8');
  try{const a=JSON.parse(d);const p=a.find(x=>x.name==='bellor-api');
  console.log(p?p.pm2_env.status:'missing')}catch{console.log('error')}
" 2>/dev/null)

echo "$LOG_PREFIX PM2 status: ${PM2_STATUS}"

# Auto-restart if PM2 process is not online
if [ "$PM2_STATUS" != "online" ]; then
  echo "$LOG_PREFIX WARNING: bellor-api is not online (${PM2_STATUS}). Restarting..."
  track_restart
  cd /opt/bellor && pm2 start ecosystem.config.cjs --update-env 2>&1
  sleep 5
  echo "$LOG_PREFIX Restart completed."
fi

# Health check
HEALTH=$(curl -s -m $HEALTH_TIMEOUT $API_URL 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "$LOG_PREFIX Health: OK"
else
  echo "$LOG_PREFIX WARNING: Health check failed. Response: ${HEALTH:-timeout}"
  echo "$LOG_PREFIX Restarting bellor-api..."
  track_restart
  pm2 restart bellor-api 2>&1
  sleep 5
  # Retry health check
  HEALTH2=$(curl -s -m $HEALTH_TIMEOUT $API_URL 2>/dev/null)
  if echo "$HEALTH2" | grep -q '"status":"ok"'; then
    echo "$LOG_PREFIX Health restored after restart."
  else
    echo "$LOG_PREFIX CRITICAL: Health still failing after restart."
  fi
fi

# Memory pressure relief
if [ "$MEM_USED" -gt "$MEM_THRESHOLD" ] || [ "$SWAP_USED" -gt 50 ]; then
  echo "$LOG_PREFIX WARNING: Memory at ${MEM_USED}% / Swap at ${SWAP_USED}% (threshold: ${MEM_THRESHOLD}%/50%)"

  # Clear system caches
  sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null

  # Clear PM2 logs (can grow large)
  pm2 flush 2>/dev/null

  # Clear temp files older than 1 day
  find /tmp -type f -mtime +1 -delete 2>/dev/null

  MEM_AFTER=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
  echo "$LOG_PREFIX Memory after cleanup: ${MEM_AFTER}%"

  # If still critical (>95%), restart PM2 to free memory
  if [ "$MEM_AFTER" -gt 95 ]; then
    echo "$LOG_PREFIX CRITICAL: Memory still at ${MEM_AFTER}%. Restarting PM2..."
    track_restart
    pm2 restart bellor-api 2>&1
  fi
fi

# Check Docker containers
for container in bellor-postgres bellor-redis; do
  RUNNING=$(docker inspect -f '{{.State.Running}}' $container 2>/dev/null)
  if [ "$RUNNING" != "true" ]; then
    echo "$LOG_PREFIX WARNING: $container is not running. Starting..."
    docker start $container 2>&1
  fi
done

# Check nginx
if ! systemctl is-active --quiet nginx; then
  echo "$LOG_PREFIX WARNING: nginx is not running. Starting..."
  sudo systemctl start nginx 2>&1
fi
