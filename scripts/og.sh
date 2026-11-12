#!/bin/sh
# Renders public/og.png (the social preview image) from the running site. Rebuild the site afterwards.
cd "$(dirname "$0")/.." || exit 1
docker run --rm --network what-ai_inside --ipc=host --user "$(id -u):$(id -g)" \
  -v "$PWD":/work:ro -e HOME=/tmp -v "$PWD/public":/out -w /work -e URL=http://app:8080/ \
  mcr.microsoft.com/playwright:v1.56.1-noble node scripts/og.mjs
