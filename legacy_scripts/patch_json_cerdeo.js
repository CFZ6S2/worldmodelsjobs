const fs = require('fs');
const file = 'C:/Users/cesar/Documents/trae_projects/worldmodels/telegram_n8n_workflow.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.nodes.forEach(n => {
  if (n.name === 'Pre-IA Reject WA1') {
    // Add smut/indie keywords to HARD_BLOCK
    n.parameters.jsCode = n.parameters.jsCode.replace(
      '"broker"',
      '"broker", "инди", "контент", "koнтент", "предоплаты", "без предоплаты", "онлифанс", "onlyfans", "вирт", "кружочк", "сигны", "госпожа", "раб", "индивидуалка"'
    );
  }
  if (n.name === 'Post-Parse Guard') {
    // Add to NEGATIVE list
    n.parameters.jsCode = n.parameters.jsCode.replace(
      '"call center"',
      '"call center", "инди", "контент", "koнтент", "предоплаты", "онлифанс", "вирт", "кружочк"'
    );
  }
  if (n.name === 'DeepSeek IA Extraer') {
    // Update AI prompt to classify single escorts as trash
    n.parameters.text = n.parameters.text.replace(
      '- "trash": Only for generic spam, personal chats, unrelated products (crypto, electronics), or purely illegible junk.',
      '- "trash": Generic spam, personal chats, INDIVIDUAL ESCORTS PROMOTING THEMSELVES (e.g., "Indie", "selling content", "my price"), unrelated products, or purely illegible junk.'
    );
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('JSON cerdeo patch applied successfully!');
