#!/bin/bash
# Rollback: docker-compose down && docker-compose up -d --no-build
ssh root@89.167.83.218 "cd /opt/micro-saas-opportunities-2026 && docker-compose down && docker-compose up -d --no-build"
