let leadData = {
  category: 'evento',
  city: 'Niza',
  text_es: 'URGENTE: Evento de 3 días en Niza (Francia) la próxima semana. Buscamos 3 modelos de alta imagen. Presupuesto: 7650€ total por chica, todos los gastos cubiertos en una villa privada. Si estás interesada, envía fotos de rostro y cuerpo a mi DM. Confirmación inmediata.'
};
const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = String(leadData.city || 'global').toLowerCase();
const text = String(leadData.text_es || '').toLowerCase();

function normalize(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
const textNorm = normalize(text);
const cityNorm = normalize(cityDetected);

const routingTable = {
  "costa_azul": {
    keywords: ["monaco", "cannes", "niza", "nice", "monte carlo", "cote d'azur"],
    targets: [
      { to: "5511953600828@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  }
};

let matchedTargets = [];

for (const [key, config] of Object.entries(routingTable)) {
    if (config.keywords.some(kw => textNorm.includes(kw) || cityNorm.includes(kw))) {
         matchedTargets = [...matchedTargets, ...config.targets];
    }
}

console.log(matchedTargets);
