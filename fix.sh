#!/bin/bash
VPATH=/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data
docker stop n8n
sqlite3 $VPATH/database.sqlite "UPDATE project SET creatorId = '724a333b-388e-41cf-ac85-549aeb320007';"
docker start n8n
echo 'Waiting 15s for n8n to start...'
sleep 15
docker exec -u node n8n n8n import:workflow --input=/home/node/.n8n/workflow_to_import.json
echo 'Done!'
