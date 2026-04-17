const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();
const app = express();

// --- SHARED NORMALIZE LOGIC ---
function normalizeForDedupe(text) {
  if (!text) return '';
  // Hardened deduplication: Retain digits, crucial punctuation, while standardizing spacing.
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function getLeadHash(text) {
  const normalized = normalizeForDedupe(text);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Hard fail for missing secrets at runtime, but don't break deploy process if env not populated locally
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
}

// Middleware setup: Restrict CORS origins
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://worldmodels.jobs', 'https://tucitasegura.com', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins }));

// Special handling for Stripe Webhook raw body
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhook')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

const router = express.Router();

// --- NEW ENDPOINTS MIGRATED FROM NEXT.JS ---

// Handle /posts
router.get('/posts', async (req, res) => {
  const city = req.query.city;
  const category = req.query.category;
  const pageSize = parseInt(req.query.limit || '20');
  const locale = req.query.locale || 'es';

  try {
    let query = db.collection('ofertas').orderBy('timestamp', 'desc').limit(pageSize);

    if (city && city !== 'All') {
      query = query.where('ubicacion', '==', city);
    }
    if (category && category !== 'ALL') {
      query = query.where('categoria', '==', category);
    }

    const snapshot = await query.get();
    const posts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.translations?.[locale]?.titulo || data.translations?.es?.titulo || data.titulo || 'Nueva Oferta Platinum',
        description: data.translations?.[locale]?.descripcion || data.translations?.es?.descripcion || data.descripcion_original || '',
        category: data.categoria || 'VIP',
        city: data.ubicacion || 'Global',
        budget: data.presupuesto || 0,
        source: data.source || data.platform || 'Telegram',
        created_at: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : (data.timestamp || new Date().toISOString())
      };
    });

    res.json({ posts });
  } catch (err) {
    console.error('[Posts API Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Handle /checkout
router.post('/checkout', async (req, res) => {
  try {
    if (!stripe) throw new Error('CRITICAL: STRIPE_SECRET_KEY not configured');
    
    const { priceId, email, userId, appUrl } = req.body || {};

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl || 'https://worldmodels.jobs'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl || 'https://worldmodels.jobs'}/pricing`,
      metadata: { userId: userId },
      customer_email: email,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Handle Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send('CRITICAL: Stripe Webhook configuration is missing.');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId) {
      console.log(`Activated subscription for user: ${userId}`);
      await db.collection('users').doc(userId).set({
        stripeCustomerId: session.customer,
        subscriptionStatus: 'active',
        worldmodels: { premium: true },
        membership: { type: 'premium' },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }

  res.json({ received: true });
});

// --- AUTH ENDPOINTS (MIGRATED FROM NEXT.JS) ---

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, birthDate } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
    });

    const uid = userRecord.uid;
    
    // WARNING: Never store password in Firestore. 
    // It is handled solely by Firebase Auth above.
    const userData = {
      uid, email, alias: displayName || '', gender: 'femenino', birthDate: birthDate || '', userRole: 'female',
      reputation: 'BRONCE',
      createdAt: new Date().toISOString(), lastActivity: new Date().toISOString(),
      signupSource: 'worldmodels', profileType: 'wm_candidate',
      stripeCustomerId: null,
      subscriptionStatus: 'inactive',
      worldmodels: { premium: false, liveFeed: false, badge: false, expiryDate: null },
      membership: { type: 'free', expiresAt: null },
    };

    await db.collection('users').doc(uid).set(userData);
    res.json({ success: true, uid });
  } catch (err) {
    console.error('[Register Error]', err.message);
    res.status(400).json({ error: err.message, code: err.code });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken required' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const profileSnap = await db.collection('users').doc(uid).get();
    const profile = profileSnap.exists ? profileSnap.data() : null;

    if (profile?.banned === true) return res.status(403).json({ error: 'Account suspended' });

    const customToken = await admin.auth().createCustomToken(uid, {
      signupSource: profile?.signupSource || 'worldmodels',
      worldmodels_premium: profile?.worldmodels?.premium || false,
    });

    res.json({
      success: true, uid, customToken,
      profile: {
        displayName: profile?.displayName || decoded.name,
        email: decoded.email,
        worldmodels: profile?.worldmodels || { premium: false },
      },
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.get('/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token required' });

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userSnap = await db.collection('users').doc(decoded.uid).get();

    if (!userSnap.exists) return res.status(404).json({ error: 'Not found' });
    const data = userSnap.data();

    res.json({
      success: true,
      uid: decoded.uid,
      profile: {
        email: decoded.email,
        alias: data.alias || '',
        worldmodels: data.worldmodels || { premium: false },
      },
    });
  } catch (err) {
    console.error('[Profile Error]', err.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

const adsHandler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const snap = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(100).get();
      const items = snap.docs.map(d => {
        const data = d.data();
        delete data.contact; // Security: Prevent sensitive contact info leak
        return { id: d.id, ...data };
      });
      res.json({ ok: true, items });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  } else if (req.method === 'POST') {
    try {
      if (!process.env.N8N_SECRET_KEY) {
        throw new Error('CRITICAL: N8N_SECRET_KEY is missing from environment. Hard failing.');
      }
      const authKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];
      const SECRET_KEY = process.env.N8N_SECRET_KEY;
      
      if (authKey !== SECRET_KEY) {
        return res.status(401).json({ ok: false, error: 'unauthorized_ingestion' });
      }

      const body = req.body || {};
      const rawText = (body.text_es || body.descripcion || body.description || body.text || '').toLowerCase();
      
      const qualityWhitelist = [
        'viaje', 'cena', 'servicio', 'extra', 'budget', 'acuerdo', 'cliente', 'cita', 'modelo', 'hotel', 'plaza', 'libre', 'disponible', 'habitacion', 'chica', 'trabajo', 'oferta', 'alojamiento', 'busco', 'ofrezco', 'zurich', 'easy',
        'travel', 'dinner', 'service', 'deal', 'agreement', 'client', 'date', 'appointment', 'model', 'vacancy', 'free', 'available', 'room', 'girl', 'job', 'offer', 'accommodation', 'looking',
        'путешествие', 'ужин', 'сервис', 'бюджет', 'сделка', 'клиент', 'встреча', 'модель', 'отель', 'место', 'свободно', 'девушка', 'работа', 'предложение',
        'viagem', 'jantar', 'serviço', 'acordo', 'cliente', 'encontro', 'modelo', 'vaga', 'livre', 'disponível', 'quarto', 'garota', 'trabalho', 'oferta'
      ];

      const junkRegex = /кавказ|caucasi|chica o pareja|busco chica|busco pareja|busco mujer/i;

      const hasQuality = qualityWhitelist.some(kw => rawText.includes(kw));
      const hasJunk = junkRegex.test(rawText);

      if (!hasQuality || hasJunk) {
        return res.status(200).json({ ok: false, message: 'Ad rejected by quality or junk filter' });
      }

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

      const hash = getLeadHash(rawText);
      let isDuplicate = false;
      try {
        // 1. Check central SHA256 registry
        const hashDoc = await db.collection('lead_hashes').doc(hash).get();
        if (hashDoc.exists) {
          const hData = hashDoc.data();
          const createdAt = hData?.createdAt ? (typeof hData.createdAt === 'string' ? new Date(hData.createdAt).getTime() : (hData.createdAt.toMillis ? hData.createdAt.toMillis() : 0)) : 0;
          if ((Date.now() - createdAt) / (1000 * 60 * 60) < 24) {
             isDuplicate = true;
          }
        }
        
        // 2. Fallback check for exact text match in last 24 hours
        if (!isDuplicate) {
          const duplicateCheck = await db.collection('ofertas')
            .where('descripcion', '==', cleanTextEs)
            .where('timestamp', '>', new Date(Date.now() - 86400000))
            .get();
          if (!duplicateCheck.empty) isDuplicate = true;
        }
      } catch (e) {
        console.error('Dedupe check error:', e);
      }

      if (isDuplicate) {
        return res.status(200).json({ ok: false, message: 'Duplicate ad rejected', hash });
      }

      let finalCategoria = 'CAT_PLAZAS';
      // Improved explicit keyword boundaries to reduce false positives
      const escortRegex = /\b(escort|trans|compañía|masaje|erótico|erotico|classic|express|mvr|эскорт|массаж|интим)\b/i;
      const eventRegex = /\b(evento|event|invitación|invitacion|fiesta|cena|party|meeting|jantar|ужин)\b/i;

      if (escortRegex.test(rawText)) finalCategoria = 'CAT_ESCORTS';
      else if (eventRegex.test(rawText)) finalCategoria = 'CAT_EVENTOS';

      const finalTitulo = body.titulo || body.title || (cleanTextEs.split('\n')[0].substring(0, 50).trim()) || 'Nueva Oferta';
      let finalPlataforma = (body.plataforma || body.platform || 'TELEGRAM').toUpperCase();

      const payload = {
        textHash: hash, // Stores standardized SHA256
        titulo: finalTitulo,
        descripcion: cleanTextEs,
        activa: body.activa !== undefined ? body.activa : true,
        categoria: finalCategoria,
        plataforma: finalPlataforma,
        ubicacion: body.ubicacion || body.city || 'Global',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        translations: {
          es: { titulo: finalTitulo, descripcion: cleanTextEs },
          en: { titulo: body.title_en || finalTitulo, descripcion: body.text_en || cleanTextEn || cleanTextEs },
          ru: { titulo: body.title_ru || finalTitulo, descripcion: body.text_ru || cleanTextRu || cleanTextEs },
          pt: { titulo: body.title_pt || finalTitulo, descripcion: body.text_pt || cleanTextPt || cleanTextEs }
        },
        contact,
        presupuesto: body.presupuesto || body.budget || 'Open',
        ingestedAt: new Date().toISOString(),
        source: body.source || 'n8n_vps'
      };

      const docRef = await db.collection('ofertas').add(payload);
      
      // Atomic register in lead_hashes to protect concurrent streams
      try {
        await db.collection('lead_hashes').doc(hash).set({
          createdAt: new Date().toISOString(),
          lead_id: docRef.id,
          text_snippet: cleanTextEs.substring(0, 50)
        });
      } catch (e) {}

      res.json({ ok: true, id: docRef.id });
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

app.use('/api', router);
app.use('/jobs-api', router);
app.use('/', router);

exports.api_v2 = onRequest({ region: 'europe-west1', cors: true }, app);
