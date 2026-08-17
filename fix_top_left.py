import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the top left logo block in mobile header entirely
left_start = content.find('        {/* Top Left Menu */}')
if left_start != -1:
    end_of_img = content.find('/>', left_start) + 2
    
    # We want to replace the img with the menu button
    # Wait, the menu button is supposed to toggle isLogoMenuOpen
    replacement = """        {/* Top Left Menu */}
        <div className="flex items-center z-10 relative">
          <button 
            onClick={() => setIsLogoMenuOpen(!isLogoMenuOpen)}
            className="p-1.5 text-black/70 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ShieldCheck className="w-6 h-6" />
          </button>"""
          
    content = content[:left_start] + replacement + content[end_of_img:]

    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Fixed left menu")
else:
    print("Could not find Top Left Menu")

