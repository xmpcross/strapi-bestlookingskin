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

# A successful build does NOT guarantee new HTML: .next/cache holds prerendered
# ISR pages and will happily keep serving the previous render. Clearing it costs
# a few seconds of rebuild and saves a confusing debugging round.
rm -rf .next/cache

yarn build
sudo systemctl restart bestlooking-skin.service

for _ in $(seq 1 20); do
  sleep 2
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 20 http://127.0.0.1:3002/ || true)
  [ "$code" = "200" ] && { echo "deployed: $(git log --oneline -1)"; exit 0; }
done

echo "site did not return 200 after restart -- check: journalctl -u bestlooking-skin -n 50" >&2
exit 1
