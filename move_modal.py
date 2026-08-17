import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove from AuthPage
target1 = """        {/* Stealth Admin Console Trigger Footer */}
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 text-center">
          <button
            type="button"
            onClick={() => setIsMasterModalOpen(true)}
            className="text-[11px] font-black tracking-widest uppercase text-black/60 dark:text-zinc-500 hover:text-black/80 dark:hover:text-zinc-300 transition-colors cursor-pointer py-1 italic mx-auto"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >VYAPAR BRIDGE</button>
        </div>
      </div>

      <MasterDeveloperConsoleModal 
        isOpen={isMasterModalOpen} 
        onClose={() => setIsMasterModalOpen(false)} 
        onLoginAsAdmin={(adminUser) => onLogin(adminUser)}
      />
    </div>
  );
}"""

replacement1 = """      </div>
    </div>
  );
}"""

if target1 in content:
    content = content.replace(target1, replacement1)
else:
    print("target1 not found")

# 2. Add isMasterModalOpen to AppContent
target2 = """  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);"""
replacement2 = """  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);"""
if target2 in content:
    content = content.replace(target2, replacement2)
else:
    print("target2 not found")

# 3. Add MasterDeveloperConsoleModal at the bottom of AppContent
target3 = """      {/* Global VYAPAR BRIDGE Approval Center Modal */}
      <ApprovalCenterModal 
        isOpen={isGlobalApprovalCenterOpen} 
        onClose={() => setIsGlobalApprovalCenterOpen(false)} 
        user={user}
        onOpenVerify={() => setIsGlobalVerifyModalOpen(true)}
      />"""
replacement3 = """      {/* Global VYAPAR BRIDGE Approval Center Modal */}
      <ApprovalCenterModal 
        isOpen={isGlobalApprovalCenterOpen} 
        onClose={() => setIsGlobalApprovalCenterOpen(false)} 
        user={user}
        onOpenVerify={() => setIsGlobalVerifyModalOpen(true)}
      />

      {/* Master Developer Console Modal (Admin Only) */}
      <MasterDeveloperConsoleModal 
        isOpen={isMasterModalOpen} 
        onClose={() => setIsMasterModalOpen(false)} 
        onLoginAsAdmin={(adminUser) => handleUpdateUser(adminUser)}
      />"""
if target3 in content:
    content = content.replace(target3, replacement3)
else:
    print("target3 not found")

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
