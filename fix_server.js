const fs = require('fs');
let code = fs.readFileSync('/root/worldmodels-jobs/server.js', 'utf8');

const commentedBlock = `/*
        const response = await axios.post('https://gate.whapi.cloud/messages/text', {
            to: targetChat,
            body: humanText
        }, {
            headers: { 'Authorization': \`Bearer \${JUANA_TOKEN}\` }
        });
        */`;

const uncommentedBlock = `const response = await axios.post('https://gate.whapi.cloud/messages/text', {
            to: targetChat,
            body: humanText
        }, {
            headers: { 'Authorization': \`Bearer \${JUANA_TOKEN}\` }
        });`;

code = code.replace(commentedBlock, uncommentedBlock);
code = code.replace('res.json({ success: true, message: "WhatsApp send disabled by admin", skipped: true });', '// res.json({ success: true, message: "WhatsApp send disabled by admin", skipped: true });');
code = code.replace('// res.json(response.data);', 'res.json(response.data);');

fs.writeFileSync('/root/worldmodels-jobs/server.js', code);
console.log('Fixed server.js');
