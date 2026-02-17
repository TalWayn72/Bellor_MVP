#!/bin/bash
# Bellor Server Watchdog - OOM Prevention & Auto-Recovery
# Install: crontab -e → */5 * * * * /opt/bellor/scripts/server-watchdog.sh >> /var/log/bellor-watchdog.log 2>&1

LOG_PREFIX="[bellor-watchdog $(date '+%Y-%m-%d %H:%M:%S')]"
MEM_THRESHOLD=90  # Restart PM2 if memory usage exceeds this %
API_URL="http://localhost:3000/health"
HEALTH_TIMEOUT=10

# Get memory usage percentage
MEM_USED=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')

echo "$LOG_PREFIX Memory usage: ${MEM_USED}%"

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
if [ "$MEM_USED" -gt "$MEM_THRESHOLD" ]; then
  echo "$LOG_PREFIX WARNING: Memory at ${MEM_USED}% (threshold: ${MEM_THRESHOLD}%)"

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
