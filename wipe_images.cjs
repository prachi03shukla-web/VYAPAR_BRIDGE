const fs = require('fs');
let db = JSON.parse(fs.readFileSync('database.json', 'utf-8'));
for (let u of db.users) {
  if (u.avatarUrl && u.avatarUrl.length > 1000) u.avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150';
  if (u.coverUrl && u.coverUrl.length > 1000) u.coverUrl = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80';
}
fs.writeFileSync('database.json', JSON.stringify(db, null, 2));
