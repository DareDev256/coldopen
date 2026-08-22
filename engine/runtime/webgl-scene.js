/**
 * COLD OPEN — the spatial topology, rendered.
 *
 * The CSS version drew a case with gradients. This one renders it: brushed
 * aluminium under real reflections, two halves that swing on hinges, and a
 * cylinder of the artist's own video around the camera. Opening the case is a
 * camera move THROUGH it, so "you are inside her work" is literal rather than
 * a caption.
 *
 * Constraints this is built under, in order:
 *   1. No CDN. Three is vendored beside this file; CSP stays script-src 'self'.
 *   2. No external HDRI. The environment is generated at runtime, so brushed
 *      metal has something to reflect without shipping a 4MB .hdr.
 *   3. A hard cap on simultaneously decoding videos. Ten 1080p streams will
 *      stall a phone; only the panels nearest the camera get a live texture,
 *      the rest hold their poster.
 *   4. It must degrade. If WebGL is unavailable the DOM fallback underneath is
 *      already a complete, readable site.
 *
 * Config is injected as window.__COLDOPEN__ by the emitter.
 */
import * as THREE from './vendor/three.module.min.js';

const CFG = window.__COLDOPEN__ || {};
const PANELS = CFG.panels || [];
const PAL = CFG.palette || { ground: '#1B2FE8', accent: '#FFDD33', payoff: '#E8EEF5' };

/* How many video elements may decode at once. Above this a phone drops frames
   long before it runs out of memory, and the wall stutters rather than fails,
   which is worse than a poster. */
const LIVE_BUDGET = matchMedia('(max-width: 820px)').matches ? 2 : 5;

const host = document.getElementById('gl');
const labelLayer = document.getElementById('gl-labels');
const root = document.getElementById('glroot');
if (!host || !PANELS.length) throw new Error('cold open: no canvas or no panels');

/* ------------------------------------------------------------------ */
/* renderer                                                            */
/* ------------------------------------------------------------------ */
/* alpha:true, and no scene.background.
   The montage of her own footage plays in the DOM behind this canvas. Painting
   a flat colour over it threw away the exact thing the ground is for — the
   rendered object should stand IN her work, not on top of a swatch. */
const renderer = new THREE.WebGLRenderer({ canvas: host, antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 0.15, 13.2);

/* ------------------------------------------------------------------ */
/* environment — generated, not downloaded                             */
/* ------------------------------------------------------------------ */
/* Brushed metal is nothing but a reflection of its surroundings; with no
   environment it renders as flat grey and the whole "aluminium" read dies.
   A few emissive planes in a throwaway scene, run through PMREM, give the
   ribs something to catch for a few hundred KB of nothing. */
function buildEnvironment() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x39415c);

  const softbox = (w, h, color, intensity, pos, rot) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    env.add(m);
  };
  // key, fill, rim — a three-point studio, which is what makes metal read
  softbox(11, 11, 0xffffff, 9.5, [-6, 5, 6], [0, Math.PI / 4, 0]);
  softbox(9, 9, 0xdfe8ff, 4.4, [7, 2.5, 4], [0, -Math.PI / 3.4, 0]);
  softbox(14, 4, PAL.accent, 2.6, [0, -4.5, -7], [Math.PI / 2.6, 0, 0]);
  softbox(16, 10, PAL.ground, 2.2, [0, 1, -11]);

  const tex = pmrem.fromScene(env, 0.03).texture;
  pmrem.dispose();
  return tex;
}
const envMap = buildEnvironment();
scene.environment = envMap;
/* PMREM gives reflections; a directional gives FORM. Metal with only an
   environment reads flat from some angles, which is how a rendered case
   starts looking like a photograph of a sticker. */
const key = new THREE.DirectionalLight(0xffffff, 3.4);
key.position.set(-4, 6, 7);
scene.add(key);
const rim = new THREE.DirectionalLight(new THREE.Color(PAL.accent), 1.1);
rim.position.set(5, -2, -4);
scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.28));

