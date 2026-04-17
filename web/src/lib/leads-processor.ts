import { createHash } from 'crypto';
import { adminDb } from './firebase-admin';

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0].map((x: any) => x[0]).join('');
  } catch (error) {
    console.error(`[Translate] Error translating to ${targetLang}:`, error);
    return text; // Fallback to original
  }
}

export function normalizeForDedupe(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const BANNED_NUMBERS = [
  '5547936188098', '351926822219', '491744723429', '5511993439714', '5511910881933', '923220067913', '16193545051', '5573991142402',
  '351966967025', '353894106470', '919672019746', '5545935056582', '556193888963', '447877354053', '351918673812', '447752825109',
  '5521986713221', '447857761695', '351920755741', '13235002297', '351933204215', '447518038911', '5521981174629', '5511977482482',
  '447308058219', '447723822600', '447448540579', '351927597878', '554797204383', '33749730432', '555391459164', '79963624515',
  '79362632269', '351927357525', '5513996848506', '351911887986', '447466297625', '447892873144', '34651303213', '447400757648',
  '31620216067', '34685647898', '556281163551', '447457422608', '351963213706', '351929073877', '5521983514307', '553497670505',
  '447377623582', '556293110529', '351912131056', '447487698165', '555194401739', '447946485621', '22999574171', '447766470330',
  '447878701129', '555189100041', '555192072204', '351924938305', '447451239098', '447821951926', '5518996148613', '559281324293',
  '4915214453550', '556291433112', '447946304880', '447599476143', '306974107999', '447902286259', '34674141224', '447782314732',
  '258850634194', '447448422578', '447411574134', '34711269334', '447877768537', '16128399721', '447922639195', '447728524014',
  '5521983827523', '556298150720', '447541742768', '34624174047', '351920358247', '22957220770', '447520622873', '5521995574624',
  '32487279353', '380937192123', '558589279166', '2348081002335', '2349077283597', '919891344354', '447492414091', '447477732578',
  '34625375125'
];

export const BANNED_KEYWORDS = [
  'crypto', 'binance', 'forex', 'casino', 'stake', 'signals', 'trading', 'pump', 'usdt', 'virtual', 'inversión', 'ganar dinero', 'bitget',
  'banco', 'bancaria', 'bancarias', 'bancario', 'cuenta bancaria', 'bank', 'account', 'conta', 'conta bancária', 'банк', 'банковский', 'счет', 'mercado pago', 'nubank', 'pic pay',
  'cocina', 'cocinero', 'cocinera', 'camarero', 'camarera', 'repartidor', 'repartidora', 'limpieza', 'obra', 'pintor', 'almacén', 'mantenimiento',
  'canales', 'canal', 'contenido virtual', 'fimdom', 'musica', 'residencia', 'paypig',
  'clases de', 'aprender inglés', 'aprender ingles', 'profesor', 'teacher', 'idiomas', 'online', 'zoom', 'english classes', 'aulas de',
  'perro', 'gato', 'mascota', 'teocar', 'veiculo', 'carro', 'automoveis', 'venda', 'vender',
  'hombre busca', 'pasivo', 'pasivos', 'hombre generoso', 'conoceré', 'man looks', 'man seeking', 'man seeks', 'generous man', 'passive', 'sugar daddy', 'busco hombre',
  'visa', 'brexit', 'pasaporte', 'trámite', 'asilo',
  'cripto', 'criptomoneda', 'receptor', 'fiduciaria',
  'medicamento', 'viagra', 'sildenafil', 'farmacia', 'medicina', 'drugs', 'pastillas', 'pills', 'medicine', 'medication', 'remédio', 'pílulas', 'лекарство', 'лекарства', 'аптека', 'таблетки',
  'seguro', 'coche', 'matrícula', 'matricula', 'automóvil', 'vehículo', 'carro', 'insurance', 'car', 'vehicle', 'registration', 'plate', 'страхование', 'машина', 'автомобиль',
  'droga', 'drogas', 'drugs', 'cocaína', 'cocaina', 'coke', 'perico', 'nieve', 'tusi', 'tusibi', '2cb', 'marihuana', 'hierba', 'weed', 'maconha', 'porro', 'canuto', 'pastilla', 'éxtasis', 'extasis', 'mdma', 'mda', 'cristal', 'metanfetamina', 'crack', 'base', 'heroína', 'heroina', 'vaper', 'airbnb'
];

export async function processLead(body: any) {
  try {
    const isValidId = (v: any) => v && typeof v === 'string' && v.length > 5 && !['unknown', 'undefined', 'null'].includes(v.toLowerCase());

    const rawContact = (
      (isValidId(body.remoteJid) ? body.remoteJid : null) ||
      (isValidId(body.chatId) ? body.chatId : null) ||
      (isValidId(body.contact) ? body.contact : null) ||
      (isValidId(body.from) ? body.from : null) ||
      (isValidId(body.chat_id) ? body.chat_id : null) ||
      ''
    ).toString();

    const isWhatsAppGroup = rawContact.includes('@g.us') || body.isGroup === true || body.isGroup === 'true' || body.is_group === true;
    const isTelegramGroup = rawContact.startsWith('-100') || body.chat_type === 'supergroup' || body.chat_type === 'group' || body.message?.chat?.type === 'supergroup' || body.message?.chat?.type === 'group';
    const isGroup = isWhatsAppGroup || isTelegramGroup || (body.isGroup === true || body.isGroup === 'true' || body.is_group === true || body.is_group === 'true');

    if (!isGroup) {
      return { success: true, message: 'Lead rechazado: Esta plataforma EXCLUSIVAMENTE procesa fuentes de GRUPOS.' };
    }

    const sender_raw = body.contact || body.sender_contact || body.whatsapp || '';
    const sender_digits = sender_raw.replace(/\D/g, '');

    if (sender_digits && BANNED_NUMBERS.includes(sender_digits)) {
      return { success: false, error: 'SENDER_BANNED' };
    }

    if (sender_digits && sender_digits.length > 5) {
      const bannedDoc = await adminDb.collection('banned_users').doc(sender_digits).get();
      if (bannedDoc.exists) return { success: false, error: 'SENDER_BANNED' };
    }

    const availableTexts = [body.text_es, body.descripcion, body.rawText, body.raw_text, body.summary, body.text].filter(t => typeof t === 'string' && t.trim().length > 0);
    const raw_text = (availableTexts.sort((a, b) => b.length - a.length)[0] || '').trim();
    if (raw_text.length < 50) {
      return { success: false, error: 'LEAD_EMPTY_OR_TOO_SHORT', message: 'Contenido demasiado corto (< 50).' };
    }

    const text_to_check = raw_text.toLowerCase();
    const found_banned = BANNED_KEYWORDS.find(k => (new RegExp(`\\b${k}\\b`, 'i')).test(text_to_check));

    if (found_banned) {
      if (sender_digits && sender_digits.length > 5) {
        await adminDb.collection('banned_users').doc(sender_digits).set({
          reason: `Baneo automático: Contenido Prohibido ("${found_banned}")`,
          bannedAt: new Date().toISOString(),
          phone: sender_digits,
          evidence: raw_text.substring(0, 500)
        });
      }
      return { success: false, error: 'LEAD_BANNED_CONTENT', message: `Contenido prohibido: "${found_banned}".` };
    }

    if (body.trash === true || body.trash_early === true) {
      return { success: true, message: 'Lead descartado (Trash Filter)' };
    }

    const textLower = raw_text.toLowerCase();

    let finalCity = body.city || body.ubicacion || body.ciudad || '';
    if (!finalCity || ['GLOBAL', 'UNKNOWN', ''].includes(finalCity.toUpperCase())) {
      const HOT_CITIES = ['marbella', 'madrid', 'barcelona', 'ibiza', 'valencia', 'sevilla', 'málaga', 'malaga', 'london', 'dubai', 'paris', 'milan', 'monaco', 'berlin', 'roma', 'lisboa', 'porto', 'miami', 'new york', 'cancun', 'limassol', 'chipre', 'cyprus', 'kipr', 'кипр', 'лимассол', 'atenas', 'marrakech', 'moscow', 'st petersburg'];
      const foundCity = HOT_CITIES.find(city => new RegExp(`\\b${city}\\b`, 'i').test(textLower));
      if (foundCity) {
        finalCity = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
      } else {
        const cityMatch = raw_text.substring(0, 40).match(/^\*?([A-Za-zñÑáéíóúÁÉÍÓÚ\s]{3,20})\*?[:\-\s]/i);
        finalCity = cityMatch ? cityMatch[1].trim() : 'Global';
      }
    }

    let finalBudget = body.budget || body.presupuesto || '';
    if (!finalBudget || finalBudget === 'Negociable') {
      const budgetMatch = raw_text.match(/(?:(?:€|\$|£|EUR|USD|GBP)\s?(\d+(?:[.,]\d+)?))|(?:(\d+(?:[.,]\d+)?)\s?(?:€|\$|£|k|EUR|USD|GBP|euros|libras|dólares|dolares|netos))/i);
      if (budgetMatch) {
        const amount = budgetMatch[1] || budgetMatch[2];
        finalBudget = budgetMatch[0].toLowerCase().includes('k') ? `${amount}k` : `${amount}€`;
      } else {
        finalBudget = 'Negociable';
      }
    }

    let manualCat = body.categoria || body.category;
    let incomingCat = (manualCat || 'CAT_PLAZAS').toUpperCase();

    const event_keywords = ['fiesta', 'evento', 'despedida', 'cena', 'horas', 'encuentro', 'travel', 'eurotour', 'booking', 'dates', 'destination', 'cliente', 'imagen', 'particular', 'directo', 'reserva', 'casting', 'vip', 'vuelo', 'hotel', 'flight', 'shopping', 'acompañante', 'companion', 'social', 'outcall', 'incall', 'night', 'noche', 'noite', 'escort', 'dating', 'cita', 'reservas', 'today', 'tomorrow', 'ibiza', 'milan', 'dubai', 'ny', 'london', 'paris', 'girls', 'models', 'party', 'fly', 'trip', 'client', 'looking', 'need', 'girl', 'girl😍', 'девушка', 'клиент', 'нужна', 'заказчик'];
    const housing_keywords = ['plaza', 'agencia', 'club', 'habitacion', 'habitación', 'independiente', 'apartamento', 'room', 'vaga', 'vagas', 'cuarto', 'quartos', 'alojamiento', 'fija', 'stay', 'piso', 'mensual', 'larga estancia', 'recepcionista', 'telefonista', 'semanal', '50%', 'cupo', 'vacante', 'trabajo', 'oferta', 'apartment', 'flat', 'vacancy', 'agência', 'agencia', 'агентство', 'квартира', 'жилье'];

    const has_event = event_keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(textLower));
    const has_housing = housing_keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(textLower));
    const has_hours = /\b\d+([-]\d+)?\s*(?:h|hr|hrs|hora|horas)\b/i.test(textLower);
    const is_valuable = body.looksValuable === true || body.looks_valuable === true || body.pre_ia_checked === true;
    const is_multiple = finalCity.toUpperCase() === 'MULTIPLE' || textLower.includes('multiple cities');

    if (is_valuable && incomingCat === 'TRASH') incomingCat = 'CAT_PLAZAS';
    if (has_housing) incomingCat = 'CAT_PLAZAS';
    else if (has_event || has_hours || is_multiple) incomingCat = 'CAT_EVENTOS';

    if (incomingCat.includes('PLAZA')) incomingCat = 'CAT_PLAZAS';
    if (incomingCat.includes('EVENTO')) incomingCat = 'CAT_EVENTOS';
    if (!incomingCat.startsWith('CAT_')) incomingCat = `CAT_${incomingCat}`;

    const VALID_CATEGORIES = ['CAT_PLAZAS', 'CAT_EVENTOS'];
    const cleanCat = VALID_CATEGORIES.includes(incomingCat) ? incomingCat : 'CAT_PLAZAS';

    const baseLead = {
      category: cleanCat,
      city: finalCity,
      budget: finalBudget,
      contact: (() => {
        const isVal = (v: any) => v && typeof v === 'string' && v.length > 5 && !['unknown', 'undefined', 'null', 'phone', 'información no disponible'].includes(v.toLowerCase());
        const findDeep = (obj: any, keys: string[]): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          for (const k of keys) {
            const v = obj[k];
            if (typeof v === 'string') {
              const cleaned = v.replace('@s.whatsapp.net', '').split(':')[0];
              if (isVal(cleaned)) return cleaned;
            }
            if (typeof v === 'object' && v?.id && isVal(v.id)) return v.id.replace('@s.whatsapp.net', '').split(':')[0];
          }
          for (const k in obj) {
            const res = findDeep(obj[k], keys);
            if (res) return res;
          }
          return null;
        };
        const targetKeys = ['sender_contact', 'whatsapp', 'sender', 'username', 'participant', 'from', 'contact', 'remoteJid', 'chat_id', 'id'];
        let val = findDeep(body, targetKeys);
        const primitiveLinkMatch = raw_text.match(/https?:\/\/(?:t\.me|wa\.me|api\.whatsapp\.com)\/[a-zA-Z0-9_/=?.-]+/i);
        if (primitiveLinkMatch) return primitiveLinkMatch[0];
        if (!val) {
          const raw = JSON.stringify(body);
          const autoWa = raw.match(/\d{8,15}/);
          const autoTg = raw.match(/@[A-Za-z0-9_]{5,}/);
          val = autoWa ? autoWa[0] : (autoTg ? autoTg[0] : 'Información no disponible');
        }
        return val;
      })(),
      title_es: body.title_es || body.titulo || body.summary || '',
      text_es: body.text_es || body.descripcion || body.summary || body.rawText || '',
      title_en: body.title_en || await translateText(body.title_es || body.titulo || body.summary || '', 'en'),
      text_en: body.text_en || await translateText(raw_text, 'en'),
      title_ru: body.title_ru || await translateText(body.title_es || body.titulo || body.summary || '', 'ru'),
      text_ru: body.text_ru || await translateText(raw_text, 'ru'),
      title_pt: body.title_pt || await translateText(body.title_es || body.titulo || body.summary || '', 'pt'),
      text_pt: body.text_pt || await translateText(raw_text, 'pt'),
      platform: body.platform || body.plataforma || 'GENERAL',
      urgencia: body.urgencia || 'NORMAL',
      rawText: raw_text,
    };

    const normalizedContent = normalizeForDedupe(raw_text);
    const contentHash = createHash('sha256').update(normalizedContent).digest('hex');
    
    // We use a transaction to prevent race conditions during ingestion
    const result = await adminDb.runTransaction(async (transaction) => {
      const hashRef = adminDb.collection('lead_hashes').doc(contentHash);
      const hashDoc = await transaction.get(hashRef);

      if (hashDoc.exists) {
        const hData = hashDoc.data();
        const createdAt = hData?.createdAt ? (typeof hData.createdAt === 'string' ? new Date(hData.createdAt).getTime() : hData.createdAt) : 0;
        if ((Date.now() - createdAt) / (1000 * 60 * 60) < 24) {
          return { success: true, message: 'Lead duplicado', duplicate: true };
        }
      }

      // Check banned user again inside transaction for maximum safety
      if (sender_digits) {
        const bannedRef = adminDb.collection('banned_users').doc(sender_digits);
        const bannedDoc = await transaction.get(bannedRef);
        if (bannedDoc.exists) return { success: true, message: 'Lead descartado (Baneado)' };
      }

      // If we are here, it's a NEW lead and we can lock it
      const sharedId = adminDb.collection('leads').doc().id;
      const nowTs = new Date().toISOString();
      const leadData = { 
        ...baseLead, 
        id: sharedId, 
        leadId: sharedId, 
        categoria: baseLead.category, 
        createdAt: nowTs, 
        display_time: nowTs, 
        status: 'active', 
        trash: false, 
        titulo: baseLead.title_es, 
        descripcion: raw_text 
      };
      
      const ofertaData = { 
        ...baseLead, 
        id: sharedId, 
        leadId: sharedId, 
        categoria: baseLead.category, 
        display_time: nowTs, 
        timestamp: nowTs, 
        status: 'active', 
        trash: false 
      };

      // Perform all writes atomically
      transaction.set(adminDb.collection('leads').doc(sharedId), leadData);
      transaction.set(adminDb.collection('ofertas').doc(sharedId), ofertaData);
      transaction.set(hashRef, { 
        createdAt: nowTs, 
        lead_id: sharedId, 
        text_snippet: raw_text.substring(0, 50) 
      });

      return { success: true, message: 'Lead publicado correctamente', ids: { shared: sharedId } };
    });

    return result;
  } catch (error: any) {
    console.error('[Processor] Fatal error:', error);
    return { error: 'Error procesando lead', details: error.message };
  }
}
