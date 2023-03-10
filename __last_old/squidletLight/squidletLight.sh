#!/usr/bin/env bash

DIRNAME=$(dirname $0)

. "$NVM_DIR/nvm.sh";

ts-node ${DIRNAME}/index.ts ${@}
