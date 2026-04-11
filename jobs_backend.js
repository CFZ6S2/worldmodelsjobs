const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
app.use(express.json())
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
