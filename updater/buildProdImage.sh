#!/bin/bash

bash -c "cd ../; npm run buildUpdater-${1}"

cd ./${1}
docker build -t "bozonx/squidlet:${1}" .
