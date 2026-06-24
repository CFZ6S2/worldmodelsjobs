const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('./scratch/final_v5_patched_fixed.json', 'utf8'));

let jsCode = '';
for (const node of wf.nodes) {
  if (node.name === 'Message Router') {
    jsCode = node.parameters.jsCode;
    break;
  }
}

// Mock N8N variables
const $input = {
  first: () => ({ json: { city: 'Москва', budget: '2000', category: 'evento', texto_limpio: 'hola' } })
};

try {
  const result = eval(`(function() { ${jsCode} })()`);
  console.log('SUCCESS:', result.length, 'items returned');
} catch (e) {
  console.error('ERROR:', e.message);
}
