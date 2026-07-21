#!/bin/bash
cd /root/worldmodels-jobs

python3 - <<'PY'
import yaml

with open('docker-compose.yml', 'r') as f:
    # use a simple string replacement so we don't mess up yaml formatting
    content = f.read()

if "TELEGRAM_TARGET_CHAT_IDS" not in content:
    content = content.replace("- TELEGRAM_API_HASH=${TELEGRAM_API_HASH}",
                              "- TELEGRAM_API_HASH=${TELEGRAM_API_HASH}\n      - TELEGRAM_TARGET_CHAT_IDS=${TELEGRAM_TARGET_CHAT_IDS}\n      - TELEGRAM_BANNED_USERNAMES=${TELEGRAM_BANNED_USERNAMES}")
    with open('docker-compose.yml', 'w') as f:
        f.write(content)
    print("docker-compose.yml patched")
PY

docker compose up -d telegram-collector
docker compose exec -T telegram-collector sh -lc 'echo "$TELEGRAM_TARGET_CHAT_IDS"'
