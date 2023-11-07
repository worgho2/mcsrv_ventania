#!/bin/bash

SCRIPT_DIR=$(cd $(dirname $0); pwd)
ROOT_DIR=$SCRIPT_DIR/..

cd $ROOT_DIR

# Pull changes
git pull

# Abort if there are no changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit"
    exit 0
fi

# Commit and Push changes from packages/server to origin
git add .
git commit -m "sync: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push
