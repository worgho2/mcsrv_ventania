#!/bin/bash

SCRIPT_DIR=$(cd $(dirname $0); pwd)
ROOT_DIR=$SCRIPT_DIR/..
GITHUB_DEPLOY_KEY_FILE=$ROOT_DIR/github_deploy_key.pem
SSH_CONFIG_FILE=$SCRIPT_DIR/config # ~/.ssh/config

# Check if the deploy key exists
if [ ! -f $GITHUB_DEPLOY_KEY_FILE ]; then
    echo "Deploy key not found at $GITHUB_DEPLOY_KEY_FILE"
    exit 1
fi

# Update deploy key permissions
chmod 600 $GITHUB_DEPLOY_KEY_FILE

# Create ssh config file if it doesn't exist
if [ ! -f $SSH_CONFIG_FILE ]; then
    touch $SSH_CONFIG_FILE
fi

# Configure ssh to use the deploy key when connecting to github.com
echo "Host github.com" > $SSH_CONFIG_FILE
echo -e "\tHostname github.com" >> $SSH_CONFIG_FILE
echo -e "\tIdentityFile $GITHUB_DEPLOY_KEY_FILE" >> $SSH_CONFIG_FILE

# Abort if there are no changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit"
    exit 0
fi

# Commit changes
git add .
git commit -m "Update $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Push changes to github using the deploy key
git push
