#!/usr/bin/env bash
#set -e

DIRNAME=$(dirname $0)

. "$NVM_DIR/nvm.sh";

ts-node ${DIRNAME}/index.ts ${@}
