#!/bin/bash

# Update package lists
apt-get update

# Install Chromium (the correct package for Debian/Ubuntu)
apt-get install -y chromium

# Verify installation and find the executable
echo "Checking for Chromium installation..."
which chromium && echo "Chromium found!" || echo "Chromium not found in PATH"
ls -la /usr/bin/chromium* || echo "No chromium files in /usr/bin"

# Run npm install
npm install

echo "Build script completed successfully"
