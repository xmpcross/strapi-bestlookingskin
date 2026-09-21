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

PULL=0; ALLOW_DIRTY=0; ALLOW_CMS_FALLBACK=0; ALLOW_CMS_CERT=0
for a in "$@"; do
  case "$a" in
    --pull) PULL=1 ;;
    --allow-dirty) ALLOW_DIRTY=1 ;;
    --allow-cms-fallback) ALLOW_CMS_FALLBACK=1 ;;
    --allow-cms-cert) ALLOW_CMS_CERT=1 ;;
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

# CMS certificate guard. This runs BEFORE the service is stopped, so failing
# here costs no downtime -- the old build keeps serving.
#
# Every page on this site renders from https://cms.fxnstudio.com. When that
# certificate expires, Node refuses the connection with CERT_HAS_EXPIRED,
# strapiTry() in lib/strapi.ts swallows it, and the build falls back to
# content/seed -- categories and stores, but no posts and no products.
#
# The CMS-fallback guard further down already catches that, but only after a
# full build, only after the service has been stopped, and its message blames
# STRAPI_API_TOKEN -- which sends you looking in entirely the wrong place.
#
# That is what happened on 21 Sep 2026. The cert expired on the 19th and every
# frontend served empty pages for two days. cms.fxnstudio.com was the one host
# name on the box NOT managed by certbot: its cert had been hand-copied into
# /etc/nginx/ssl/, so certbot.timer renewed the other 27 domains twice a day and
# never once touched this one. It is under certbot now, but a silent expiry is
# worth naming in a single line rather than rediscovering from an empty site.
#
# This check never blocks a deploy for a reason of its own making: if openssl is
# missing, the URL is not https, or the host cannot be reached, it says so and
# carries on. Only a genuinely expired certificate stops the deploy.
CMS_CERT_WARN_DAYS=14

check_cms_cert() {
  command -v openssl >/dev/null 2>&1 || { echo "note: openssl not found, skipping CMS certificate check" >&2; return 0; }

  local url host port end end_ts now_ts days
  url="$(sed -n 's/^NEXT_PUBLIC_STRAPI_URL=//p' .env.local 2>/dev/null | tail -1 | tr -d '"'\''' | tr -d '[:space:]')"
  case "$url" in
    https://*) ;;
    "")        echo "note: NEXT_PUBLIC_STRAPI_URL not set in .env.local, skipping CMS certificate check" >&2; return 0 ;;
    *)         echo "note: CMS is not https ($url), skipping certificate check" >&2; return 0 ;;
  esac

  host="${url#https://}"; host="${host%%/*}"
  port="${host##*:}"; [ "$port" = "$host" ] && port=443
  host="${host%%:*}"

  end="$(openssl s_client -connect "$host:$port" -servername "$host" </dev/null 2>/dev/null \
         | openssl x509 -noout -enddate 2>/dev/null | sed -n 's/^notAfter=//p')"
  if [ -z "$end" ]; then
    echo "note: could not read the certificate for $host, skipping CMS certificate check" >&2
    return 0
  fi

  end_ts="$(date -d "$end" +%s 2>/dev/null || true)"
  [ -n "$end_ts" ] || { echo "note: could not parse certificate date '$end', skipping check" >&2; return 0; }
  now_ts="$(date +%s)"
  days=$(( (end_ts - now_ts) / 86400 ))

  if [ "$end_ts" -le "$now_ts" ]; then
    echo >&2
    echo "The CMS certificate for $host EXPIRED on $end." >&2
    echo >&2
    echo "Node rejects every request to $url with CERT_HAS_EXPIRED, so this build" >&2
    echo "would render the whole site from seed content -- no posts, no products." >&2
    echo >&2
    echo "Renew it:" >&2
    echo "  certbot certonly --webroot -w /var/www/certbot-webroot -d $host" >&2
    echo "  systemctl reload nginx" >&2
    echo >&2
    return 1
  fi

  if [ "$days" -le "$CMS_CERT_WARN_DAYS" ]; then
    echo "warning: the CMS certificate for $host expires in $days day(s), on $end." >&2
    echo "         Renew it before it takes content down across every site." >&2
  fi
  return 0
}

if ! check_cms_cert; then
  if [ "$ALLOW_CMS_CERT" = 0 ]; then
    echo "DEPLOY REFUSED: nothing has been stopped, the current build is still serving." >&2
    echo "Pass --allow-cms-cert if you really want to publish on seed content." >&2
    exit 1
  fi
  echo "warning: building against an expired CMS certificate (--allow-cms-cert) --" >&2
  echo "         expect seed content: no posts and no products." >&2
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

# CMS-fallback guard. This site is a special case: the service was STOPPED
# above, so bailing out here would leave the site DOWN. A site serving seed
# content is bad; a site serving nothing is worse. So start the service either
# way, and fail the deploy afterwards so the problem is still impossible to
# miss in the exit status.
CMS_FALLBACK_RE='\[strapi\].*unavailable|\[Strapi Fetch (Error|Warning)\]'
BUILD_LOG="$(mktemp -t bestlooking-build-XXXXXX.log)"

if ! yarn build 2>&1 | tee "$BUILD_LOG"; then
  echo "build failed -- restarting the old build so the site is not left down" >&2
  sudo systemctl start bestlooking-skin.service || true
  echo "log kept at $BUILD_LOG" >&2
  exit 1
fi

CMS_FELL_BACK=0
grep -Eqi "$CMS_FALLBACK_RE" "$BUILD_LOG" && CMS_FELL_BACK=1

sudo systemctl start bestlooking-skin.service

if [ "$CMS_FELL_BACK" = 1 ] && [ "$ALLOW_CMS_FALLBACK" = 0 ]; then
  echo >&2
  echo "DEPLOY FAILED: the CMS was unreachable during this build, so pages were" >&2
  echo "rendered from seed content. The service HAS been started (leaving it down" >&2
  echo "would be worse), but this build is publishing incomplete content." >&2
  echo >&2
  grep -Eni "$CMS_FALLBACK_RE" "$BUILD_LOG" | head -20 | sed 's/^/  /' >&2
  echo >&2
  echo "Fix STRAPI_API_TOKEN in .env.local, then re-run ./deploy.sh" >&2
  echo "Full log: $BUILD_LOG" >&2
  exit 1
fi
[ "$CMS_FELL_BACK" = 1 ] && echo "warning: built with seed content (--allow-cms-fallback)" >&2
rm -f "$BUILD_LOG"

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
