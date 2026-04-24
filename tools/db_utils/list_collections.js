const admin = require('firebase-admin');
const fs = require('fs');

async function listCollections() {
  try {
    admin.initializeApp({ projectId: 'worldmodels-jobs' });
    const db = admin.firestore();
    const collections = await db.listCollections();
    console.log('Collections:');
    for (const col of collections) {
      console.log(`- ${col.id}`);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

listCollections();
