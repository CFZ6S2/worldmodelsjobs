const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: '/root/worldmodels-jobs/firebase-admin.json' });

async function tryAll() {
  const [buckets] = await storage.getBuckets();
  for (const b of buckets) {
    try {
        process.stdout.write('Attempting: ' + b.name + '... ');
        await b.setCorsConfiguration([
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

tryAll().catch(console.error);
