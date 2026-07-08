#!/bin/bash
JUANA="http://localhost:3001/api/juana/send"
ADMIN_WA="34658034597@s.whatsapp.net"
ALERT_FILE="/tmp/wm_alert_sent"

DOWN=()

for proc in worldmodels-backend whapi-gateway tg-sniffer; do
  pm2 status "$proc" 2>/dev/null | grep -q "online" || DOWN+=("$proc")
done

docker ps --filter "name=n8n" --filter "status=running" 2>/dev/null | grep -q "n8n" || DOWN+=("n8n docker")

if [ ${#DOWN[@]} -gt 0 ]; then
  LAST=$(stat -c %Y "$ALERT_FILE" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  if [ ! -f "$ALERT_FILE" ] || [ $(( NOW - LAST )) -gt 3600 ]; then
    touch "$ALERT_FILE"
    SVCS=$(printf 'X %s' "${DOWN[@]}")
    BODY="WORLDMODELS ALERTA $(date '+%d/%m %H:%M UTC')\nServicios caidos:\n${SVCS//X /\n}⚠️ "
    curl -s -X POST "$JUANA" -H "Content-Type: application/json"       -d "{\"to\":\"$ADMIN_WA\",\"body\":\"$BODY\"}" > /dev/null 2>&1
  fi
else
  if [ -f "$ALERT_FILE" ]; then
    rm -f "$ALERT_FILE"
    BODY="WORLDMODELS OK - todos los servicios activos $(date '+%d/%m %H:%M UTC') ✅"
    curl -s -X POST "$JUANA" -H "Content-Type: application/json"       -d "{\"to\":\"$ADMIN_WA\",\"body\":\"$BODY\"}" > /dev/null 2>&1
  fi
fi
