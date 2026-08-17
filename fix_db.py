import sys
import json
import os

db_path = 'database3.json'
if os.path.exists(db_path):
    with open(db_path, 'r') as f:
        data = json.load(f)
        
    has_admin = False
    for u in data.get('users', []):
        if str(u.get('role', '')).lower() == 'admin':
            has_admin = True
            
    if not has_admin:
        admin_user = {
          "id": "1",
          "role": "admin",
          "name": "Vyapar Bridge B2B Admin",
          "isVerified": True,
          "verifiedPlan": "yearly",
          "category": "Platform Operations",
          "gstNumber": "24AAACT1234F1Z0",
          "address": "Vyapar Bridge Tower, GIDC Industrial Estate",
          "city": "Morbi",
          "state": "Gujarat",
          "gpsCoords": { "lat": 22.8182, "lng": 70.8368 },
          "googleMapsUrl": "https://maps.google.com/?q=22.8182,70.8368",
          "bio": "Official Vyapar Bridge B2B Operations & Moderation Desk.",
          "phone": "+91 9876500001",
          "email": "admin@vyaparbridge.com",
          "avatarUrl": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150",
          "coverUrl": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80"
        }
        if 'users' not in data:
            data['users'] = []
        data['users'].insert(0, admin_user)
        
        with open(db_path, 'w') as f:
            json.dump(data, f, indent=2)
        print("Admin user added to database3.json")
    else:
        print("Admin user already exists in database3.json")
else:
    print("Database not found")
