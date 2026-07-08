const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: '/root/worldmodels-jobs/firebase-admin.json' });
const bucketName = 'worldmodels-jobs.firebasestorage.app';

async function fix() {
  try {
    console.log('Setting CORS for ' + bucketName);
    await storage.bucket(bucketName).setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
        origin: ['*'],
        responseHeader: ['Content-Type', 'Authorization', 'x-goog-resumable'],
      },
    ]);
    console.log('✅ DONE');
  } catch (err) {
    console.error('❌ FAIL: ' + err.message);
  }
}
fix();
