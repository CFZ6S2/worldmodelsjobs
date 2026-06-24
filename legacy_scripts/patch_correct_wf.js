const fs = require('fs');

const content = fs.readFileSync('./scratch/vps_all_workflows_backup.json', 'utf16le');
const data = JSON.parse(content.trim());

const latestWf = data.find(w => w.id === 'A0QpoDzX559wzRXQ');

let modified = false;

for (const node of latestWf.nodes) {
  // 1. Update IA Extract
  if (node.name.startsWith('IA Extract') && node.parameters && node.parameters.text) {
    let text = node.parameters.text;
    if (!text.includes('"text_en"')) {
      text = text.replace(
        /"title_es": "Short descriptive title",\n\s*"text_es": "Clean and translated text",/g,
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
      console.log(`Patched IA Extract`);
    }
  }
  
  // 2. Update Parse JSON
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
      // Older variant
      code = code.replace(
        /text_es: parsed\.text_es \|\| input\.texto_limpio \|\| "Sin descripcin",\n\s*title_es: parsed\.title_es \|\| \(input\.texto_limpio \? input\.texto_limpio\.substring\(0, 40\) : "Nuevo Lead"\),/,
        `text_es: parsed.text_es || input.texto_limpio || "Sin descripción",
  title_es: parsed.title_es || (input.texto_limpio ? input.texto_limpio.substring(0, 40) : "Nuevo Lead"),
  text_en: parsed.text_en || "",
  title_en: parsed.title_en || "",
  text_ru: parsed.text_ru || "",
  title_ru: parsed.title_ru || "",
  text_pt: parsed.text_pt || "",
  title_pt: parsed.title_pt || "",`
      );
      node.parameters.jsCode = code;
      modified = true;
      console.log(`Patched Parse JSON`);
    }
  }
  
  // 3. Update Message Router
  if (node.name.startsWith('Message Router') && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    if (code.includes('const langs = [') && !code.includes("code: 'EN'")) {
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
         console.log(`Patched Message Router`);
      }
    }
  }

  // 4. Update Post Backend
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
       console.log(`Patched Post Backend`);
    }
  }

  // 5. Remove Ibiza numbers from Dynamic Routing Engine
  if (node.name.startsWith('Dynamic Routing Engine') && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    const originalCode = code;
    code = code.replace(
      /"ibiza":\s*\{\s*keywords:\s*\[[^\]]+\],\s*targets:\s*\[[\s\S]*?\]\s*\}/,
      `"ibiza": {
    keywords: ["ibiza", "eivissa", "mansour", "pacha", "lio", "ushuaia", "sant antoni"],
    targets: []
  }`
    );
    if (code !== originalCode) {
      node.parameters.jsCode = code;
      modified = true;
      console.log(`Removed Ibiza target numbers`);
    }
  }
}

fs.writeFileSync('./scratch/patched_latest.json', JSON.stringify(latestWf, null, 2));
console.log(`Saved changes to patched_latest.json`);
