#!/usr/bin/env bash
#
# Deploy a built world, and refuse to do it to the wrong project.
#
# On 2026-08-22 a production deploy of the Shortiie Raw carry-on went to the
# project `shortiieraw-gl` instead of `shortiieraw`. Nothing failed. Vercel
# printed "Production", aliased it, and returned 200 on a .vercel.app URL. The
# domain kept serving the OLD build for another ten minutes while everything on
# screen said the deploy had succeeded.
#
# Three shortiieraw-* projects exist. Only one serves the domain. A vercel.app
# alias returning 200 is not proof it is yours.
#
#   usage: scripts/deploy.sh <site-dir> <expected-project> <domain> [marker]
#
# `marker` is a string that must appear in the HTML the DOMAIN serves after the
# deploy. Without it this script proves the upload happened, not that anyone can
# see it.
set -euo pipefail

SITE_DIR=${1:?site dir}
EXPECT=${2:?expected vercel project name}
DOMAIN=${3:?domain that must serve it}
MARKER=${4:-}

cd "$SITE_DIR"

# 1. the link, before anything is uploaded
LINK=".vercel/project.json"
[ -f "$LINK" ] || { echo "✕ no $LINK — run: vercel link --project $EXPECT --yes"; exit 1; }
ACTUAL=$(python3 -c "import json;print(json.load(open('$LINK'))['projectName'])")
if [ "$ACTUAL" != "$EXPECT" ]; then
  echo "✕ REFUSING: this directory is linked to '$ACTUAL', not '$EXPECT'."
  echo "  A deploy would succeed, alias, return 200, and never reach $DOMAIN."
  echo "  fix: vercel link --project $EXPECT --yes"
  exit 1
fi
echo "✓ linked to $EXPECT"

# 2. what the domain serves right now, so we can prove it changed
BEFORE=$(curl -s -m 20 "https://$DOMAIN/?cb=$RANDOM" | shasum | cut -c1-12)
echo "  $DOMAIN before: $BEFORE"

# 3. deploy
vercel --prod 2>&1 | grep -E 'Production|Aliased|Error' || true

# 4. the domain, not the alias
sleep 8
for i in 1 2 3 4 5 6; do
  BODY=$(curl -s -m 25 "https://$DOMAIN/?cb=$RANDOM")
  AFTER=$(printf '%s' "$BODY" | shasum | cut -c1-12)
  if [ -n "$MARKER" ]; then
    printf '%s' "$BODY" | grep -q -- "$MARKER" && { echo "✓ $DOMAIN serves the marker ($AFTER)"; exit 0; }
  elif [ "$AFTER" != "$BEFORE" ]; then
    echo "✓ $DOMAIN changed: $BEFORE -> $AFTER"; exit 0
  fi
  echo "  attempt $i: $DOMAIN still $AFTER — waiting"
  sleep 10
done

echo "✕ deploy reported success but $DOMAIN never changed."
[ -n "$MARKER" ] && echo "  marker '$MARKER' absent from what the domain serves."
echo "  The upload is real. It is not what $DOMAIN is pointing at."
exit 1
