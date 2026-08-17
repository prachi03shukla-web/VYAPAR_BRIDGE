import re

with open('server.ts', 'r') as f:
    content = f.read()

# Add async to routes that use upload.single or upload.fields but are not async
routes = [
    r"(app\.post\('/api/users/:id/catalogue', upload\.single\('catalogue'\), )\((req, res) => {",
    r"(app\.post\('/api/upload', upload\.single\('media'\), )\((req, res) => {",
    r"(app\.post\('/api/messages/image', upload\.single\('image'\), )\((req, res) => {",
    r"(app\.post\('/api/admin/announcements', upload\.single\('mediaFile'\), )\((req, res) => {",
    r"(app\.post\('/api/music', upload\.single\('musicFile'\), )\((req, res) => {",
    r"(app\.post\('/api/admin/showcase', )\((req, res) => {"
]

for route in routes:
    content = re.sub(route, r"\1async (req, res) => {", content)

# Now replace the string templates
# 1. `/uploads/${req.file.filename}`
content = content.replace("`/uploads/${req.file.filename}`", "await uploadToFirebaseOrLocal(req.file)")

# 2. `/uploads/${file.filename}`
content = content.replace("`/uploads/${file.filename}`", "await uploadToFirebaseOrLocal(file)")

# 3. `/uploads/${files.thumbnail[0].filename}`
content = content.replace("`/uploads/${files.thumbnail[0].filename}`", "await uploadToFirebaseOrLocal(files.thumbnail[0])")

# 4. `/uploads/${uploadedFile.filename}`
content = content.replace("`/uploads/${uploadedFile.filename}`", "await uploadToFirebaseOrLocal(uploadedFile)")

with open('server.ts', 'w') as f:
    f.write(content)

print("Done")
