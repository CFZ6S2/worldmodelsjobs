import sqlite3
c = sqlite3.connect('/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite')
c.execute("UPDATE workflow_entity SET active=1 WHERE id='A0QpoDzX559wzRXQ'")
c.commit()
print("Workflow reactivated in DB")
