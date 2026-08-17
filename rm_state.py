import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """  const [selectedRole, setSelectedRole] = useState<'factory' | 'dealer' | 'customer'>('factory');
  const [isLogin, setIsLogin] = useState(true);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  
  // Common Form States"""
replacement = """  const [selectedRole, setSelectedRole] = useState<'factory' | 'dealer' | 'customer'>('factory');
  const [isLogin, setIsLogin] = useState(true);
  
  // Common Form States"""
if target in content:
    content = content.replace(target, replacement)
else:
    print("Not found")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
