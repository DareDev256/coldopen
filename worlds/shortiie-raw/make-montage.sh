#!/usr/bin/env bash
# The montage that plays behind the closed case.
#
# Shot-picked, not auto-cut: these are the drone plates and the wides that
# carry the Lisbon-Toronto-Luanda premise. It is muted, loops seamlessly, and
# is graded down because it is a GROUND, not a hero — anything that competes
# with the object in front of it is doing the wrong job.
set -euo pipefail
cd "$(dirname "$0")"
SRC=footage/hd; OUT=assets
python3 - <<'PY' > /tmp/montage.sh
SHOTS = [
    ("NbJnT5j365M", 92.4, 4.0),   # aerial: the Luanda coast
    ("X8zj9clGQO4", 35.8, 4.0),   # aerial: villa and pool
    ("NbJnT5j365M", 73.6, 3.5),   # aerial: the beach, boats out
    ("z2BL7wgPsaI",  2.2, 3.2),   # the caption-free intro — 17.6s carried a burned-in profane lyric line straight across the background
    ("NbJnT5j365M", 35.2, 3.5),   # the bike along the water
    ("EmrpNsyVtDQ", 88.4, 3.2),   # Drip, daylight
    ("Xedv19NEX-E", 36.0, 3.2),   # the red interior — 74.8s was underexposed
    ("HueUBufXMbs", 76.4, 3.2),   # the glass corridor
    ("X8zj9clGQO4", 55.8, 3.2),   # the stone house — 9hRUzEGfW7o 68.6 was near-black
    ("EmrpNsyVtDQ", 111.4, 3.2),  # the glitter plate, bright close
]
XF = 0.55
ins  = " ".join(f'-ss {s} -t {d} -i footage/hd/{i}.mp4' for i, s, d in SHOTS)
pre  = "".join(
    # Crop the bottom 11% BEFORE scaling. Several of these uploads are lyric
    # videos with a burned-in caption band down there; cropping it is the only
    # way to use the footage without shipping someone else's subtitles.
    f'[{n}:v]crop=iw:ih*0.89:0:0,scale=960:540:force_original_aspect_ratio=increase,'
    f'crop=960:540,setsar=1,fps=25,format=yuv420p[v{n}];'
    for n in range(len(SHOTS)))
chain, off, prev = "", 0.0, "v0"
for n in range(1, len(SHOTS)):
    off += SHOTS[n - 1][2] - XF
    out = f'x{n}'
    chain += f'[{prev}][v{n}]xfade=transition=fade:duration={XF}:offset={off:.2f}[{out}];'
    prev = out
# graded as a ground: desaturated, lifted blacks knocked back, a touch of grain
grade = f'[{prev}]eq=saturation=0.78:contrast=1.04:brightness=0.012,noise=alls=6:allf=t+u[vout]'
print(f'ffmpeg -y -v error {ins} -filter_complex "{pre}{chain}{grade}" '
      f'-map "[vout]" -an -c:v libx264 -profile:v main -pix_fmt yuv420p '
      f'-crf 31 -preset slow -g 50 -movflags +faststart assets/montage.mp4')
PY
bash /tmp/montage.sh
ffmpeg -y -v error -i "$OUT/montage.mp4" -frames:v 1 -q:v 3 "$OUT/montage-poster.jpg"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration -of csv=p=0 "$OUT/montage.mp4" | tr '\n' ' '
echo " · $(du -h $OUT/montage.mp4 | cut -f1)"
