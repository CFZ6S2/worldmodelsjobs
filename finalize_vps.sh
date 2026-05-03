#!/bin/bash
cd /root/worldmodels-jobs

# 1. Update telegram_collector.py to use /sessions/anon
python3 - <<'PY'
from pathlib import Path
p = Path("collectors/telegram/telegram_collector.py")
s = p.read_text(encoding="utf-8")
s = s.replace("session_path = '/app/anon'", "session_path = '/sessions/anon'")
p.write_text(s, encoding="utf-8")
print("telegram_collector.py updated to use /sessions/anon")
PY

# 2. Update docker-compose.yml to define and mount the volume
python3 - <<'PY'
import yaml
with open('docker-compose.yml', 'r') as f:
    content = f.read()

# Add volumes entry if not exists
if "telegram_sessions:" not in content:
    # Add to volumes section
    if "volumes:" in content:
        # Find the last line of volumes: or just append to the end of volumes block
        # Actually easier to just append at the very end if it's the last section
        if content.strip().endswith("n8n_data:"):
            content = content.rstrip() + "\n  telegram_sessions:\n    external: true\n"
        else:
            # Fallback string replace
            content = content.replace("  n8n_data:", "  n8n_data:\n  telegram_sessions:\n    external: true")

# Add volume mount to telegram-collector service
if "telegram_sessions:/sessions" not in content:
    # Find telegram-collector section
    insertion_point = "container_name: telegram-collector"
    replacement = insertion_point + "\n    volumes:\n      - telegram_sessions:/sessions"
    content = content.replace(insertion_point, replacement)

with open('docker-compose.yml', 'w') as f:
    f.write(content)
print("docker-compose.yml updated with volume mount")
PY

# 3. Remove COPY anon.session . from Dockerfile
python3 - <<'PY'
from pathlib import Path
p = Path("collectors/telegram/Dockerfile")
s = p.read_text(encoding="utf-8")
s = s.replace("COPY anon.session .", "")
p.write_text(s, encoding="utf-8")
print("Dockerfile cleaned up")
PY

# 4. Rebuild and restart
docker compose up -d --build telegram-collector
docker compose logs -n 40 telegram-collector
