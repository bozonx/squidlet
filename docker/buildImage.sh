#!/bin/bash

bash -c "cd ../; npm run buildUpdater"
docker build -t "bozonx/squidlet" .
