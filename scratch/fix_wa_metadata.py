import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'

def patch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if not row:
        print(f'CRITICAL ERROR: Workflow {target_id} not found in DB.')
        return
    
    nodes = json.loads(row[0])
    
    # IMPROVED METADATA EXTRACTION FOR WHATSAPP (HANDLES CAPTIONS & OBJECTS)
    improved_wa_metadata_js = """
const input = $input.first().json;
const item = input.message || (input.messages && input.messages[0]) || input.body || input;

// Extraer el texto de forma robusta (mirando caption para fotos)
function getText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    // Prioridades: 1. Caption (fotos), 2. text.body (whapi), 3. text (general)
    let t = obj.caption || (obj.text && (obj.text.body || obj.text)) || obj.body || '';
    if (typeof t === 'object') {
        t = t.body || t.text || JSON.stringify(t);
    }
    return String(t);
}

const textBody = getText(item) || getText(input);

function getPhone(val) {
  if (!val) return null;
  let s = '';
  if (typeof val === 'object') {
    s = String(val.id || val.author || val.from || val.phone || val.number || val.wa_id || val.remoteJid || '');
  } else {
    s = String(val);
  }
  if (s.includes('@g.us') || s.includes('-')) return null;
  const digits = s.replace(/\\D/g, '');
  return (digits.length >= 7 && digits.length <= 15) ? digits : null;
}

const sc = getPhone(item.author) || getPhone(item.from) || getPhone(item.sender) || getPhone(input.sender?.wa_id) || getPhone(input.contact) || "No disponible";
const sourceChatId = item.chat_id || item.chatId || input.source_chat_id || null;

return [{ json: {
  ...item,
  platform: "WhatsApp",
  sender_contact: sc,
  final_contact: sc,
  source_chat_id: sourceChatId,
  texto_limpio: textBody.trim(),
  looksValuable: textBody.trim().length > 5
}}];
    """.strip()

    for n in nodes:
        if n['name'] == 'Extract Metadata WA1':
            n['parameters']['jsCode'] = improved_wa_metadata_js
            break
            
    cursor.execute('UPDATE workflow_entity SET nodes = ?, updatedAt = datetime("now") WHERE id = ?', 
                   (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print('PATCH SUCCESSFUL: Fixed WhatsApp Caption & Object handling.')

if __name__ == "__main__":
    patch()
