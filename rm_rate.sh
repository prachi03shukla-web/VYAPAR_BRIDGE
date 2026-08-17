#!/bin/bash
awk '
/setShowRatingModal\(true\)/ {
  skip=4
}
{
  if (skip > 0) {
    skip--
  } else {
    print $0
  }
}
' src/App.tsx > src/App.tsx.new
mv src/App.tsx.new src/App.tsx
