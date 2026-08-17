import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix buttons
content = content.replace('bg-blue-600 hover:bg-blue-500 text-black', 'bg-blue-600 hover:bg-blue-500 text-white')
content = content.replace('bg-emerald-600 hover:bg-emerald-500 text-black', 'bg-emerald-600 hover:bg-emerald-500 text-white')
content = content.replace('bg-red-600 hover:bg-red-500 text-black', 'bg-red-600 hover:bg-red-500 text-white')
content = content.replace('bg-amber-600 hover:bg-amber-500 text-black', 'bg-amber-600 hover:bg-amber-500 text-white')

# There might also be `bg-slate-800 hover:bg-slate-700 text-black` which should probably be text-white or text-black. We'll leave as is if not colored bg.

# We changed `text-white` to `text-black`. Let's check `bg-blue-600 text-black` generally:
content = content.replace('bg-blue-600 text-black', 'bg-blue-600 text-white')
content = content.replace('bg-emerald-600 text-black', 'bg-emerald-600 text-white')
content = content.replace('bg-red-500 text-black', 'bg-red-500 text-white')
content = content.replace('bg-blue-500 text-black', 'bg-blue-500 text-white')
content = content.replace('bg-emerald-500 text-black', 'bg-emerald-500 text-white')
content = content.replace('bg-red-500 text-black', 'bg-red-500 text-white')
content = content.replace('bg-amber-500 text-black', 'bg-amber-500 text-white')

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
