import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
result = subprocess.run(['sqlite3', DB, "SELECT data FROM execution_data ORDER BY executionId DESC LIMIT 1;"], capture_output=True, text=True)
raw = result.stdout.strip()
if raw:
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            first = data[0]
            if 'resultData' in first:
                runData = first['resultData'].get('runData', {})
                print("runData keys:", runData.keys())
                for node_name, runs in runData.items():
                    if 'Telegram' in node_name:
                        print(f"Node: {node_name}")
                        for i, run in enumerate(runs):
                            print(f"  Run {i}: error={run.get('error')}, data={bool(run.get('data'))}")
    except Exception as e:
        print("Error parsing:", e)
