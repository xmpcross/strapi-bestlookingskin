#!/usr/bin/env bash
# Netlify build (netlify.toml): installs with npm ci from package-lock.json (yarn.lock was stale and removed). Mirrors the CMS-fallback guard in deploy.sh: if Strapi was unreachable during the
# build, pages were rendered from seed content, so the build FAILS -- on Netlify a failed build leaves the previous
# deploy live, which is the safe outcome.
set -euo pipefail
CMS_FALLBACK_RE='\[strapi\].*unavailable|\[Strapi Fetch (Error|Warning)\]'
LOG="$(mktemp)"
npm run build 2>&1 | tee "$LOG"
if grep -Eqi "$CMS_FALLBACK_RE" "$LOG"; then
  echo "BUILD FAILED: the CMS was unreachable during the build; refusing to publish seed content:" >&2
  grep -Eni "$CMS_FALLBACK_RE" "$LOG" | head -20 >&2
  exit 1
fi
