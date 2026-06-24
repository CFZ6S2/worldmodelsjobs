const admin = require('firebase-admin');
const serviceAccount = require('c:\\Users\\cesar\\.google-keys\\worldmodels-admin-new.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listUsers() {
  console.log("Listing users in worldmodels-jobs (users collection):");
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(doc => {
    const data = doc.data();
    console.log(`UID: ${doc.id} | Email: ${data.email} | Role: ${data.userRole} | isAdmin: ${data.isAdmin}`);
  });

  console.log("\nListing users in worldmodels-jobs (profiles collection):");
  const profilesSnap = await db.collection('profiles').get();
  profilesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`UID: ${doc.id} | Email: ${data.email} | Role: ${data.userRole} | isAdmin: ${data.isAdmin}`);
  });
}

listUsers().catch(console.error).finally(() => process.exit(0));
