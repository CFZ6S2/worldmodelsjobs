@echo off
title LIMPIADOR FIREBASE
echo 🧹 Iniciando limpieza de base de datos...
echo ---------------------------------------
cd /d "c:\Users\cesar\Documents\trae_projects\worldmodels"
node -e "const admin = require('firebase-admin'); const serviceAccount = require('./firebase-admin.json'); admin.initializeApp({credential: admin.credential.cert(serviceAccount)}); const db = admin.firestore(); (async () => { const snapshot = await db.collection('ofertas').get(); let count = 0; for (const doc of snapshot.docs) { const data = doc.data(); if (data.titulo?.includes('[WM_FIXED') || data.descripcion_original?.includes('[WM_FIXED')) { await doc.ref.delete(); count++; } } console.log('>>> LIMPIEZA COMPLETADA: Se han borrado ' + count + ' leads viejos.'); process.exit(0); })();"
pause
