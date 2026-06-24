const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT id, name, active FROM workflow", [], (err, rows) => {
  if (err) {
    throw err;
  }
  rows.forEach((row) => {
    console.log(`${row.id} | ${row.name} | active: ${row.active}`);
  });
});

db.close();
