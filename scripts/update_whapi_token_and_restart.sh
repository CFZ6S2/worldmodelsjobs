#!/bin/bash
# update_whapi_token_and_restart.sh
# Uso: ./update_whapi_token_and_restart.sh <WHAPI_TOKEN> [TARGET_NUMBER] [APP_DIR]
# Ejemplo: ./update_whapi_token_and_restart.sh shJOb5wskQMTyfoF20GLqmJOclA5if5j 34658034597@s.whatsapp.net /root/worldmodels-jobs
set -euo pipefail
TOKEN="$1"
TARGET_NUMBER="${2:-34658034597@s.whatsapp.net}"
APP_DIR="${3:-/root/worldmodels-jobs}"
ENV_FILE="$APP_DIR/.env"
TIMESTAMP=$(date +"%Y%m%dT%H%M%S")

echo "[INFO] Aplicando token en: $ENV_FILE"
if [ ! -d "$APP_DIR" ]; then
  echo "[ERROR] No existe el directorio $APP_DIR"
  exit 2
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "[WARN] .env no existe. Se creará uno nuevo en $ENV_FILE"
  touch "$ENV_FILE"
fi

cp "$ENV_FILE" "$ENV_FILE.bak.$TIMESTAMP"
echo "[INFO] Backup creado: $ENV_FILE.bak.$TIMESTAMP"

# Reemplaza o añade WHAPI_TOKEN
if grep -q '^WHAPI_TOKEN=' "$ENV_FILE"; then
  sed -i "s/^WHAPI_TOKEN=.*/WHAPI_TOKEN=$TOKEN/" "$ENV_FILE"
else
  echo "WHAPI_TOKEN=$TOKEN" >> "$ENV_FILE"
fi

# Reemplaza o añade JUANA_API_TOKEN (si aplica)
if grep -q '^JUANA_API_TOKEN=' "$ENV_FILE"; then
  sed -i "s/^JUANA_API_TOKEN=.*/JUANA_API_TOKEN=$TOKEN/" "$ENV_FILE" || true
else
  # no forzamos si no existe
  echo "JUANA_API_TOKEN=$TOKEN" >> "$ENV_FILE"
fi

echo "[INFO] Variables actualizadas en .env (no se hará commit)."

# Reiniciar PM2
if command -v pm2 >/dev/null 2>&1; then
  echo "[INFO] Reiniciando procesos pm2: whapi-gateway y server (si existen)"
  pm2 restart whapi-gateway || true
  pm2 restart server || true
  echo "[INFO] pm2 restart completado"
else
  echo "[WARN] pm2 no encontrado en PATH. Asegúrate de reiniciar los servicios manualmente."
fi

# Esperar un par de segundos para que arranquen
sleep 3

# Prueba de envío local
echo "[INFO] Probando envío local a $TARGET_NUMBER usando endpoint local (/api/juana/send)"
HTTP=$(curl -s -o /dev/stderr -w "%{http_code}" -X POST http://127.0.0.1:3001/api/juana/send -H "Content-Type: application/json" -d "{\"to\":\"$TARGET_NUMBER\",\"body\":\"TEST producción: re-vinculado desde script\"}") || true

echo "[INFO] Código HTTP de prueba: $HTTP"

# Mostrar último log breve
if command -v pm2 >/dev/null 2>&1; then
  echo "[INFO] Últimas 80 líneas de logs de whapi-gateway (si existe):"
  pm2 logs whapi-gateway --lines 80 --nostream || true
  echo "[INFO] Últimas 80 líneas de logs de server (si existe):"
  pm2 logs server --lines 80 --nostream || true
fi

echo "[DONE] Script finalizado. Si la prueba falló, pega los logs aquí para que lo revise."