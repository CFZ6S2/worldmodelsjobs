#!/bin/bash
cd /root/worldmodels-jobs

# Update docker-compose.yml to define and mount the volume correctly
python3 - <<'PY'
import yaml
with open('docker-compose.yml', 'r') as f:
    content = f.read()

# Fix volumes section: use telegram_sessions without external: true
# so it maps to worldmodels-jobs_telegram_sessions
if "telegram_sessions:" not in content:
    if "volumes:" in content:
        content = content.replace("  n8n_data:", "  n8n_data:\n  telegram_sessions:")
    else:
        content += "\nvolumes:\n  n8n_data:\n  telegram_sessions:"

# Ensure external: true is REMOVED if it was added incorrectly
content = content.replace("  telegram_sessions:\n    external: true", "  telegram_sessions:")

with open('docker-compose.yml', 'w') as f:
    f.write(content)
print("docker-compose.yml updated with correct volume definition")
PY

# Rebuild and restart
docker compose up -d --build telegram-collector
docker compose logs -n 40 telegram-collector
