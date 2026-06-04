#!/bin/bash
apt-get update
apt-get install -y dante-server
id -u worldmodels &>/dev/null || useradd --shell /usr/sbin/nologin -m worldmodels
echo "worldmodels:wmproxy2026" | chpasswd
systemctl restart danted
systemctl enable danted
systemctl status danted --no-pager
