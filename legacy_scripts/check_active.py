import sqlite3
c = sqlite3.connect('/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite').cursor()
c.execute("SELECT active FROM workflow_entity WHERE id='A0QpoDzX559wzRXQ'")
print('active:', c.fetchone()[0])
