const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/root/.n8n/database.sqlite');

db.all("SELECT id, name, active FROM workflow_entity WHERE active=1;", (err, rows) => {
    if (err) throw err;
    console.log("ACTIVE WORKFLOWS:");
    console.table(rows);
    
    db.get("SELECT nodes FROM workflow_entity WHERE id = 'NO7NLZ5Kccp6jrOS';", (err, row) => {
        if (err) throw err;
        if(row) {
            const nodes = JSON.parse(row.nodes);
            const webhooks = nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
            console.log("OLD WORKFLOW WEBHOOKS:");
            webhooks.forEach(w => console.log(w.name, w.parameters.path));
        }
    });

    db.get("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ';", (err, row) => {
        if (err) throw err;
        if(row) {
            const nodes = JSON.parse(row.nodes);
            const webhooks = nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
            console.log("NEW WORKFLOW WEBHOOKS:");
            webhooks.forEach(w => console.log(w.name, w.parameters.path));
        }
    });
});
