import sys
import re

with open('server.ts', 'r') as f:
    content = f.read()

target = """        if (db.users && Array.isArray(db.users)) {
          db.users.forEach((u: any) => {
            if (u.avatarUrl && typeof u.avatarUrl === 'string' && u.avatarUrl.includes('ui-avatars.com')) {
              u.avatarUrl = getDefaultAvatar(u.name || u.username, u.id);
            }
          });
        }"""

replacement = """        if (db.users && Array.isArray(db.users)) {
          db.users.forEach((u: any) => {
            if (u.avatarUrl && typeof u.avatarUrl === 'string' && u.avatarUrl.includes('ui-avatars.com')) {
              u.avatarUrl = getDefaultAvatar(u.name || u.username, u.id);
            }
          });
          
          // Guarantee Admin exists
          if (!db.users.find((u: any) => u.role === 'admin')) {
             db.users.unshift({ 
                id: '1', 
                role: 'admin', 
                name: 'Vyapar Bridge B2B Admin', 
                isVerified: true, 
                verifiedPlan: 'yearly', 
                category: 'Platform Operations',
                gstNumber: '24AAACT1234F1Z0',
                address: 'Vyapar Bridge Tower, GIDC Industrial Estate',
                city: 'Morbi',
                state: 'Gujarat',
                gpsCoords: { lat: 22.8182, lng: 70.8368 },
                googleMapsUrl: 'https://maps.google.com/?q=22.8182,70.8368',
                bio: 'Official Vyapar Bridge B2B Operations & Moderation Desk.',
                coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80',
                avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150',
                phone: '+91 9876500001',
                email: 'admin@vyaparbridge.com'
              });
          }
        }"""

if target in content:
    content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Done")
else:
    print("Target not found")
