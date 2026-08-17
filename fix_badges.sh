#!/bin/bash
sed -i 's/<VerifiedBadge size="sm" \/>/<VerifiedBadge size="sm" plan={usr?.verifiedPlan} \/>/g' src/App.tsx
sed -i 's/<VerifiedBadge size="sm" \/>/<VerifiedBadge size="sm" plan={u?.verifiedPlan} \/>/g' src/App.tsx
sed -i 's/<VerifiedBadge size="sm" \/>/<VerifiedBadge size="sm" plan={user?.verifiedPlan} \/>/g' src/App.tsx
sed -i 's/<VerifiedBadge size="lg" \/>/<VerifiedBadge size="lg" plan={userToDisplay?.verifiedPlan} \/>/g' src/App.tsx
