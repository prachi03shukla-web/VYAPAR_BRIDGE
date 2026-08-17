#!/bin/bash
awk '
BEGIN { in_reel = 0 }
/function ReelCard/ { in_reel = 1 }
/Top Header Overlay/ {
  if (in_reel) {
    print $0
    getline
    sub(/gap-2/, "gap-2 pointer-events-auto")
    print $0
    next
  }
}
/title="Toggle Aspect Ratio/ {
  if (in_reel) {
    print $0
    next
  }
}
{ print $0 }
' src/App.tsx > tmp.tsx && mv tmp.tsx src/App.tsx
