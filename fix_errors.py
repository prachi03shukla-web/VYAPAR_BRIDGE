with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "updateDoc(doc(firestoreDb, 'posts', String(post.id)), { status: post.status })",
    "setDoc(doc(firestoreDb, 'posts', String(post.id)), { status: post.status }, { merge: true })"
)

content = content.replace(
    "updateDoc(doc(firestoreDb, 'advertisements', String(adId)), { isActive: ad.isActive })",
    "setDoc(doc(firestoreDb, 'advertisements', String(adId)), { isActive: ad.isActive }, { merge: true })"
)

with open('server.ts', 'w') as f:
    f.write(content)

with open('src/App.tsx', 'r') as f:
    app_content = f.read()

app_content = app_content.replace(
    "safeFetch('/api/payments')",
    "safeFetch('/api/admin/payments')"
)

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

print("Done")
