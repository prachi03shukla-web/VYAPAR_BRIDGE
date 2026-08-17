import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target_props = """  onOpenCalculator,
  onToggleTheme, 
  isDark 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any; 
  onLogout: () => void; 
  onOpenEditProfile: () => void; 
  onOpenVerify: () => void; 
  onOpenApprovalCenter?: () => void;
  onOpenCalculator: () => void;
  onToggleTheme: () => void; 
  isDark: boolean; 
}) {"""
replacement_props = """  onOpenCalculator,
  onToggleTheme, 
  isDark,
  onOpenMasterConsole
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any; 
  onLogout: () => void; 
  onOpenEditProfile: () => void; 
  onOpenVerify: () => void; 
  onOpenApprovalCenter?: () => void;
  onOpenCalculator: () => void;
  onToggleTheme: () => void; 
  isDark: boolean; 
  onOpenMasterConsole?: () => void;
}) {"""
if target_props in content:
    content = content.replace(target_props, replacement_props)
else:
    print("target_props not found")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
