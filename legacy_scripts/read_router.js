const { DataSource } = require('typeorm');
const ds = new DataSource({
    type: 'sqlite',
    database: '/home/node/.n8n/database.sqlite'
});

ds.initialize().then(async () => {
    const r = await ds.query("SELECT nodes FROM workflow_entity WHERE id='A0QpoDzX559wzRXQ'");
    const nodes = JSON.parse(r[0].nodes);
    const router = nodes.find(n => n.name === 'Message Router');
    console.log('=== MESSAGE ROUTER CODE ===');
    console.log(router.parameters.jsCode);
    console.log('===========================');
    await ds.destroy();
}).catch(e => {
    console.error(e.message);
    process.exit(1);
});
