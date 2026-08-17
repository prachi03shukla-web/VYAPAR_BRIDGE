import re

with open('server.ts', 'r') as f:
    content = f.read()

target = "app.post('/api/users/:id/catalogue', upload.single('catalogue'), (req, res) => {"
replacement = "app.post('/api/users/:id/catalogue', upload.single('catalogue'), async (req, res) => {"

if target in content:
    content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Done")
else:
    print("Not found")
