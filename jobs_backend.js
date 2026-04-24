require('dotenv').config()
const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const app = express()

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (err) => {
  console.error('🔥 [JOBS-API] Uncaught Exception:', err)
})
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 [JOBS-API] Unhandled Rejection at:', promise, 'reason:', reason)
})

// --- SECURITY MIDDLEWARE ---
app.use(cors())
app.use(express.json({ limit: '500kb' })) // Strict limit for ads JSON

const jobsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Limit each IP to 50 requests per window
  message: { error: 'Too many requests for the Jobs API' }
})
app.use('/api/', jobsLimiter)
const ADS_JSON_PATH = process.env.ADS_JSON_PATH || '/var/www/worldmodelsjobs/ads.json'
function readAds() {
  try {
    const raw = fs.readFileSync(ADS_JSON_PATH, 'utf-8')
    const data = JSON.parse(raw)
    if (Array.isArray(data)) return data
    return []
  } catch (_) {
    return []
  }
}
function writeAds(list) {
  const dir = path.dirname(ADS_JSON_PATH)
  try { fs.mkdirSync(dir, { recursive: true }) } catch (_) {}
  fs.writeFileSync(ADS_JSON_PATH, JSON.stringify(list))
}
app.get('/api/ads', (req, res) => {
  const ads = readAds()
  res.json({ ok: true, items: ads })
})
app.post('/api/ads', (req, res) => {
  // AUTHENTICATION GUARD
  const apiKey = process.env.JOBS_API_KEY
  const authHeader = req.headers['authorization'] || req.headers['x-api-key']
  
  if (apiKey && authHeader !== apiKey) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  const { id, title, description, price, location, date } = req.body || {}
  if (!title || !description) return res.status(400).json({ ok: false, error: 'missing_fields' })
  const ads = readAds()
  const item = {
    id: id || String(Date.now()),
    title: String(title).trim(),
    description: String(description).trim(),
    price: price != null ? Number(price) : null,
    location: location ? String(location).trim() : null,
    date: date ? String(date).trim() : new Date().toISOString()
  }
  ads.unshift(item)
  writeAds(ads)
  res.json({ ok: true, item })
})
const PORT = process.env.JOBS_API_PORT || 3100
app.listen(PORT, () => {
  process.stdout.write('wmjobs_api:' + PORT + '\n')
})
