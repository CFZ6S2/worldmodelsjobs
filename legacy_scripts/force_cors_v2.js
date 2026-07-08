const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: '/root/worldmodels-jobs/firebase-admin.json' });

async function tryBuckets() {
  const buckets = [
    'worldmodels-jobs.firebasestorage.app',
    'worldmodels-jobs.appspot.com',
    '711545896552.appspot.com',
    'worldmodels-jobs-711545896552',
    'staging.worldmodels-jobs.appspot.com'
  ];

  for (const name of buckets) {
    try {
        process.stdout.write('Attempting: ' + name + '... ');
        await storage.bucket(name).setCorsConfiguration([
            {
                maxAgeSeconds: 3600,
                method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
                origin: ['*'],
                responseHeader: ['Content-Type', 'Authorization', 'x-goog-resumable'],
            },
        ]);
        console.log('OK');
    } catch (err) {
        console.log('FAIL: ' + err.message);
    }
  }
}

tryBuckets().catch(console.error);
