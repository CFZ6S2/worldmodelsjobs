const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));
const paths = Object.keys(swagger.paths).filter(p => p.includes('connect') || p.includes('pair') || p.includes('code'));
paths.forEach(p => {
    console.log(p);
    const methods = Object.keys(swagger.paths[p]);
    methods.forEach(m => {
        const op = swagger.paths[p][m];
        console.log(`  ${m.toUpperCase()} - params: ${JSON.stringify(op.parameters || [])}`);
    });
});
