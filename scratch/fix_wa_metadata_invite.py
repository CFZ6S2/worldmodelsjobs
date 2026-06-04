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
        print(f'CRITICAL ERROR: Workflow {target_id} not found.')
        return
    
    nodes = json.loads(row[0])
    
    # IMPROVED METADATA EXTRACTION (SUPPORTS GROUP_INVITE)
    improved_wa_metadata_js = """
const input = $input.first().json;
const item = input.message || (input.messages && input.messages[0]) || input.body || input;

function getText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    
    // 1. Invitaciones de Grupo (Formato Whapi)
    if (obj.group_invite && obj.group_invite.link) return String(obj.group_invite.link);
    
    // 2. Mirar caption (para imágenes)
    if (obj.caption) return String(obj.caption);
    
    // 3. Mirar estructura de texto de Whapi/WhatsApp
    if (obj.text) {
        if (typeof obj.text === 'string') return obj.text;
        if (typeof obj.text === 'object' && obj.text.body !== undefined) return String(obj.text.body);
    }
    
    // 4. Fallback a body
    if (obj.body) {
        if (typeof obj.body === 'string') return obj.body;
        if (typeof obj.body === 'object' && obj.body.text !== undefined) return String(obj.body.text);
    }
    
    return '';
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
    print('PATCH SUCCESSFUL: Added support for group_invite links.')

if __name__ == "__main__":
    patch()
