#!/usr/bin/env bash
# Mean motion of a clip, 0..1. A music-video upload that is really an audio
# file behind a static cover art card scores ~0 — and a still image does not
# belong on a wall of moving work, so the pipeline has to be able to tell.
set -euo pipefail
ffmpeg -v error -i "$1" -vf "select='gt(scene,0)',metadata=print:file=-" -an -f null - 2>/dev/null \
 | awk -F'=' '/lavfi.scene_score/{s+=$2; n++} END{ if(n>0) printf "%.4f\n", s/n; else print "0.0000" }'
