#!/bin/sh
# Builds and starts the site, and prints its public address.
#
# If .env sets TUNNEL_TOKEN, the site runs on SITE_URL (for example https://earlythesis.com)
# through the named tunnel. Otherwise it falls back to a temporary quick tunnel address.
cd "$(dirname "$0")/.." || exit 1
[ -f .env ] && . ./.env

if [ -n "$TUNNEL_TOKEN" ]; then
  [ -n "$SITE_URL" ] || { echo "Set SITE_URL in .env, for example https://earlythesis.com"; exit 1; }
  docker compose --profile quick stop quicktunnel >/dev/null 2>&1
  docker compose --profile quick rm -f quicktunnel >/dev/null 2>&1
  SITE_URL="$SITE_URL" TUNNEL_TOKEN="$TUNNEL_TOKEN" docker compose --profile named up -d --build app tunnel || exit 1
  echo "Live at: $SITE_URL"
  exit 0
fi

docker compose --profile quick up -d quicktunnel || exit 1
URL=""
for i in 1 2 3 4 5 6 7 8 9 10; do
  URL=$(docker compose --profile quick logs quicktunnel 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)
  [ -n "$URL" ] && break
  sleep 2
done
[ -z "$URL" ] && echo "Could not find the tunnel address. Check: docker compose --profile quick logs quicktunnel" && exit 1
SITE_URL="$URL" docker compose up -d --build app || exit 1
echo "Live at: $URL (temporary)"
