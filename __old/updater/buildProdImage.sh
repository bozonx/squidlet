#!/bin/bash
set -e;

DIRNAME=$(dirname $0);

cd ${DIRNAME}/../;

# remove first param which is like "x86 | rpi | arm" and pass other params
PARAMS=$(echo ${@} | cut -d " " -f 2-);

npm run buildUpdater-${1} -- ${PARAMS};

docker build -t "bozonx/squidlet:${1}" -f ./updater/Dockerfile-${1} .;
