import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

# Extract Metadata WA1 fixed - handles the actual webhook structure
extract_wa_fixed = """
const input = $input.first().json;

// The webhook sends: { body: { platform, from, sender, chatId, body: { text }, text, ... } }
// But n8n wraps everything, so input could be the body directly or have it nested
const body = input.body || input;

// Get text - could be in body.text, body.body.text, or just text
let textBody = '';
if (typeof body.text === 'string') {
  textBody = body.text;
} else if (body.body && typeof body.body.text === 'string') {
  textBody = body.body.text;
} else if (typeof body.body === 'string') {
  textBody = body.body;
} else if (input.text && typeof input.text === 'string') {
  textBody = input.text;
} else if (input.message && typeof input.message.text === 'string') {
  textBody = input.message.text;
}

// Clean WhatsApp formatting (* for bold, _ for italic)
textBody = textBody.replace(/\\*/g, '').replace(/_/g, '').trim();

// Get sender phone
function getPhone(val) {
  if (!val) return null;
  let s = String(typeof val === 'object' ? (val.id || val.author || val.from || val.phone || val.number || val.wa_id || val.remoteJid || '') : val);
  if (s.includes('@g.us') || s.includes('-')) return null;
  const digits = s.replace(/\\\\D/g, '');
  return (digits.length >= 7 && digits.length <= 15) ? digits : null;
}

const sc = getPhone(body.from) || getPhone(body.sender) || getPhone(body.author) || getPhone(input.from) || getPhone(input.sender) || "No disponible";
const chatId = body.chatId || body.chat_id || input.chatId || input.chat_id || null;
const chatName = body.chat_name || input.chat_name || '';
const msgType = body.type || input.type || 'text';

// If no text or type is unknown/reaction/sticker, mark as not valuable immediately
if (!textBody || textBody.length < 5 || ['unknown', 'reaction', 'sticker', 'image', 'video', 'audio', 'document', 'location', 'contacts', 'poll'].includes(msgType)) {
  return [];
}

return [{ json: {
  platform: "WhatsApp",
  sender_contact: sc,
  final_contact: sc,
  from: sc,
  source_chat_id: chatId,
  chat_name: chatName,
  texto_limpio: textBody,
  looksValuable: true
}}];
"""

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    
    if row:
        nodes = json.loads(row['nodes'])
        
        for node in nodes:
            if node['name'] == 'Extract Metadata WA1':
                node['parameters']['jsCode'] = extract_wa_fixed
                print("FIXED: Extract Metadata WA1 - correct field parsing + kills empty/unknown messages")
                
        c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (json.dumps(nodes),))
        conn.commit()
        print("Database updated.")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
