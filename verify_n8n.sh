#!/bin/bash
echo "--- ALL WORKFLOWS ---"
n8n export:workflow --all > /tmp/check_all.json
grep -oE '"id":"[a-zA-Z0-9]{16}"|"name":"[^"]+"|"active":(true|false)' /tmp/check_all.json
echo "--- ENVIRONMENT ---"
env | grep N8N
echo "--- NGINX STATUS ---"
curl -s http://localhost:5678/healthz || echo "n8n not reachable on localhost:5678"
