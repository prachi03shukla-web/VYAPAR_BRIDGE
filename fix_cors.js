const { Storage } = require('@google-cloud/storage');
async function configureCors() {
  const storage = new Storage({
    projectId: "studio-9585497857-6d0db",
    keyFilename: applicationDefault() // Needs credentials, but admin sdk handles it
  });
  // We can't easily do this via node without a service account JSON.
}