/* ------------------------------------------------------------------ */
/* the ribbed shell — a procedural map, so there is no texture to ship  */
/* ------------------------------------------------------------------ */
function ribMaps() {
  const W = 512, H = 512;
  const nc = document.createElement('canvas'); nc.width = W; nc.height = H;
  const nx = nc.getContext('2d');
  const rc = document.createElement('canvas'); rc.width = W; rc.height = H;
  const rx = rc.getContext('2d');

  const RIBS = 26, period = W / RIBS;
  const nimg = nx.createImageData(W, H);
  const rimg = rx.createImageData(W, H);
  for (let x = 0; x < W; x++) {
    // one rib = one smooth ridge; its slope IS the normal's x component
    const t = (x % period) / period;
    const slope = Math.cos(t * Math.PI * 2);
    const nxv = Math.max(-1, Math.min(1, slope * 0.85));
    const r = Math.round((nxv * 0.5 + 0.5) * 255);
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4;
      // anisotropic brushing: fine vertical grain along the rib
      const grain = (Math.sin(y * 12.9898 + x * 78.233) * 43758.5453) % 1;
      nimg.data[i] = r;
      nimg.data[i + 1] = 128 + Math.round(grain * 6);
      nimg.data[i + 2] = 255;
      nimg.data[i + 3] = 255;
      const rough = 0.16 + Math.abs(slope) * 0.10 + Math.abs(grain) * 0.06;
      const rv = Math.round(rough * 255);
      rimg.data[i] = rv; rimg.data[i + 1] = rv; rimg.data[i + 2] = rv; rimg.data[i + 3] = 255;
    }
  }
  nx.putImageData(nimg, 0, 0);
  rx.putImageData(rimg, 0, 0);

  const mk = (c, srgb) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { normal: mk(nc, false), rough: mk(rc, false) };
}
const RIB = ribMaps();

const alu = new THREE.MeshStandardMaterial({
  color: 0xC6CCD4, metalness: 1.0, roughness: 0.2,
  normalMap: RIB.normal, normalScale: new THREE.Vector2(0.85, 0.85),
  roughnessMap: RIB.rough, envMapIntensity: 2.0,
});
const aluEdge = new THREE.MeshStandardMaterial({ color: 0xA8AFB8, metalness: 1, roughness: 0.3, envMapIntensity: 1.9 });
const liningMat = new THREE.MeshStandardMaterial({ color: 0x14121A, metalness: 0.1, roughness: 0.82 });
const goldMat = new THREE.MeshStandardMaterial({ color: PAL.payoff, metalness: 1, roughness: 0.28, envMapIntensity: 1.4 });

/* ------------------------------------------------------------------ */
/* the case                                                            */
/* ------------------------------------------------------------------ */
const CASE_W = 2.35, CASE_H = 3.3, CASE_D = 0.92;
const caseGroup = new THREE.Group();
caseGroup.position.set(0, -0.1, 0);
scene.add(caseGroup);

function halfShell(sign) {
  // hinged at the OUTER edge, so the two halves open outwards like a clamshell
  const pivot = new THREE.Group();
  pivot.position.set(sign * CASE_W / 2, 0, 0);
  const g = new THREE.Group();
  g.position.set(-sign * CASE_W / 4, 0, 0);

  const body = new THREE.Mesh(new THREE.BoxGeometry(CASE_W / 2, CASE_H, CASE_D / 2), [
    sign > 0 ? aluEdge : aluEdge, sign > 0 ? aluEdge : aluEdge,
    aluEdge, aluEdge, alu, liningMat,
  ]);
  RIB.normal.repeat.set(1.15, 1); RIB.rough.repeat.set(1.15, 1);
  g.add(body);

  // corner caps
  for (const cy of [1, -1]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, CASE_D / 2 + 0.02), aluEdge);
    cap.position.set(sign * (CASE_W / 4 - 0.16), cy * (CASE_H / 2 - 0.16), 0);
    g.add(cap);
  }
  pivot.add(g);
  return pivot;
}
const halfL = halfShell(-1), halfR = halfShell(1);
caseGroup.add(halfL, halfR);

// telescoping handle
const handle = new THREE.Group();
{
  const post = new THREE.CylinderGeometry(0.045, 0.045, 0.72, 12);
  for (const x of [-0.42, 0.42]) {
    const m = new THREE.Mesh(post, aluEdge);
    m.position.set(x, CASE_H / 2 + 0.36, -CASE_D / 2 + 0.06);
    handle.add(m);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.95, 12), aluEdge);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, CASE_H / 2 + 0.7, -CASE_D / 2 + 0.06);
  handle.add(bar);
}
caseGroup.add(handle);

