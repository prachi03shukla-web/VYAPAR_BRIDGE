#!/bin/bash
sed -i 's/onClick={handleDelete}/onClick={(e) => { e.stopPropagation(); handleDelete(); }}/g' src/App.tsx
sed -i 's/onClick={handleNotInterested}/onClick={(e) => { e.stopPropagation(); handleNotInterested(); }}/g' src/App.tsx
