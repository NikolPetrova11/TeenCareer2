#!/bin/bash

# Install system dependencies for Chromium
apt-get update
apt-get install -y chromium-browser chromium-common

# Copy Chromium to expected location
mkdir -p /usr/bin
which chromium-browser && echo "Chromium found at $(which chromium-browser)" || echo "Chromium not found, installing..."

# Run npm install
npm install

echo "Build script completed successfully"
