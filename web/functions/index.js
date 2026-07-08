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


// ============================================================
// ROUTING MANAGER — proxy to VPS, served from Firebase
// ============================================================
const axios_rm = require('axios');
const VPS_API = 'http://178.156.186.149/api/routing';
const RM_PASSWORD = 'WorldModels2026';

const ROUTING_HTML = "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">\n<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">\n<meta name=\"theme-color\" content=\"#0d0d14\">\n<title>WM Admin</title>\n<style>\n*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}\nbody{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d0d14;color:#e8e8f0;min-height:100dvh;overscroll-behavior:none}\n#login{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;padding:32px;gap:24px}\n.login-logo{font-size:28px;font-weight:700;letter-spacing:2px;color:#c89dff}\n.login-sub{color:#888;font-size:13px}\n.login-box{background:#1a1a26;border:1px solid #2a2a3e;border-radius:16px;padding:28px;width:100%;max-width:360px;display:flex;flex-direction:column;gap:16px}\ninput[type=password]{background:#0d0d14;border:1px solid #2a2a3e;border-radius:10px;color:#e8e8f0;font-size:16px;padding:14px 16px;width:100%;outline:none}\ninput[type=password]:focus{border-color:#c89dff}\n#app{display:none;flex-direction:column;min-height:100dvh}\n.topbar{background:#1a1a26;border-bottom:1px solid #2a2a3e;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}\n.topbar-title{font-weight:700;font-size:17px;letter-spacing:1px;color:#c89dff}\n.status-dot{width:8px;height:8px;border-radius:50%;background:#555;display:inline-block;margin-right:6px}\n.status-dot.ok{background:#22c55e}.status-dot.err{background:#ef4444}\n.status-label{font-size:12px;color:#aaa}\n.content{padding:16px;display:flex;flex-direction:column;gap:12px;padding-bottom:100px}\n.card{background:#1a1a26;border:1px solid #2a2a3e;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px}\n.card.inactive{opacity:.5;border-color:#1e1e2e}\n.card-header{display:flex;align-items:center;justify-content:space-between}\n.card-name{font-weight:600;font-size:15px}\n.card-wa{font-size:12px;color:#888;margin-top:2px}\n.lang-badge{display:inline-block;background:#1e1940;border:1px solid #3a2f70;color:#a78bfa;border-radius:4px;font-size:10px;padding:1px 5px;margin-left:4px;vertical-align:middle}\n.card-cities{display:flex;flex-wrap:wrap;gap:6px}\n.city-tag{background:#1e1940;border:1px solid #3a2f70;color:#a78bfa;border-radius:6px;font-size:11px;padding:3px 8px}\n.card-actions{display:flex;gap:8px;margin-top:4px}\n.btn{display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;padding:10px 16px;transition:opacity .15s}\n.btn-primary{background:#7c3aed;color:#fff}.btn-primary:active{opacity:.8}\n.btn-danger{background:#3f1010;color:#ef4444;border:1px solid #5a1010}.btn-danger:active{opacity:.7}\n.btn-success{background:#0f2e1f;color:#22c55e;border:1px solid #1a5c35}.btn-success:active{opacity:.7}\n.btn-ghost{background:#1e1e2e;color:#aaa;border:1px solid #2a2a3e}.btn-ghost:active{opacity:.7}\n.btn-icon{background:none;border:none;color:#888;cursor:pointer;padding:6px;font-size:18px}\n.btn-sm{padding:7px 12px;font-size:12px;border-radius:8px}\n.fab{position:fixed;bottom:24px;right:20px;width:56px;height:56px;border-radius:28px;background:#7c3aed;color:#fff;font-size:28px;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(124,58,237,.5);display:flex;align-items:center;justify-content:center;z-index:20}\n.fab:active{transform:scale(.95)}\n.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:30;display:none;align-items:flex-end}\n.overlay.open{display:flex}\n.drawer{background:#1a1a26;border-radius:20px 20px 0 0;width:100%;max-height:92dvh;overflow-y:auto;padding:20px 20px 40px}\n.drawer-handle{width:40px;height:4px;background:#2a2a3e;border-radius:2px;margin:0 auto 20px}\n.drawer-title{font-size:17px;font-weight:700;margin-bottom:20px;color:#c89dff}\n.form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}\n.form-label{font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.5px}\ninput[type=text],input[type=tel]{background:#0d0d14;border:1px solid #2a2a3e;border-radius:10px;color:#e8e8f0;font-size:15px;padding:12px 14px;width:100%;outline:none}\ninput[type=text]:focus,input[type=tel]:focus{border-color:#7c3aed}\n.option-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.opt-chip{display:flex;align-items:center;gap:8px;background:#0d0d14;border:1px solid #2a2a3e;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:13px}\n.opt-chip.selected{background:#1e1940;border-color:#7c3aed;color:#a78bfa}\n.sync-bar{background:#0f2e1f;border:1px solid #1a5c35;border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between}\n.sync-info{font-size:12px;color:#4ade80}\n.empty{text-align:center;padding:40px 20px;color:#444;font-size:14px}\n.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1a1a26;border:1px solid #2a2a3e;border-radius:10px;padding:10px 20px;font-size:13px;z-index:50;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}\n.toast.show{opacity:1}\n.section-header{font-size:11px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-top:4px}\n</style>\n</head>\n<body>\n<div id=\"login\">\n  <div class=\"login-logo\">\u25c6 WORLDMODELS</div>\n  <div class=\"login-sub\">Panel de administraci\u00f3n</div>\n  <div class=\"login-box\">\n    <input type=\"password\" id=\"pwdInput\" placeholder=\"Contrase\u00f1a\" autocomplete=\"current-password\">\n    <button class=\"btn btn-primary\" onclick=\"doLogin()\">Entrar</button>\n    <div id=\"loginErr\" style=\"color:#ef4444;font-size:12px;text-align:center;display:none\">Contrase\u00f1a incorrecta</div>\n  </div>\n</div>\n<div id=\"app\">\n  <div class=\"topbar\">\n    <div class=\"topbar-title\">\u25c6 WM Admin</div>\n    <div style=\"display:flex;align-items:center;gap:12px\">\n      <div><span class=\"status-dot\" id=\"n8nDot\"></span><span class=\"status-label\" id=\"n8nLabel\">\u2013</span></div>\n      <button class=\"btn-icon\" onclick=\"doLogout()\">\u23cf</button>\n    </div>\n  </div>\n  <div class=\"content\">\n    <div class=\"sync-bar\">\n      <span class=\"sync-info\" id=\"syncInfo\">Cargando\u2026</span>\n      <button class=\"btn btn-success btn-sm\" id=\"syncBtn\" onclick=\"forceSync()\">\u27f3 Sync</button>\n    </div>\n    <div class=\"section-header\">Clientes activos</div>\n    <div id=\"clientList\"><div class=\"empty\">Cargando\u2026</div></div>\n    <div id=\"inactiveSection\" style=\"display:none\">\n      <div class=\"section-header\" style=\"margin-top:8px\">Inactivos</div>\n      <div id=\"inactiveList\"></div>\n    </div>\n  </div>\n  <button class=\"fab\" onclick=\"openAdd()\">+</button>\n</div>\n<div class=\"overlay\" id=\"overlay\" onclick=\"closeDrawer(event)\">\n  <div class=\"drawer\">\n    <div class=\"drawer-handle\"></div>\n    <div class=\"drawer-title\" id=\"drawerTitle\">Nuevo cliente</div>\n    <div class=\"form-group\">\n      <div class=\"form-label\">Nombre / etiqueta</div>\n      <input type=\"text\" id=\"fLabel\" placeholder=\"Ej: DUBAI_CLIENT\" maxlength=\"30\">\n    </div>\n    <div class=\"form-group\">\n      <div class=\"form-label\">WhatsApp (d\u00edgitos con prefijo pa\u00eds)</div>\n      <input type=\"tel\" id=\"fWa\" placeholder=\"34XXXXXXXXX\" maxlength=\"20\">\n    </div>\n    <div class=\"form-group\">\n      <div class=\"form-label\">Telegram (opcional)</div>\n      <input type=\"text\" id=\"fTg\" placeholder=\"@username o ID num\u00e9rico\">\n    </div>\n    <div class=\"form-group\">\n      <div class=\"form-label\">Idioma de los mensajes WA</div>\n      <div class=\"option-grid\" id=\"langGrid\">\n        <div class=\"opt-chip selected\" data-lang=\"es\" onclick=\"selectLang('es')\">\ud83c\uddea\ud83c\uddf8 Espa\u00f1ol</div>\n        <div class=\"opt-chip\" data-lang=\"en\" onclick=\"selectLang('en')\">\ud83c\uddec\ud83c\udde7 English</div>\n        <div class=\"opt-chip\" data-lang=\"ru\" onclick=\"selectLang('ru')\">\ud83c\uddf7\ud83c\uddfa \u0420\u0443\u0441\u0441\u043a\u0438\u0439</div>\n        <div class=\"opt-chip\" data-lang=\"pt\" onclick=\"selectLang('pt')\">\ud83c\uddf5\ud83c\uddf9 Portugu\u00eas</div>\n      </div>\n    </div>\n    <div class=\"form-group\">\n      <div class=\"form-label\">Zonas que recibe</div>\n      <div class=\"option-grid\" id=\"citiesGrid\"></div>\n    </div>\n    <div style=\"display:flex;gap:10px;margin-top:8px\">\n      <button class=\"btn btn-ghost\" style=\"flex:1\" onclick=\"closeOverlay()\">Cancelar</button>\n      <button class=\"btn btn-primary\" style=\"flex:2\" id=\"saveBtn\" onclick=\"saveClient()\">Guardar</button>\n    </div>\n  </div>\n</div>\n<div class=\"toast\" id=\"toast\"></div>\n<script>\nconst API='/api/routing';\nconst CITIES=[\n  {id:'ibiza',name:'Ibiza'},{id:'marbella',name:'Marbella'},{id:'madrid',name:'Madrid'},\n  {id:'barcelona',name:'Barcelona'},{id:'monaco',name:'M\u00f3naco/Niza'},{id:'paris',name:'Par\u00eds'},\n  {id:'amsterdam',name:'\u00c1msterdam'},{id:'berlin',name:'Berl\u00edn'},{id:'london',name:'Londres'},\n  {id:'suiza',name:'Suiza'},{id:'russia_turkey',name:'Rusia/Turqu\u00eda'},{id:'dubai',name:'Dub\u00e1i'},\n  {id:'new_york',name:'Nueva York'},{id:'miami',name:'Miami'},{id:'los_angeles',name:'L.A.'},\n  {id:'cartagena',name:'Cartagena'},{id:'boston',name:'Boston'},\n];\nconst LANG_FLAGS={es:'\ud83c\uddea\ud83c\uddf8',en:'\ud83c\uddec\ud83c\udde7',ru:'\ud83c\uddf7\ud83c\uddfa',pt:'\ud83c\uddf5\ud83c\uddf9'};\nlet pwd='',clients=[],editId=null;\n\nfunction doLogin(){\n  const p=document.getElementById('pwdInput').value;\n  document.getElementById('loginErr').style.display='none';\n  fetch(API+'/clients',{headers:{'x-routing-password':p}})\n    .then(r=>{if(!r.ok)throw new Error();return r.json();})\n    .then(data=>{pwd=p;localStorage.setItem('wm_pwd',p);clients=data;\n      document.getElementById('login').style.display='none';\n      document.getElementById('app').style.display='flex';\n      renderClients();loadStatus();})\n    .catch(()=>document.getElementById('loginErr').style.display='block');\n}\nfunction doLogout(){localStorage.removeItem('wm_pwd');pwd='';document.getElementById('login').style.display='flex';document.getElementById('app').style.display='none';}\ndocument.getElementById('pwdInput').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});\nconst saved=localStorage.getItem('wm_pwd');if(saved){document.getElementById('pwdInput').value=saved;doLogin();}\n\nfunction renderClients(){\n  const active=clients.filter(c=>c.active!==false);\n  const inactive=clients.filter(c=>c.active===false);\n  document.getElementById('clientList').innerHTML=active.length?active.map(c=>cardHTML(c,false)).join(''):'<div class=\"empty\">No hay clientes activos</div>';\n  const sec=document.getElementById('inactiveSection');\n  if(inactive.length){sec.style.display='block';document.getElementById('inactiveList').innerHTML=inactive.map(c=>cardHTML(c,true)).join('');}\n  else sec.style.display='none';\n}\nfunction cardHTML(c,isInactive){\n  const tags=(c.cities||[]).map(ci=>{const f=CITIES.find(x=>x.id===ci);return '<span class=\"city-tag\">'+(f?f.name:ci)+'</span>';}).join('');\n  const flag=LANG_FLAGS[c.lang||'es']||'';\n  return '<div class=\"card'+(isInactive?' inactive':'')+'\">'+\n    '<div class=\"card-header\">'+\n      '<div><div class=\"card-name\">'+esc(c.label||'?')+'</div>'+\n      '<div class=\"card-wa\">+'+esc(c.wa||'')+(c.tg?' \u00b7 '+esc(c.tg):'')+'<span class=\"lang-badge\">'+flag+' '+(c.lang||'es').toUpperCase()+'</span></div></div>'+\n      '<button class=\"btn-icon\" onclick=\"deleteClient(\\''+c.id+'\\')\">\ud83d\uddd1</button>'+\n    '</div>'+\n    '<div class=\"card-cities\">'+(tags||'<span style=\"color:#555;font-size:12px\">Sin zonas</span>')+'</div>'+\n    '<div class=\"card-actions\">'+\n      '<button class=\"btn btn-ghost btn-sm\" style=\"flex:1\" onclick=\"editClient(\\''+c.id+'\\')\">\u270f Editar</button>'+\n      '<button class=\"btn '+(isInactive?'btn-success':'btn-danger')+' btn-sm\" style=\"flex:1\" onclick=\"toggleActive(\\''+c.id+'\\')\">'+(isInactive?'\u2713 Activar':'\u2715 Pausar')+'</button>'+\n    '</div></div>';\n}\nfunction esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}\n\nfunction selectLang(l){document.querySelectorAll('#langGrid .opt-chip').forEach(el=>el.classList.toggle('selected',el.dataset.lang===l));}\nfunction getSelectedLang(){const el=document.querySelector('#langGrid .opt-chip.selected');return el?el.dataset.lang:'es';}\nfunction buildCitiesGrid(sel){document.getElementById('citiesGrid').innerHTML=CITIES.map(c=>'<div class=\"opt-chip'+(sel.includes(c.id)?' selected':'')+'\" data-city=\"'+c.id+'\" onclick=\"this.classList.toggle(\\'selected\\')\">'+c.name+'</div>').join('');}\n\nlet lastSync=null;\nfunction loadStatus(){\n  fetch('/api/admin/status',{headers:{'x-routing-password':pwd}}).then(r=>r.ok?r.json():null).then(data=>{\n    if(!data)return;\n    const ok=data.processes&&data.processes.every(p=>p.status==='online');\n    document.getElementById('n8nDot').className='status-dot '+(ok?'ok':'err');\n    document.getElementById('n8nLabel').textContent=ok?'online':'error';\n  }).catch(()=>{});\n  if(lastSync){const m=Math.round((Date.now()-lastSync)/60000);document.getElementById('syncInfo').textContent='\u00daltimo sync: hace '+m+' min';}\n}\nsetInterval(loadStatus,60000);\n\nfunction forceSync(){\n  const btn=document.getElementById('syncBtn');btn.textContent='\u2026';btn.disabled=true;\n  fetch(API+'/sync',{method:'POST',headers:{'Content-Type':'application/json','x-routing-password':pwd},body:'{}'})\n    .then(r=>r.json()).then(d=>{lastSync=Date.now();document.getElementById('syncInfo').textContent='Sync OK \u00b7 '+d.pushed+' clientes \u00b7 '+new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});toast('\u2713 Sincronizado con n8n');})\n    .catch(()=>toast('Error al sincronizar','err')).finally(()=>{btn.textContent='\u27f3 Sync';btn.disabled=false;});\n}\n\nfunction saveClient(){\n  const label=document.getElementById('fLabel').value.trim().toUpperCase();\n  const wa=document.getElementById('fWa').value.replace(/\\D/g,'');\n  const tg=document.getElementById('fTg').value.trim();\n  const lang=getSelectedLang();\n  const cities=[...document.querySelectorAll('#citiesGrid .opt-chip.selected')].map(el=>el.dataset.city);\n  if(!label){toast('Falta el nombre','err');return;}\n  if(!wa||wa.length<8){toast('WhatsApp inv\u00e1lido','err');return;}\n  if(!cities.length){toast('Selecciona al menos una zona','err');return;}\n  if(editId){const i=clients.findIndex(c=>c.id===editId);if(i>=0)clients[i]={...clients[i],label,wa,tg,lang,cities};}\n  else clients.push({id:'cl_'+Date.now(),label,wa,tg,lang,cities,active:true});\n  const btn=document.getElementById('saveBtn');btn.textContent='Guardando\u2026';btn.disabled=true;\n  fetch(API+'/clients',{method:'POST',headers:{'Content-Type':'application/json','x-routing-password':pwd},body:JSON.stringify(clients)})\n    .then(r=>r.json()).then(()=>{closeOverlay();renderClients();toast(editId?'\u2713 Cliente actualizado':'\u2713 Cliente a\u00f1adido');lastSync=Date.now();document.getElementById('syncInfo').textContent='Sync OK \u00b7 '+clients.filter(c=>c.active!==false).length+' clientes \u00b7 '+new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});})\n    .catch(()=>toast('Error al guardar','err')).finally(()=>{btn.textContent='Guardar';btn.disabled=false;});\n}\nfunction toggleActive(id){\n  const c=clients.find(x=>x.id===id);if(!c)return;\n  if(c.active!==false&&clients.filter(x=>x.active!==false).length<=1){toast('No puedes pausar el \u00faltimo cliente activo','err');return;}\n  c.active=c.active===false?true:false;\n  fetch(API+'/clients',{method:'POST',headers:{'Content-Type':'application/json','x-routing-password':pwd},body:JSON.stringify(clients)})\n    .then(()=>{renderClients();toast(c.active?'\u2713 Activado':'Pausado');}).catch(()=>toast('Error','err'));\n}\nfunction deleteClient(id){\n  const c=clients.find(x=>x.id===id);if(!c)return;\n  if(!confirm('\u00bfEliminar '+c.label+'?'))return;\n  clients=clients.filter(x=>x.id!==id);\n  fetch(API+'/clients',{method:'POST',headers:{'Content-Type':'application/json','x-routing-password':pwd},body:JSON.stringify(clients)})\n    .then(()=>{renderClients();toast('Cliente eliminado');}).catch(()=>toast('Error','err'));\n}\nfunction openAdd(){editId=null;document.getElementById('drawerTitle').textContent='Nuevo cliente';document.getElementById('fLabel').value='';document.getElementById('fWa').value='';document.getElementById('fTg').value='';selectLang('es');buildCitiesGrid([]);document.getElementById('overlay').classList.add('open');}\nfunction editClient(id){editId=id;const c=clients.find(x=>x.id===id);if(!c)return;document.getElementById('drawerTitle').textContent='Editar: '+c.label;document.getElementById('fLabel').value=c.label||'';document.getElementById('fWa').value=c.wa||'';document.getElementById('fTg').value=c.tg||'';selectLang(c.lang||'es');buildCitiesGrid(c.cities||[]);document.getElementById('overlay').classList.add('open');}\nfunction closeDrawer(e){if(e.target===document.getElementById('overlay'))closeOverlay();}\nfunction closeOverlay(){document.getElementById('overlay').classList.remove('open');editId=null;}\nlet toastTimer;\nfunction toast(msg,type){const el=document.getElementById('toast');el.textContent=msg;el.style.color=type==='err'?'#ef4444':'#4ade80';el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);}\n</script>\n</body>\n</html>\n";

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

