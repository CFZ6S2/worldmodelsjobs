import json

payload = {
  "json": {
    "body": {
      "messages": [
        {
          "id": "Ou4P0g5HnUt4Sg-gjcBq53ly.55Zg",
          "from_me": False,
          "type": "text",
          "timestamp": 1782264129,
          "source": "mobile",
          "chat_name": "BEST JOBS WORLD \ud83d\udc51\ud83d\udc51",
          "starred": False,
          "chat_id": "120363425349925222@g.us",
          "from": "5492255608577",
          "text": {
            "body": "MIAMI \ud83c\uddfa\ud83c\uddf8 \ud83c\uddfa\ud83c\uddf8 \ud83c\uddfa\ud83c\uddf8\nMIAMI\nMIAMI\n\n-tonight/ tomorrow\nMax 2hr private\nUp to 2000usd\n\n-weekend Friday or Saturday \nDinner+private\n3 models\n3-4k usd \n\nPlease top proffiles with good portfolio"
          },
          "from_name": "Est"
        }
      ],
      "event": {
        "type": "messages",
        "event": "post"
      },
      "channel_id": "GRNARN-PN6KD"
    }
  }
}

js_code = """
const input = payload.json;

// The webhook sends: { body: { platform, from, sender, chatId, body: { text }, text, ... } }
// But n8n wraps everything, so input could be the body directly or have it nested
const body = input.body || input;

// Get text - could be in body.text, body.body.text, or just text
let textBody = '';
if (body.messages && body.messages.length > 0 && body.messages[0].text && typeof body.messages[0].text.body === 'string') {
  textBody = body.messages[0].text.body;
}
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
  const digits = s.replace(/\\D/g, '');
  return (digits.length >= 7 && digits.length <= 15) ? digits : null;
}

const sc = getPhone(body.from) || getPhone(body.sender) || getPhone(body.author) || getPhone(input.from) || getPhone(input.sender) || "No disponible";
const chatId = body.chatId || body.chat_id || input.chatId || input.chat_id || null;
const chatName = body.chat_name || input.chat_name || '';
const msgType = body.type || input.type || 'text';

console.log("textBody:", textBody);
console.log("sc:", sc);
console.log("chatId:", chatId);
console.log("chatName:", chatName);
console.log("msgType:", msgType);

if (!textBody || textBody.length < 5 || ['unknown', 'reaction', 'sticker', 'image', 'video', 'audio', 'document', 'location', 'contacts', 'poll'].includes(msgType)) {
  console.log("RETURN []");
} else {
  console.log("RETURN ITEM");
}
"""

with open('test_wa.js', 'w', encoding='utf-8') as f:
    f.write(f"const payload = {json.dumps(payload)};\n")
    f.write(js_code)
