import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove the second onError from that block
desktop_start = content.find('            {/* Center Animated Brand Header */}')
if desktop_start != -1:
    desktop_end = content.find('/>', desktop_start) + 2
    img_block = content[desktop_start:desktop_end]
    
    # regex to remove the second onError
    img_block_fixed = re.sub(r'onError=\{\(e\) => \(e\.currentTarget\.style\.display = \'none\'\)\}', '', img_block)
    
    content = content[:desktop_start] + img_block_fixed + content[desktop_end:]
    
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Fixed")
