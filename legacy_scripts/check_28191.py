import subprocess
DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
result = subprocess.run(['sqlite3', DB, "SELECT startedAt FROM execution_entity WHERE id=28191;"], capture_output=True, text=True)
print(result.stdout)
