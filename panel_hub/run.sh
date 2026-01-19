#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Panel Hub..."

cd /app
exec bun run src/index.ts
