#!/bin/bash
sed -i 's/<div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white z-20/<div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white z-[50] pointer-events-none/g' src/App.tsx
sed -i 's/<div className="flex items-center gap-2">/<div className="flex items-center gap-2 pointer-events-auto">/g' src/App.tsx
