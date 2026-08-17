import re

with open('server.ts', 'r') as f:
    content = f.read()

targets = [
    "app.post('/api/upload', upload.single('media'), (req, res) => {",
    "app.post('/api/messages/image', upload.single('image'), (req, res) => {",
    "app.post('/api/admin/announcements', upload.single('mediaFile'), (req, res) => {",
    "app.post('/api/music', upload.single('musicFile'), (req, res) => {"
]

replacements = [
    "app.post('/api/upload', upload.single('media'), async (req, res) => {",
    "app.post('/api/messages/image', upload.single('image'), async (req, res) => {",
    "app.post('/api/admin/announcements', upload.single('mediaFile'), async (req, res) => {",
    "app.post('/api/music', upload.single('musicFile'), async (req, res) => {"
]

for t, r in zip(targets, replacements):
    content = content.replace(t, r)

with open('server.ts', 'w') as f:
    f.write(content)
print("Done")
