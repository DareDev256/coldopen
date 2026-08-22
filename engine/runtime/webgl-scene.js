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
const key = new THREE.DirectionalLight(0xffffff, 5.2);
key.position.set(-3, 5, 9);
scene.add(key);
const rim = new THREE.DirectionalLight(new THREE.Color(PAL.accent), 1.1);
rim.position.set(5, -2, -4);
scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.34));
/* A fill that travels with the camera. Metal silhouetted against bright
   footage goes black — it can only reflect what is in front of it, and the
   montage is BEHIND it. */
const fill = new THREE.DirectionalLight(0xffffff, 2.4);
scene.add(fill, fill.target);

/* ------------------------------------------------------------------ */
/* the ribbed shell — a procedural map, so there is no texture to ship  */
/* ------------------------------------------------------------------ */
function ribMaps() {
  const W = 512, H = 512;
  const nc = document.createElement('canvas'); nc.width = W; nc.height = H;
  const nx = nc.getContext('2d');
  const rc = document.createElement('canvas'); rc.width = W; rc.height = H;
  const rx = rc.getContext('2d');

  const RIBS = 13, period = W / RIBS;
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
      const rough = 0.22 + Math.abs(slope) * 0.09 + Math.abs(grain) * 0.05;
      const rv = Math.round(rough * 255);
      rimg.data[i] = rv; rimg.data[i + 1] = rv; rimg.data[i + 2] = rv; rimg.data[i + 3] = 255;
    }
  }
  nx.putImageData(nimg, 0, 0);
  rx.putImageData(rimg, 0, 0);

  /* Mipmaps and trilinear filtering are not optional here. A rib pitch that
     lands near one screen pixel aliases into a barcode — the shell rendered as
     hard black and white stripes rather than brushed metal, which is exactly
     what a drawn CSS version does NOT do because it never resamples. */
  const mk = (c, srgb) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { normal: mk(nc, false), rough: mk(rc, false) };
}
const RIB = ribMaps();

const alu = new THREE.MeshStandardMaterial({
  color: 0xE2E7ED, metalness: 1.0, roughness: 0.26,
  normalMap: RIB.normal, normalScale: new THREE.Vector2(0.42, 0.42),
  roughnessMap: RIB.rough, envMapIntensity: 3.4,
});
const aluEdge = new THREE.MeshStandardMaterial({ color: 0xCED4DB, metalness: 1, roughness: 0.26, envMapIntensity: 3.2 });
const liningMat = new THREE.MeshStandardMaterial({ color: 0x14121A, metalness: 0.1, roughness: 0.82 });
const goldMat = new THREE.MeshStandardMaterial({ color: PAL.payoff, metalness: 1, roughness: 0.28, envMapIntensity: 1.4 });

/* ------------------------------------------------------------------ */
/* YOU ARE INSIDE THE CASE                                             */
/* ------------------------------------------------------------------ */
/*
 * The mistake worth naming: the first two passes built a suitcase you look AT.
 * A diorama. Standing outside an object and pointing at it is not the same
 * experience as being inside one, and the whole reason to use a case rather
 * than a grid is that a case has an INSIDE.
 *
 * So the camera goes in. The room IS the packed compartment — ribbed aluminium
 * lining on every wall, the open lid overhead, foam and straps underfoot — and
 * her work is mounted on the walls around you. Scroll turns your head.
 *
 * The exterior case still exists: it is what you see before you cross, and the
 * open animation flies you through the gap between its halves into the room.
 */

/* A carry-on is wider than it is deep and not very tall. The first pass used a
   7.2 cube, which renders as a warehouse — the proportion IS the object. */
/* A carry-on is wider than it is deep and not very tall — but you have to fit
   inside it. 4.6 deep put the camera two metres off the back wall and every
   screen filled the frame. The RATIO is the object; the scale is so a person
   can stand in it. */
const ROOM_W = 10.4, ROOM_H = 6.0, ROOM_D = 7.0;
const CASE_W = 2.35, CASE_H = 3.3, CASE_D = 0.92;

/* ---------- the exterior: the case, closed, standing in her footage ---------- */
const exterior = new THREE.Group();
exterior.position.set(0, -0.1, 0);
scene.add(exterior);

