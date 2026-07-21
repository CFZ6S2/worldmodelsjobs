const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: '/root/worldmodels-jobs/firebase-admin.json' });

async function debug() {
  const [buckets] = await storage.getBuckets();
  console.log('--- FOUND BUCKETS ---');
  for (const b of buckets) {
    console.log('Name: ' + b.name);
  }
}
debug().catch(console.error);
