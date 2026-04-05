#!/bin/bash
cd "$(dirname "$0")"
echo "🔑 AIforSecurity Hub"
echo "📦 Installing dependencies..."
npm install --silent
echo "📑 Generating index from wiki/ ..."
node gen-index.mjs
echo "🔄 Syncing wiki/ → public/wiki/ ..."
rm -rf public/wiki
mkdir -p public/wiki
cp -r wiki/openclaw-threat-model public/wiki/openclaw-threat-model
cp -r wiki/ai-agent-threat-model public/wiki/ai-agent-threat-model
echo "🌐 Starting dev server..."
npx vite --open
