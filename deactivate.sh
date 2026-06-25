#!/bin/bash
sqlite3 /root/.n8n/database.sqlite "UPDATE workflow_entity SET active = 0 WHERE id != 'A0QpoDzX559wzRXQ';"
echo "Deactivated ghost workflows."
docker restart n8n
