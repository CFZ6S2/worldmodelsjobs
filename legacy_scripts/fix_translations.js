const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, 'n8n', 'active', 'worldmodels_fixed_v5.json'),
  path.join(__dirname, 'n8n', 'active', 'workflow_active.json'),
  path.join(__dirname, 'n8n', 'active', 'vps_buggy_safe.json')
];

for (const file of targetFiles) {
  if (!fs.existsSync(file)) {
    console.log(`Skipping missing file: ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.log(`Skipping file with invalid JSON: ${path.basename(file)}`);
    continue;
  }
  
  let modified = false;
  
  const workflows = Array.isArray(data) ? data : (data.nodes ? [data] : []);
  
  for (const wf of workflows) {
    if (!wf.nodes) continue;
    
    for (const node of wf.nodes) {
      if (node.name.startsWith('IA Extract') && node.parameters && node.parameters.text) {
        let text = node.parameters.text;
        if (!text.includes('"text_en"')) {
          text = text.replace(
            /"title_es": "Short descriptive title",\n  "text_es": "Clean and translated text",/g,
            `"title_es": "Short descriptive title",
  "text_es": "Clean and translated text",
  "title_en": "Short descriptive title in English",
  "text_en": "Clean and translated text in English",
  "title_ru": "Short descriptive title in Russian",
  "text_ru": "Clean and translated text in Russian",
  "title_pt": "Short descriptive title in Portuguese",
  "text_pt": "Clean and translated text in Portuguese",`
          );
          node.parameters.text = text;
          modified = true;
          console.log(`Patched IA Extract in ${path.basename(file)}`);
        }
      }
      
      if (node.name.startsWith('Parse JSON') && node.parameters && node.parameters.jsCode) {
        let code = node.parameters.jsCode;
        if (!code.includes('text_en')) {
          code = code.replace(
            /text_es: parsed\.text_es \|\| input\.texto_limpio \|\| lowerRaw \|\| "Sin descripción",\n\s*title_es: parsed\.title_es \|\| \(lowerRaw \? lowerRaw\.substring\(0, 40\) : "Nuevo Lead"\),/,
            `text_es: parsed.text_es || input.texto_limpio || lowerRaw || "Sin descripción",
  title_es: parsed.title_es || (lowerRaw ? lowerRaw.substring(0, 40) : "Nuevo Lead"),
  text_en: parsed.text_en || "",
  title_en: parsed.title_en || "",
  text_ru: parsed.text_ru || "",
  title_ru: parsed.title_ru || "",
  text_pt: parsed.text_pt || "",
  title_pt: parsed.title_pt || "",`
          );
          node.parameters.jsCode = code;
          modified = true;
          console.log(`Patched Parse JSON in ${path.basename(file)}`);
        }
      }
      
      if (node.name.startsWith('Message Router') && node.parameters && node.parameters.jsCode) {
        let code = node.parameters.jsCode;
        if (code.includes('const langs = [') && !code.includes("code: 'EN'")) {
          const oldLangsRegex = /const langs = \[\s*\{\s*code:\s*'ES'[^\}]+(?:\}\s*,\s*\{\s*code:\s*'PT_CLIENT'[^\}]+\})?\s*\}\s*\];/s;
          const newLangs = `const langs = [
  { code: 'ES', tg: '-5283488138', wa: '120363425790792660@g.us', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' },
  { code: 'EN', tg: '-1003757267210', wa: '120363408216646972@g.us', title: item.title_en || item.title_es || 'New Lead', text: item.text_en || item.text_es || item.texto_limpio, tag: 'Sender' },
  { code: 'RU', tg: '-1003920309636', wa: '120363408298375271@g.us', title: item.title_ru || item.title_es || 'Новый Лид', text: item.text_ru || item.text_es || item.texto_limpio, tag: 'Отправитель' },
  { code: 'PT', tg: '-1003727383883', wa: '120363426262586004@g.us', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' }
];`;
          const splitCode = code.split(/const langs = \[.*?\];/s);
          if (splitCode.length === 2) {
             code = splitCode[0] + newLangs + splitCode[1];
             node.parameters.jsCode = code;
             modified = true;
             console.log(`Patched Message Router in ${path.basename(file)}`);
          }
        }
      }

      if (node.name === 'Post Backend' && node.parameters && node.parameters.jsonBody) {
        let body = node.parameters.jsonBody;
        if (!body.includes('text_en')) {
           body = body.replace(
             /"text_es":\s*\$json\.text_es,\s*"title_es":\s*\$json\.title_es/,
             `"text_es": $json.text_es,
  "title_es": $json.title_es,
  "text_en": $json.text_en,
  "title_en": $json.title_en,
  "text_ru": $json.text_ru,
  "title_ru": $json.title_ru,
  "text_pt": $json.text_pt,
  "title_pt": $json.title_pt`
           );
           node.parameters.jsonBody = body;
           modified = true;
           console.log(`Patched Post Backend in ${path.basename(file)}`);
        }
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`Saved changes to ${file}`);
  }
}
