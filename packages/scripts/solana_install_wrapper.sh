#!/bin/bash

# Check if a version argument is passed; if not, use a default
DESIRED_SOLANA_VERSION=${1:-"v1.14.17"}

# Fetch the latest installer version
LATEST_INSTALLER_VERSION=$(curl -sSfL https://api.github.com/repos/solana-labs/solana/releases/latest | grep -m 1 "tag_name" | sed -ne 's/^ *"tag_name": "\([^"]*\)",$/\1/p')

# Download the latest install script
INSTALL_SCRIPT_URL="https://release.anza.xyz/$LATEST_INSTALLER_VERSION/install"
curl -sSfL "$INSTALL_SCRIPT_URL" -o solana_install_latest.sh

# Make the script executable
chmod +x solana_install_latest.sh

# Replace SOLANA_INSTALL_INIT_ARGS with the desired version in the downloaded script
sed -i.bak "s/^SOLANA_INSTALL_INIT_ARGS=.*/SOLANA_INSTALL_INIT_ARGS=$DESIRED_SOLANA_VERSION/" solana_install_latest.sh

# Verify that the change was made (for debugging, optional)
grep "SOLANA_INSTALL_INIT_ARGS=" solana_install_latest.sh

# Run the modified install script
./solana_install_latest.sh
