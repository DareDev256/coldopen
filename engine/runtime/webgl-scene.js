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
if (!host) throw new Error('cold open: no canvas');

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
/* WHAT IS PACKED INSIDE                                                */
/* ------------------------------------------------------------------ */
/* The contents ARE the site. A wall of screens floating in space was a
   gallery with a suitcase parked in front of it; this is a case you open and
   look into, which is the only reason to build an object at all. */

const loader = new THREE.TextureLoader();
const inside = new THREE.Group();
inside.position.z = -CASE_D / 4 + 0.02;
caseGroup.add(inside);

/* the lining the contents sit against */
const lining = new THREE.Mesh(
  new THREE.PlaneGeometry(CASE_W - 0.12, CASE_H - 0.12),
  new THREE.MeshStandardMaterial({ color: 0x15121B, roughness: 0.92, metalness: 0.04 })
);
inside.add(lining);

/* A polaroid is drawn, not loaded: white card, photo inset, caption in the
   margin. Shipping eight pre-composited frames would be eight more files and
   would bake the caption into the image, where no translation can reach it. */
function polaroidTexture(img, caption) {
  const W = 512, H = 620, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#F4F2EC'; g.fillRect(0, 0, W, H);          // the card stock
  g.fillStyle = '#0B0B0D'; g.fillRect(28, 28, W - 56, 440); // the photo well
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s2 = Math.max((W - 56) / iw, 440 / ih);
  g.drawImage(img, 28 + ((W - 56) - iw * s2) / 2, 28 + (440 - ih * s2) / 2, iw * s2, ih * s2);
  g.fillStyle = '#1A1A1E';
  g.font = '600 30px ui-monospace, Menlo, monospace';
  g.textAlign = 'center';
  g.fillText(caption.toUpperCase(), W / 2, 545);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

const items = [];        // everything clickable
const POL = CFG.polaroids || [];
const VID = CFG.panels || [];

/* ---- polaroids, loose in the top of the case ---- */
/* Loose in the top of the case, overlapping the way a handful of photographs
   actually sits — a tidy grid would read as a contact sheet, not a pile. */
const POL_LAYOUT = [
  [-0.74,  1.14, -8], [-0.02,  1.24,  5], [ 0.72,  1.10, -5],
  [-0.78,  0.52,  7], [-0.04,  0.60, -6], [ 0.76,  0.48,  9],
];
POL.slice(0, POL_LAYOUT.length).forEach((p, i) => {
  const [x, y, rot] = POL_LAYOUT[i];
  const geo = new THREE.PlaneGeometry(0.6, 0.73);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86, metalness: 0.0 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, 0.012 + i * 0.004);
  m.rotation.z = rot * Math.PI / 180;
  inside.add(m);
  const img = new Image();
  img.onload = () => { mat.map = polaroidTexture(img, p.caption); mat.needsUpdate = true; };
  img.src = p.src;
  items.push({ mesh: m, kind: 'polaroid', data: p, home: m.position.clone(), rot: m.rotation.z });
});

/* ---- the music videos, seated under an elastic strap ---- */
const strapMat = new THREE.MeshStandardMaterial({ color: 0x121216, roughness: 0.7 });
const strap = new THREE.Mesh(new THREE.PlaneGeometry(CASE_W - 0.16, 0.055), strapMat);
strap.position.set(0, -0.07, 0.09);
inside.add(strap);

const VID_LAYOUT = [[-0.7, -0.42], [0.0, -0.42], [0.7, -0.42], [-0.7, -0.98], [0.0, -0.98], [0.7, -0.98]];
VID.slice(0, VID_LAYOUT.length).forEach((v, i) => {
  const [x, y] = VID_LAYOUT[i];
  const w = 0.6, h = w * 9 / 16;
  const poster = loader.load(v.poster);
  poster.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: poster, toneMapped: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, 0.02);
  inside.add(m);
  const bez = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.03, h + 0.03), new THREE.MeshBasicMaterial({ color: 0x05060A }));
  bez.position.set(x, y, 0.014);
  inside.add(bez);
  items.push({ mesh: m, kind: 'video', data: v, mat, poster, video: null, live: false, home: m.position.clone(), rot: 0 });
});