function halfShell(sign) {
  const pivot = new THREE.Group();
  pivot.position.set(sign * CASE_W / 2, 0, 0);
  const g = new THREE.Group();
  g.position.set(-sign * CASE_W / 4, 0, 0);
  const body = new THREE.Mesh(new THREE.BoxGeometry(CASE_W / 2, CASE_H, CASE_D / 2),
    [aluEdge, aluEdge, aluEdge, aluEdge, alu, liningMat]);
  g.add(body);
  for (const cy of [1, -1]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, CASE_D / 2 + 0.02), aluEdge);
    cap.position.set(sign * (CASE_W / 4 - 0.16), cy * (CASE_H / 2 - 0.16), 0);
    g.add(cap);
  }
  pivot.add(g);
  return pivot;
}
const halfL = halfShell(-1), halfR = halfShell(1);
exterior.add(halfL, halfR);

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
exterior.add(handle);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 16),
    new THREE.MeshStandardMaterial({ color: 0x15151a, metalness: 0.5, roughness: 0.6 }));
  w.rotation.z = Math.PI / 2;
  w.position.set(sx * (CASE_W / 2 - 0.28), -CASE_H / 2 - 0.1, sz * (CASE_D / 4));
  exterior.add(w);
}
for (const y of [0.72, -0.72]) {
  const l = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), goldMat);
  l.position.set(0, y, CASE_D / 4 + 0.03);
  exterior.add(l);
}

/* ---------- the interior: the room you end up standing in ---------- */
const room = new THREE.Group();
scene.add(room);

/* Lining on every surface. BackSide, because we are inside the box looking at
   the inner faces — the one detail that separates a room from a cube. */
/* The lining is FABRIC, not bare metal.
   A real aluminium case is metal on the outside and lined on the inside; the
   first pass put the ribbed shell material on the inner walls, which read as
   white bars and reflected the cobalt ground back at the viewer as navy.
   Woven texture is generated here rather than shipped. */
function weave() {
  const N = 256, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4;
    /* A weave is a CROSS-hatch. Summing two sine waves at the same low
       frequency made vertical banding, which read as bars on the wall. */
    const w = Math.sin((x + y) * 2.1) * Math.sin((x - y) * 2.1) * 0.5;
    const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    const v = 128 + w * 9 + n * 5;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(26, 14);
  return t;
}
const ribbedLining = new THREE.MeshStandardMaterial({
  color: 0x1E1D26, metalness: 0.05, roughness: 0.96,
  normalMap: weave(), normalScale: new THREE.Vector2(0.3, 0.3),
  side: THREE.BackSide,
});
const shellRoom = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, ROOM_H, ROOM_D), ribbedLining);
room.add(shellRoom);

/* Light inside the room. The scene's key and rim are aimed at the exterior
   case out in the montage; once you are inside a closed metal box none of it
   reaches you, and the lining renders as flat navy. */
const inLight = new THREE.PointLight(0xF2F5FA, 22, 20, 1.8);
inLight.position.set(0, ROOM_H / 2 - 0.7, 0.6);
room.add(inLight);
const inWarm = new THREE.PointLight(new THREE.Color(PAL.accent), 3.4, 11, 2);
inWarm.position.set(-1.6, -0.6, 1.8);
room.add(inWarm);

/* the foam floor */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D),
  new THREE.MeshStandardMaterial({ color: 0x121017, roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -ROOM_H / 2 + 0.01;
room.add(floor);

/* Aluminium rails at every corner: the frame of the case, seen from inside.
   Without them the room is a fabric box and the object stops being luggage. */
{
  /* Trim, not scaffolding. At 0.09 across a 7-unit room these rendered as
     structural beams and the interior read as a warehouse frame. */
  const railMat = new THREE.MeshStandardMaterial({ color: 0x8E959E, metalness: 1, roughness: 0.34, envMapIntensity: 1.1 });
  const vGeo = new THREE.BoxGeometry(0.035, ROOM_H, 0.035);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const m = new THREE.Mesh(vGeo, railMat);
    m.position.set(sx * (ROOM_W / 2 - 0.02), 0, sz * (ROOM_D / 2 - 0.02));
    room.add(m);
  }
  const hGeoX = new THREE.BoxGeometry(ROOM_W, 0.035, 0.035);
  const hGeoZ = new THREE.BoxGeometry(0.035, 0.035, ROOM_D);
  for (const sy of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const m = new THREE.Mesh(hGeoX, railMat);
      m.position.set(0, sy * (ROOM_H / 2 - 0.02), sz * (ROOM_D / 2 - 0.02));
      room.add(m);
    }
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(hGeoZ, railMat);
      m.position.set(sx * (ROOM_W / 2 - 0.02), sy * (ROOM_H / 2 - 0.02), 0);
      room.add(m);
    }
  }
}

