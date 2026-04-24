const admin = require('firebase-admin');
const serviceAccount = require('./worldmodels-admin.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCollections() {
  console.log("Checking Firestore collections...");
  const collections = await db.listCollections();
  collections.forEach(collection => {
    console.log("Found collection:", collection.id);
  });
  
  // Test read one doc from 'ads'
  const adsSnap = await db.collection('ads').limit(1).get();
  console.log("Ads count test:", adsSnap.size);
  
  // Test read one doc from 'users'
  const usersSnap = await db.collection('users').limit(1).get();
  console.log("Users count test:", usersSnap.size);
  
  // Test read one doc from 'profiles'
  const profilesSnap = await db.collection('profiles').limit(1).get();
  console.log("Profiles count test:", profilesSnap.size);
}

checkCollections().catch(console.error);
