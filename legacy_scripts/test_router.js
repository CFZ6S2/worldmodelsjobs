const leadData = {
    "category": "evento",
    "city": "London",
    "texto_limpio": "**Cliente busca modelo en Londres para reuni\u00f3n de 3h**\n\ud83c\udff7\ufe0f **Eventos**\n\ud83d\udccd **London**\n\ud83d\udcb0 **1500\u00a3**\n\nLondres \ud83c\uddec\ud83c\udde7 19-25 junio cualquier fecha\nReuni\u00f3n de 3h\nCaballero agradable y normal\n1500\u00a3 puede ser m\u00e1s\nTipo Kim Kardashian \u23f3\n\n- El presupuesto depende de la modelo.\n- El presupuesto puede variar desde 1500\u00a3\n- Si est\u00e1s disponible, por favor aplica correctamente. No solo"
};

function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = normalize(String(leadData.city || 'global').toLowerCase());
const text = normalize(String(leadData.texto_limpio || leadData.text_es || leadData.text_en || leadData.text_pt || leadData.text || leadData.body || JSON.stringify(leadData) || '').toLowerCase());

const routingTable = {
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "353830078788@s.whatsapp.net", label: "MADRID", categoryFilter: "evento" }
    ]
  },
  "monaco": {
    keywords: ["monaco", "monte carlo", "cannes", "\\bniza\\b", "cote d'azur"],
    targets: [
      { to: "33672474796@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  },
  "ibiza": {
    keywords: ["ibiza", "eivissa"],
    targets: [
      { to: "34601169815@s.whatsapp.net", label: "IBIZA" }
    ]
  },
  "suiza": {
    keywords: ["suiza", "switzerland", "zurich", "ginebra", "basilea", "berna", "lausana", "lugano", "lucerna", "schweiz", "suisse", "svizzera", "zurigo"],
    targets: [
      { to: "573183836809@s.whatsapp.net", label: "SUIZA" }
    ]
  },
  "london": {
    keywords: ["london", "londres", "mayfair", "soho", "chelsea", "\\buk\\b", "england", "inglaterra"],
    targets: [
      { to: "447838757923@s.whatsapp.net", label: "LONDON" }
    ]
  }
};

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

matchedTargets = matchedTargets.filter(t => !t.categoryFilter || t.categoryFilter === category);

if (matchedTargets.length === 0 && (category === 'evento' || category === 'plaza')) {
  matchedTargets.push({ to: "120363425790792660@g.us", label: (cityDetected !== 'global' ? cityDetected.toUpperCase() : 'GLOBAL') });
}

const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

console.log("🚀 DRE ROUTED TO:", JSON.stringify(uniqueTargets));
