const admin = require('firebase-admin');
const email = 'cesar.herrera.rojo@gmail.com';

async function setAdmin() {
  try {
    admin.initializeApp({ projectId: 'worldmodels-jobs' });
    const db = admin.firestore();
    
    const userSnap = await db.collection('users').where('email', '==', email).get();
    
    if (userSnap.empty) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    const userDoc = userSnap.docs[0];
    await userDoc.ref.update({
      userRole: 'admin',
      isAdmin: true
    });
    
    console.log(`Successfully promoted ${email} to admin.`);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

setAdmin();