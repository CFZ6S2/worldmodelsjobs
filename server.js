const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();

// Initialize Firebase Admin
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. DUPLICATE GUARD (Anti-Spam)
// ==========================================
app.get('/api/check-duplicate', async (req, res) => {
  const { text } = req.query;
  if (!text) return res.json({ duplicate: false });
  
  const cleanText = text.trim();

  try {
    // RECONCILED: Querying 'ofertas' (Platinum) instead of 'posts'
    const ofertasRef = db.collection('ofertas');
    
    // Check for duplicates in the last 24 hours
    const period = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Note: This query requires an INDEX (descripcion_original ASC, timestamp DESC)
    const snapshot = await ofertasRef
      .where('descripcion_original', '==', cleanText)
      .where('timestamp', '>', period)
      .limit(1)
      .get();

    console.log(`🔍 [GUARD] Result for "${cleanText.substring(0, 30)}...": ${snapshot.empty ? 'NEW ✅' : 'DUPLICADO ❌'}`);
    res.json({ duplicate: !snapshot.empty });
  } catch (error) {
    if (error.message.includes('requires an index')) {
       console.error('⚠️ [INDEX MISSING]: ' + error.message.split('here: ')[1]);
    } else {
       console.error('Error checking duplicate:', error.message);
    }
    // Fallback: If guard fails, allow transit to avoid blocking
    res.json({ duplicate: false });
  }
});

// ==========================================
// 2. DATA INGESTION (Legacy compatibility / Backup)
// ==========================================
app.post('/api/save-data', async (req, res) => {
    try {
        const body = req.body || {};
        const payload = {
            titulo: body.title || body.titulo || "Nuevo Lead",
            descripcion_original: body.description || body.descripcion_original || "-",
            ubicacion: body.city || body.ubicacion || "Global",
            categoria: body.category || body.categoria || "CAT_VARIOS",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            platform: (body.source || body.platform || "TELEGRAM").toUpperCase(),
            activa: true
        };

        const docRef = await db.collection('ofertas').add(payload);
        res.status(200).json({ success: true, id: docRef.id });
    } catch (error) {
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