/* the zip line running round the seam of the case, at eye height */
{
  const zipMat = new THREE.MeshStandardMaterial({ color: PAL.payoff, metalness: 1, roughness: 0.34 });
  const zipGeo = new THREE.BoxGeometry(ROOM_W - 0.02, 0.035, 0.03);
  for (const [rot, x, z] of [[0, 0, -ROOM_D / 2 + 0.04], [0, 0, ROOM_D / 2 - 0.04],
                             [Math.PI / 2, -ROOM_W / 2 + 0.04, 0], [Math.PI / 2, ROOM_W / 2 - 0.04, 0]]) {
    const m = new THREE.Mesh(zipGeo, zipMat);
    m.rotation.y = rot; m.position.set(x, ROOM_H / 2 - 0.34, z);
    room.add(m);
  }
}

/* ---------- what is mounted on the walls ---------- */
const items = [];
const POL = CFG.polaroids || [];
const VID = CFG.panels || [];
const loader = new THREE.TextureLoader();

function polaroidTexture(img, caption) {
  const W = 512, H = 620, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#F4F2EC'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0B0B0D'; g.fillRect(28, 28, W - 56, 440);
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

/* Place an object against the inside of a wall, facing the middle of the room. */
function onWall(mesh, wall, u, v, tilt = 0) {
  const inset = 0.06;
  if (wall === 'back')  { mesh.position.set(u, v, -ROOM_D / 2 + inset); }
  if (wall === 'front') { mesh.position.set(u, v,  ROOM_D / 2 - inset); mesh.rotation.y = Math.PI; }
  if (wall === 'left')  { mesh.position.set(-ROOM_W / 2 + inset, v, u); mesh.rotation.y =  Math.PI / 2; }
  if (wall === 'right') { mesh.position.set( ROOM_W / 2 - inset, v, u); mesh.rotation.y = -Math.PI / 2; }
  mesh.rotation.z = tilt * Math.PI / 180;
  room.add(mesh);
}

/* the videos: screens set into the back and side lining */
const VID_SPOTS = [
  ['back', -2.9, 0.75], ['back', 0, 0.75], ['back', 2.9, 0.75],
  ['left', -1.9, 0.62], ['left', 1.9, 0.62], ['right', -0.4, 0.62],
];
VID.slice(0, VID_SPOTS.length).forEach((v, i) => {
  const [wall, u, vv] = VID_SPOTS[i];
  const w = 1.55, h = w * 9 / 16;
  const poster = loader.load(v.poster);
  poster.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: poster, toneMapped: false });
  const bez = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.07, h + 0.07), new THREE.MeshBasicMaterial({ color: 0x05060A }));
  onWall(bez, wall, u, vv);
  bez.position.multiplyScalar(1.0);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  onWall(m, wall, u, vv);
  m.position.add(new THREE.Vector3(0, 0, 0).copy(m.position).normalize().multiplyScalar(-0.012));
  items.push({ mesh: m, kind: 'video', data: v, mat, poster, video: null, live: false,
               home: m.position.clone(), rot: m.rotation.z, quat: m.quaternion.clone() });
});

/* the polaroids: pinned around the videos */
const POL_SPOTS = [
  ['back', -3.9, -0.75, -7], ['back', -1.35, -0.9, 5], ['back', 1.3, -0.86, -5],
  ['back', 3.85, -0.75, 8], ['left', 0.2, -0.8, -6], ['right', -2.4, -0.72, 6],
];
POL.slice(0, POL_SPOTS.length).forEach((p, i) => {
  const [wall, u, v, tilt] = POL_SPOTS[i];
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.87), mat);
  onWall(m, wall, u, v, tilt);
  const img = new Image();
  img.onload = () => { mat.map = polaroidTexture(img, p.caption); mat.needsUpdate = true; };
  img.src = p.src;
  items.push({ mesh: m, kind: 'polaroid', data: p, home: m.position.clone(), rot: m.rotation.z, quat: m.quaternion.clone() });
});

