import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onToggleTheme={toggleDark}
        isDark={isDark}
      />"""

replacement = """        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onToggleTheme={toggleDark}
        isDark={isDark}
        onOpenMasterConsole={() => setIsMasterModalOpen(true)}
      />"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("target not found")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
