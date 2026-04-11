
function testClassify(raw_text, manualCat) {
    const event_keywords = [
      'fiesta', 'evento', 'despedida', 'cena', 'horas', 'encuentro', 
      'travel', 'tour', 'eurotour', 'booking', 'dates', 'destination',
      'cliente', 'imagen', 'particular', 'directo', 'direct', 'reserva', 'casting',
      'vip', 'vuelo', 'hotel', 'flight', 'shopping', 'acompañante', 'companion', 'social', 
      'outcall', 'incall', 'out', 'saida', 'saída', 'salida', 'night', 'noche', 'noite', 
      'service', 'servicio', 'escort', 'dating', 'cita', 'hombre', 'natural', 'reservas',
      'hoy', 'mañana', 'am', 'pm', 'tonight', 'tomorrow'
    ];
    
    const housing_keywords = [
      'plaza', 'agencia', 'club', 'habitacion', 'habitación', 'habitaciones', 'independiente', 
      'apartamento', 'room', 'vaga', 'vagas', 'cuarto', 'quartos', 'alojamiento', 'fija', 'stay',
      'piso', 'piso para independiente', 'planta', 'mensual', 'larga estancia', 'recepcionista', 'telefonista'
    ];

    const textLower = raw_text.toLowerCase();
    const has_event_keyword = event_keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(textLower));
    const has_housing_keyword = housing_keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(textLower));
    const hasHoursRegex = /\b\d+([-]\d+)?\s*(?:h|hr|hrs|hora|horas)\b/i.test(textLower); 

    let incomingCat = (manualCat || 'CAT_PLAZAS').toUpperCase();

    if (has_event_keyword || hasHoursRegex) {
      incomingCat = 'CAT_EVENTOS';
    } else if (!manualCat && has_housing_keyword) {
      incomingCat = 'CAT_PLAZAS';
    }

    console.log(`Text: "${raw_text.substring(0, 50)}..."`);
    console.log(`Result: ${incomingCat} (Keywords: ${has_event_keyword}, Hours: ${hasHoursRegex})`);
    console.log('---');
}

console.log("Running Updated Classification Tests...\n");

testClassify("NYC * Salida a las 11pm ... $650 limpio por 1h", "CAT_PLAZAS"); // Lead 385
testClassify("Londres, cena con un hombre. 250-300. Para esta semana", "CAT_PLAZAS"); // Lead 362
testClassify("Londres Hoy a las 4 pm Hotel Trabajo de 2 horas", "CAT_PLAZAS"); // Lead 484
testClassify("Chipre Limassol Encuentro de 4-5 h Cena y extra", "CAT_PLAZAS"); // Lead 597
testClassify("Outcall service available now", null);
testClassify("Model for incall/outcall", null);
testClassify("Plaza disponible en Madrid independiente", null);
