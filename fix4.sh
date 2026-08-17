#!/bin/bash
sed -i '1331i\
  const handleAddComment = async (e: React.FormEvent) => {\
    e.preventDefault();\
    if (!commentText.trim()) return;\
    setIsSubmittingComment(true);' src/App.tsx
