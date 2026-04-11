const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();
const app = express();

const router = express.Router();

router.use(cors({ origin: true }));
router.use(express.json());

// Handle /login (SECURED: No hardcoded credentials or plaintext passwords)
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'missing_fields' });
  
  try {
    // Recommendation: Use Firebase Auth on the client side for all authentication.
    // This endpoint is kept for backwards compatibility but performs no insecure checks.
    return res.status(410).json({ ok: false, error: 'method_deprecated', message: 'Please use Firebase Auth SDK via login.html' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Handle /register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ ok: false, error: 'missing_fields' });
  
  try {
    const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!userSnap.empty) {
      return res.status(400).json({ ok: false, error: 'email_already_registered' });
    }
    
    const newUser = {
      name,
      email,
      password,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').add(newUser);
    return res.json({ ok: true, user: { email, role: 'user', name } });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Handle /feeds
router.get('/feeds', async (req, res) => {
  try {
    const snap = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(20).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

// Handle /ads and /ofertas (Unified Lead Ingestion)
const adsHandler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      // Return latest 100 offers for testing/monitoring
      const snap = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(100).get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json({ ok: true, items });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  } else if (req.method === 'POST') {
    try {
      // Security Check: Ensure the request comes from the authorized n8n workflow
      const authKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];
      const SECRET_KEY = 'WORLDMODELS_N8N_2026'; // To be configured in n8n Headers
      
      if (authKey !== SECRET_KEY) {
        console.warn('Unauthorized Ingestion Attempt blocked');
        return res.status(401).json({ ok: false, error: 'unauthorized_ingestion' });
      }

      const body = req.body || {};
      
      // 1. Anti-Basura (Quality Filter) - Platinum Shield
      const rawText = (body.text_es || body.descripcion || body.description || body.text || '').toLowerCase();
      
      // Recovered Multi-language Whitelist (ES, EN, RU, PT)
      const qualityWhitelist = [
        'viaje', 'cena', 'servicio', 'extra', 'budget', 'acuerdo', 'cliente', 'cita', 'modelo', 'hotel', 'plaza', 'libre', 'disponible', 'habitacion', 'chica', 'trabajo', 'oferta', 'alojamiento', 'busco', 'ofrezco', 'zurich', 'easy',
        'travel', 'dinner', 'service', 'deal', 'agreement', 'client', 'date', 'appointment', 'model', 'vacancy', 'free', 'available', 'room', 'girl', 'job', 'offer', 'accommodation', 'looking',
        'путешествие', 'ужин', 'сервис', 'бюджет', 'сделка', 'клиент', 'встреча', 'модель', 'отель', 'место', 'свободно', 'девушка', 'работа', 'предложение',
        'viagem', 'jantar', 'serviço', 'acordo', 'cliente', 'encontro', 'modelo', 'vaga', 'livre', 'disponível', 'quarto', 'garota', 'trabalho', 'oferta'
      ];

      // Robust Junk Regex (Blocking known undesirable patterns, excluding St. Petersburg/Russia as per update)
      const junkRegex = /кавказ|caucasi|chica o pareja|busco chica|busco pareja|busco mujer/i;

      const hasQuality = qualityWhitelist.some(kw => rawText.includes(kw));
      const hasJunk = junkRegex.test(rawText);

      // ONLY permit if it has a quality keyword AND NO junk
      if (!hasQuality || hasJunk) {
        console.log(`REJECTED: Quality=${hasQuality}, Junk=${hasJunk}. Text: ${rawText.substring(0, 50)}...`);
        return res.status(200).json({ ok: false, message: 'Ad rejected by quality or junk filter' });
      }

      // Cleanup: Remove contact info from text fields to ensure it only shows via button/popup (Paid feature)
      const contact = body.contact || body.contacto || body.whatsapp || '';
      let cleanTextEs = body.text_es || body.descripcion || body.description || body.text || '';
      let cleanTextEn = body.text_en || '';
      let cleanTextRu = body.text_ru || '';
      let cleanTextPt = body.text_pt || '';

      if (contact && contact.length > 3) {
        const contactEscaped = contact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleanTextEs = cleanTextEs.replace(new RegExp(contactEscaped, 'g'), '[CONTACTO PROTEGIDO]').trim();
        cleanTextEn = cleanTextEn.replace(new RegExp(contactEscaped, 'g'), '[PROTECTED CONTACT]').trim();
        cleanTextRu = cleanTextRu.replace(new RegExp(contactEscaped, 'g'), '[КОНТАКТ ЗАЩИЩЕН]').trim();
        cleanTextPt = cleanTextPt.replace(new RegExp(contactEscaped, 'g'), '[CONTATO PROTEGIDO]').trim();
      }

      // 2. Duplicate Guard (Platinum Shield)
      const textHash = Buffer.from(rawText.substring(0, 300).replace(/\s/g, '')).toString('base64');
      let isDuplicate = false;
      try {
        const duplicateCheck = await db.collection('ofertas')
          .where('textHash', '==', textHash)
          .where('timestamp', '>', new Date(Date.now() - 3600000))
          .get();

        if (!duplicateCheck.empty) isDuplicate = true;
      } catch (e) {
        console.warn('Duplicate check skipped:', e.message);
      }

      if (isDuplicate) {
        return res.status(200).json({ ok: false, message: 'Duplicate ad rejected' });
      }

      // 3. Smart Title & Category
      let finalCategoria = 'CAT_PLAZAS';
      
      // Categorization priority: ESCORTS > EVENTOS > PLAZAS
      const escortKeywords = ['escort', 'trans', 'compañía', 'masaje', 'erótico', 'erotico', 'classic', 'express', 'mvr', 'эскорт', 'массаж', 'интим'];
      const eventKeywords = ['evento', 'event', 'invitación', 'invitacion', 'fiesta', 'cena', 'party', 'meeting', 'jantar', 'ужин'];

      if (escortKeywords.some(key => rawText.toLowerCase().includes(key.toLowerCase()))) {
        finalCategoria = 'CAT_ESCORTS';
      } else if (eventKeywords.some(key => rawText.toLowerCase().includes(key.toLowerCase()))) {
        finalCategoria = 'CAT_EVENTOS';
      }

      const validCategories = ['CAT_PLAZAS', 'CAT_EVENTOS', 'CAT_ESCORTS', 'CAT_TRANS'];
      if (!validCategories.includes(finalCategoria)) {
        finalCategoria = 'CAT_PLAZAS';
      }

      const finalTitulo = body.titulo || body.title || (cleanTextEs.split('\n')[0].split('.')[0].substring(0, 50).trim()) || (finalCategoria === 'CAT_PLAZAS' ? 'Nueva Plaza' : (finalCategoria === 'CAT_EVENTOS' ? 'Nuevo Evento' : 'Servicio Escort'));

      let finalPlataforma = (body.plataforma || body.platform || 'TELEGRAM').toUpperCase();
      if (finalPlataforma.includes('WASP') || finalPlataforma.includes('WASAP') || finalPlataforma.includes('WHATS')) finalPlataforma = 'WASAP';
      if (finalPlataforma.includes('TELE')) finalPlataforma = 'TELEGRAM';
      
      if (contact.startsWith('@')) finalPlataforma = 'TELEGRAM';
      if (/^\+?\d{9,15}$/.test(contact.replace(/\s/g, ''))) finalPlataforma = 'WASAP';

      const payload = {
        textHash: textHash,
        titulo: finalTitulo,
        descripcion: cleanTextEs,
        activa: body.activa !== undefined ? body.activa : true,
        categoria: finalCategoria,
        plataforma: finalPlataforma,
        ubicacion: body.ubicacion || body.city || body.ciudad || 'Global',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        translations: {
          es: { titulo: finalTitulo, descripcion: cleanTextEs },
          en: {
            titulo: body.title_en || finalTitulo,
            descripcion: body.text_en || cleanTextEn || cleanTextEs
          },
          ru: {
            titulo: body.title_ru || finalTitulo,
            descripcion: body.text_ru || cleanTextRu || cleanTextEs
          },
          pt: {
            titulo: body.title_pt || finalTitulo,
            descripcion: body.text_pt || cleanTextPt || cleanTextEs
          }
        },
        contact: contact,
        presupuesto: body.presupuesto || body.budget || 'Open',
        ingestedAt: new Date().toISOString(),
        source: body.source || 'n8n_vps'
      };

      const docRef = await db.collection('ofertas').add(payload);
      
      res.json({ 
        ok: true, 
        message: 'Lead ingested successfully into ofertas collection',
        id: docRef.id 
      });
    } catch (error) {
      console.error('Ingestion Error:', error);
      res.status(500).json({ ok: false, error: 'internal_error' });
    }
  }
};

router.all('/ads', adsHandler);
router.all('/ofertas', adsHandler);
router.all('/v1/jobs', adsHandler);
router.all('/v1/ofertas', adsHandler);

// Mount router on both /api (for production rewrites) and / (for local/direct calls)
app.use('/api', router);
app.use('/jobs-api', router);
app.use('/', router);

exports.api_v2 = onRequest({ region: 'europe-west1', cors: true }, app);
