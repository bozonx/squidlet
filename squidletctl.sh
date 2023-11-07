#!/usr/bin/env bash

CUR_DIR=$(dirname $(realpath "$0"))

/usr/bin/env node $CUR_DIR/distr/src/squidletctl/index.js "$@"
