import json

ROUTER_CODE = """const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138',    title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' },
  { code: 'RU', tg: '-1003920309636', title: item.title_es || 'Новый лид',  text: item.text_es || item.texto_limpio, tag: 'Источник'  }
];

const results = [];
for (const l of langs) {
  function formatContact(val, mode) {
    if (!val || val === 'Desconocido' || val === 'No disponible') return 'No disponible';
    if (String(val).startsWith('tg_id_')) {
      const id = val.replace('tg_id_', '');
      return mode === 'html' ? '<a href="tg://user?id='+id+'">Chat Directo</a>' : 'ID: '+id;
    }
    if (/[a-zA-Z]/.test(val) && !/\\d/.test(val)) {
      const user = String(val).replace('@', '');
      return mode === 'html' ? '<a href="https://t.me/'+user+'">@'+user+'</a>' : '@'+user;
    }
    const s = String(val).replace(/[^0-9]/g, '');
    return s.length >= 7 ? '+'+s : val;
  }

  const isRu = l.code === 'RU';
  const categoryStr = (item.category === 'plaza') ? (isRu ? 'Вакансии' : 'Plazas') : (isRu ? 'Мероприятия' : 'Eventos');
  const unkCity   = isRu ? 'Неизвестно'   : 'Desconocida';
  const unkBudget = isRu ? 'Договорная'   : 'Negociable';
  const noText    = isRu ? 'Нет описания' : 'Sin texto';
  const srcStr    = isRu ? 'Источник'     : 'Fuente';

  const tgContact = formatContact(item.contact || item.final_contact, 'html');
  const tgText =
    '<b>' + escapeHTML(l.title) + '</b>\\n' +
    '\\uD83C\\uDFF7\\uFE0F <b>' + categoryStr + '</b>\\n' +
    '\\uD83D\\uDCCD <b>' + escapeHTML(item.city || unkCity) + '</b>\\n' +
    '\\uD83D\\uDCB0 <b>' + escapeHTML(item.budget || unkBudget) + '</b>\\n\\n' +
    escapeHTML(l.text || noText) + '\\n\\n' +
    '\\uD83D\\uDC64 <b>' + l.tag + ':</b> ' + tgContact + '\\n' +
    '\\uD83D\\uDD0C <b>' + srcStr + ':</b> ' + escapeHTML(item.platform || 'WhatsApp');

  results.push({ json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText } });
}
return results;"""

with open('/home/node/.n8n/wf_export.json', 'r') as f:
    wf = json.load(f)

nodes = wf if isinstance(wf, list) else wf.get('nodes', wf)
if isinstance(wf, list):
    for item in wf:
        for n in item.get('nodes', []):
            if n.get('name') == 'Message Router':
                n['parameters']['jsCode'] = ROUTER_CODE
                print(f"Fixed in list item!")
else:
    for n in wf.get('nodes', []):
        if n.get('name') == 'Message Router':
            n['parameters']['jsCode'] = ROUTER_CODE
            print("Fixed!")

with open('/home/node/.n8n/wf_fixed.json', 'w') as f:
    json.dump(wf, f)

print("Saved to wf_fixed.json")
