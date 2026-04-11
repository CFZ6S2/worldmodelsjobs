# WhatsApp Collector Restoration Workflow

If the collector is restarting or failing with "stream error: conflict", there are likely ghost Node processes using the same session.

## Clean Up Orphan Processes
1. Stop all PM2 processes:
   `pm2 stop all`
2. Kill orphan Node instances:
   `killall -9 node`
3. Clear logs:
   `pm2 flush`

## Force-Activate Ingestion Workflow
Run the activation script if n8n is serving 404:
`sqlite3 /root/.n8n/database.sqlite "UPDATE workflow_entity SET active = 1 WHERE id = 'mpJxAxn2Y5qEAarU';"`

## Verify Ingestion
`curl -I http://localhost:5678/webhook/worldmodelsjobs-lead`
