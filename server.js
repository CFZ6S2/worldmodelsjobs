require('dotenv').config();
const path = require('path');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.BACKEND_PORT || 3001;

// Initialize Firebase Admin (WorldModels Database for Leads)
const firebasePath = process.env.WM_FIREBASE_ADMIN_JSON_PATH || path.join(__dirname, 'worldmodels-admin.json');
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

        const payload = {
            titulo: finalTitulo,
            descripcion: text,
            ubicacion: body.ubicacion || body.municipio || "Global",
            categoria: finalCategoria,
            contact: body.contacto || body.tel || "-",
            platform: "TELEGRAM",
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

  if (plazasKeywords.some(kw => content.includes(kw))) return 'CAT_PLAZAS';
  if (eventosKeywords.some(kw => content.includes(kw))) return 'CAT_EVENTOS';
  
  return 'CAT_PLAZAS'; 
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
      console.log(`🛡️ [LOCK] Instant block for race condition: ${hash.substring(0,10)}...`);
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
         console.log(`❌ [GUARD] SHA256 Hash Duplicate blocked: ${hash.substring(0,10)}`);
         return res.json({ duplicate: true, reason: 'db_hash' });
      }
    }

    const textSnapshot = await ofertasRef
      .where('descripcion_original', '==', cleanText)
      .where('timestamp', '>', dayAgo)
      .limit(1)
      .get();

    if (!textSnapshot.empty) {
      console.log(`❌ [GUARD] DB Duplicate blocked`);
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

// This handles the EXACT URL and structure found in WORLDMODELS_V2_ELITE_FINAL
app.post(['/api/leads', '/jobs-api/api/ads', '/api/ads', '/api/save-data'], async (req, res) => {
    try {
        const body = req.body || {};
        
        // 🛡️ SECURITY & PRIVACY FILTER:
        const chatId = body.chatId || body.remoteJid || body.jid || "";
        const MIRROR_GROUPS = [
            '120363408216646972@g.us', '120363425790792660@g.us', 
            '120363426262586004@g.us', '120363408298375271@g.us'
        ];

        // 1. Block Private Chats (Privacy)
        if (chatId && !chatId.endsWith('@g.us')) {
            return res.status(200).json({ success: false, reason: 'private_chat_ignored' });
        }
        // 2. Block Mirror Groups for the Sniffer (Loop Prevention)
        if (MIRROR_GROUPS.includes(chatId)) {
            return res.status(200).json({ success: false, reason: 'mirror_group_ignored_to_prevent_loop' });
        }

        // --- ROBUST EXTRACTION (Support for ELITE V2 & Legacy) ---
        const rawDescription = body.text_es || body.description || body.descripcion || body.descripcion_original || body.text || "-";
        const rawTitle = body.title_es || body.title || body.titulo || body.titulo_web || (rawDescription.split('\n')[0].substring(0, 50)) || "Nuevo Lead Sync";
        
        // 🧠 ANTI-STORM LOCK
        const hash = getLeadHash(rawDescription);
        const now = Date.now();
        if (recentLeads.has(hash)) {
            const lastTime = recentLeads.get(hash);
            if (now - lastTime < 60000) {
                console.log(`🛡️ [STORM] Blocking duplicate ingestion: ${hash.substring(0,10)}`);
                return res.status(200).json({ success: false, reason: 'duplicate_blocked_by_storm_guard' });
            }
        }
        recentLeads.set(hash, now);

        // 🗄️ DB CHECK (Avoid overwriting / double posting)
        const exists = await db.collection('lead_hashes').doc(hash).get();
        if (exists.exists) {
            console.log(`🛡️ [DB] Lead already exists in Firestore: ${hash.substring(0,10)}`);
            return res.status(200).json({ success: false, reason: 'already_exists' });
        }

        const finalCategory = body.category || body.categoria || autoCategorize(rawDescription);
        
        const payload = {
            titulo: rawTitle,
            descripcion: rawDescription,
            descripcion_original: rawDescription,
            ubicacion: body.city || body.location || body.ubicacion || body.municipio || "Global",
            categoria: finalCategory,
            contact: body.contact || body.contacto || body.tel || body.sender_contact || "-",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            platform: (body.platform || "n8n_vps").toUpperCase(),
            activa: true,
            source: "n8n_elite_v2_compat",
            translations: {
                es: { titulo: body.title_es || rawTitle, descripcion: body.text_es || rawDescription },
                en: { titulo: body.title_en || rawTitle, descripcion: body.text_en || rawDescription },
                ru: { titulo: body.title_ru || rawTitle, descripcion: body.text_ru || rawDescription },
                pt: { titulo: body.title_pt || rawTitle, descripcion: body.text_pt || rawDescription }
            }
        };

        // Standardized mapping: Every field covered
        await db.collection('ofertas').doc(hash).set(payload, { merge: true });
        await db.collection('lead_hashes').doc(hash).set({ createdAt: new Date().toISOString() });
        
        console.log(`💎 [SAVED] Sync via Elite V2 Compat: ${rawTitle.substring(0,20)}...`);
        res.status(200).json({ success: true, id: hash });
    } catch (error) {
        console.error('❌ [ERROR] Ingestion failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
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
