const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

async function seed() {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
    const clientApp = initializeApp(firebaseConfig);
    const firestoreDb = getFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
    
    if (fs.existsSync('database.json')) {
      const data = JSON.parse(fs.readFileSync('database.json', 'utf8'));
      
      let uCount = 0;
      if (data.users && Array.isArray(data.users)) {
        for (const u of data.users) {
           await setDoc(doc(firestoreDb, 'users', String(u.id)), u);
           uCount++;
        }
      }
      console.log(`Seeded ${uCount} users to Firestore.`);

      let aCount = 0;
      if (data.adminSettings && data.adminSettings.brandAdsList) {
        for (const a of data.adminSettings.brandAdsList) {
           await setDoc(doc(firestoreDb, 'advertisements', String(a.id)), a);
           aCount++;
        }
      }
      console.log(`Seeded ${aCount} ads to Firestore.`);
    }
  } catch (e) {
    console.error('Error seeding:', e);
  }
}
seed();
