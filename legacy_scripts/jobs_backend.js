require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('pino')({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

const app = express();

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (err) => {
  logger.error({ err }, '🔥 [FATAL] Uncaught Exception');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, '🔥 [FATAL] Unhandled Rejection');
});

// --- CONFIGURATION ---
const ADS_JSON_PATH = process.env.ADS_JSON_PATH || path.join(__dirname, 'ads.json');
const JOBS_API_KEY = process.env.JOBS_API_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(o => o);

// --- SECURITY MIDDLEWARE ---
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      logger.warn({ origin }, '🛡️ [CORS] Blocked request from unauthorized origin');
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '256kb' })); // HARDENED: Strict body limit for ads

const jobsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', jobsLimiter);

// --- HELPERS ---
function readAds() {
  try {
    if (!fs.existsSync(ADS_JSON_PATH)) return [];
    const raw = fs.readFileSync(ADS_JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    logger.error({ err }, '❌ Error reading ads.json');
    return [];
  }
}

function writeAds(list) {
  const dir = path.dirname(ADS_JSON_PATH);
  const tempPath = `${ADS_JSON_PATH}.tmp`;
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // HARDENED: Atomic write (write to temp file then rename)
    fs.writeFileSync(tempPath, JSON.stringify(list, null, 2));
    fs.renameSync(tempPath, ADS_JSON_PATH);
    logger.info('💾 [STORAGE] ads.json updated successfully (atomic)');
  } catch (err) {
    logger.error({ err }, '❌ Error writing ads.json');
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw err;
  }
}

// --- ROUTES ---
app.get('/api/ads', (req, res) => {
  const ads = readAds();
  res.json({ ok: true, items: ads });
});

app.post('/api/ads', (req, res) => {
  try {
    // HARDENED: Authentication Guard
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
    if (JOBS_API_KEY && authHeader !== JOBS_API_KEY) {
      logger.warn('🛡️ [AUTH] Unauthorized POST attempt to /api/ads');
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const { id, title, description, price, location, date } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    const ads = readAds();
    const item = {
      id: id || String(Date.now()),
      title: String(title).trim(),
      description: String(description).trim(),
      price: price != null ? Number(price) : null,
      location: location ? String(location).trim() : null,
      date: date ? String(date).trim() : new Date().toISOString()
    };

    ads.unshift(item);
    writeAds(ads.slice(0, 1000)); // Keep only latest 1000 items to prevent bloat
    
    logger.info({ adId: item.id, title: item.title }, '✅ [JOBS] New ad published successfully');
    res.json({ ok: true, item });
  } catch (err) {
    logger.error({ err }, '❌ Error processing POST /api/ads');
    res.status(500).json({ ok: false, error: 'internal_server_error' });
  }
});

const PORT = process.env.JOBS_API_PORT || 3100;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Jobs API listening on port ${PORT}`);
});
