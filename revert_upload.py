import re

with open('server.ts', 'r') as f:
    content = f.read()

# Revert to standard local saving ONLY since we have no bucket
new_upload_func = """async function uploadToFirebaseOrLocal(file: Express.Multer.File): Promise<string> {
  return `/uploads/${file.filename}`;
}"""

content = re.sub(r'async function uploadToFirebaseOrLocal\([^\{]+\{.*?(?=async function|app\.)', new_upload_func + "\n\n  ", content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)
