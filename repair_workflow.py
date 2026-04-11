// 1. Capturamos el objeto principal
const item = $json;

let plataforma = "";
let contacto = "";
let texto = "";
let remitente_nombre = "";
let chat_id = item.chat_id || "";
let chat_name = item.chat_name || "";

// --- LÓGICA TELEGRAM ---
if (item.message) {
  plataforma = "telegram";
  texto = item.message.text || "";
  remitente_nombre = item.message.from.first_name || "";
  const user = item.message.from.username ? `@${item.message.from.username}` : item.message.from.id;
  contacto = remitente_nombre ? `${remitente_nombre} (${user})` : user;
} 

// --- LÓGICA WHATSAPP (Basada en tu captura de Maru) ---
else {
  plataforma = "whatsapp";
  // El texto en tu captura está en item.text.body
  texto = item.text?.body || item.text || "";
  
  const num = item.from || "";
  remitente_nombre = (item.from_name && item.from_name !== ".") ? item.from_name : "";
  contacto = remitente_nombre ? `${remitente_nombre} (${num})` : num;
}

const textoSeguro = String(texto).trim();
const esLink = /(http|t.me|chat.whatsapp|link)/i.test(textoSeguro);

// 2. RETORNAMOS TU ESTRUCTURA EXACTA
return {
  plataforma: plataforma,
  contacto: contacto,
  chat_id: chat_id,
  chat_name: chat_name,
  remitente_nombre: remitente_nombre,
  texto_limpio: textoSeguro,
  es_bot: !!(item.message?.from?.is_bot),
  es_link: esLink,
  timestamp_origen: item.timestamp || "",
  fecha_procesado: new Date().toISOString(),
  debug_platform_detected: plataforma,
  debug_text_length: textoSeguro.length
};