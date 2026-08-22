#!/usr/bin/env bash
# Cut one short loop per video for the WebGL wall.
#
#   1. START ON A REAL CUT. Scene-detect, then snap to the nearest shot
#      boundary — otherwise every panel opens mid-motion and the wall reads as
#      a scrubbing timeline instead of a set of shots.
#   2. FORCE A KEYFRAME AT 0. A clip whose first frame is not a keyframe shows
#      a grey flash the instant a video texture is promoted, which is exactly
#      when someone is looking at it.
#   3. HONOUR shots.json. The picker cannot see burned-in lyric captions; a
#      person can. Overrides carry their reason with them.
#   4. CROP THE CAPTION BAND. Several of these uploads are lyric videos with
#      burned-in subtitles, and one of them carries profanity. A panel on the
#      artist's own site must not ship someone else's caption track — this is
#      not a taste call, it is the difference between her work and a karaoke
#      overlay. Cropping the lower band also removes baked letterboxing.
#   5. MEASURE MOTION. An upload that is really audio behind a cover card
#      scores an order of magnitude below everything else and must never get a
#      video texture — a still does not belong on a wall of moving work.
set -euo pipefail
cd "$(dirname "$0")"
SRC=footage/hd; OUT=assets/clips; LEN=${LEN:-8}
mkdir -p "$OUT"; rm -f "$OUT"/*.mp4 "$OUT"/*.jpg

for f in "$SRC"/*.mp4; do
  id=$(basename "$f" .mp4)
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")

  over=$(python3 -c "
import json;d=json.load(open('shots.json'))['overrides'].get('$id')
print(d['start'] if d else '')")
  keep=$(python3 -c "
import json;print(json.load(open('shots.json')).get('crop',{}).get('$id',0.87))")
  clen=$(python3 -c "
import json;print(json.load(open('shots.json')).get('len',{}).get('$id',$LEN))")

  if [ -n "$over" ]; then
    start=$over; how="override"
  else
    cuts=$(ffprobe -v error -f lavfi -i "movie=$f,select=gt(scene\,0.34)" \
            -show_entries frame=pkt_pts_time -of csv=p=0 2>/dev/null | tr -d ',' | head -400 || true)
    start=$(python3 - "$dur" "$LEN" <<PY
import sys
dur=float(sys.argv[1]); L=float(sys.argv[2]); target=dur*0.38
cuts=[float(x) for x in """$cuts""".split() if x.strip()]
cuts=[c for c in cuts if 0.08*dur < c < dur-L-1]
print(f"{min(cuts,key=lambda c:abs(c-target)) if cuts else target:.2f}")
PY
)
    how="auto"
  fi

  ffmpeg -y -v error -ss "$start" -t "$clen" -i "$f" \
    -an -vf "crop=iw:ih*$keep:0:ih*0.03,scale=854:480:force_original_aspect_ratio=increase,crop=854:480,setsar=1,fps=25" \
    -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 26 -preset slow \
    -g 25 -keyint_min 25 -force_key_frames "expr:eq(n,0)" -movflags +faststart "$OUT/$id.mp4"
  ffmpeg -y -v error -i "$OUT/$id.mp4" -frames:v 1 -q:v 3 "$OUT/$id.jpg"

  m=$(./motion.sh "$OUT/$id.mp4")
  static=$(python3 -c "print('STATIC' if float('$m') < 0.005 else '')")
  printf "%-16s %-9s %-8s keep %-5s motion %-7s %s %s\n" "$id" "$how" "${start}s" "$keep" "$m" "$(du -h "$OUT/$id.mp4"|cut -f1)" "$static"
done
echo "clips: $(ls "$OUT"/*.mp4|wc -l|tr -d ' ')  total: $(du -sh "$OUT"|cut -f1)"
