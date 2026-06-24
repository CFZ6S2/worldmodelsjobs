import json, subprocess, sys

N8N_API = 'http://178.156.186.149/n8n/api/v1'
WF_ID = 'A0QpoDzX559wzRXQ'

ROUTER_CODE = r"""const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138',    title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' },
  { code: 'RU', tg: '-1003920309636', title: item.title_es || 'Новый лид',  text: item.text_es || item.texto_limpio, tag: 'Источник' }
];

const results = [];
for (const l of langs) {
  function formatContact(val, mode) {
    if (!val || val === 'Desconocido' || val === 'No disponible') return 'No disponible';
    if (String(val).startsWith('tg_id_')) {
      const id = val.replace('tg_id_', '');
      return mode === 'html' ? '<a href="tg://user?id=' + id + '">Chat Directo</a>' : 'ID: ' + id;
    }
    if (/[a-zA-Z]/.test(val) && !/\d/.test(val)) {
      const user = String(val).replace('@', '');
      return mode === 'html' ? '<a href="https://t.me/' + user + '">@' + user + '</a>' : '@' + user;
    }
    const s = String(val).replace(/[^0-9]/g, '');
    return s.length >= 7 ? '+' + s : val;
  }

  const isRu = l.code === 'RU';
  const categoryStr = (item.category === 'plaza') ? (isRu ? 'Вакансии' : 'Plazas') : (isRu ? 'Мероприятия' : 'Eventos');
  const unkCity    = isRu ? 'Неизвестно'   : 'Desconocida';
  const unkBudget  = isRu ? 'Договорная'   : 'Negociable';
  const noText     = isRu ? 'Нет описания' : 'Sin texto';
  const sourceStr  = isRu ? 'Источник'     : 'Fuente';

  const tgContact = formatContact(item.contact || item.final_contact, 'html');
  const tgText = '<b>' + escapeHTML(l.title) + '</b>\n' +
    '\u{1F3F7}\uFE0F <b>' + categoryStr + '</b>\n' +
    '\u{1F4CD} <b>' + escapeHTML(item.city || unkCity) + '</b>\n' +
    '\u{1F4B0} <b>' + escapeHTML(item.budget || unkBudget) + '</b>\n\n' +
    escapeHTML(l.text || noText) + '\n\n' +
    '\u{1F464} <b>' + l.tag + ':</b> ' + tgContact + '\n' +
    '\u{1F50C} <b>' + sourceStr + ':</b> ' + escapeHTML(item.platform || 'WhatsApp');

  results.push({ json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText } });
}
return results;"""

# 1. GET current workflow via API
r = subprocess.run(['curl', '-s', f'{N8N_API}/workflows/{WF_ID}'], capture_output=True, text=True)
wf = json.loads(r.stdout)

if 'nodes' not in wf:
    print("ERROR getting workflow:", r.stdout[:200])
    sys.exit(1)

# 2. Fix the empty Message Router
fixed = False
for n in wf['nodes']:
    if n.get('name') == 'Message Router':
        n['parameters']['jsCode'] = ROUTER_CODE
        fixed = True
        print(f"Fixed! Router was: {repr(n['parameters'].get('jsCode','')[:50])}")
        break

if not fixed:
    print("Node not found!")
    sys.exit(1)

# 3. PUT back via API
payload = json.dumps(wf)
with open('/tmp/wf_fixed.json', 'w') as f:
    f.write(payload)

r2 = subprocess.run([
    'curl', '-s', '-X', 'PUT',
    f'{N8N_API}/workflows/{WF_ID}',
    '-H', 'Content-Type: application/json',
    '-d', f'@/tmp/wf_fixed.json'
], capture_output=True, text=True)

resp = json.loads(r2.stdout)
if 'id' in resp:
    print("Workflow updated successfully via API!")
else:
    print("API update response:", r2.stdout[:300])
