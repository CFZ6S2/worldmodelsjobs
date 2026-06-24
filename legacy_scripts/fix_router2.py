import json, subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

ROUTER_CODE = """const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138',    title: item.title_es || 'Nuevo Lead',  text: item.text_es || item.texto_limpio, tag: 'Remitente' },
  { code: 'RU', tg: '-1003920309636', title: item.title_es || 'Новый лид',   text: item.text_es || item.texto_limpio, tag: 'Источник' }
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
  const unkCity    = isRu ? 'Неизвестно'   : 'Desconocida';
  const unkBudget  = isRu ? 'Договорная'   : 'Negociable';
  const noText     = isRu ? 'Нет описания' : 'Sin texto';
  const sourceStr  = isRu ? 'Источник'     : 'Fuente';

  const tgContact = formatContact(item.contact || item.final_contact, 'html');
  const tgText = '<b>' + escapeHTML(l.title) + '</b>\\n' +
    '\\uD83C\\uDFF7\\uFE0F <b>' + categoryStr + '</b>\\n' +
    '\\uD83D\\uDCCD <b>' + escapeHTML(item.city || unkCity) + '</b>\\n' +
    '\\uD83D\\uDCB0 <b>' + escapeHTML(item.budget || unkBudget) + '</b>\\n\\n' +
    escapeHTML(l.text || noText) + '\\n\\n' +
    '\\uD83D\\uDC64 <b>' + l.tag + ':</b> ' + tgContact + '\\n' +
    '\\uD83D\\uDD0C <b>' + sourceStr + ':</b> ' + escapeHTML(item.platform || 'WhatsApp');

  results.push({ json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText } });
}
return results;"""

# Get all workflow row IDs
rows = subprocess.run(['sqlite3', DB, 'SELECT rowid FROM workflow_entity;'], capture_output=True, text=True).stdout.strip().split('\n')
print(f"Found {len(rows)} workflow rows: {rows}")

for rowid in rows:
    rowid = rowid.strip()
    if not rowid:
        continue
    
    result = subprocess.run(['sqlite3', DB, f'SELECT nodes FROM workflow_entity WHERE rowid={rowid};'], capture_output=True, text=True)
    raw = result.stdout.strip()
    if not raw:
        continue
    
    try:
        nodes = json.loads(raw)
    except:
        continue
    
    for n in nodes:
        if n.get('name') == 'Message Router':
            old = n.get('parameters', {}).get('jsCode', '')
            print(f"Row {rowid}: Message Router found. Code: {repr(old[:60])}")
            n['parameters']['jsCode'] = ROUTER_CODE
            
            new_json = json.dumps(nodes)
            new_json_escaped = new_json.replace("'", "''")
            update = f"UPDATE workflow_entity SET nodes='{new_json_escaped}' WHERE rowid={rowid};"
            
            proc = subprocess.run(['sqlite3', DB, update], capture_output=True, text=True)
            if proc.returncode == 0:
                print(f"Row {rowid}: FIXED successfully!")
            else:
                print(f"Row {rowid}: Error - {proc.stderr}")

print("Done. Restart n8n to apply changes.")