router.post('/routing/sync', async (req, res) => {
  const pwd = req.headers['x-routing-password'] || (req.body && req.body.password);
  if (pwd !== RM_PASSWORD) return res.status(401).json({error:'Unauthorized'});
  try {
    const r = await axios_rm.post(VPS_API + '/sync', {}, {
      headers: {'x-routing-password': RM_PASSWORD, 'Content-Type': 'application/json'},
      timeout: 30000
    });
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.get('/admin/status', async (req, res) => {
  const pwd = req.headers['x-routing-password'] || req.query.pwd;
  if (pwd !== RM_PASSWORD) return res.status(401).json({error:'Unauthorized'});
  try {
    const r = await axios_rm.get('http://178.156.186.149/api/admin/status', {
      headers: {'x-routing-password': RM_PASSWORD}, timeout: 8000
    });
    res.json(r.data);
  } catch(e) { res.status(500).json({error: e.message}); }
});


// ============================================================
// STRIPE WEBHOOK — forward raw body to VPS
// ============================================================
router.post('/stripe/webhook', express.raw({type:'application/json'}), async (req, res) => {
  try {
    const r = await axios_rm.post('http://178.156.186.149/api/stripe/webhook', req.body, {
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
    const r = await axios_rm.post('http://178.156.186.149/api/registro/checkout', req.body, {
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
      const url = 'http://178.156.186.149/api' + path;
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
const VPS_REG = 'http://178.156.186.149/api/registro';

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
const VPS_AUTH = 'http://178.156.186.149/api/auth';

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

exports.api = onRequest({ region: 'europe-west1', cors: true }, app)

// ============================================================
// WEB — proxy Next.js desde VPS (puerto 3000 via nginx)
// ============================================================
const webApp = express();
const VPS_WEB = 'http://178.156.186.149';

webApp.use(async (req, res) => {
  try {
    const url = VPS_WEB + req.url;
    const r = await axios_rm({
      method: req.method,
      url: url,
      headers: { ...req.headers, host: '178.156.186.149' },
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