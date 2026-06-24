const leadData = {
  category: "evento",
  city: "monaco",
  texto_limpio: "Busco chica en monaco hoy pago alto. @testuser9",
  text_es: "Busco chica en monaco hoy pago alto."
};

function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = normalize(String(leadData.city || 'global').toLowerCase());
const text = normalize(String(leadData.texto_limpio || leadData.text_es || '').toLowerCase());

const routingTable = {
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "5511953600828@s.whatsapp.net", label: "MADRID (PT)", categoryFilter: "evento" }
    ]
  },
  "london": {
    keywords: ["london", "londres", "mayfair", "soho", "chelsea"],
    targets: [
      { to: "120363425790792660@g.us", label: "LONDON" }
    ]
  },
  "paris": {
    keywords: ["paris", "francia", "france", "champs"],
    targets: [
      { to: "33744156314@s.whatsapp.net", label: "PARIS" }
    ]
  },
  "monaco": {
    keywords: ["monaco", "viena", "vienna", "monte carlo", "cannes", "niza", "nice", "cote d'azur"],
    targets: [
      { to: "33672474796@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  }
};

let matchedTargets = [];

if (routingTable[cityDetected]) {
    console.log("MATCHED CITY DIRECTLY:", cityDetected);
    matchedTargets = [...routingTable[cityDetected].targets];
} else {
    for (const [key, config] of Object.entries(routingTable)) {
        if (cityDetected.includes(key)) {
             console.log("MATCHED CITY INCLUDES:", key);
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

if (matchedTargets.length === 0) {
    for (const [key, config] of Object.entries(routingTable)) {
        if (config.keywords.some(kw => text.includes(kw))) {
             console.log("MATCHED KEYWORD:", key);
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

if (matchedTargets.length === 0 && (category === 'evento' || category === 'plaza')) {
  console.log("FALLBACK TO GLOBAL");
  matchedTargets.push({ to: "120363425790792660@g.us", label: (cityDetected !== 'global' ? cityDetected.toUpperCase() : 'GLOBAL') });
}

console.log("TARGETS:", matchedTargets);
