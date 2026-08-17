import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
initializeApp({ credential: applicationDefault(), storageBucket: firebaseConfig.storageBucket });
const bucket = getStorage().bucket();

async function run() {
  const [files] = await bucket.getFiles();
  console.log(`Found ${files.length} files.`);
  files.forEach(f => console.log(f.name));
}
run().catch(console.error);
