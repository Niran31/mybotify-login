#!/bin/bash
# Build script for Render deployment
set -e

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 Installing Python dependencies..."
pip install -r "$SCRIPT_DIR/requirements.txt"

echo "🔧 Installing Node.js dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install

echo "🔧 Building React app..."
npm run build

echo "✅ Build complete!"
