import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the firebase/storage client imports and initialization
content = content.replace("import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';", "import { getStorage } from 'firebase-admin/storage';\nimport { applicationDefault, initializeApp as initAdminApp } from 'firebase-admin/app';")

# Initialize admin app
init_str = """
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const clientApp = initClientApp(firebaseConfig);
  firestoreDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
  firebaseStorage = getStorage(clientApp);
  console.log('✅ Firebase Client SDK and Storage initialized for syncing.');
"""

new_init_str = """
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const clientApp = initClientApp(firebaseConfig);
  firestoreDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
  
  // Initialize Admin SDK for Storage
  const adminApp = initAdminApp({
    credential: applicationDefault(),
    storageBucket: firebaseConfig.storageBucket
  });
  firebaseStorage = getStorage(adminApp).bucket();
  console.log('✅ Firebase Admin SDK Storage and Firestore Client initialized.');
"""
content = content.replace(init_str, new_init_str)

# Replace the uploadToFirebaseOrLocal function
old_upload_func = """async function uploadToFirebaseOrLocal(file: Express.Multer.File): Promise<string> {
  let finalUrl = `/uploads/${file.filename}`;
  if (firebaseStorage) {
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const storageRef = ref(firebaseStorage, `barcodes/${file.filename}`);
      await uploadBytes(storageRef, fileBuffer, { contentType: file.mimetype });
      finalUrl = await getDownloadURL(storageRef);
      console.log('✅ File successfully uploaded to Firebase Storage:', finalUrl);
    } catch (e) {
      console.error('❌ Failed to upload file to Firebase Storage, falling back to local.', e);
    }
  }
  return finalUrl;
}"""

new_upload_func = """async function uploadToFirebaseOrLocal(file: Express.Multer.File): Promise<string> {
  let finalUrl = `/uploads/${file.filename}`;
  if (firebaseStorage) {
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const fileObj = firebaseStorage.file(`uploads/${file.filename}`);
      await fileObj.save(fileBuffer, {
        metadata: { contentType: file.mimetype }
      });
      await fileObj.makePublic();
      finalUrl = `https://storage.googleapis.com/${firebaseStorage.name}/uploads/${file.filename}`;
      console.log('✅ File successfully uploaded to Firebase Storage:', finalUrl);
    } catch (e) {
      console.error('❌ Failed to upload file to Firebase Storage, falling back to local.', e);
    }
  }
  return finalUrl;
}"""

content = content.replace(old_upload_func, new_upload_func)

with open('server.ts', 'w') as f:
    f.write(content)

