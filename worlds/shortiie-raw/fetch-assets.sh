#!/usr/bin/env bash
# Pull the artwork this world renders. Not committed: these are YouTube
# thumbnails and label cover art belonging to the artist and her label.
set -euo pipefail
cd "$(dirname "$0")/assets" 2>/dev/null || { mkdir -p "$(dirname "$0")/assets"; cd "$(dirname "$0")/assets"; }
for id in EmrpNsyVtDQ NbJnT5j365M Xedv19NEX-E z2BL7wgPsaI X8zj9clGQO4 \
          9hRUzEGfW7o 82_xVuYR45c HueUBufXMbs iiYmh9-D_14 WLnquJAMnt0; do
  curl -sL -o "yt-$id.jpg" "https://img.youtube.com/vi/$id/maxresdefault.jpg"
  # maxres does not exist for every upload; fall back rather than ship a stub
  [ "$(stat -f%z "yt-$id.jpg" 2>/dev/null || stat -c%s "yt-$id.jpg")" -lt 5000 ] && \
    curl -sL -o "yt-$id.jpg" "https://img.youtube.com/vi/$id/hqdefault.jpg"
done
echo "fetched $(ls yt-*.jpg | wc -l | tr -d ' ') thumbnails"
