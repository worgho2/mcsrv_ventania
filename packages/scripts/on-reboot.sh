#!/bin/bash
# This script is executed when the system is rebooted

SCRIPT_DIR=$(cd $(dirname $0); pwd)
SERVER_DIR=$SCRIPT_DIR/../server

cd $SERVER_DIR

# Check if there are changes to the repository
git pull

# Restart the mcsrv systemd service
sudo systemctl restart mcsrv
