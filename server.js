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
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const crypto = require('crypto');

// --- SHARED NORMALIZE LOGIC ---
function normalizeForDedupe(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    // Remove emojis and special characters for strict fingerprinting
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLeadHash(text) {
  const normalized = normalizeForDedupe(text);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

app.use(cors());
app.use(express.json());

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
  // If we saw this exact hash in the last 15 seconds, block it instantly
  if (recentLeads.has(hash)) {
    const lastTime = recentLeads.get(hash);
    if (now - lastTime < 15000) {
      console.log(`🛡️ [LOCK] Instant block for race condition: ${hash.substring(0,10)}...`);
      return res.json({ duplicate: true, reason: 'memory_lock' });
    }
  }
  
  // Set the lock
  recentLeads.set(hash, now);
  // Cleanup map every hour to prevent memory bloat
  if (recentLeads.size > 1000) recentLeads.clear();

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
// 2. DATA INGESTION (Legacy compatibility / Backup)
// ==========================================
const crypto = require('crypto');

app.post('/api/save-data', async (req, res) => {
    try {
        const body = req.body || {};
        const text = body.description || body.descripcion_original || "-";
        
        // CREATE UNIQUE SHARED FINGERPRINT (Standardized)
        const hash = getLeadHash(text);
        
        const payload = {
            titulo: body.title || body.titulo || "Nuevo Lead",
            descripcion_original: text,
            ubicacion: body.city || body.ubicacion || "Global",
            categoria: body.category || body.categoria || "CAT_VARIOS",
            contact: body.contact || body.sender_contact || "-",
            remoteJid: body.to || body.remoteJid || body.contact || body.sender_contact || "-",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            platform: (body.source || body.platform || "TELEGRAM").toUpperCase(),
            activa: true
        };

        // Use the hash as the ID to ensure absolute uniqueness
        await db.collection('ofertas').doc(hash).set(payload, { merge: true });
        
        console.log(`💎 [SAVED] Unique Lead stored: ${hash.substring(0,8)}`);
        res.status(200).json({ success: true, id: hash });
    } catch (error) {
        console.error('Error in save-data:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3. MONITORING HTML
// ==========================================
app.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(50).get();
        let leadsHtml = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const time = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recién';
            leadsHtml += `
                <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: white;">
                    <b style="color: #d4af37">[${data.platform || 'TG'}] ${data.titulo}</b><br>
                    <small>${data.ubicacion} | ${time}</small><br>
                    <p style="font-style: italic; font-size: 0.9em;">${data.descripcion_original.substring(0, 200)}...</p>
                </div>`;
        });

        res.send(`
            <html><body style="font-family: sans-serif; background: #f4f4f4; padding: 20px;">
                <h1>Platinum Ingestion Monitor</h1>
                <div style="max-width: 800px; margin: 0 auto;">${leadsHtml}</div>
            </body></html>
        `);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Platinum Duplicate Guard listening on port ${PORT}`);
});
