#!/bin/bash
n8n export:workflow --all > /tmp/all_wf.json

# Extract unique IDs and deactivate them
ids=$(grep -oE '"id":"[a-zA-Z0-9]{16}"' /tmp/all_wf.json | cut -d'"' -f4 | sort -u)

for wf_id in $ids; do
  echo "Deactivating workflow: $wf_id"
  n8n update:workflow --active=false --id="$wf_id"
done

echo "Importing finalized workflow V3..."
n8n import:workflow --input=/tmp/clean_v3.json > /tmp/res.txt
new_id=$(grep -oE '[a-zA-Z0-9]{16}' /tmp/res.txt | tail -n 1)

if [ -n "$new_id" ]; then
  echo "Activating new production workflow: $new_id"
  n8n update:workflow --active=true --id="$new_id"
  echo "Restarting services via PM2..."
  pm2 restart n8n
  echo "Activation complete."
else
  echo "Error: Could not identify new workflow ID from import logs."
  cat /tmp/res.txt
fi
