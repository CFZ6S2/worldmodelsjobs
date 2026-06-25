# Stop all currently active workflows to ensure we don't have multiple conflicting ones
docker exec n8n n8n update:workflow --all --active=false

# Import the new fixed workflow
docker exec n8n n8n import:workflow --input=/tmp/final_v5_patched_fixed2.json

# Activate the specific workflow by ID
docker exec n8n n8n update:workflow --id=A0QpoDzX559wzRXQ --active=true
