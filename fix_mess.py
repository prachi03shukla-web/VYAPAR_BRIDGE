import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove all definitions of state
content = re.sub(r"\n  const \[isLogoLightboxOpen, setIsLogoLightboxOpen\] = useState\(false\);", "", content)
content = re.sub(r"const \[isLogoLightboxOpen, setIsLogoLightboxOpen\] = useState\(false\);\n", "", content)

# Remove all instances of the lightbox code block
lightbox_pattern = r"\s*\{\/\* Logo Lightbox Modal \*\/\}\s*\{isLogoLightboxOpen && \(\s*<div className=\"fixed inset-0.*?</div>\s*\)\s*\}\s*"
content = re.sub(lightbox_pattern, "", content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Cleaned!")
