#!/bin/bash
# Build script for Render deployment

echo "🔧 Installing Python dependencies..."
pip install -r requirements.txt

echo "🔧 Installing Node.js dependencies..."
cd frontend
npm install

echo "🔧 Building React app..."
npm run build

echo "✅ Build complete!"
