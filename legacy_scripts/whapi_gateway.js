
process.on("uncaughtException", (err) => { console.error("🔥 [WHAPI FATAL]", err.message); });
process.on("unhandledRejection", (reason) => { console.error("🔥 [WHAPI REJECTION]", reason); });
require('dotenv').config();
const http = require('http');
const axios = require('axios');

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://178.156.186.149/n8n/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef';

const COOLDOWN_MS = 10000;
const authorCooldowns = new Map();
const contentDedup = new Map();
const CONTENT_TTL = 120000;

const { BANNED_NUMBERS, BANNED_PREFIXES } = require('./shared_bans.js');

const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/whapi') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const whapiData = JSON.parse(body);
                if (whapiData.messages && whapiData.messages.length > 0) {
                    for (const msg of whapiData.messages) {
                        if (msg.from_me) continue;
                        
                        // Ignorar mensajes privados (solo permitir grupos)
                        const chatId = msg.chat_id || msg.from || '';
                        if (!chatId.endsWith('@g.us')) {
                            console.log(`🛡️ [FILTER] Ignorando mensaje privado en whapi_gateway de: ${chatId}`);
                            continue;
                        }

                        const author = msg.from;
                        const now = Date.now();
                        const authorDigits = author ? author.replace(/\D/g, '') : '';
                        
                        // Ban pre IA
                        if (
                            authorDigits && 
                            (BANNED_NUMBERS.includes(authorDigits) || BANNED_PREFIXES.some(prefix => authorDigits.startsWith(prefix)))
                        ) {
                            console.log(`🚫 [BANNED PRE-IA] Ignorando a ${author}`);
                            continue;
                        }

                        // Extracción de texto mejorada (incluye group invite buttons)
                        let extractedText = msg.text?.body || msg.caption || msg.content || (msg.type === 'text' ? msg.body : '') || '';
                        
                        // Capturar enlaces de grupo desde botón "Únete a este grupo"
                        if (!extractedText && msg.action && msg.action.type === 'group') {
                            const inviteLink = msg.action.invite_link || msg.action.url || '';
                            const groupName = msg.action.group_name || msg.action.title || 'Grupo';
                            extractedText = inviteLink ? `🔗 Grupo: ${groupName}\n${inviteLink}` : '';
                        }
                        // Whapi a veces envía invitaciones como tipo 'group' o con campos de invitación
                        if (!extractedText && msg.type === 'group' && msg.invite_link) {
                            extractedText = `🔗 Grupo: ${msg.group_name || 'Grupo'}\n${msg.invite_link}`;
                        }
                        if (!extractedText && msg.group_invite) {
                            const gi = msg.group_invite;
                            const link = gi.invite_link || gi.url || (gi.invite_code ? `https://chat.whatsapp.com/${gi.invite_code}` : '');
                            extractedText = link ? `🔗 Grupo: ${gi.group_name || gi.subject || 'Grupo'}\n${link}` : '';
                        }
                        
<<<<<<<< HEAD:legacy_scripts/whapi_gateway.js
                        // Extracción de texto mejorada (incluye group invite buttons)
                        let extractedText = msg.text?.body || msg.caption || msg.content || (msg.type === 'text' ? msg.body : '') || '';
                        
                        // Capturar enlaces de grupo desde botón "Únete a este grupo"
                        if (!extractedText && msg.action && msg.action.type === 'group') {
                            const inviteLink = msg.action.invite_link || msg.action.url || '';
                            const groupName = msg.action.group_name || msg.action.title || 'Grupo';
                            extractedText = inviteLink ? `🔗 Grupo: ${groupName}\n${inviteLink}` : '';
                        }
                        // Whapi a veces envía invitaciones como tipo 'group' o con campos de invitación
                        if (!extractedText && msg.type === 'group' && msg.invite_link) {
                            extractedText = `🔗 Grupo: ${msg.group_name || 'Grupo'}\n${msg.invite_link}`;
                        }
                        if (!extractedText && msg.group_invite) {
                            const gi = msg.group_invite;
                            const link = gi.invite_link || gi.url || (gi.invite_code ? `https://chat.whatsapp.com/${gi.invite_code}` : '');
                            extractedText = link ? `🔗 Grupo: ${gi.group_name || gi.subject || 'Grupo'}\n${link}` : '';
                        }
                        
                        // Marcamos el autor
========
                        // Cooldown por autor (10s) + dedup por contenido (2 min)
                        if (authorCooldowns.has(author) && (now - authorCooldowns.get(author) < COOLDOWN_MS)) {
                            console.log(`[COOLDOWN] Ignorando a ${author}`);
                            continue;
                        }
                        const contentKey = (authorDigits || author) + ':' + extractedText.substring(0, 150);
                        if (contentKey.length > 15 && contentDedup.has(contentKey) && (now - contentDedup.get(contentKey) < CONTENT_TTL)) {
                            console.log(`[TEXTDEDUP] Duplicado de ${author} bloqueado`);
                            continue;
                        }
>>>>>>>> production/main:whapi_gateway.js
                        authorCooldowns.set(author, now);
                        if (contentKey.length > 15) {
                            contentDedup.set(contentKey, now);
                            if (contentDedup.size > 3000) { contentDedup.delete(contentDedup.keys().next().value); }
                        }

                        const n8nPayload = {
                            platform: 'whatsApp',
                            from: msg.author || msg.participant || (msg.from && !String(msg.from).includes('@g.us') ? msg.from : '') || '',
                            author: msg.author || "",
                            sender: msg.author || msg.participant || (msg.from && !String(msg.from).includes('@g.us') ? msg.from : '') || '',
                            chatId: msg.chat_id || msg.from,
                            body: { text: extractedText },
                            text: extractedText,
                            type: msg.type,
                            key: { 
                                remoteJid: msg.chat_id || msg.from,
                                fromMe: false 
                            },
                            pushName: msg.from_name || 'Usuario WhatsApp',
                            timestamp: msg.timestamp,
                            source: 'whapi_cloud'
                        };

                        console.log(`🔍 [DEBUG] from=${msg.from} author=${msg.author||'undef'} participant=${msg.participant||'undef'} chat_id=${msg.chat_id||'undef'}`);
                        console.log(`🚀 Forwarding [${msg.type}] to n8n from ${msg.from_name || msg.from}...`);
                        try {
                            const n8nRes = await axios.post(N8N_WEBHOOK_URL, n8nPayload);
                            console.log(`✅ [N8N] Response: ${n8nRes.status}`);
                        } catch (err) {
                            console.error(`❌ [N8N ERROR] ${err.response?.status || err.code}: ${err.message}`);
                        }
                    }
                }
                res.writeHead(200);
                res.end('ok');
            } catch (e) {
                res.writeHead(500);
                res.end('error');
            }
        });
    } else {
        res.writeHead(200);
        res.end('Whapi Gateway Original Restored');
    }
});

server.listen(8080, () => {
    console.log('🚀 Pasarela RESTAURADA en puerto 8080');
});
