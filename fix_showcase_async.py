import re

with open('server.ts', 'r') as f:
    content = f.read()

target = "upload.any()(req, res, (err) => {"
replacement = "upload.any()(req, res, async (err) => {"

if target in content:
    content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Done")
else:
    print("Not found")
