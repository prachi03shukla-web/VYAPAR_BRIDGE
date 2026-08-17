import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """  useEffect(() => {
    const handleOpenVerify = () => setIsGlobalVerifyModalOpen(true);
    window.addEventListener('openVerifyModal', handleOpenVerify);
    return () => window.removeEventListener('openVerifyModal', handleOpenVerify);
  }, []);"""

replacement = """"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("target not found")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
