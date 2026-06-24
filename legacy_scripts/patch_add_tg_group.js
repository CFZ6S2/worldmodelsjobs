const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

let msgRouter = wf.nodes.find(n => n.name === 'Message Router');
let msgCode = msgRouter.parameters.jsCode;

const oldMadridCode = `const madridRegex = /(madrid|barajas|serrano|pozuelo)/i;
if ((madridRegex.test(cityRaw) || madridRegex.test(textRaw)) && item.category === 'evento') {
  langs.push({ code: 'PT_CLIENT_MADRID', tg: '5479166354', wa: '5511953600828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}`;

const newMadridCode = `const madridRegex = /(madrid|barajas|serrano|pozuelo)/i;
if ((madridRegex.test(cityRaw) || madridRegex.test(textRaw)) && item.category === 'evento') {
  // Envía a la clienta brasileña privada
  langs.push({ code: 'PT_CLIENT_MADRID', tg: '5479166354', wa: '5511953600828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  // Envía al grupo compartido
  langs.push({ code: 'PT_GROUP_MADRID', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}`;

msgCode = msgCode.replace(oldMadridCode, newMadridCode);
msgRouter.parameters.jsCode = msgCode;

fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json updated with new Telegram group!");
