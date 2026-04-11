#!/bin/bash
DB="/root/.n8n/database.sqlite"
echo "Deactivating all workflows..."
sqlite3 $DB "UPDATE workflow_entity SET active = 0;"
echo "Activating DeepSeek V7 Elite & Master..."
sqlite3 $DB "UPDATE workflow_entity SET active = 1 WHERE name IN ('WorldModels_Elite_System_V7_Brain', 'WorldModelsJobs - Master V7');"
echo "Restarting n8n services..."
pm2 restart n8n
echo "DEPLOYMENT SUCCESS: DeepSeek V7 is now LIVE."
