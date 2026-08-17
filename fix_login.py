import sys

with open('server.ts', 'r') as f:
    content = f.read()

target = """  app.post('/api/auth/login', (req, res) => {
    const { username, password, role } = req.body;
    let user = db.users.find(u => u.name.toLowerCase() === username.toLowerCase() || (u.phone && u.phone.includes(username)));
    if (!user) {
      if (username.toLowerCase() === 'admin') {
        user = db.users[0];
      } else {
        return res.status(401).json({ error: 'User not found. Please register first.' });
      }
    }
    res.json(user);
  });"""

replacement = """  app.post('/api/auth/login', (req, res) => {
    const { username, password, role } = req.body;
    
    // Master Admin Hardcoded Login
    if (username.toLowerCase() === 'manit' && password === '5503') {
      const adminUser = db.users.find(u => u.role === 'admin') || db.users[0];
      return res.json(adminUser);
    } else if (username.toLowerCase() === 'manit' && password !== '5503') {
      return res.status(401).json({ error: 'Incorrect password for admin.' });
    }

    let user = db.users.find(u => u.name.toLowerCase() === username.toLowerCase() || (u.phone && u.phone.includes(username)));
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please register first.' });
    }
    res.json(user);
  });"""

if target in content:
    content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Done")
else:
    print("Target not found")
