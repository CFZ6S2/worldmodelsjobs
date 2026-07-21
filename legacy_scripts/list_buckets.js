const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: '/root/worldmodels-jobs/firebase-admin.json' });
async function list() {
  const [buckets] = await storage.getBuckets();
  buckets.forEach(b => console.log(b.name));
}
list().catch(console.error);
