const admin = require('firebase-admin');

// Initialize Firebase Admin (adjust path to serviceAccountKey if needed, maybe we can use default credentials or the one in the project root)
const serviceAccountPath = './worldmodelsjobs-firebase-adminsdk-hswqg-2a543f510d.json'; // or similar, let's try to find the key
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
  try {
    serviceAccount = require('./firebase/serviceAccountKey.json');
  } catch (err) {
    console.error("Could not find serviceAccountKey.json");
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdmin() {
  const emailToFind = 'cesar.herrera.rojo@gmail.com';
  const emailToFind2 = 'cesarherrerarojo@gmail.com';

  console.log('Searching for users to make admin...');

  const collections = ['users', 'profiles'];
  let found = false;

  for (const coll of collections) {
    const snapshot = await db.collection(coll).get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.email && (data.email.toLowerCase() === emailToFind || data.email.toLowerCase() === emailToFind2)) {
        console.log(`Found user in ${coll}: ${doc.id} - ${data.email}`);
        await doc.ref.update({
          userRole: 'admin',
          isAdmin: true
        });
        console.log(`Updated ${doc.id} successfully.`);
        found = true;
      }
    }
  }

  if (!found) {
    console.log('User not found. Adding a new admin document anyway for cesar.herrera.rojo@gmail.com just in case it is created later.');
    // Let's not blindly create, because we don't know their UID.
  } else {
    console.log('Done!');
  }
}

setAdmin().catch(console.error).finally(() => process.exit(0));
