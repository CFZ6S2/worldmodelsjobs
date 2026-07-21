docker exec n8n sqlite3 /home/node/.n8n/database.sqlite "SELECT id, name FROM workflow WHERE active = 1;"
