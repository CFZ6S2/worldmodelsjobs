const fs = require('fs');
const path = 'worldmodels_n8n_v4_final.json';
const workflow = JSON.parse(fs.readFileSync(path, 'utf8'));

const preFilter = workflow.nodes.find(n => n.name === 'Pre-Filter Unified1');
let code = preFilter.parameters.jsCode;

// Bloquear cursos de inglés y temas relacionados
const newHardBlocks = ['ingles', 'english', 'course', 'curso', 'clases', 'clase', 'estudiar'];
newHardBlocks.forEach(word => {
  if (!code.includes(`"${word}"`)) {
    code = code.replace('"necesito ayuda"', `"necesito ayuda", "${word}"`);
  }
});

preFilter.parameters.jsCode = code;
fs.writeFileSync(path, JSON.stringify(workflow, null, 2));
