#!/bin/bash

# Exit on error
set -e

echo "Building Donut Extension Backend..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Compiling TypeScript..."
npm run build

echo "Build completed successfully!"
echo "You can now run the server with: npm start" 