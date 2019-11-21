#!/bin/sh
set -e

#groupadd --gid ${PGID} services;
#useradd --uid ${PUID} --gid services --shell /bin/bash --create-home services;
##adduser services root;
#usermod -aG root services;
#usermod -aG sudo services;

#. /home/appuser/.nvm/nvm.sh;
exec "$@"

#cmd=". /home/appuser/.nvm/nvm.sh && $@"
#bash -c "$cmd"
#bash -c "$@"

#chown services:services -R /root/.nvm;
#chmod ugo+w -R /root/.nvm;
#
#echo "%sudo   ALL=(ALL:ALL) ALL" > /etc/sudoers

#ln -s /root/.nvm /home/services

#cmd=". /root/.nvm/nvm.sh && cd /app && $@"
#export NVM_DIR="/root/.nvm"
#cmd="sudo . $NVM_DIR/nvm.sh && cd /app && $@"

#ls /root/.nvm/versions/node/v13.1.0/bin -la
#ls /root/.nvm/versions/node/v13.1.0/lib/node_modules/npm/bin -la
#cat /etc/group
#cat /etc/passwd

#cmd="cd /app && /root/.nvm/versions/node/v13.1.0/bin/npm"


#ls /root/.nvm -la
#ls /usr -la
#ls /usr/local -la
#ls /etc -la
#ls /proc -la
#ls / -la
#cat /etc/group
#cat /etc/sudoers

#cat /root/.nvm/nvm.sh

#. /root/.nvm/nvm.sh

#runuser -l services -c "$cmd"
#runuser -u services -g services -p -- bash -c "$cmd"
#runuser -u root -g services -p -- bash -c "$cmd"
