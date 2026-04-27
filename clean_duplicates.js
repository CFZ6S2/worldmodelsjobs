const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

/**
 * Regla Práctica de Deduplicación:
 * 1. Normaliza: minúsculas, sin emojis, sin espacios dobles, sin puntuación.
 * 2. Compara: Título + Ciudad + Cuerpo.
 */
function normalizeText(text) {
    if (!text) return "";
    return text.toString()
        .toLowerCase()
        .replace(/[\u1000-\uFFFF]+/g, "") // Quitar emojis y caracteres especiales
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Quitar puntuación
        .replace(/\s{2,}/g, " ") // Espacios dobles a simples
        .trim();
}

async function runCleanup() {
    console.log('🚀 Iniciando limpieza de duplicados (Ventana 14 días)...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const snapshot = await db.collection('ofertas')
        .where('timestamp', '>=', cutoffDate)
        .get();

    console.log(`📊 Analizando ${snapshot.size} publicaciones...`);

    const registry = new Map();
    let hiddenCount = 0;

    // Usamos un loop secuencial para evitar race conditions en el map
    for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // No procesar si ya está oculta
        if (data.activa === false) continue;

        const title = normalizeText(data.titulo);
        const city = normalizeText(data.ubicacion || data.city || "");
        const body = normalizeText(data.descripcion || data.text || "");
        
        // Clave de comparación: Ciudad + Fragmentos del cuerpo para detectar "reposts"
        // Tomamos los primeros 100 caracteres del cuerpo para evitar variaciones mínimas al final
        const signature = `${city}|${title}|${body.substring(0, 150)}`;

        if (registry.has(signature)) {
            const existing = registry.get(signature);
            
            // Lógica: Conservar el más reciente (o el que ya tenemos si son iguales)
            // Marcar este como duplicado
            console.log(`🚫 Duplicado detectado: "${data.titulo}" en ${data.ubicacion}`);
            await doc.ref.update({ 
                activa: false, 
                reason: 'duplicate_cleanup',
                duplicate_of: existing.id
            });
            hiddenCount++;
        } else {
            registry.set(signature, { id: doc.id, timestamp: data.timestamp });
        }
    }

    console.log(`✅ Limpieza completada. Se han ocultado ${hiddenCount} duplicados.`);
}

runCleanup().catch(console.error);
