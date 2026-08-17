sed -i 's/const handleShare = (e: React.MouseEvent) => {/const handleShare = async (e: React.MouseEvent) => {/g' src/App.tsx
npm run build
