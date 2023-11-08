#!/bin/bash
# This script runs every 10 minutes to sync the server data to the cloud

SCRIPT_DIR=$(cd $(dirname $0); pwd)
SERVER_DIR=$SCRIPT_DIR/../server
LOG_FILE=/home/ec2-user/sync.log

cd $SERVER_DIR

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

