const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const app = express();

// Unified Deduplication Logic
function normalizeForDedupe(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getLeadHash(text) {
  const normalized = normalizeForDedupe(text);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Intelligent Categorization Engine
function autoCategorize(text) {
  const content = (text || '').toLowerCase();
  const plazasKeywords = ['plaza', 'vacante', 'contratando', 'puesto', 'oferta de trabajo', 'trabajo', 'job', 'hiring', 'contratacion', 'se busca', 'requisito', 'reponedor', 'mozo', 'limpieza', 'camarer'];
  const eventosKeywords = ['evento', 'party', 'fiesta', 'show', 'bolo', 'presentacion', 'casting', 'event', 'party', 'club', 'vuelo', 'hotel', 'modelo', 'imagen', 'azafata'];

  if (plazasKeywords.some(kw => content.includes(kw))) return 'CAT_PLAZAS';
  if (eventosKeywords.some(kw => content.includes(kw))) return 'CAT_EVENTOS';
  
  return 'CAT_PLAZAS'; 
}

const allowedOrigins = ['*'];
app.use(cors({ origin: allowedOrigins }));
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhook')) next();
  else express.json()(req, res, next);
});

const router = express.Router();

// --- IDENTITY & AUTH ENDPOINTS ---

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email/password' });

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
    });

    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      userRole: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      worldmodels: { premium: false }
    };

    // Write to both for compatibility
    await db.collection('users').doc(userRecord.uid).set(userData);
    await db.collection('profiles').doc(userRecord.uid).set(userData);

    res.json({ ok: true, uid: userRecord.uid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/profile/:uid', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.json(doc.data());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ADS & LEADS ENDPOINTS ---

router.get('/ads', async (req, res) => {
  try {
    const category = req.query.category;
    let mainQuery = db.collection('ofertas').orderBy('timestamp', 'desc').limit(100);
    if (category && category !== 'all') {
      const catKey = category.toUpperCase().startsWith('CAT_') ? category.toUpperCase() : `CAT_${category.toUpperCase()}`;
      mainQuery = db.collection('ofertas').where('category', '==', catKey).orderBy('timestamp', 'desc').limit(100);
    }
    const snap = await mainQuery.get();
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ ok: true, items });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

const adsHandler = async (req, res) => {
  console.log(">>> INCOMING LEAD REQUEST:", JSON.stringify(req.body));
  try {
    const body = req.body || {};
    const desc = body.text_es || body.descripcion || body.text || body.content || '';
    if (!desc) return res.status(200).json({ ok: false, message: 'Empty' });

    const hash = getLeadHash(desc);
    const category = body.categoria || body.category || autoCategorize(desc);

    const payload = {
      textHash: hash,
      titulo: body.titulo || body.title || desc.split('\n')[0].substring(0, 70).trim(),
      content: desc,
      category: category,
      categoria: category,
      city: body.ubicacion || body.city || body.location || body.ciudad || 'VIP Global',
      ubicacion: body.ubicacion || body.city || body.location || body.ciudad || 'VIP Global',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      contact: body.contact || body.contacto || body.whatsapp || body.phone || body.phoneNumber || body.sender || body.from || '',
      platform: (body.plataforma || body.platform || 'API').toUpperCase(),
      source: body.source || 'n8n_vps',
      ingestedAt: new Date().toISOString()
    };

    // Agregar traducciones si vienen en el body (de n8n u otras fuentes)
    if (body.translations) {
      payload.translations = body.translations;
    }
    
    // Support for text_en, title_en format from some pipelines
    ['en', 'pt', 'ru', 'es'].forEach(l => {
      if (body[`text_${l}`]) payload[`text_${l}`] = body[`text_${l}`];
      if (body[`title_${l}`]) payload[`title_${l}`] = body[`title_${l}`];
    });

    const batch = db.batch();
    batch.set(db.collection('ads').doc(), payload);
    batch.set(db.collection('ofertas').doc(), payload);
    batch.set(db.collection('lead_hashes').doc(hash), { createdAt: new Date().toISOString() });

    await batch.commit();
    res.json({ ok: true, id: hash });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

router.all('/ads', adsHandler);
router.all('/leads', adsHandler);
router.all('/ingest', adsHandler);

app.use('/api', router);
app.use('/', router);

exports.api = onRequest({ region: 'europe-west1', cors: true }, app);