// castors
for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 16), new THREE.MeshStandardMaterial({ color: 0x15151a, metalness: 0.5, roughness: 0.6 }));
  w.rotation.z = Math.PI / 2;
  w.position.set(sx * (CASE_W / 2 - 0.28), -CASE_H / 2 - 0.1, sz * (CASE_D / 4));
  caseGroup.add(w);
}
// latches
for (const y of [0.72, -0.72]) {
  const l = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), goldMat);
  l.position.set(0, y, CASE_D / 4 + 0.03);
  caseGroup.add(l);
}

/* ------------------------------------------------------------------ */
/* the wall — her work, on a cylinder around the camera                */
/* ------------------------------------------------------------------ */
const RADIUS = 7.8;
const wall = new THREE.Group();
scene.add(wall);
const panels = [];

const loader = new THREE.TextureLoader();
/* Arc width is a framing decision, not decoration. At 1.78pi the ten panels
   sat 64 degrees apart and only one or two ever fell inside the frustum — the
   wall read as two floating screens. Tightened so three columns are in frame
   at once, which is the point at which it reads as a WALL. */
const ARC = Math.PI * 0.82;
const ROWS = PANELS.length > 6 ? 2 : 1;
const perRow = Math.ceil(PANELS.length / ROWS);

PANELS.forEach((p, i) => {
  const row = Math.floor(i / perRow);
  const col = i % perRow;
  const a = -ARC / 2 + (col + 0.5) * (ARC / perRow);
  const y = ROWS === 1 ? 0.1 : (row === 0 ? 1.12 : -1.06);

  const w = 3.15, h = w * 9 / 16;
  const geo = new THREE.PlaneGeometry(w, h, 1, 1);
  const poster = loader.load(p.poster);
  poster.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: poster, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(Math.sin(a) * RADIUS, y, -Math.cos(a) * RADIUS);
  mesh.lookAt(0, y, 0);
  wall.add(mesh);

  // bezel
  const bez = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.1, h + 0.1), new THREE.MeshBasicMaterial({ color: 0x05060A }));
  bez.position.copy(mesh.position).multiplyScalar(1.004);
  bez.quaternion.copy(mesh.quaternion);
  wall.add(bez);

  // the label, in the DOM, tracking this panel
  let el = null;
  if (labelLayer) {
    el = document.createElement('a');
    el.className = 'gl-tag';
    el.href = p.href; el.target = '_blank'; el.rel = 'noopener';
    el.innerHTML =
      '<span class="t-n">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="t-title">' + p.title + '</span>' +
      '<span class="t-meta">' + (p.sub || '') + '</span>' +
      (p.sourceHost ? '<span class="t-src">' + p.sourceHost + ' ↗</span>' : '');
    labelLayer.appendChild(el);
  }

  // anchor the label to the panel's lower-left corner in the panel's own
  // space, so it sits ON the frame rather than across the picture
  const anchor = new THREE.Object3D();
  anchor.position.set(-w / 2 + 0.06, -h / 2 + 0.06, 0.02);
  mesh.add(anchor);
  panels.push({ mesh, mat, poster, el, cfg: p, video: null, live: false, anchor });
});

/* ---- video promotion, inside a hard budget ---- */
function makeVideo(src) {
  const v = document.createElement('video');
  v.src = src; v.muted = true; v.loop = true; v.playsInline = true;
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  v.crossOrigin = 'anonymous'; v.preload = 'auto';
  return v;
}
function promote(p) {
  if (p.live || !p.cfg.video) return;
  p.live = true;
  p.video = makeVideo(p.cfg.video);
  const tex = new THREE.VideoTexture(p.video);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  p.video.play().then(() => { p.mat.map = tex; p.mat.needsUpdate = true; })
    .catch(() => { p.live = false; p.video = null; });   // autoplay refused: keep the poster
}
function demote(p) {
  if (!p.live) return;
  p.live = false;
  try { p.video.pause(); p.video.removeAttribute('src'); p.video.load(); } catch (e) {}
  if (p.mat.map && p.mat.map.isVideoTexture) p.mat.map.dispose();
  p.mat.map = p.poster; p.mat.needsUpdate = true;
  p.video = null;
}

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */
let opened = false, openT = 0, spin = 0, spinTarget = 0;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function openCase() {
  if (opened) return;
  opened = true;
  document.body.classList.add('is-open');
}
window.__coldopenOpen = openCase;