/* the pouch: on the right wall, where a document pocket actually lives */
{
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x1D1A24, roughness: 0.88 }));
  onWall(body, 'right', 2.2, -0.7);
  const zip = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.05),
    new THREE.MeshStandardMaterial({ color: PAL.payoff, metalness: 1, roughness: 0.3 }));
  onWall(zip, 'right', 2.2, -0.34);
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66),
    new THREE.MeshStandardMaterial({ color: 0x7A1420, roughness: 0.8 }));
  onWall(pp, 'right', 2.75, -0.44, 9);
  items.push({ mesh: body, kind: 'pouch', data: { label: CFG.pouchLabel || 'DOCUMENTS' },
               home: body.position.clone(), rot: body.rotation.z, quat: body.quaternion.clone() });
}

/* ---- the paperwork, hung where paperwork lives ----
   Everything that used to be a section BELOW the page is now an object inside
   the case: the figures on a baggage tag, the sources on a cargo manifest, the
   booking rail on a customs declaration. If the premise is that all of her is
   in this case, a scrolling document underneath it contradicts the premise. */
function cardTexture(title, sub, accent) {
  const W = 512, H = 320, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#EFEADC'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(20,19,26,0.3)'; g.lineWidth = 3;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.fillStyle = accent; g.fillRect(14, 14, W - 28, 16);
  g.fillStyle = '#14131A';
  g.font = '900 54px Anton, Impact, sans-serif';
  g.textAlign = 'center';
  const words = title.split(' ');
  if (words.length > 2) {
    g.fillText(words.slice(0, 2).join(' ').toUpperCase(), W / 2, 150);
    g.fillText(words.slice(2).join(' ').toUpperCase(), W / 2, 206);
  } else g.fillText(title.toUpperCase(), W / 2, 178);
  g.fillStyle = '#6A6252';
  g.font = '600 22px ui-monospace, Menlo, monospace';
  g.fillText(sub.toUpperCase(), W / 2, 262);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

(CFG.plaques || []).forEach((pl) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.72),
    new THREE.MeshStandardMaterial({ map: cardTexture(pl.label, pl.sub, PAL.accent), roughness: 0.82 }));
  onWall(m, pl.wall, pl.u, pl.v, pl.tilt || 0);
  // the string it hangs by
  const str = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xC9C2AE, roughness: 0.9 }));
  onWall(str, pl.wall, pl.u, pl.v + 0.51, pl.tilt || 0);
  items.push({ mesh: m, kind: 'panel', data: pl, home: m.position.clone(), rot: m.rotation.z, quat: m.quaternion.clone() });
});

/* the wordmark, stencilled on the lining behind you — the way a case carries
   its owner's name on the inside of the lid */
{
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 256);
  g.fillStyle = 'rgba(255,255,255,0.16)';
  g.font = '900 150px Anton, Impact, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText((CFG.artist || '').toUpperCase(), 512, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  onWall(m, 'front', 0, 0.4);
}

/* ---- video promotion, inside a hard budget ----
   A poster is the resting state. A clip becomes a live texture only when it is
   one of the screens you are actually facing and the frame budget allows, and
   it is torn all the way down on demotion — pausing alone leaves the decoder
   alive and the budget stops meaning anything. */
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
    .catch(() => { p.live = false; p.video = null; });
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

/* Every readable surface is a panel you take out of the case. Same shell,
   different paper — passport, baggage tag, manifest, customs form. */
function openPanel(id) {
  const el = document.getElementById('panel-' + id);
  if (!el) return;
  document.querySelectorAll('.panel').forEach((p) => { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); });
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  const first = el.querySelector('button, a, input');
  if (first) first.focus();
}
function closePanels() {
  document.querySelectorAll('.panel').forEach((p) => { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); });
}
document.querySelectorAll('.panel').forEach((el) => {
  el.addEventListener('click', (e) => { if (e.target === el || e.target.dataset.close !== undefined) closePanels(); });
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanels(); });
window.__coldopenPanel = openPanel;

host.addEventListener('click', () => {
  const it = pick();
  if (!it) { if (held) held = null; return; }
  if (it.kind === 'pouch') { openPanel('docs'); return; }
  if (it.kind === 'panel') { openPanel(it.data.id); return; }
  if (it.kind === 'video') { window.open(it.data.href, '_blank', 'noopener'); return; }
  held = held === it ? null : it;      // a polaroid you picked up, put back
});

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */
let opened = false, openT = 0, openTarget = 0, spin = 0, spinTarget = 0;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Scroll position is the ONLY source of truth for how open the case is.
   Clicking a tag used to set openTarget = 1 directly, and the very next scroll
   event overwrote it with the value derived from a scroll position of ~0 — so
   the case sat half-open with its shell parked in the middle of the room,
   blocking everything inside. A click now SCROLLS to the open point instead of
   fighting it. */
