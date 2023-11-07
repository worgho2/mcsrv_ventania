#!/bin/bash

SCRIPT_DIR=$(cd $(dirname $0); pwd)
ROOT_DIR=$SCRIPT_DIR/..
LOG_FILE=~/sync.log

cd $ROOT_DIR

git pull | tee -a $LOG_FILE

# Abort if there are no changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit" | tee -a $LOG_FILE
    exit 0
fi

# Commit and Push changes from packages/server to origin and log the execution to a file
git add . | tee -a $LOG_FILE
git commit -m "sync: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a $LOG_FILE
git push | tee -a $LOG_FILE

