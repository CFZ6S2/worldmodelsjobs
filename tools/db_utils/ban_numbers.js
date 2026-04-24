const admin = require('firebase-admin');

const numbersToBan = [
  "+55 21 97316-7159",
  "+57 310 4671939",
  "+44 7752 825109",
  "+44 7768 127960",
  "+234 707 626 4388",
  "+44 7400 757648"
];

async function banUsers() {
  try {
    admin.initializeApp({ projectId: 'worldmodels-jobs' });
    const db = admin.firestore();
    const batch = db.batch();

    for (const number of numbersToBan) {
      const docRef = db.collection('banned_users').doc();
      const digitsOnly = number.replace(/[^0-9]/g, '');
      batch.set(docRef, {
        id: number,
        telegramId: digitsOnly,
        reason: "Baneado por el administrador",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Banning ${number} (telId: ${digitsOnly})...`);
    }

    await batch.commit();
    console.log('Successfully banned all numbers.');
    process.exit(0);
  } catch (e) {
    console.error('Error banning numbers:', e);
    process.exit(1);
  }
}

banUsers();