/* ---- the pouch: passports and documents, i.e. who she is ---- */
const pouch = new THREE.Group();
/* Bottom of the case, fully in frame. It first sat below the interior and was
   clipped by the viewport — a clickable object nobody can see is not one. */
pouch.position.set(0, -1.44, 0.05);
inside.add(pouch);
{
  const body = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1D1A24, roughness: 0.88 }));
  pouch.add(body);
  const zip = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.035),
    new THREE.MeshStandardMaterial({ color: PAL.payoff, metalness: 1, roughness: 0.3 }));
  zip.position.set(0, 0.225, 0.005);
  pouch.add(zip);
  // a passport corner poking out of it
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x7A1420, roughness: 0.8 }));
  pp.position.set(0.4, 0.19, -0.004);
  pp.rotation.z = 0.14;
  pouch.add(pp);
  items.push({ mesh: body, kind: 'pouch', data: { label: CFG.pouchLabel || 'DOCUMENTS' }, home: pouch.position.clone(), rot: 0 });
}

/* ---- video promotion, inside a hard budget ----
   A poster is the resting state. A clip is promoted to a live texture only
   when it is one of the nearest items and the frame budget allows, and it is
   torn all the way down on demotion — pausing alone leaves the decoder alive
   and the budget stops meaning anything. */
