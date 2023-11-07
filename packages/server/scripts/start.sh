#!/bin/bash

SCRIPT_DIR=$(cd $(dirname $0); pwd)
ROOT_DIR=$SCRIPT_DIR/..
SERVER_EXECUTABLE=$ROOT_DIR/paper.jar
SERVER_MEMORY=${SERVER_MEMORY:-2048M}

echo "Starting server with $SERVER_MEMORY of memory at ($SERVER_EXECUTABLE)"

cd $ROOT_DIR
java -Xmx${SERVER_MEMORY} -Xms${SERVER_MEMORY} -jar $SERVER_EXECUTABLE nogui