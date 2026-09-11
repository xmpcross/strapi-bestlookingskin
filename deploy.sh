#!/usr/bin/env bash
#
# Deploy bestlooking.skin.
#
# Production runs on THIS host from this very directory -- there is no copy step
# and no remote. The site moved off Vercel on 2026-08-15; nginx proxies
# www.bestlooking.skin to bestlooking-skin.service on 127.0.0.1:3002.
#
#   ./deploy.sh          build from the working tree, then restart
#   ./deploy.sh --pull   git pull first
#
# Because the working tree IS production, an uncommitted edit goes live the
# moment this runs. That is deliberate -- it makes previewing local changes
# cheap -- but a half-finished edit ships too, so the script refuses to build a
# dirty tree unless you pass --allow-dirty.

set -euo pipefail
cd "$(dirname "$0")"

PULL=0; ALLOW_DIRTY=0
for a in "$@"; do
  case "$a" in
    --pull) PULL=1 ;;
    --allow-dirty) ALLOW_DIRTY=1 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

export NVM_DIR=/root/.nvm
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22 >/dev/null
export NODE_OPTIONS=--max-old-space-size=2048

[ "$PULL" = 1 ] && git pull --ff-only

if [ -n "$(git status --porcelain)" ] && [ "$ALLOW_DIRTY" = 0 ]; then
  echo "working tree is dirty -- commit, stash, or pass --allow-dirty" >&2
  git status --short >&2
  exit 1
fi

# Remove the whole build directory, not just .next/cache.
#
# Clearing only the cache was not enough and failed silently in production on
# 12 Sep 2026: the build emitted a new stylesheet hash but did NOT regenerate
# .next/server/app/index.html, which kept linking the PREVIOUS build's CSS. That
# file was gone, so every page served a 404 stylesheet and the live site
# rendered unstyled -- while the build reported success and the service came up
# 200, so nothing in this script noticed.
#
# A full clean costs some seconds of rebuild. That is cheap next to shipping an
# unstyled site that looks healthy to every check we have.
#
# The service is STOPPED first, not just restarted afterwards. A running
# `next start` regenerates ISR pages into .next while the build is writing it,
# using the manifest the old process loaded at ITS startup. The page it writes
# therefore links the PREVIOUS build's asset hashes, and it overwrites the HTML
# the new build just produced. That is what actually caused the unstyled site:
# clearing .next was not enough, because the old process refilled it.
#
# The cost is a few seconds of downtime instead of zero. A short 502 is a much
# smaller problem than serving a stale, broken page that looks fine to every
# health check.
sudo systemctl stop bestlooking-skin.service
rm -rf .next

yarn build
sudo systemctl start bestlooking-skin.service

for _ in $(seq 1 20); do
  sleep 2
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 20 http://127.0.0.1:3002/ || true)
  if [ "$code" = "200" ]; then
    # Every stylesheet the homepage asks for must actually exist. This is the
    # exact check that would have caught the 12 Sep 2026 unstyled-site incident:
    # the page returned 200 while its CSS returned 404.
    missing=0
    for href in $(curl -s -m 20 http://127.0.0.1:3002/ \
                  | grep -o '/_next/static/css/[a-z0-9]*\.css' | sort -u); do
      css=$(curl -s -o /dev/null -w '%{http_code}' -m 20 "http://127.0.0.1:3002$href" || true)
      [ "$css" = "200" ] || { echo "MISSING stylesheet: $href -> $css" >&2; missing=1; }
    done
    if [ "$missing" = "1" ]; then
      echo "build served a stylesheet that does not exist -- site would render unstyled" >&2
      exit 1
    fi
    echo "deployed: $(git log --oneline -1)"
    exit 0
  fi
done

echo "site did not return 200 after restart -- check: journalctl -u bestlooking-skin -n 50" >&2
exit 1
