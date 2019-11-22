#!/bin/sh
set -e

#groupadd --gid ${PGID} services;
#useradd --uid ${PUID} --gid services --shell /bin/bash --create-home services;
##adduser services root;
#usermod -aG root services;
#usermod -aG sudo services;

exec "$@"