/* Wall rotation is driven by the document's own scroll position across the
   sticky track, not by intercepting wheel events. Hijacked scroll breaks
   trackpad momentum, keyboard paging and screen readers, and it makes the
   scrollbar lie about the length of the page. */
const track = document.getElementById('glscroll');
/* Sweep exactly the arc that is NOT already in frame, and no further.
   A fixed rotation (1.15pi) swung the whole wall past the camera and left the
   viewer staring at empty ground halfway down the track. Derived from the real
   horizontal field of view so it stays correct at any aspect ratio. */
function sweepRange() {
  const vfov = camera.fov * Math.PI / 180;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  return Math.max(0.25, ARC - hfov * 0.92);
}
function readScroll() {
  if (!track) return;
  const total = track.offsetHeight - innerHeight;
  const p = total > 0 ? Math.max(0, Math.min(1, -track.getBoundingClientRect().top / total)) : 0;
  // the first tenth of the track is the threshold; the rest turns the wall
  const t = Math.max(0, (p - 0.1) / 0.9);
  spinTarget = -sweepRange() / 2 + t * sweepRange();
  if (p > 0.015) openCase();
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', readScroll);
readScroll();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ------------------------------------------------------------------ */
/* loop                                                                */
/* ------------------------------------------------------------------ */
const tmp = new THREE.Vector3();
const clock = new THREE.Clock();
let frames = 0, slowSince = 0, degraded = false;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (opened) openT = Math.min(1, openT + dt / 1.5);
  const e = 1 - Math.pow(1 - openT, 3);

  // the halves swing out, the camera rides through the gap between them
  halfL.rotation.y = e * 1.95;
  halfR.rotation.y = -e * 1.95;
  caseGroup.position.z = e * 6.2;
  caseGroup.scale.setScalar(1 + e * 0.9);
  handle.visible = e < 0.5;

  /* Stop short of the axis. Standing exactly at the centre of the cylinder
     puts only two or three panels inside the frustum and the wall stops
     reading as a wall; a couple of units back keeps six or seven in view. */
  camera.position.z = 13.2 - e * 9.4;
  camera.position.y = 0.15 + e * 0.03;

  spin += (spinTarget - spin) * 0.075;
  wall.rotation.y = spin;
  camera.rotation.y = 0;

  // only the nearest panels decode video
  if (openT > 0.55) {
    const ranked = panels.map((p) => {
      p.mesh.getWorldPosition(tmp);
      return { p, d: tmp.distanceTo(camera.position), facing: tmp.z < camera.position.z };
    }).sort((a, b) => a.d - b.d);
    ranked.forEach((r, i) => {
      if (i < (degraded ? 1 : LIVE_BUDGET) && r.facing) promote(r.p); else demote(r.p);
    });
  }

  // labels track their panel in screen space
  if (labelLayer && openT > 0.5) {
    for (const p of panels) {
      if (!p.el) continue;
      p.mesh.getWorldPosition(tmp);
      const dist = tmp.distanceTo(camera.position);
      p.anchor.getWorldPosition(tmp);
      tmp.project(camera);
      const on = tmp.z < 1 && Math.abs(tmp.x) < 1.0 && Math.abs(tmp.y) < 1.0;
      if (!on) { p.el.style.opacity = '0'; p.el.style.pointerEvents = 'none'; continue; }
      const x = (tmp.x * 0.5 + 0.5) * innerWidth;
      const y = (-tmp.y * 0.5 + 0.5) * innerHeight;
      p.el.style.transform = 'translate(0,-100%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      const near = Math.max(0, Math.min(1, (14 - dist) / 6));
      p.el.style.opacity = String(near * openT);
      p.el.style.pointerEvents = near > 0.55 ? 'auto' : 'none';
    }
  }

  renderer.render(scene, camera);

  /* Watchdog: if the wall cannot hold a frame rate, cut the video budget
     rather than let it stutter. A poster that holds 60fps beats a video that
     does not. */
  frames++;
  if (!degraded && frames % 90 === 0) {
    const fps = 1 / Math.max(dt, 1 / 240);
    if (fps < 34) { slowSince++; if (slowSince >= 2) { degraded = true; root && root.setAttribute('data-degraded', '1'); } }
    else slowSince = 0;
  }
}

if (reduce) { openT = 1; opened = true; document.body.classList.add('is-open'); }
tick();
root && root.setAttribute('data-ready', '1');
