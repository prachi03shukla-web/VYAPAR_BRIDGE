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
    
    const shareText = `VYAPAR BRIDGE\n\n${reel?.title ? reel.title + '\n' : ''}${reel?.content ? reel.content + '\n\n' : ''}Check out this post on Vyapar Bridge B2B Network!`;
    const shareUrl = window.location.href;
    
    const shareData = {
      title: 'VYAPAR BRIDGE',
      text: shareText,
      url: shareUrl,
    };

    // 1. Try Native Share
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setSharesCount(prev => prev + 1);
        toast.success('Shared successfully!');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          toast('Share cancelled');
          return;
        }
        // Fall through to WhatsApp / Clipboard if native share fails
        console.warn('Native share failed, using fallback:', err);
      }
    }

    // 2. Fallback: Copy link & toast
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
cat src/App.tsx | sed -n '1322,$p' >> src/App.tsx.new
mv src/App.tsx.new src/App.tsx
