import re

with open('server.ts', 'r') as f:
    content = f.read()

target = "let finalUrl = await uploadToFirebaseOrLocal(file);"
replacement = "let finalUrl = `/uploads/${file.filename}`;"

if target in content:
    content = content.replace(target, replacement, 1)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Done")
else:
    print("Not found")
