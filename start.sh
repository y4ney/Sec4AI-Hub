#!/bin/bash
cd "$(dirname "$0")"
echo "🔑 Sec4AI Hub"
echo "📦 Installing dependencies..."
npm install --silent
echo "📑 Generating index from wiki/ ..."
node gen-index.mjs
echo "🌐 Starting dev server..."
npx vite --open
