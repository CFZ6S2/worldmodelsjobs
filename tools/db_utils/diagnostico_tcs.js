const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('./firebase-admin.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function listAll() {
    console.log('--- 🔎 ESCANEANDO ESTRUCTURA DE TUCITASEGURA ---');
    try {
        const collections = await db.listCollections();
        for (const col of collections) {
            console.log(`📌 Colección detectada: ${col.id}`);
            
            // Ver una muestra de un documento para ver los campos
            const snapshot = await db.collection(col.id).limit(1).get();
            if (!snapshot.empty) {
                console.log(`   📄 Muestra de campos en ${col.id}:`, Object.keys(snapshot.docs[0].data()));
            } else {
                console.log(`   ⚠️ Colección vacía.`);
            }
        }
        console.log('--- ✅ ESCANEO COMPLETADO ---');
    } catch (e) {
        console.error('❌ Error fatal en el escaneo:', e.message);
    }
}

listAll();
