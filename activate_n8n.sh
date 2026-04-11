#!/bin/bash
sqlite3 /root/.n8n/database.sqlite "UPDATE workflow_entity SET active = 1 WHERE name = 'Euromodel_Master_System_V3_Refined';"
pm2 restart n8n
