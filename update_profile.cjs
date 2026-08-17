const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const editProfileCode = `
function EditProfileModal({ isOpen, onClose, user, onSave }: { isOpen: boolean, onClose: () => void, user: any, onSave: (u: any) => void }) {
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '');
      setBio(user?.bio || '');
      setEmail(user?.email || '');
      setWebsite(user?.website || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(\`/api/users/\${user.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, email, website })
      });
      const data = await res.json();
      if (data.success) {
        onSave(data.user);
        toast.success('Profile updated');
        onClose();
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="font-semibold text-lg">Edit profile</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-500 text-xl">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <button type="button" className="text-blue-500 text-sm font-semibold hover:text-blue-600">Change profile photo</button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 resize-none h-20"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Website</label>
            <input 
              type="url" 
              value={website} 
              onChange={e => setWebsite(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold rounded-lg py-2 mt-4 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
`;

content = content.replace('function ProfilePage({ user, onLogout }: { user: any, onLogout: () => void }) {', editProfileCode + '\nfunction ProfilePage({ user, onLogout, onUpdateUser }: { user: any, onLogout: () => void, onUpdateUser: (u: any) => void }) {\n  const [isEditModalOpen, setIsEditModalOpen] = useState(false);');

content = content.replace(
  '<button className="bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors">\n                Edit profile\n              </button>',
  '<button onClick={() => setIsEditModalOpen(true)} className="bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors">\n                Edit profile\n              </button>'
);

// Add the bio, website to profile display
content = content.replace(
  `          <div>\n            <div className="font-semibold text-sm mb-1">{user.role.toUpperCase()} PROFILE</div>\n            <p className="text-sm">Welcome to {user.name}'s official B2B portal.</p>\n          </div>`,
  `          <div>
            <div className="font-semibold text-sm mb-1">{user.role.toUpperCase()} PROFILE</div>
            {user.bio ? <p className="text-sm whitespace-pre-wrap mb-1">{user.bio}</p> : <p className="text-sm mb-1">Welcome to {user.name}'s official B2B portal.</p>}
            {user.website && <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#00376b] dark:text-blue-400 hover:underline flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>{user.website.replace(/^https?:\\/\\//, '')}</a>}
            {user.email && <p className="text-sm mt-1">📧 {user.email}</p>}
          </div>`
);

content = content.replace(
  '    </div>\n  );\n}',
  '    </div>\n      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} onSave={onUpdateUser} />\n    </div>\n  );\n}'
);

// Update AppContent Route to pass onUpdateUser
content = content.replace(
  '<Route path="/profile" element={<ProfilePage user={user} onLogout={() => {\n            setUser(null);\n            localStorage.removeItem(\'user\');\n          }} />} />',
  `<Route path="/profile" element={<ProfilePage user={user} onLogout={() => {
            setUser(null);
            localStorage.removeItem('user');
          }} onUpdateUser={(u) => {
            setUser(u);
            localStorage.setItem('user', JSON.stringify(u));
          }} />} />`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Edit profile feature added');
