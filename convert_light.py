import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "function MasterDeveloperConsoleModal(" in line:
        start_idx = i
        break

if start_idx == -1:
    print("Not found")
    sys.exit(1)

end_idx = -1
# Assuming it ends when we hit "function ApprovalCenterModal("
for i in range(start_idx, len(lines)):
    if "function ApprovalCenterModal(" in line:
        end_idx = i - 1
        break

if end_idx == -1:
    end_idx = len(lines) - 1

modal_code = "".join(lines[start_idx:end_idx])

# Now perform replacements inside modal_code

# Outer container
modal_code = modal_code.replace('bg-slate-900 border-2 border-blue-500/50 text-white', 'bg-white border border-slate-200 text-black')

# Header
modal_code = modal_code.replace('bg-gradient-to-r from-slate-950 via-zinc-900 to-slate-950 p-4 sm:p-5 border-b border-blue-900/60', 'bg-[#E6C76C] p-4 sm:p-5 border-b border-slate-200')
modal_code = modal_code.replace('text-[11px] text-black/60', 'text-[11px] text-black/70')
modal_code = modal_code.replace('text-blue-200', 'text-blue-800')

# Content background
modal_code = modal_code.replace('bg-slate-950/60', 'bg-slate-50')
modal_code = modal_code.replace('bg-slate-950 p-6', 'bg-white p-6')
modal_code = modal_code.replace('bg-slate-900 border border-blue-500/30 text-white', 'bg-slate-50 border border-slate-200 text-black')
modal_code = modal_code.replace('bg-slate-800/80', 'bg-slate-100')
modal_code = modal_code.replace('bg-slate-800/50', 'bg-slate-50')
modal_code = modal_code.replace('bg-slate-800', 'bg-slate-100')
modal_code = modal_code.replace('border-slate-800', 'border-slate-200')
modal_code = modal_code.replace('border-blue-900/40', 'border-blue-200')
modal_code = modal_code.replace('border-blue-900/60', 'border-blue-200')
modal_code = modal_code.replace('border-slate-700', 'border-slate-300')
modal_code = modal_code.replace('bg-slate-900', 'bg-white')
modal_code = modal_code.replace('bg-slate-950', 'bg-slate-50')
modal_code = modal_code.replace('text-white', 'text-black')
modal_code = modal_code.replace('text-blue-400', 'text-blue-600')
modal_code = modal_code.replace('text-slate-400', 'text-slate-600')
modal_code = modal_code.replace('text-slate-300', 'text-slate-700')
modal_code = modal_code.replace('text-slate-200', 'text-slate-800')

lines[start_idx:end_idx] = [modal_code]

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)

print("Done")
