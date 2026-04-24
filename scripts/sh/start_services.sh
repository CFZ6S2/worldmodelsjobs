#!/bin/bash
set -e

# Production Environment Variables
export MEDIA_DIR=/var/www/whatsapp_media
export MEDIA_BASE_URL=http://178.156.186.149/media/
export QUEUE_DIR=/root/whatsapp_bot/queue
export N8N_WEBHOOK_URL=http://178.156.186.149/webhook/euromodel/inbound
export N8N_MODE=prod
export API_PORT=3000
export JOBS_API_PORT=3100
export ADS_JSON_PATH=/var/www/worldmodelsjobs/ads.json
export N8N_HOST=0.0.0.0
export N8N_PORT=5678
export N8N_PROTOCOL=http

# Telegram Credentials (ensure these are set in the shell before running or in a .env file)
# export TELEGRAM_API_ID=xxx
# export TELEGRAM_API_HASH=xxx

mkdir -p /root/whatsapp_bot/queue
mkdir -p /var/www/whatsapp_media
mkdir -p /var/www/worldmodelsjobs
touch /var/www/worldmodelsjobs/ads.json
if [ ! -s /var/www/worldmodelsjobs/ads.json ]; then echo "[]" > /var/www/worldmodelsjobs/ads.json; fi

# Whatsapp Bot & Retry
pm2 delete euromodel-bot 2>/dev/null || true
pm2 delete euromodel-retry 2>/dev/null || true
pm2 start /root/whatsapp_bot/index.js --name euromodel-bot
pm2 start /root/whatsapp_bot/retry.js --name euromodel-retry --cron "*/5 * * * *" --no-autorestart

# Telegram Sniffer
pm2 delete tg-sniffer 2>/dev/null || true
if [ ! -z "$TELEGRAM_API_ID" ]; then
  pm2 start python3 --name "tg-sniffer" -- /root/telegram_sniffer/sniffer.py
fi

# Jobs Backend
pm2 delete wmjobs-api 2>/dev/null || true
pm2 start /root/whatsapp_bot/jobs_backend.js --name wmjobs-api

# n8n
pm2 delete n8n 2>/dev/null || true
pm2 start n8n --name n8n

pm2 save
pm2 status
