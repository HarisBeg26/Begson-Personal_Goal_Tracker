#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
npm --prefix client install

echo "Installing server dependencies..."
npm --prefix server install

echo "Building client..."
npm --prefix client run build

echo "Building server..."
npm --prefix server run build

echo "Build complete!"
