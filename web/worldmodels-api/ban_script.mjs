import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

async function run() {
  // Use the existing config if possible, orADC
  const serviceAccount = JSON.parse(await readFile('./current_auth_config.json', 'utf8'));

  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();
  const leadsRef = db.collection('leads');
  const bannedRef = db.collection('banned_users');

  const numbersToBan = [
    "33762686262",
    "+55 27 99969-6247",
    "+55 31 9693-1652",
    "+55 47 9112-9953",
    "+55 21 99557-4624",
    "+92 322 0067913",
    "+34 612 48 02 76",
    "+55 18 99614-8613",
    "+91 80057 95407",
    "447520629287",
    "+92 320 0796883",
    "+49 174 4723429",
    "+351 924 938 305",
    "+91 78776 22286"
  ];

  const normalized = numbersToBan.map(n => n.replace(/\D/g, ''));

  console.log('Normalized numbers:', normalized);

  for (const num of normalized) {
    if (!num) continue;

    // Search and delete leads
    // We check both 'contact' and 'sender'
    const queries = [
      leadsRef.where('contact', '==', num).get(),
      leadsRef.where('sender', '==', num).get()
    ];

    const results = await Promise.all(queries);
    let deletedCount = 0;

    for (const snapshot of results) {
      for (const doc of snapshot.docs) {
        await doc.ref.delete();
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} leads for ${num}`);
    }

    // Ban the user
    await bannedRef.doc(num).set({
      reason: "Baneado por administrador (Lista Negra)",
      bannedAt: FieldValue.serverTimestamp(),
      phone: num
    }, { merge: true });
    
    console.log(`Banned ${num}`);
  }

  console.log('Cleanup and banning complete.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