function makeVideo(src) {
  const v = document.createElement('video');
  v.src = src; v.muted = true; v.loop = true; v.playsInline = true;
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  v.preload = 'auto';
  return v;
}
function promote(p) {
  if (p.live || !p.data.video) return;
  p.live = true;
  p.video = makeVideo(p.data.video);
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
/* PICKING UP WHAT IS IN THE CASE                                       */
/* ------------------------------------------------------------------ */
/* Everything in here is a real object you can pick up. A polaroid lifts out
   of the pile and turns to face you; a video card opens the video; the pouch
   opens her documents. Hover state matters as much as the click — an object
   that does not respond to the cursor reads as a picture of an object. */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2(-2, -2);
let hovered = null, held = null;

addEventListener('pointermove', (e) => {
  ptr.x = (e.clientX / innerWidth) * 2 - 1;
  ptr.y = -(e.clientY / innerHeight) * 2 + 1;
});

function pick() {
  if (openT < 0.55) return null;
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(items.map((i) => i.mesh), false)[0];
  return hit ? items.find((i) => i.mesh === hit.object) : null;
}

const docs = document.getElementById('docs');
const docsBody = document.getElementById('docs-body');
function openDocs() {
  if (!docs) return;
  docs.classList.add('open');
  docs.setAttribute('aria-hidden', 'false');
  const first = docs.querySelector('button, a');
  if (first) first.focus();
}
function closeDocs() {
  if (!docs) return;
  docs.classList.remove('open');
  docs.setAttribute('aria-hidden', 'true');
}
if (docs) {
  docs.addEventListener('click', (e) => { if (e.target === docs || e.target.dataset.close !== undefined) closeDocs(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDocs(); });
}

host.addEventListener('click', () => {
  const it = pick();
  if (!it) { if (held) held = null; return; }
  if (it.kind === 'pouch') { openDocs(); return; }
  if (it.kind === 'video') { window.open(it.data.href, '_blank', 'noopener'); return; }
  held = held === it ? null : it;      // a polaroid you picked up, put back
});

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */
let opened = false, openT = 0, openTarget = 0, spin = 0, spinTarget = 0;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function openCase() {
  opened = true;
  openTarget = 1;
  document.body.classList.add('is-open');
  /* Tell the DOM layer too. Scrolling used to open the scene while the
     language tags stayed on screen, because the two halves each had their own
     idea of "open" and only the click path told both. */
  if (typeof window.__coldopenUIOpen === 'function') window.__coldopenUIOpen();
}
window.__coldopenOpen = openCase;

/* Wall rotation is driven by the document's own scroll position across the
   sticky track, not by intercepting wheel events. Hijacked scroll breaks
   trackpad momentum, keyboard paging and screen readers, and it makes the
   scrollbar lie about the length of the page. */
const track = document.getElementById('glscroll');
/* Scroll leans the open case, it does not spin a carousel. The range is small
   on purpose: you are looking into one object, and the useful motion is the
   one you would make with your own head, not a turntable. */
const LEAN = 0.62;
function sweepRange() { return LEAN; }
function readScroll() {
  if (!track) return;
  const total = track.offsetHeight - innerHeight;
  const p = total > 0 ? Math.max(0, Math.min(1, -track.getBoundingClientRect().top / total)) : 0;
  // the first tenth of the track is the threshold; the rest turns the wall
  const t = Math.max(0, (p - 0.16) / 0.84);
  spinTarget = -sweepRange() / 2 + t * sweepRange();
  /* Reversible. The case opens across the first sixth of the track and closes
     again on the way back up — a threshold you can only cross once is a door
     that deletes itself, and the object is the whole point of the page. */
  if (!opened) { if (p > 0.015) openCase(); }
  else openTarget = Math.max(0.001, Math.min(1, p / 0.16));
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

  openT += (openTarget - openT) * Math.min(1, dt * 2.6);
  const e = 1 - Math.pow(1 - openT, 3);

  /* The halves swing wide and the camera comes in until the open case fills
     the frame — you end up looking down into it, close enough to read a
     polaroid caption. The case never flies past the camera and never leaves
     the world; scroll back up and it closes again.

     Framing is derived, not tuned by eye: solve the camera distance that makes
     the interior occupy TARGET_FILL of the viewport height at the current fov,
     so it frames the same on a phone and an ultrawide. */
  halfL.rotation.y = e * 2.34;
  halfR.rotation.y = -e * 2.34;
  caseGroup.position.z = 0;
  caseGroup.position.y = -0.1;
  caseGroup.scale.setScalar(1);
  handle.visible = e < 0.4;

  const TARGET_FILL = 0.86;
  const vfov = camera.fov * Math.PI / 180;
  const needH = CASE_H / TARGET_FILL;
  const closeZ = (needH / 2) / Math.tan(vfov / 2) + CASE_D;
  camera.position.z = 13.2 - e * (13.2 - closeZ);
  camera.position.y = 0.15 - e * 0.22;

  /* Scroll leans the open case rather than spinning a carousel — you are
     looking INTO one object, so the only motion that makes sense is the one
     you would make with your own head. */
  spin += (spinTarget - spin) * 0.075;
  caseGroup.rotation.y = spin * 0.34 * openT;
  caseGroup.rotation.x = 0.02 + spin * 0.06 * openT;

  /* Only the video items nearest the camera decode. Ten 1080p streams stall a
     phone long before they run out of memory, and a wall that stutters is
     worse than one that holds still. */
  if (openT > 0.6) {
    const vids = items.filter((it) => it.kind === 'video');
    const ranked = vids.map((it) => {
      it.mesh.getWorldPosition(tmp);
      return { it, d: tmp.distanceTo(camera.position) };
    }).sort((a, b) => a.d - b.d);
    ranked.forEach((r, i) => { if (i < (degraded ? 1 : LIVE_BUDGET)) promote(r.it); else demote(r.it); });
  }

  /* hover / hold */
  const hit = pick();
  if (hit !== hovered) {
    hovered = hit;
    host.style.cursor = hit ? 'pointer' : '';
    const cap = document.getElementById('pickcap');
    if (cap) {
      if (hit) {
        cap.textContent = hit.kind === 'pouch' ? (hit.data.label + ' — OPEN')
          : hit.kind === 'video' ? (hit.data.title + ' — ' + (hit.data.sub || '') + '  ↗')
          : hit.data.caption;
        cap.classList.add('on');
      } else cap.classList.remove('on');
    }
  }
  for (const it of items) {
    if (it.kind === 'pouch') continue;
    const lifted = it === held;
    const near = it === hovered && !held;
    const tz = it.home.z + (lifted ? 0.9 : near ? 0.09 : 0);
    const tsc = lifted ? 1.9 : near ? 1.06 : 1;
    const trot = lifted ? 0 : it.rot;
    it.mesh.position.z += (tz - it.mesh.position.z) * Math.min(1, dt * 7);
    it.mesh.rotation.z += (trot - it.mesh.rotation.z) * Math.min(1, dt * 7);
    const cs = it.mesh.scale.x + (tsc - it.mesh.scale.x) * Math.min(1, dt * 7);
    it.mesh.scale.setScalar(cs);
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
