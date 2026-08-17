import sys
import re

with open('server.ts', 'r') as f:
    content = f.read()

helper_code = """
async function uploadToFirebaseOrLocal(file: Express.Multer.File): Promise<string> {
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
}
"""

# Insert the helper code after syncFromFirestore function
insert_pos = content.find("async function syncFromFirestore() {")
if insert_pos != -1:
    content = content[:insert_pos] + helper_code + "\n" + content[insert_pos:]
else:
    print("Could not find syncFromFirestore")
    sys.exit(1)

# Now update the upload-barcode route
target_route = """  app.post('/api/admin/upload-barcode', upload.single('barcodeFile'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No barcode image file uploaded' });
    }
    const barcodeImageUrl = `/uploads/${req.file.filename}`;
    const barcodeSecretToken = `SECURE-BC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    db.adminSettings.barcodeImageUrl = barcodeImageUrl;
    db.adminSettings.barcodeSecretToken = barcodeSecretToken;
    db.adminSettings.barcodeUploadedAt = Date.now();
    saveAdminSettings();

    res.json({
      success: true,
      barcodeImageUrl,
      barcodeSecretToken,
      settings: db.adminSettings
    });
  });"""

replacement_route = """  app.post('/api/admin/upload-barcode', upload.single('barcodeFile'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No barcode image file uploaded' });
    }
    
    const barcodeImageUrl = await uploadToFirebaseOrLocal(req.file);
    const barcodeSecretToken = `SECURE-BC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    db.adminSettings.barcodeImageUrl = barcodeImageUrl;
    db.adminSettings.barcodeSecretToken = barcodeSecretToken;
    db.adminSettings.barcodeUploadedAt = Date.now();
    saveAdminSettings();

    res.json({
      success: true,
      barcodeImageUrl,
      barcodeSecretToken,
      settings: db.adminSettings
    });
  });"""

if target_route in content:
    content = content.replace(target_route, replacement_route)
else:
    print("Could not find target route")
    sys.exit(1)

with open('server.ts', 'w') as f:
    f.write(content)
print("Done")
