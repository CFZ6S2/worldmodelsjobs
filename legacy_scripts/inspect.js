const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin.json');
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
admin.firestore().collection('ofertas').limit(2).get().then(s => {
    s.forEach(d => console.log(JSON.stringify({
        id: d.id,
        titulo: d.data().titulo,
        ubicacion: d.data().ubicacion,
        descripcion: d.data().descripcion,
        text: d.data().text,
        city: d.data().city
    }, null, 2)));
    process.exit(0);
});
