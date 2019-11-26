#!/bin/bash
set -e;

DIRNAME=$(dirname $0);

cd ${DIRNAME}/../;

npm run buildUpdater-${1};

docker build -t "bozonx/squidlet:${1}" -f ./updater/Dockerfile-${1} .;
