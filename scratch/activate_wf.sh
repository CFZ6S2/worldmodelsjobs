docker exec n8n sqlite3 /home/node/.n8n/database.sqlite "UPDATE workflow_entity SET active=1 WHERE id='A0QpoDzX559wzRXQ';"
echo "Workflow activated"
