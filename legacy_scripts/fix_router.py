import json, subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

# The correct Message Router code
ROUTER_CODE = r"""const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138',    title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' },
  { code: 'RU', tg: '-1003920309636', title: item.title_ru || item.title_es || 'Новый лид', text: item.text_ru || item.text_es || item.texto_limpio, tag: 'Источник' }
];

const results = [];
for (const l of langs) {
  function formatOutputContact(val, mode) {
    if (!val || val === 'Desconocido' || val === 'No disponible') return mode === 'html' ? 'No disponible' : 'No disponible';
    if (String(val).startsWith('tg_id_')) {
      const id = val.replace('tg_id_', '');
      return mode === 'html' ? `<a href="tg://user?id=${id}">Chat Directo</a>` : `ID: ${id}`;
    }
    if (/[a-zA-Z]/.test(val) && !/\d/.test(val)) {
       const user = String(val).replace('@', '');
       return mode === 'html' ? `<a href="https://t.me/${user}">@${user}</a>` : `@${user}`;
    }
    const s = String(val).replace(/[^0-9]/g, '');
    return s.length >= 7 ? `+${s}` : val;
  }

  const isPt = l.code.startsWith('PT');
  const isRu = l.code.startsWith('RU');
  const categoryStr = (item.category === 'plaza') ? (isPt ? 'Vagas' : isRu ? 'Вакансии' : 'Plazas') : (isRu ? 'Мероприятия' : 'Eventos');
  const unkCity    = isPt ? 'Desconhecida' : isRu ? 'Неизвестно'    : 'Desconocida';
  const unkBudget  = isPt ? 'Negociável'   : isRu ? 'Договорная'    : 'Negociable';
  const noText     = isPt ? 'Sem texto'    : isRu ? 'Нет описания'  : 'Sin texto';
  const sourceStr  = isPt ? 'Fonte'        : isRu ? 'Источник'      : 'Fuente';

  const tgContact = formatOutputContact(item.contact || item.final_contact, 'html');

  const tgText = `<b>${escapeHTML(l.title)}</b>\n🏷️ <b>${categoryStr}</b>\n📍 <b>${escapeHTML(item.city || unkCity)}</b>\n💰 <b>${escapeHTML(item.budget || unkBudget)}</b>\n\n${escapeHTML(l.text || noText)}\n\n👤 <b>${l.tag}:</b> ${tgContact}\n🔌 <b>${sourceStr}:</b> ${escapeHTML(item.platform || 'WhatsApp')}`;

  results.push({
    json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText }
  });
}
return results;"""

# Read current workflow
result = subprocess.run(
    ['sqlite3', DB, 'SELECT nodes FROM workflow_entity LIMIT 1;'],
    capture_output=True, text=True
)
nodes = json.loads(result.stdout.strip())

# Fix the empty Message Router
fixed = False
for n in nodes:
    if n.get('name') == 'Message Router':
        n['parameters']['jsCode'] = ROUTER_CODE
        fixed = True
        print("Fixed Message Router!")
        break

if not fixed:
    print("ERROR: Message Router node not found!")
    exit(1)

# Write back to DB
new_nodes_json = json.dumps(nodes).replace("'", "''")
update_sql = f"UPDATE workflow_entity SET nodes='{new_nodes_json}' WHERE rowid=1;"

proc = subprocess.run(
    ['sqlite3', DB, update_sql],
    capture_output=True, text=True
)
if proc.returncode == 0:
    print("Database updated successfully!")
else:
    print("Error:", proc.stderr)
