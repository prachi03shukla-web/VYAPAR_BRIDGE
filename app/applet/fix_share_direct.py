with open("src/App.tsx", "r") as f:
    content = f.read()

start_idx = content.find("const handleShare =")
end_idx = content.find("const handleAddComment =", start_idx)

new_handle_share = """  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (currentUser?.id) {
      safeFetch(`/api/posts/${reel.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      }).catch(console.error);
    }

    const shareText = `VYAPAR BRIDGE\\n\\n${reel?.title ? reel.title + '\\n' : ''}${reel?.content ? reel.content + '\\n\\n' : ''}Check out this post on Vyapar Bridge B2B Network!`;
    const shareUrl = window.location.href;
    const whatsappUrl = `https://api.whatsapp.com/send?text=` + encodeURIComponent(shareText + "\\n" + shareUrl);

    try {
      window.open(whatsappUrl, '_blank');
      setSharesCount(prev => prev + 1);
      toast.success('Opening WhatsApp to share!');
      return;
    } catch (err) {
      console.warn("WhatsApp open failed", err);
    }

    try {
      const textToCopy = shareText + "\\n" + shareUrl;
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Post link copied to clipboard!');
      setSharesCount(prev => prev + 1);
    } catch (e) {
      toast.error('Could not share or copy link');
    }
  };"""

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_handle_share + "\n\n  " + content[end_idx:]
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Successfully updated handleShare")
else:
    print("Could not find handleShare bounds")
