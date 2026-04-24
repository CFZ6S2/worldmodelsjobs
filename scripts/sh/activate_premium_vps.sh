#!/bin/bash
DB="/root/.n8n/database.sqlite"
sqlite3 $DB "UPDATE workflow_entity SET active = 0;"
sqlite3 $DB "UPDATE workflow_entity SET active = 1 WHERE name = 'WorldModelsJobs - Premium Final Fixed';"
echo "Nuevos flujos activos:"
sqlite3 $DB "SELECT id, name, active FROM workflow_entity WHERE active = 1;"
