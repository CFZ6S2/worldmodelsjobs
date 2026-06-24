import json, subprocess, os

ROUTER_CODE = r"""const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' },
  { code: 'RU_PUBLIC', tg: '-1003920309636', title: '💎 Эксклюзивный Заказ', text: item.texto_limpio, tag: 'Контакт', isPublic: true }
];

// --- INJECTED: COSTA AZUL CLIENT (PORTUGUESE) ---
const cityRaw = String(item.city || 'Global').toLowerCase();
const textRaw = String(item.text_es || '').toLowerCase();
const monacoRegex = /\b(monaco|cannes|niza|nice|monte carlo|côte d'azur)\b/i;
if (monacoRegex.test(cityRaw) || monacoRegex.test(textRaw)) {
  // Envía a la clienta (Telegram)
  langs.push({ code: 'PT_CLIENT', tg: '5479166354', wa: '5511953600828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  // Envía a la clienta 2 (Telegram y WhatsApp)
  langs.push({ code: 'PT_CLIENT_2', tg: '8799609531', wa: '33672474796@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  // Envía al grupo de referencias
  langs.push({ code: 'PT_GROUP', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}
// -----------------------------------

const results = [];
for (const l of langs) {
  function formatOutputContact(val, mode) {
    if (!val || val === 'Desconocido' || val === 'No disponible') return 'No disponible';
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

  const tgContact = formatOutputContact(item.contact || item.final_contact, 'html');
  const waContact = formatOutputContact(item.contact || item.final_contact, 'text');

  const isPt = l.code.startsWith('PT');
  const categoryStr = (item.category === 'plaza') ? (isPt ? 'Vagas' : 'Plazas') : 'Eventos';
  const unkCity = isPt ? 'Desconhecida' : 'Desconocida';
  const unkBudget = isPt ? 'Negociável' : 'Negociable';
  const noText = isPt ? 'Sem descrição' : 'Sin texto';
  const sourceLabel = isPt ? 'Fonte' : 'Fuente';

  let finalTgContact = tgContact;
  let finalWaContact = waContact;
  
  if (l.isPublic) {
    finalTgContact = `<a href="https://t.me/TuCuentaVIP">🔐 Скрыт (Доступно в VIP)</a>`;
    finalWaContact = `🔐 Скрыт (Доступно в VIP)`;
  }

  const tgText = `<b>${escapeHTML(l.title)}</b>\n📍 <b>${categoryStr}</b>\n🏢 <b>${escapeHTML(item.city || unkCity)}</b>\n💰 <b>${escapeHTML(item.budget || unkBudget)}</b>\n\n${escapeHTML(l.text || noText)}\n\n📲 <b>${l.tag}:</b> ${finalTgContact}\n🌐 <b>${sourceLabel}:</b> ${escapeHTML(item.platform || 'WhatsApp')}`;
  const waText = `*🌟 ${l.title}*\n📍 *${item.city || unkCity}* | 💰 *${item.budget || unkBudget}*\n\n${l.text || noText}\n\n📲 *${l.tag}:* ${finalWaContact}\n🌐 *${sourceLabel}:* ${item.platform || 'WhatsApp'}`;
  
  results.push({
    json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText, wa_chat: l.wa, wa_text: waText }
  });
}
return results;"""

# Write to DB directly
DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

# Get all workflow row IDs
result = subprocess.run(['sqlite3', DB, 'SELECT rowid FROM workflow_entity;'], capture_output=True, text=True)
rows = result.stdout.strip().split('\n')
for rowid in rows:
    rowid = rowid.strip()
    if not rowid: continue
    
    result = subprocess.run(['sqlite3', DB, f'SELECT nodes FROM workflow_entity WHERE rowid={rowid};'], capture_output=True, text=True)
    raw = result.stdout.strip()
    if not raw: continue
    
    try:
        nodes = json.loads(raw)
    except Exception as e:
        continue
    
    modified = False
    for n in nodes:
        if n.get('name') == 'Message Router':
            n['parameters']['jsCode'] = ROUTER_CODE
            modified = True
            
    if modified:
        new_json = json.dumps(nodes)
        new_json_escaped = new_json.replace("'", "''")
        update = f"UPDATE workflow_entity SET nodes='{new_json_escaped}' WHERE rowid={rowid};"
        subprocess.run(['sqlite3', DB, update])
        print(f"Patched row {rowid}")

# Also update wf_export.json just in case
if os.path.exists('/root/wf_export.json'):
    with open('/root/wf_export.json', 'r') as f:
        wf = json.load(f)
    
    nodes = wf if isinstance(wf, list) else wf.get('nodes', wf)
    modified = False
    if isinstance(wf, list):
        for item in wf:
            for n in item.get('nodes', []):
                if n.get('name') == 'Message Router':
                    n['parameters']['jsCode'] = ROUTER_CODE
                    modified = True
    else:
        for n in wf.get('nodes', []):
            if n.get('name') == 'Message Router':
                n['parameters']['jsCode'] = ROUTER_CODE
                modified = True
                
    if modified:
        with open('/root/wf_fixed.json', 'w') as f:
            json.dump(wf, f)
        print("Patched wf_fixed.json")
