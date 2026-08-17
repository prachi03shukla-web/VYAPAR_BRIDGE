#!/bin/bash
cat src/App.tsx | sed -n '1,1350p' > src/App.tsx.new
# Let's just fix it cleanly by extracting up to line 1325 and appending the rest properly
cat << 'INNER' >> src/App.tsx.new
    try {
      const textToCopy = shareText + "\n" + shareUrl;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('VYAPAR BRIDGE post link copied to clipboard!');
      setSharesCount(prev => prev + 1);
    } catch (e) {
      toast.error('Could not share or copy link. Please try again.');
    }
  };
INNER
cat src/App.tsx | sed -n '1353,$p' >> src/App.tsx.new
mv src/App.tsx.new src/App.tsx
npm run build
