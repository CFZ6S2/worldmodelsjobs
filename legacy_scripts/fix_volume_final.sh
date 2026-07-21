#!/bin/bash
cd /root/worldmodels-jobs

# Update docker-compose.yml to define the volume with its exact external name
python3 - <<'PY'
import yaml
with open('docker-compose.yml', 'r') as f:
    content = f.read()

# Replace telegram_sessions definition to use the exact external volume name
if "telegram_sessions:" in content:
    # Remove existing telegram_sessions: block
    import re
    content = re.sub(r'  telegram_sessions:.*(?:\n    .*)*', 
                     '  telegram_sessions:\n    name: worldmodels-jobs_telegram_sessions\n    external: true', 
                     content)
else:
    if "volumes:" in content:
        content = content.replace("  n8n_data:", "  n8n_data:\n  telegram_sessions:\n    name: worldmodels-jobs_telegram_sessions\n    external: true")

with open('docker-compose.yml', 'w') as f:
    f.write(content)
print("docker-compose.yml updated with exact external volume name")
PY

# Rebuild and restart
docker compose up -d --build telegram-collector
docker compose logs -n 40 telegram-collector
