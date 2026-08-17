#!/bin/bash
cat src/App.tsx | sed -n '1,1282p' > src/App.tsx.new
cat << 'INNER' >> src/App.tsx.new
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.id) {
      fetch(`/api/posts/${reel.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      }).catch(console.error);
    }
    
    const shareData = {
      title: 'VYAPAR BRIDGE',
      text: `VYAPAR BRIDGE\n\n${reel?.title ? reel.title + '\n' : ''}${reel?.content ? reel.content + '\n\n' : ''}Check out this post on Vyapar Bridge B2B Network!`,
      url: window.location.href,
    };

    // 1. Try Native Share First
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setSharesCount(prev => prev + 1);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // 2. Final Fallback: Copy to clipboard instead of blocked window.open
    try {
      // Create fallback string
      const textToCopy = shareData.text + "\n" + shareData.url;
      
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
      toast.success('Post link copied to clipboard!');
      setSharesCount(prev => prev + 1);
    } catch (e) {
      toast.error('Could not share or copy link');
    }
  };
INNER
cat src/App.tsx | sed -n '1322,$p' >> src/App.tsx.new
mv src/App.tsx.new src/App.tsx
