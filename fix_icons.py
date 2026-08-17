import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace "/icon.png" with "/tileanceindia_fixed.png"
# and simplify the onError handler
content = re.sub(
    r'src="/icon\.png"', 
    r'src="/tileanceindia_fixed.png"', 
    content
)

content = re.sub(
    r'onError=\{\(e\) => \{ if \(e\.currentTarget\.src\.includes\(\'icon\.png\'\)\) \{ e\.currentTarget\.src = \'/tileanceindia_fixed\.png\'; \} else \{ e\.currentTarget\.style\.display = \'none\'; \} \}\}',
    r'onError={(e) => (e.currentTarget.style.display = \'none\')}',
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Icons replaced")
