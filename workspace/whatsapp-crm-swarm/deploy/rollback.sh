#!/bin/bash
# Rollback: docker compose down && docker compose up -d --no-build
echo "🔄 Rolling back deployment..."
ssh root@89.167.83.218 "cd /opt/whatsapp-crm-swarm && docker compose down && docker compose up -d --no-build"
echo "✅ Rollback complete"
