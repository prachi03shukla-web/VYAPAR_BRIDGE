const admin = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function seed() {
  try {
    admin.initializeApp();
    const firestoreDb = getFirestore();
    
    if (fs.existsSync('database.json')) {
      const data = JSON.parse(fs.readFileSync('database.json', 'utf8'));
      
      let uCount = 0;
      if (data.users && Array.isArray(data.users)) {
        for (const u of data.users) {
           await firestoreDb.collection('users').doc(String(u.id)).set(u);
           uCount++;
        }
      }
      console.log(`Seeded ${uCount} users to Firestore.`);

      let aCount = 0;
      if (data.adminSettings && data.adminSettings.brandAdsList) {
        for (const a of data.adminSettings.brandAdsList) {
           await firestoreDb.collection('advertisements').doc(String(a.id)).set(a);
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
