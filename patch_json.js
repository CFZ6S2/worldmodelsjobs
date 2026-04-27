const fs = require('fs');
const file = 'C:/Users/cesar/Documents/trae_projects/worldmodels/telegram_n8n_workflow.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.nodes.forEach(n => {
  if (n.name === 'Pre-IA Reject WA1') {
    n.parameters.jsCode = n.parameters.jsCode.replace('"москва", "питер"', '"москва", "питер", "девочки", "девушки", "море", "европу", "модель", "встречи", "встреч", "кастинг", "эскорт", "заработок", "тусовки", "выезд", "апартаменты"');
    n.parameters.jsCode = n.parameters.jsCode.replace('links >= 3', 'links >= 6');
  }
  if (n.name === 'Post-Parse Guard') {
    n.parameters.jsCode = n.parameters.jsCode.replace('"vacantes"', '"vacantes", "девочки", "девушки", "море", "европу", "модель", "встречи", "встреч", "кастинг", "эскорт", "заработок", "тусовки", "выезд", "апартаменты"');
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('JSON updated successfully!');
