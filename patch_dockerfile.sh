#!/bin/bash
cd /root/worldmodels-jobs

# Patch Dockerfile to include anon.session
python3 - <<'PY'
from pathlib import Path
p = Path("collectors/telegram/Dockerfile")
s = p.read_text(encoding="utf-8")
if "COPY anon.session ." not in s:
    s = s.replace("COPY telegram_collector.py .", "COPY telegram_collector.py .\nCOPY anon.session .")
    p.write_text(s, encoding="utf-8")
    print("Dockerfile patched to include anon.session")
PY

# Build and restart
docker compose up -d --build telegram-collector
docker compose restart telegram-collector
docker compose logs -n 40 telegram-collector
docker compose exec -T telegram-collector sh -lc 'echo "$TELEGRAM_TARGET_CHAT_IDS"'
