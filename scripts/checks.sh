#!/bin/sh
# Runs scripts/checks.mjs inside the official Playwright image, against the running "app" container.
cd "$(dirname "$0")/.." || exit 1
mkdir -p /tmp/wai-out
docker run --rm --network what-ai_inside --ipc=host --user "$(id -u):$(id -g)" \
  -v "$PWD":/work:ro -e HOME=/tmp -v /tmp/wai-out:/tmp/wai-shots -w /work \
  -e URL=http://app:8080/ \
  mcr.microsoft.com/playwright:v1.56.1-noble node scripts/checks.mjs
