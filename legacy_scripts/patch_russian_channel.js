const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('./scratch/final_v5_patched_fixed.json', 'utf8'));

for (const node of wf.nodes) {
  if (node.name === 'Message Router' && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    
    // Check if we haven't already added RU_CHANNEL
    if (!code.includes("code: 'RU_CHANNEL'")) {
      const ruLine = "{ code: 'RU', tg: '-1003920309636', wa: '120363408298375271@g.us', title: item.title_ru || item.title_es || 'Новый Лид', text: item.text_ru || item.text_es || item.texto_limpio, tag: 'Отправитель' },";
      
      const newLines = ruLine + "\n  { code: 'RU_CHANNEL', tg: '-1003934906353', title: item.title_ru || item.title_es || 'Новый Лид', text: item.text_ru || item.text_es || item.texto_limpio, tag: 'Отправитель' },";
      
      code = code.replace(ruLine, newLines);
      node.parameters.jsCode = code;
    }
  }
}

fs.writeFileSync('./scratch/final_v5_patched_fixed.json', JSON.stringify(wf, null, 2));
console.log('Saved final_v5_patched_fixed.json with RU_CHANNEL addition.');
