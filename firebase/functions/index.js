const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const secretRoutingPassword = defineSecret('ROUTING_PASSWORD');

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

function autoCategorize(text) {
  const content = (text || '').toLowerCase();

  const eventosKeywords = [
    'evento', 'party', 'fiesta', 'show', 'bolo', 'presentacion', 'casting',
    'club nocturno', 'club de noche', 'discoteca', 'vuelo privado', 'yate',
    'azafata', 'hostess', 'promotora', 'imagen', 'modelo evento',
    'inauguracion', 'gala', 'desfile', 'photoshoot', 'sesion de fotos',
  ];

  const plazasKeywords = [
    'vacante', 'contratando', 'puesto', 'oferta de trabajo', 'oferta laboral',
    'hiring', 'contratacion', 'se busca', 'buscamos', 'requisito', 'salario',
    'sueldo', 'reponedor', 'mozo', 'limpieza', 'camarero', 'camarera',
    'cocinero', 'cocinera', 'recepcionista', 'dependienta', 'dependiente',
    'plaza', 'jornada', 'turno', 'contrato',
  ];

  // Eventos primero — más específico y fácil de confirmar
  if (eventosKeywords.some(kw => content.includes(kw))) return 'CAT_EVENTOS';
  if (plazasKeywords.some(kw => content.includes(kw))) return 'CAT_PLAZAS';

  return 'CAT_GENERAL';
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

    const existing = await db.collection('lead_hashes').doc(hash).get();
    if (existing.exists) return res.status(200).json({ ok: false, message: 'Duplicate', hash });

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


// ============================================================
// ROUTING MANAGER — proxy to VPS, served from Firebase
// ============================================================
const axios_rm = require('axios');
const VPS_BASE = process.env.VPS_BASE_URL || 'http://178.156.186.149';
const VPS_API = VPS_BASE + '/api/routing';
const RM_PASSWORD = process.env.ROUTING_PASSWORD;
if (!RM_PASSWORD) console.error('[WARN] ROUTING_PASSWORD env var not set — routing endpoints will reject all requests');

const ROUTING_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WorldModels Routing</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#0a0a0a;color:#fff;min-height:100vh}.login{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.box{background:#1a1a1a;border:1px solid #333;border-radius:16px;padding:32px;width:100%;max-width:360px}.logo{text-align:center;font-size:26px;font-weight:700;color:#c9a84c;margin-bottom:6px}.sub{text-align:center;color:#666;font-size:13px;margin-bottom:24px}.app{display:none;padding:16px;max-width:600px;margin:0 auto}.hdr{display:flex;justify-content:space-between;align-items:center;padding:12px 0 20px;border-bottom:1px solid #222;margin-bottom:20px}.hdr h1{font-size:18px;color:#c9a84c}.btn{padding:10px 18px;border-radius:10px;border:none;cursor:pointer;font-size:14px;font-weight:600}.bgold{background:#c9a84c;color:#000}.bred{background:#c0392b;color:#fff}.bgray{background:#333;color:#aaa}.bsm{padding:6px 12px;font-size:12px;border-radius:8px}input{width:100%;padding:12px;border-radius:10px;border:1px solid #333;background:#111;color:#fff;font-size:14px;margin-bottom:10px}input:focus{outline:none;border-color:#c9a84c}label{display:block;font-size:12px;color:#888;margin-bottom:4px}.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:14px;padding:16px;margin-bottom:12px}.chdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.clbl{font-weight:700;font-size:15px;color:#c9a84c}.cinf{font-size:12px;color:#666;margin-top:3px}.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.tag{background:#222;border:1px solid #333;border-radius:6px;padding:3px 8px;font-size:11px;color:#aaa}.tagc{border-color:#c9a84c44;color:#c9a84c}.fsec{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:14px;padding:16px;margin-bottom:16px}.ftitle{font-size:13px;font-weight:700;color:#666;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px}.cgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}.citem{display:flex;align-items:center;gap:8px;background:#111;border:1px solid #333;border-radius:8px;padding:8px 10px;cursor:pointer}.citem input[type=checkbox]{width:auto;margin:0}.citem label{margin:0;font-size:13px;color:#ccc;cursor:pointer}.citem.sel{border-color:#c9a84c;background:#1a1500}.st{padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:12px;display:none}.stok{background:#0a2a0a;border:1px solid #1a5a1a;color:#4caf50;display:block}.sterr{background:#2a0a0a;border:1px solid #5a1a1a;color:#f44;display:block}.dim{opacity:0.5;pointer-events:none}hr{border:none;border-top:1px solid #222;margin:20px 0}
</style>
</head>
<body>
<div class="login" id="LS"><div class="box"><div class="logo">WorldModels</div><div class="sub">Routing Manager</div><label>Contrasena</label><input type="password" id="pw" placeholder="..." onkeydown="if(event.key==='Enter')login()"><button class="btn bgold" style="width:100%;margin-top:6px" onclick="login()">Entrar</button><div id="lerr" style="color:#f44;font-size:13px;margin-top:10px;text-align:center"></div></div></div>
<div class="app" id="AS"><div class="hdr"><h1>Routing Manager</h1><button class="btn bgold bsm" onclick="showForm()">+ Nueva clienta</button></div><div id="st" class="st"></div><div id="CL"></div><hr><div class="fsec" id="AF" style="display:none"><div class="ftitle" id="FT">Nueva Clienta</div><input type="hidden" id="EID"><label>Nombre o Etiqueta</label><input type="text" id="FL" placeholder="Ej: SOFIA_LONDON"><label>WhatsApp (numeros con prefijo pais)</label><input type="tel" id="FW" placeholder="447XXXXXXXXX"><label>Telegram username (opcional)</label><input type="text" id="FTG" placeholder="@username o vacio"><label>Ciudades</label><div class="cgrid" id="CG"></div><label>Solo categoria (opcional)</label><input type="text" id="FF" placeholder="Vacio = recibe todo"><div style="display:flex;gap:10px;margin-top:6px"><button class="btn bgold" style="flex:1" onclick="saveC()">Guardar y activar</button><button class="btn bgray" style="flex:0.4" onclick="cancelF()">Cancelar</button></div></div></div>
<script>
var API='/api/routing',pw='',clients=[];
var CITIES={ibiza:'Ibiza',marbella:'Marbella/Costa Sol',madrid:'Madrid',monaco:'Monaco/Niza/Cannes',london:'Londres/UK',russia_turkey:'Rusia/Turquia/Baku',suiza:'Suiza',amsterdam:'Amsterdam',dubai:'Dubai',paris:'Paris',berlin:'Berlin/Munich',viena:'Viena',tel_aviv:'Tel Aviv'};
function login(){pw=document.getElementById('pw').value;fetch(API+'/clients',{headers:{'x-routing-password':pw}}).then(function(r){if(r.status===401){document.getElementById('lerr').textContent='Contrasena incorrecta';return;}r.json().then(function(d){clients=d;document.getElementById('LS').style.display='none';document.getElementById('AS').style.display='block';render();buildGrid();});}).catch(function(){document.getElementById('lerr').textContent='Error';});}
function render(){var el=document.getElementById('CL');if(!clients.length){el.innerHTML='<p style="color:#555;text-align:center;padding:20px">Sin clientas</p>';return;}el.innerHTML=clients.map(function(c){return '<div class="card"><div class="chdr"><div><div class="clbl">'+c.label+'</div><div class="cinf">WA: +'+c.wa+(c.tg?' &middot; TG: '+c.tg:'')+'</div></div><div style="display:flex;gap:8px"><button class="btn bgray bsm" onclick="editC(\''+c.id+'\')">Editar</button><button class="btn bred bsm" onclick="delC(\''+c.id+'\')">Borrar</button></div></div><div class="tags">'+c.cities.map(function(x){return '<span class="tag tagc">'+(CITIES[x]||x)+'</span>';}).join('')+(c.categoryFilter?'<span class="tag">Solo: '+c.categoryFilter+'</span>':'<span class="tag">Todo</span>')+'</div></div>';}).join('');}
function buildGrid(){document.getElementById('CG').innerHTML=Object.keys(CITIES).map(function(k){return '<div class="citem" id="cw_'+k+'" onclick="togC(\''+k+'\')"><input type="checkbox" id="cb_'+k+'"><label>'+CITIES[k]+'</label></div>';}).join('');}
function togC(k){var cb=document.getElementById('cb_'+k);cb.checked=!cb.checked;document.getElementById('cw_'+k).className='citem'+(cb.checked?' sel':'');}
function showForm(){document.getElementById('EID').value='';document.getElementById('FL').value='';document.getElementById('FW').value='';document.getElementById('FTG').value='';document.getElementById('FF').value='';document.getElementById('FT').textContent='Nueva Clienta';Object.keys(CITIES).forEach(function(k){document.getElementById('cb_'+k).checked=false;document.getElementById('cw_'+k).className='citem';});var f=document.getElementById('AF');f.style.display='block';f.scrollIntoView({behavior:'smooth'});}
function editC(id){var c=clients.find(function(x){return x.id===id;});if(!c)return;document.getElementById('EID').value=c.id;document.getElementById('FL').value=c.label;document.getElementById('FW').value=c.wa;document.getElementById('FTG').value=c.tg||'';document.getElementById('FF').value=c.categoryFilter||'';document.getElementById('FT').textContent='Editar Clienta';Object.keys(CITIES).forEach(function(k){var s=c.cities.indexOf(k)!==-1;document.getElementById('cb_'+k).checked=s;document.getElementById('cw_'+k).className='citem'+(s?' sel':'');});var f=document.getElementById('AF');f.style.display='block';f.scrollIntoView({behavior:'smooth'});}
function cancelF(){document.getElementById('AF').style.display='none';}
function saveC(){var id=document.getElementById('EID').value;var label=document.getElementById('FL').value.trim().toUpperCase().replace(/\\s+/g,'_');var wa=document.getElementById('FW').value.replace(/\\D/g,'');var tg=document.getElementById('FTG').value.trim();var filt=document.getElementById('FF').value.trim();var cities=Object.keys(CITIES).filter(function(k){return document.getElementById('cb_'+k).checked;});if(!label||!wa||!cities.length){showSt('Rellena nombre, WA y ciudad',false);return;}var nc={id:id||(label+'_'+Date.now()),label:label,wa:wa,tg:tg,cities:cities,categoryFilter:filt};var updated=id?clients.map(function(c){return c.id===id?nc:c;}):[].concat(clients,[nc]);document.getElementById('AS').classList.add('dim');showSt('Guardando...',true,true);fetch(API+'/clients',{method:'POST',headers:{'Content-Type':'application/json','x-routing-password':pw},body:JSON.stringify(updated)}).then(function(r){return r.json();}).then(function(d){if(d.ok){clients=updated;render();cancelF();showSt('Guardado y activado',true);}else showSt('Error: '+d.error,false);document.getElementById('AS').classList.remove('dim');}).catch(function(){showSt('Error de red',false);document.getElementById('AS').classList.remove('dim');});}
function delC(id){if(!confirm('Eliminar?'))return;var updated=clients.filter(function(c){return c.id!==id;});fetch(API+'/clients',{method:'POST',headers:{'Content-Type':'application/json','x-routing-password':pw},body:JSON.stringify(updated)}).then(function(r){return r.json();}).then(function(d){if(d.ok){clients=updated;render();showSt('Eliminada',true);}else showSt('Error: '+d.error,false);});}
function showSt(msg,ok,neutral){var el=document.getElementById('st');el.className='st '+(neutral?'':ok?'stok':'sterr');el.textContent=msg;el.style.display='block';if(!neutral)setTimeout(function(){el.style.display='none';},4000);}
document.getElementById('pw').focus();
</script></body></html>`;

router.get('/routing', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(ROUTING_HTML);
});

router.get('/routing/clients', async (req, res) => {
  const pwd = req.headers['x-routing-password'] || req.query.pwd;
  if (pwd !== RM_PASSWORD) return res.status(401).json({error:'Unauthorized'});
  try {
    const r = await axios_rm.get(VPS_API + '/clients', {headers: {'x-routing-password': RM_PASSWORD}, timeout: 10000});
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.post('/routing/clients', async (req, res) => {
  const pwd = req.headers['x-routing-password'] || req.query.pwd;
  if (pwd !== RM_PASSWORD) return res.status(401).json({error:'Unauthorized'});
  try {
    const r = await axios_rm.post(VPS_API + '/clients', req.body, {
      headers: {'x-routing-password': RM_PASSWORD, 'Content-Type': 'application/json'},
      timeout: 30000
    });
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});

// ============================================================
// STRIPE WEBHOOK — forward raw body to VPS
// ============================================================
router.post('/stripe/webhook', express.raw({type:'application/json'}), async (req, res) => {
  try {
    const r = await axios_rm.post(VPS_BASE + '/api/stripe/webhook', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': req.headers['stripe-signature'] || ''
      },
      timeout: 15000
    });
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});

// Checkout session creator — proxy to VPS
router.post('/registro/checkout', async (req, res) => {
  try {
    const r = await axios_rm.post(VPS_BASE + '/api/registro/checkout', req.body, {
      headers: {'Content-Type': 'application/json'},
      timeout: 15000
    });
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});

// ============================================================
// ADMIN PANEL — proxy all /admin/* and /registro/reactivate to VPS
// ============================================================
const VPS_PROXY_ROUTES = [
  ['GET',    '/admin/bans'],
  ['POST',   '/admin/bans/number'],
  ['DELETE', '/admin/bans/number'],
  ['POST',   '/admin/bans/prefix'],
  ['DELETE', '/admin/bans/prefix'],
  ['GET',    '/admin/status'],
  ['POST',   '/admin/restart'],
  ['POST',   '/registro/reactivate'],
];

VPS_PROXY_ROUTES.forEach(([method, path]) => {
  router[method.toLowerCase()](path, async (req, res) => {
    try {
      const opts = {
        headers: {
          'Content-Type': 'application/json',
          'x-routing-password': req.headers['x-routing-password'] || ''
        },
        timeout: 15000
      };
      const url = VPS_BASE + '/api' + path;
      const r = method === 'GET'
        ? await axios_rm.get(url + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''), opts)
        : await axios_rm[method.toLowerCase()](url, req.body, opts);
      res.json(r.data);
    } catch(e) { res.status(500).json({error: e.message}); }
  });
});

// ============================================================
// SELF-REGISTRATION — proxy to VPS
// ============================================================
const VPS_REG = VPS_BASE + '/api/registro';

router.get('/registro/tg-poll', async (req, res) => {
  try {
    const r = await axios_rm.get(VPS_REG + '/tg-poll?token=' + (req.query.token || ''), {timeout: 5000});
    res.json(r.data);
  } catch(e) { res.json({tg_id: null}); }
});

router.post('/registro/register', async (req, res) => {
  try {
    const r = await axios_rm.post(VPS_REG + '/register', req.body, {
      headers: {'Content-Type': 'application/json'},
      timeout: 15000
    });
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});

// ============================================================
// WEB AUTH — proxy to VPS
// ============================================================
const VPS_AUTH = VPS_BASE + '/api/auth';

router.post('/auth/validate', async (req, res) => {
  try {
    const r = await axios_rm.post(VPS_AUTH + '/validate', req.body, {headers: {'Content-Type': 'application/json'}, timeout: 8000});
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.post('/auth/link-channel', async (req, res) => {
  try {
    const r = await axios_rm.post(VPS_AUTH + '/link-channel', req.body, {headers: {'Content-Type': 'application/json'}, timeout: 8000});
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});

exports.api = onRequest({ region: 'europe-west1', cors: true, secrets: [secretRoutingPassword] }, app)

// ============================================================
// WEB — proxy Next.js desde VPS (puerto 3000 via nginx)
// ============================================================
const webApp = express();
const VPS_WEB = VPS_BASE;

webApp.use(async (req, res) => {
  try {
    const url = VPS_WEB + req.url;
    const r = await axios_rm({
      method: req.method,
      url: url,
      headers: { ...req.headers, host: new URL(VPS_BASE).hostname },
      data: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      responseType: 'arraybuffer',
      timeout: 15000,
      validateStatus: () => true
    });
    res.status(r.status);
    const skipHeaders = ['transfer-encoding','connection','keep-alive'];
    Object.entries(r.headers).forEach(([k,v]) => { if (!skipHeaders.includes(k.toLowerCase())) res.set(k, v); });
    res.send(Buffer.from(r.data));
  } catch(e) {
    res.status(502).send('Error conectando con el servidor web: ' + e.message);
  }
});

exports.web = onRequest({ region: 'europe-west1', cors: false, invoker: 'public' }, webApp);