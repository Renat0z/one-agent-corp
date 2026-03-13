#!/bin/bash
# Rollback: docker-compose down && docker-compose up -d --no-build
ssh root@89.167.83.218 "cd /opt/swarm-os-v5 && docker-compose down && docker-compose up -d --no-build"
