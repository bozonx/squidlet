#!/usr/bin/env bash

# squidlet
sudo cp ./squidlet.service /etc/systemd/system
sudo systemctl enable squidlet.service
sudo systemctl restart squidlet.service
