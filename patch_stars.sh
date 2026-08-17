#!/bin/bash

# Remove bottom rating indicator
sed -i '1577,1582d' src/App.tsx

# Remove rating modal and related logic
# 1664 to 1708 is Rating Modal
sed -i '1664,1708d' src/App.tsx

# Remove option from Options modal (1719 to 1722)
# Check lines first to be safe