export function openCase() {
  opened = true;
  document.body.classList.add('is-open');
  if (track) {
    const total = track.offsetHeight - innerHeight;
    const want = total * 0.2;
    if (scrollY < want) scrollTo({ top: want, behavior: reduce ? 'auto' : 'smooth' });
  } else openTarget = 1;
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
  openTarget = Math.min(1, p / 0.16);
  if (!opened && p > 0.015) { opened = true; document.body.classList.add('is-open');
    if (typeof window.__coldopenUIOpen === 'function') window.__coldopenUIOpen(); }
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

  /* ENTERING.
     The halves swing wide and the camera flies through the gap between them
     into the room. The exterior case shrinks away as you pass it, because at
     the moment you are inside the packed compartment the outside of the case
     is no longer a thing you can see — you are behind it. */
  halfL.rotation.y = e * 2.5;
  halfR.rotation.y = -e * 2.5;
  handle.visible = e < 0.4;
  exterior.visible = e < 0.9;                 // gone before it can block the room
  exterior.scale.setScalar(1 + e * 6.5);      // it opens past you as you enter
  exterior.position.z = e * 12.0;

  /* Camera: from outside the case, through the gap, to standing in the room. */
  camera.position.z = 13.2 - e * (13.2 - 2.05);
  camera.position.y = 0.15 - e * 0.15;

  /* Scroll turns your head, exactly as it turns the room in a vault. */
  spin += (spinTarget - spin) * 0.08;
  camera.rotation.order = 'YXZ';
  camera.rotation.y = spin * openT;
  camera.rotation.x = -0.10 * openT;

  /* The room only exists once you are through the threshold, so its lining
     never shows through the closed shell. */
  room.visible = e > 0.06;

  /* Only the video items nearest the camera decode. Ten 1080p streams stall a
     phone long before they run out of memory, and a wall that stutters is
     worse than one that holds still. */
  if (openT > 0.6) {
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const vids = items.filter((it) => it.kind === 'video');
    const ranked = vids.map((it) => {
      it.mesh.getWorldPosition(tmp);
      const to = tmp.clone().sub(camera.position);
      // rank by how far off-axis it is, not raw distance: in a small room every
      // screen is close, and the one you are LOOKING at is the one to decode
      return { it, d: to.normalize().dot(fwd) };
    }).sort((a, b) => b.d - a.d);
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
          : hit.kind === 'panel' ? (hit.data.label + ' — OPEN')
          : hit.kind === 'video' ? (hit.data.title + ' — ' + (hit.data.sub || '') + '  ↗')
          : hit.data.caption;
        cap.classList.add('on');
      } else cap.classList.remove('on');
    }
  }
  /* Hover lifts an item off the lining toward the middle of the room; a
     polaroid you pick up comes off the wall and turns to face you. Movement is
     along each item's OWN normal, because they are on four different walls and
     a shared axis would push half of them into the aluminium. */
  for (const it of items) {
    if (it.kind === 'pouch' || it.kind === 'panel') continue;
    const lifted = it === held;
    const near = it === hovered && !held;
    const out = lifted ? 1.7 : near ? 0.12 : 0;
    const n = tmp.set(0, 0, 1).applyQuaternion(it.quat);
    const target = it.home.clone().addScaledVector(n, out);
    it.mesh.position.lerp(target, Math.min(1, dt * 6));
    const tsc = lifted ? 1.55 : near ? 1.05 : 1;
    it.mesh.scale.setScalar(it.mesh.scale.x + (tsc - it.mesh.scale.x) * Math.min(1, dt * 6));
    if (lifted) it.mesh.quaternion.slerp(camera.quaternion, Math.min(1, dt * 5));
    else it.mesh.quaternion.slerp(it.quat, Math.min(1, dt * 5));
  }

  fill.position.copy(camera.position);
  fill.target.position.set(0, 0, 0);
  fill.intensity = 2.4 * (1 - openT);   // it lights the exterior shell, not the lining

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

if (reduce) { openT = 1; openTarget = 1; opened = true; document.body.classList.add('is-open'); }
tick();
root && root.setAttribute('data-ready', '1');
