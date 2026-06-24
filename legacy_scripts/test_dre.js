const leadData = {
  "city": "Санкт-Петербург",
  "text_es": "Cita en San Petersburgo esta noche",
  "texto_limpio": "Cita en San Petersburgo esta noche\n🏷️ Eventos\n📍 Санкт-Петербург\n💰 20 000"
};

const routingTable = {
  "russia_turkey": {
    keywords: ["rusia", "russia", "\\bru\\b", "россия", "moscu", "moscow", "москва", "san petersburgo", "saint petersburg", "st petersburg", "санкт-петербург", "питер", "kazan", "казань", "sochi", "сочи", "vladivostok", "владивосток", "novosibirsk", "новосибирск", "ekaterimburgo", "yekaterinburg", "екатеринбург", "baku", "баку", "tiflis", "tbilisi", "тбилиси", "kiev", "kyiv", "киев", "київ", "киів", "turquia", "turkey", "türkiye", "турция", "estambul", "istanbul", "стамбул", "ankara", "анкара", "antalya", "анталья", "анталия", "izmir", "esmirna", "измир", "bodrum", "бодрум", "bursa", "бурса", "capadocia", "cappadocia", "каппадокия"],
    targets: [
      { to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY", tg_chat: "1800004016" }
    ]
  }
};

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const category = String(leadData.category || 'evento').toLowerCase().trim();
const cityDetected = normalize(String(leadData.city || 'global').toLowerCase().trim());
const text = normalize(String(leadData.text_es || leadData.texto_limpio || leadData.text_en || leadData.text_pt || leadData.text || '').toLowerCase());

let matchedTargets = [];

if (routingTable[cityDetected]) {
    matchedTargets = [...routingTable[cityDetected].targets];
} else {
    for (const [key, config] of Object.entries(routingTable)) {
        if (cityDetected.includes(key) || config.keywords.some(kw => cityDetected.includes(kw))) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

if (matchedTargets.length === 0) {
    for (const [key, config] of Object.entries(routingTable)) {
        if (config.keywords.some(kw => {
            if (kw.includes('\\b')) return new RegExp(kw, 'i').test(text);
            return text.includes(kw);
        })) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

matchedTargets = matchedTargets.filter(t => !t.categoryFilter || category.includes(t.categoryFilter) || t.categoryFilter.includes(category));

const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

if (uniqueTargets.length === 0) {
    console.log("Returned EMPTY array!");
} else {
    console.log("Returned MATCH:", uniqueTargets);
}
