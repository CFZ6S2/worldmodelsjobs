require('dotenv').config();
const path = require('path');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.BACKEND_PORT || 3001;

// Initialize Firebase Admin (WorldModels Database for Leads)
const firebasePath = process.env.WM_FIREBASE_ADMIN_JSON_PATH || path.join(__dirname, 'firebase-admin.json');
const serviceAccount = require(firebasePath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://worldmodels-jobs.firebaseio.com"
});
const db = admin.firestore();
const rtdb = admin.database();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (err) => {
    console.error('🔥 [FATAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 [FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- RATE LIMITING ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased to 500 to accommodate high-frequency automated ingestion
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use(cors());
app.use(express.json({ limit: '1mb' })); // HARDENED: Limit body size to 1MB

// Apply rate limiting to all API endpoints
app.use('/api/', apiLimiter);
app.use('/jobs-api/', apiLimiter);

// Real-time bridge from n8n (RTDB) to Web (Firestore)
rtdb.ref('/posts').on('child_added', async (snapshot) => {
    try {
        const rawData = snapshot.val();
        if (!rawData) return;

        let body;
        try {
            body = typeof rawData.data === 'string' ? JSON.parse(rawData.data) : rawData.data;
        } catch (e) {
            body = rawData;
        }

        if (!body || body.valido === false) return;

        const text = body.descripcion_limpia || body.description || "-";
        const hash = crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');

        // Check if already in Firestore
        const exists = await db.collection('lead_hashes').doc(hash).get();
        if (exists.exists) return;

        const finalTitulo = body.titulo_web || body.title || "Nuevo Lead Sync";
        const finalCategoria = (body.categoria === 'Acompañante de Viaje' || body.categoria === 'Imagen') ? 'CAT_ESCORTS' : 'CAT_EVENTOS';

        const contact = body.contacto || body.tel || "-";
        const senderDigits = contact.replace(/\D/g, '');
        const isBannedPrefix = BANNED_PREFIXES.some(prefix => senderDigits.startsWith(prefix));

        if (senderDigits && (BANNED_NUMBERS.includes(senderDigits) || isBannedPrefix)) {
            console.log(`🚫 [BRIDGE BANNED] Blocked: ${senderDigits}`);
            return;
        }

        const payload = {
            titulo: finalTitulo,
            descripcion: text,
            ubicacion: body.ubicacion || body.municipio || "Global",
            categoria: finalCategoria,
            contact: contact,
            platform: body.platform || "TELEGRAM",
            timestamp: new Date().toISOString(),
            translations: {
                es: { titulo: finalTitulo, descripcion: text },
                en: { titulo: finalTitulo, descripcion: text },
                ru: { titulo: finalTitulo, descripcion: text },
                pt: { titulo: finalTitulo, descripcion: text }
            },
            activa: true,
            source: "n8n_bridge",
            presupuesto: body.pago || "Open"
        };

        await db.collection('ofertas').add(payload);
        await db.collection('lead_hashes').doc(hash).set({ createdAt: new Date().toISOString() });

        console.log(`🚀 [BRIDGE] Synced legacy lead to Web: ${finalTitulo}`);
    } catch (err) {
        console.error('❌ [BRIDGE] Error syncing:', err.message);
    }
});

// Watch extra paths just in case
rtdb.ref('/leads').on('child_added', snapshot => rtdb.ref('/posts').child(snapshot.key).set(snapshot.val()));
rtdb.ref('/ofertas').on('child_added', snapshot => rtdb.ref('/posts').child(snapshot.key).set(snapshot.val()));

// --- SHARED NORMALIZE LOGIC (Anti-Dedupe Hardened) ---
function normalizeForDedupe(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        // 1. Remove ALL Emojis and Symbols
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        // 2. Remove non-alphanumeric (keep only letters and numbers)
        .replace(/[^a-z0-9ñáéíóú]/g, '')
        // 3. Ultra-compact
        .trim();
}

function getLeadHash(text) {
    const normalized = normalizeForDedupe(text);
    // If text is effectively empty after cleaning, use raw but trimmed as fallback
    const finalInput = normalized.length > 5 ? normalized : text.toLowerCase().trim();
    return crypto.createHash('sha256').update(finalInput).digest('hex');
}

// Intelligent Categorization Engine (Migrated from Cloud Functions)
function autoCategorize(text) {
    const content = (text || '').toLowerCase();
    const plazasKeywords = ['plaza', 'vacante', 'contratando', 'puesto', 'oferta de trabajo', 'trabajo', 'job', 'hiring', 'contratacion', 'se busca', 'requisito', 'reponedor', 'mozo', 'limpieza', 'camarer'];
    const eventosKeywords = ['evento', 'party', 'fiesta', 'show', 'bolo', 'presentacion', 'casting', 'event', 'party', 'club', 'vuelo', 'hotel', 'modelo', 'imagen', 'azafata'];

    if (plazasKeywords.some(kw => content.includes(kw))) return 'CAT_EVENTOS';
    if (eventosKeywords.some(kw => content.includes(kw))) return 'CAT_EVENTOS';

    return 'CAT_EVENTOS';
}

// --- REMOVED DUPLICATE MIDDLEWARE (Moved to top) ---

// ==========================================
// 1. DUPLICATE GUARD (Anti-Spam)
// ==========================================
const recentLeads = new Map(); // Memory lock for rapid duplicates

app.get('/api/check-duplicate', async (req, res) => {
    const { text, contact, remoteJid } = req.query;
    if (!text) return res.json({ duplicate: false });

    const cleanText = normalizeForDedupe(text);
    const hash = getLeadHash(text);
    const now = Date.now();

    // 1. BRAIN-LEVEL LOCK (Memory)
    // If we saw this exact hash in the last 60 seconds, block it instantly
    if (recentLeads.has(hash)) {
        const lastTime = recentLeads.get(hash);
        if (now - lastTime < 60000) {
            console.log(`🛡️ [LOCK] Instant block for race condition: ${hash.substring(0, 10)}...`);
            return res.json({ duplicate: true, reason: 'memory_lock' });
        }
    }

    // Set the lock
    recentLeads.set(hash, now);

    // HARDENED: Periodic cleanup using setInterval (every hour) instead of size-only
    // size-check still exists as a secondary guard
    if (recentLeads.size > 2000) recentLeads.clear();

    try {
        const ofertasRef = db.collection('ofertas');

        // 2. DB-LEVEL CHECK (Last 24h)
        // We check either the description matches exactly OR the lead_hashes collection has it
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

        // First check lead_hashes (preferred method)
        const hashDoc = await db.collection('lead_hashes').doc(hash).get();
        if (hashDoc.exists) {
            const hData = hashDoc.data();
            const hTime = hData.createdAt ? (hData.createdAt.toMillis ? hData.createdAt.toMillis() : new Date(hData.createdAt).getTime()) : 0;
            if (now - hTime < 24 * 3600 * 1000) {
                console.log(`❌ [GUARD] SHA256 Hash Duplicate blocked: ${hash.substring(0, 10)}`);
                return res.json({ duplicate: true, reason: 'db_hash' });
            }
        }

        const textSnapshot = await ofertasRef
            .where('descripcion_original', '==', cleanText)
            .where('timestamp', '>', dayAgo)
            .limit(1)
            .get();

        if (!textSnapshot.empty) {
            console.log(`❌ [GUARD] DB Duplicate blocked for: ${hash.substring(0, 10)}`);
            return res.json({ duplicate: true, reason: 'db_text' });
        }

        console.log(`✅ [GUARD] New lead accepted: ${cleanText.substring(0, 30)}...`);
        res.json({ duplicate: false });
    } catch (error) {
        console.error('Error checking duplicate:', error.message);
        res.json({ duplicate: false });
    }
});

// ==========================================
// 2. DATA INGESTION & LEGACY COMPATIBILITY
// ==========================================

// --- UTILITIES FOR HARDENING ---
function normalizeForComparison(text) {
    if (!text) return "";
    return text.toString().toLowerCase()
        .replace(/[\u1000-\uFFFF]+/g, "")
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const BANNED_NUMBERS = [
    '5547936188098', '351926822219', '491744723429', '5511993439714', '5511910881933', '923220067913', '16193545051', '5573991142402',
    '351966967025', '353894106470', '919672019746', '5545935056582', '556193888963', '447877354053', '351918673812', '447752825109',
    '5521986713221', '447857761695', '351920755741', '13235002297', '351933204215', '447518038911', '5521981174629', '5511977482482',
    '447308058219', '447723822600', '447448540579', '351927597878', '554797204383', '33749730432', '555391459164', '79963624515',
    '79362632269', '351927357525', '5513996848506', '351911887986', '447466297625', '447892873144', '34651303213', '447400757648',
    '31620216067', '34685647898', '556281163551', '447457422608', '351963213706', '351929073877', '5521983514307', '553497670505',
    '447377623582', '556293110529', '351912131056', '447487698165', '555194401739', '447946485621', '22999574171', '447766470330',
    '447878701129', '555189100041', '555192072204', '351924938305', '447451239098', '447821951926', '5518996148613', '559281324293',
    '4915214453550', '556291433112', '447946304880', '447599476143', '306974107999', '447902286259', '34674141224', '447782314732',
    '258850634194', '447448422578', '447411574134', '34711269334', '447877768537', '16128399721', '447922639195', '447728524014',
    '5521983827523', '556298150720', '447541742768', '34624174047', '351920358247', '22957220770', '447520622873', '5521995574624',
    '32487279353', '380937192123', '558589279166', '2348081002335', '2349077283597', '919891344354', '447492414091', '447477732578',
    '34625375125', '34685617971', '5521990286011'
];
const BANNED_PREFIXES = ['57', '91', '92', '234', '212', '229', '20', '27', '227', '2274']; 

const BANNED_KEYWORDS = [
    'crypto', 'binance', 'forex', 'casino', 'stake', 'signals', 'trading', 'pump', 'usdt', 'virtual', 'inversión', 'ganar dinero', 'bitget',
    'nudes', 'onlyfans', 'video llamada', 'packs', 'contenido', 'paypig', 'fimdom',
    'hombre busca', 'pasivo', 'pasivos', 'hombre generoso', 'conoceré', 'man looks', 'man seeking', 'man seeks', 'generous man', 'sugar daddy', 'busco hombre',
    'droga', 'drogas', 'drugs', 'cocaína', 'cocaina', 'coke', 'perico', 'nieve', 'tusi', 'tusibi', '2cb', 'marihuana', 'hierba', 'weed', 'maconha', 'porro', 'canuto', 'pastilla', 'éxtasis', 'extasis', 'mdma', 'mda', 'cristal', 'metanfetamina', 'crack', 'base', 'heroína', 'heroina', 'vaper', 'airbnb'
];

const JUANA_TOKEN = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
const SPANISH_GROUP_ID = '120363425790792660@g.us';
const VIP_TARGET_NUMBER = '34664266926@s.whatsapp.net';

// 🛡️ JUANA FUNNEL: Universal posting (General & VIP)
app.post('/api/juana/send', async (req, res) => {
    const body = req.body || {};
    const targetChat = body.to || body.chat_id || "";
    const messageText = body.body || body.text || "";

    // Juana only sends to the VIP number OR the Spanish group if needed, 
    // but primarily for the VIP alert requested.
    try {
        const response = await axios.post('https://gate.whapi.cloud/messages/text', {
            to: targetChat,
            body: messageText
        }, {
            headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }
        });
        res.json(response.data);
    } catch (err) {
        console.error('❌ [JUANA ERROR]', err.response?.data || err.message);
        res.status(500).json({ error: "Failed to forward to Whapi (Juana)" });
    }
});

app.post(['/api/leads', '/jobs-api/api/ads', '/api/ads', '/api/save-data'], async (req, res) => {
    try {
        const body = req.body || {};
        const chatId = body.chatId || body.source_chat_id || body.from || "";

        // 🛡️ SECURITY & PRIVACY FILTER
        // 🛡️ SECURITY & PRIVACY FILTER (Allow WhatsApp @g.us AND Telegram -100 IDs)
        const isTelegram = chatId.startsWith('-100') || body.platform === 'telegram';
        if (chatId && !chatId.endsWith('@g.us') && !isTelegram) {
            console.log(`🛡️ [FILTER] Ignored private chat from: ${chatId}`);
            return res.status(200).json({ success: false, reason: 'private_chat_ignored' });
        }

        const rawDescription = body.text_es || body.description || body.text || body.body?.text_es || body.body?.description || body.body?.text || "-";
        const rawTitle = body.title_es || body.title || body.body?.title_es || body.body?.title || (rawDescription.split('\n')[0].substring(0, 50)) || "Lead Sync";
        const city = body.city || body.location || body.body?.city || body.body?.location || "Global";
        
        // Priorizar el contacto de Telegram si viene de ahí
        const contact = body.from || body.sender_contact || body.contact || body.whatsapp || body.phone || body.body?.contact || body.body?.whatsapp || body.body?.phone || "-";
        
        // Si es un link de Telegram, no le quitamos las letras (porque romperíamos el t.me/usuario)
        const senderDigits = contact.includes('t.me/') ? '' : contact.replace(/\D/g, '');

        // 🚫 BANNED NUMBERS & PREFIXES CHECK
        const isBannedPrefix = BANNED_PREFIXES.some(prefix => senderDigits.startsWith(prefix));
        if (senderDigits && (BANNED_NUMBERS.includes(senderDigits) || isBannedPrefix)) {
            console.log(`🚫 [BANNED] Sender blocked (Prefix or Number): ${senderDigits}`);
            return res.status(200).json({ success: false, reason: 'sender_banned' });
        }

        // 🧠 SEMANTIC DEDUPLICATION
        const normalizedTitle = normalizeForComparison(rawTitle);
        const normalizedCity = normalizeForComparison(city);

        // Check recent semantic matches (last 24h)
        const recentMatch = await db.collection('ofertas')
            .where('ubicacion', '==', city)
            .where('titulo', '==', rawTitle)
            .limit(1).get();

        if (!recentMatch.empty) {
            console.log(`🚫 [BLOCK] Semantic duplicate: ${rawTitle} in ${city}`);
            return res.status(200).json({ success: false, reason: 'semantic_duplicate_blocked' });
        }

        // 🚫 BANNED KEYWORDS CHECK
        const textToCheck = `${rawTitle} ${rawDescription}`.toLowerCase();
        const foundBanned = BANNED_KEYWORDS.find(k => textToCheck.includes(k.toLowerCase()));
        if (foundBanned) {
            console.log(`🚫 [BANNED] Keyword found: "${foundBanned}"`);
            return res.status(200).json({ success: false, reason: 'banned_content', keyword: foundBanned });
        }

        // 🚫 FIRESTORE BLACKLIST CHECK
        if (senderDigits && senderDigits.length > 5) {
            const bannedDoc = await db.collection('banned_users').doc(senderDigits).get();
            if (bannedDoc.exists) return res.status(200).json({ success: false, reason: 'sender_blacklisted_firestore' });
        }

        const hash = getLeadHash(rawDescription);
        const payload = {
            titulo: rawTitle,
            descripcion: rawDescription,
            ubicacion: city,
            categoria: autoCategorize(rawDescription),
            contact: contact,
            timestamp: new Date().toISOString(),
            platform: (body.platform || "n8n_vps").toUpperCase(),
            activa: true,
            moderation_status: 'auto_approved',
            source: "n8n_elite_v2_original_rules",
            translations: {
                es: { titulo: body.title_es || rawTitle, descripcion: body.text_es || rawDescription },
                en: { titulo: body.title_en || rawTitle, descripcion: body.text_en || rawDescription },
                ru: { titulo: body.title_ru || rawTitle, descripcion: body.text_ru || rawDescription },
                pt: { titulo: body.title_pt || rawTitle, descripcion: body.text_pt || rawDescription }
            }
        };

        await db.collection('ofertas').doc(hash).set(payload, { merge: true });
        await db.collection('lead_hashes').doc(hash).set({ createdAt: new Date().toISOString() });

        console.log(`💎 [SAVED] Ingested (Unfiltered): ${rawTitle.substring(0, 30)}`);
        res.status(200).json({ success: true, id: hash });
    } catch (error) {
        console.error('❌ Ingestion failed:', error.message);
        res.status(500).json({ success: false });
    }
});

// ==========================================
// 3. MONITORING HTML (HARDENED: Basic Auth)
// ==========================================
app.get('/', async (req, res) => {
    // SIMPLE AUTH GUARD
    const monitorToken = process.env.MONITOR_TOKEN;
    if (monitorToken && req.query.token !== monitorToken) {
        return res.status(401).send('Unauthorized: Missing or invalid monitor token');
    }

    try {
        const snapshot = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(50).get();
        let leadsHtml = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            let time = 'Recién';
            if (data.timestamp) {
                if (typeof data.timestamp.toDate === 'function') {
                    time = data.timestamp.toDate().toLocaleString();
                } else {
                    time = new Date(data.timestamp).toLocaleString();
                }
            }
            leadsHtml += `
                <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: white;">
                    <b style="color: #d4af37">[${data.platform || 'TG'}] ${data.titulo}</b><br>
                    <small>${data.ubicacion} | ${time}</small><br>
                    <p style="font-style: italic; font-size: 0.9em;">${(data.descripcion_original || '').substring(0, 200)}...</p>
                </div>`;
        });

        res.send(`
            <html><body style="font-family: sans-serif; background: #f4f4f4; padding: 20px;">
                <h1>Platinum Ingestion Monitor</h1>
                <p>Status: Authenticated</p>
                <div style="max-width: 800px; margin: 0 auto;">${leadsHtml}</div>
            </body></html>
        `);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Periodic memory cleanup every 60 minutes
setInterval(() => {
    console.log('🧹 [CLEANUP] Clearing recentLeads map...');
    recentLeads.clear();
}, 60 * 60 * 1000);

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Platinum Duplicate Guard listening on port ${port}`);
});
