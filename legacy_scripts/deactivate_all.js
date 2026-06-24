const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/root/.n8n/database.sqlite');

db.run("UPDATE workflow_entity SET active = 0 WHERE id != 'A0QpoDzX559wzRXQ';", function(err) {
    if (err) throw err;
    console.log("Deactivated", this.changes, "ghost workflows.");
});
