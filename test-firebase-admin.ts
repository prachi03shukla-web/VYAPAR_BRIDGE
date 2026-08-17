import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

initializeApp({
  credential: applicationDefault(),
  storageBucket: firebaseConfig.storageBucket
});

const bucket = getStorage().bucket();
console.log("Bucket:", bucket.name);
