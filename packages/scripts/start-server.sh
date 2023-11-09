#!/bin/bash
# This script is the target of the systemd mcsrv service

SCRIPT_DIR=$(cd $(dirname $0); pwd)
SERVER_DIR=$SCRIPT_DIR/../server
SERVER_EXECUTABLE=$SERVER_DIR/paper.jar
SERVER_MEMORY=${SERVER_MEMORY:-1024M}

NAMED_PIPE=/home/ec2-user/mcsrv.fifo

echo "Starting server with $SERVER_MEMORY of memory at ($SERVER_EXECUTABLE)"

cd $SERVER_DIR

tail -n1 -f $NAMED_PIPE | java -Xmx${SERVER_MEMORY} -Xms${SERVER_MEMORY} -jar $SERVER_EXECUTABLE nogui
