#!/bin/bash
set -e

# Install dependencies
npm install

# Build client and server
npm run build

# Start the server
npm start
