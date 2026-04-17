/*  ── Milky Way Night Sky ──
 *  Deep star field with a bright diagonal Milky Way band,
 *  colorful nebula clouds, and twinkling stars.
 *  Viewed from afar — like gazing at the night sky.
 *  Very slow drift, cursor-reactive parallax.
 */

const THREE_CDN = "https://unpkg.com/three@0.158.0/build/three.module.js";
let sceneState = null;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch { return false; }
}
function isLowPower() { return (navigator.hardwareConcurrency || 4) < 4; }

function makeRng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/* Gaussian-ish random (sum of 3 uniforms) for natural clustering */
function gaussRng(rand) {
  return (rand() + rand() + rand()) / 3;
}

/* ── Build the night sky ── */
function buildSky(THREE, scene) {
  const rand = makeRng(42);

  const TEAL   = new THREE.Color(0x00f5d4);
  const VIOLET = new THREE.Color(0x7b68ee);
  const SKY    = new THREE.Color(0x38bdf8);
  const ROSE   = new THREE.Color(0xf472b6);
  const WHITE  = new THREE.Color(0xe8eeff);
  const WARM   = new THREE.Color(0xffd4a0);
  const MINT   = new THREE.Color(0x00c9a7);
  const PINK   = new THREE.Color(0xd87cff);

  /* The Milky Way band direction — diagonal across the sky */
  const bandAngle = Math.PI * 0.22;  // ~40° tilt
  const cosB = Math.cos(bandAngle);
  const sinB = Math.sin(bandAngle);

  /* Distance from a point to the Milky Way band (projected) */
  function bandDist(x, y) {
    return Math.abs(-sinB * x + cosB * y);
  }

  /* ═══════════════════════════════════════
     1. BACKGROUND STAR FIELD — 3 500 stars
     Spread across entire sky sphere
     ═══════════════════════════════════════ */
  const BG_COUNT = 3500;
  const bgPos = new Float32Array(BG_COUNT * 3);
  const bgCol = new Float32Array(BG_COUNT * 3);
  const bgMeta = [];

  for (let i = 0; i < BG_COUNT; i++) {
    const r = 80 + rand() * 40;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const x = Math.sin(phi) * Math.cos(theta) * r;
    const y = Math.sin(phi) * Math.sin(theta) * r;
    const z = Math.cos(phi) * r;
    bgPos[i * 3] = x; bgPos[i * 3 + 1] = y; bgPos[i * 3 + 2] = z;

    /* Brightness varies — some bright, most dim */
    const bright = Math.pow(rand(), 2.5) * 0.7 + 0.3;
    const tint = rand() > 0.85 ? SKY : rand() > 0.7 ? WARM : WHITE;
    bgCol[i * 3]     = tint.r * bright;
    bgCol[i * 3 + 1] = tint.g * bright;
    bgCol[i * 3 + 2] = tint.b * bright;

    bgMeta.push({ phase: rand() * Math.PI * 2, speed: 0.3 + rand() * 1.5 });
  }

  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
  bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
  const bgMat = new THREE.PointsMaterial({
    size: 0.15,
    transparent: true, opacity: 0.9,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
  });
  const bgStars = new THREE.Points(bgGeo, bgMat);
  scene.add(bgStars);

  /* ═══════════════════════════════════════
     2. MILKY WAY BAND — 4 000 dense stars
     Concentrated along a diagonal strip
     ═══════════════════════════════════════ */
  const MW_COUNT = 4000;
  const mwPos = new Float32Array(MW_COUNT * 3);
  const mwCol = new Float32Array(MW_COUNT * 3);

  for (let i = 0; i < MW_COUNT; i++) {
    /* Place stars along the band with gaussian spread */
    const along = (rand() - 0.5) * 160;       // spread along the band
    const across = (gaussRng(rand) - 0.5) * 18; // narrow gaussian spread perpendicular
    const depth = (rand() - 0.5) * 30;

    /* Rotate into band direction */
    const x = cosB * along + sinB * across;
    const y = -sinB * along + cosB * across;
    const z = -50 + depth;

    mwPos[i * 3] = x; mwPos[i * 3 + 1] = y; mwPos[i * 3 + 2] = z;

    /* Brighter at center of band */
    const centerDist = Math.abs(across) / 9;
    const bright = Math.max(0.15, 1 - centerDist * 0.7) * (0.4 + rand() * 0.6);
    const tint = rand() > 0.7 ? TEAL.clone().lerp(WHITE, 0.5) : rand() > 0.5 ? VIOLET.clone().lerp(WHITE, 0.4) : WHITE;
    mwCol[i * 3]     = tint.r * bright;
    mwCol[i * 3 + 1] = tint.g * bright;
    mwCol[i * 3 + 2] = tint.b * bright;
  }

  const mwGeo = new THREE.BufferGeometry();
  mwGeo.setAttribute("position", new THREE.BufferAttribute(mwPos, 3));
  mwGeo.setAttribute("color", new THREE.BufferAttribute(mwCol, 3));
  const mwMat = new THREE.PointsMaterial({
    size: 0.12,
    transparent: true, opacity: 0.85,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const mwStars = new THREE.Points(mwGeo, mwMat);
  scene.add(mwStars);

  /* ═══════════════════════════════════════
     3. MILKY WAY CORE — 1 500 bright center
     Dense concentration at galactic center
     ═══════════════════════════════════════ */
  const MC_COUNT = 1500;
  const mcPos = new Float32Array(MC_COUNT * 3);
  const mcCol = new Float32Array(MC_COUNT * 3);

  for (let i = 0; i < MC_COUNT; i++) {
    const along = (gaussRng(rand) - 0.5) * 30;
    const across = (gaussRng(rand) - 0.5) * 10;
    const depth = (rand() - 0.5) * 12;

    const x = cosB * along + sinB * across;
    const y = -sinB * along + cosB * across;
    const z = -50 + depth;

    mcPos[i * 3] = x; mcPos[i * 3 + 1] = y; mcPos[i * 3 + 2] = z;

    const bright = 0.5 + rand() * 0.5;
    const warmth = rand();
    const c = warmth > 0.6 ? WARM.clone().lerp(WHITE, 0.5) : warmth > 0.3 ? TEAL.clone().lerp(WHITE, 0.6) : VIOLET.clone().lerp(WHITE, 0.5);
    mcCol[i * 3] = c.r * bright; mcCol[i * 3 + 1] = c.g * bright; mcCol[i * 3 + 2] = c.b * bright;
  }

  const mcGeo = new THREE.BufferGeometry();
  mcGeo.setAttribute("position", new THREE.BufferAttribute(mcPos, 3));
  mcGeo.setAttribute("color", new THREE.BufferAttribute(mcCol, 3));
  const mcMat = new THREE.PointsMaterial({
    size: 0.18,
    transparent: true, opacity: 0.9,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const mwCore = new THREE.Points(mcGeo, mcMat);
  scene.add(mwCore);

  /* ═══════════════════════════════════════
     4. NEBULA CLOUDS — 2 000 soft particles
     Colorful gas patches along and near the band
     ═══════════════════════════════════════ */
  const NEB_COUNT = 2000;
  const nebPos = new Float32Array(NEB_COUNT * 3);
  const nebCol = new Float32Array(NEB_COUNT * 3);

  /* 10 nebula clusters along the band */
  const nebClusters = [];
  for (let k = 0; k < 10; k++) {
    const along = (rand() - 0.5) * 100;
    const across = (rand() - 0.5) * 12;
    nebClusters.push({
      x: cosB * along + sinB * across,
      y: -sinB * along + cosB * across,
      z: -50 + (rand() - 0.5) * 20,
      r: 5 + rand() * 12,
      col: [ROSE, VIOLET, PINK, TEAL, WARM, MINT, SKY][Math.floor(rand() * 7)],
    });
  }

  for (let i = 0; i < NEB_COUNT; i++) {
    const cl = nebClusters[i % nebClusters.length];
    const dx = (gaussRng(rand) - 0.5) * cl.r;
    const dy = (gaussRng(rand) - 0.5) * cl.r * 0.6;
    const dz = (rand() - 0.5) * cl.r * 0.5;

    nebPos[i * 3]     = cl.x + dx;
    nebPos[i * 3 + 1] = cl.y + dy;
    nebPos[i * 3 + 2] = cl.z + dz;

    const c = cl.col.clone().lerp(WHITE, rand() * 0.25);
    nebCol[i * 3] = c.r; nebCol[i * 3 + 1] = c.g; nebCol[i * 3 + 2] = c.b;
  }

  const nebGeo = new THREE.BufferGeometry();
  nebGeo.setAttribute("position", new THREE.BufferAttribute(nebPos, 3));
  nebGeo.setAttribute("color", new THREE.BufferAttribute(nebCol, 3));
  const nebMat = new THREE.PointsMaterial({
    size: 0.8,
    transparent: true, opacity: 0.06,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const nebulaPoints = new THREE.Points(nebGeo, nebMat);
  scene.add(nebulaPoints);

  /* ═══════════════════════════════════════
     5. BRIGHT STARS — 80 prominent ones
     Scattered, some with a slight glow
     ═══════════════════════════════════════ */
  const BR_COUNT = 80;
  const brPos = new Float32Array(BR_COUNT * 3);
  const brCol = new Float32Array(BR_COUNT * 3);
  const brMeta = [];

  for (let i = 0; i < BR_COUNT; i++) {
    const r = 60 + rand() * 50;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    brPos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r;
    brPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    brPos[i * 3 + 2] = Math.cos(phi) * r;

    const tint = rand() > 0.5 ? SKY : rand() > 0.3 ? TEAL : WHITE;
    brCol[i * 3] = tint.r; brCol[i * 3 + 1] = tint.g; brCol[i * 3 + 2] = tint.b;
    brMeta.push({ phase: rand() * Math.PI * 2, speed: 0.8 + rand() * 2 });
  }

  const brGeo = new THREE.BufferGeometry();
  brGeo.setAttribute("position", new THREE.BufferAttribute(brPos, 3));
  brGeo.setAttribute("color", new THREE.BufferAttribute(brCol, 3));
  const brMat = new THREE.PointsMaterial({
    size: 0.4,
    transparent: true, opacity: 0.9,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const brightStars = new THREE.Points(brGeo, brMat);
  scene.add(brightStars);

  /* ═══════════════════════════════════════
     6. SHOOTING STARS — 5 streaks
     ═══════════════════════════════════════ */
  const SHOOT_COUNT = 5;
  const shootMeta = [];
  for (let i = 0; i < SHOOT_COUNT; i++) {
    shootMeta.push({
      active: false,
      timer: 4 + rand() * 12,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0, maxLife: 0.4 + rand() * 0.5,
    });
  }
  const shootPos = new Float32Array(SHOOT_COUNT * 2 * 3);
  const shootCol = new Float32Array(SHOOT_COUNT * 2 * 3);
  const shootGeo = new THREE.BufferGeometry();
  shootGeo.setAttribute("position", new THREE.BufferAttribute(shootPos, 3));
  shootGeo.setAttribute("color", new THREE.BufferAttribute(shootCol, 3));
  const shootMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.8,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const shootLines = new THREE.LineSegments(shootGeo, shootMat);
  scene.add(shootLines);

  return {
    bgStars, bgMeta, bgCol,
    mwStars, mwCore, mcMat,
    nebulaPoints,
    brightStars, brMeta, brCol,
    shootLines, shootMeta, shootPos, shootCol,
    rand,
  };
}

/* ── Per-frame update ── */
function animate(data, t, dt) {
  /* Twinkle background stars */
  const sc = data.bgStars.geometry.attributes.color;
  const base = data.bgCol;
  const arr = sc.array;
  for (let i = 0; i < data.bgMeta.length; i++) {
    const m = data.bgMeta[i];
    const tw = 0.6 + 0.4 * Math.sin(t * m.speed + m.phase);
    arr[i * 3]     = base[i * 3]     * tw;
    arr[i * 3 + 1] = base[i * 3 + 1] * tw;
    arr[i * 3 + 2] = base[i * 3 + 2] * tw;
  }
  sc.needsUpdate = true;

  /* Twinkle bright stars */
  const bsc = data.brightStars.geometry.attributes.color;
  const bBase = data.brCol;
  const bArr = bsc.array;
  for (let i = 0; i < data.brMeta.length; i++) {
    const m = data.brMeta[i];
    const tw = 0.5 + 0.5 * Math.sin(t * m.speed + m.phase);
    bArr[i * 3]     = bBase[i * 3]     * tw;
    bArr[i * 3 + 1] = bBase[i * 3 + 1] * tw;
    bArr[i * 3 + 2] = bBase[i * 3 + 2] * tw;
  }
  bsc.needsUpdate = true;

  /* Core glow pulse */
  data.mcMat.opacity = 0.8 + 0.1 * Math.sin(t * 0.5);

  /* Nebula gentle drift */
  data.nebulaPoints.rotation.y = Math.sin(t * 0.008) * 0.015;
  data.nebulaPoints.rotation.x = Math.cos(t * 0.006) * 0.01;

  /* Shooting stars */
  const sp = data.shootPos;
  const sCol = data.shootCol;
  for (let i = 0; i < data.shootMeta.length; i++) {
    const m = data.shootMeta[i];
    if (!m.active) {
      m.timer -= dt;
      if (m.timer <= 0) {
        m.active = true; m.life = 0;
        m.maxLife = 0.3 + data.rand() * 0.4;
        const a = data.rand() * Math.PI * 2;
        const el = (data.rand() - 0.5) * 1.2;
        const r = 50 + data.rand() * 30;
        m.pos.set(Math.cos(a) * r, el * r * 0.3, -40 + Math.sin(a) * r);
        const spd = 40 + data.rand() * 40;
        m.vel.set(
          -Math.cos(a) * spd + (data.rand() - 0.5) * 10,
          (data.rand() - 0.5) * 8 - 3,
          -Math.sin(a) * spd * 0.3
        );
      }
      const idx = i * 6;
      sp[idx] = sp[idx+3] = 9999;
      sp[idx+1] = sp[idx+4] = 9999;
      sp[idx+2] = sp[idx+5] = 9999;
    } else {
      m.life += dt;
      const frac = m.life / m.maxLife;
      if (frac >= 1) { m.active = false; m.timer = 5 + data.rand() * 15; continue; }
      m.pos.addScaledVector(m.vel, dt);
      const fade = 1 - frac;
      const tail = m.vel.clone().normalize().multiplyScalar(-2 * fade);
      const idx = i * 6;
      sp[idx] = m.pos.x; sp[idx+1] = m.pos.y; sp[idx+2] = m.pos.z;
      sp[idx+3] = m.pos.x + tail.x; sp[idx+4] = m.pos.y + tail.y; sp[idx+5] = m.pos.z + tail.z;
      sCol[idx] = 0.8*fade; sCol[idx+1] = 0.96*fade; sCol[idx+2] = 0.9*fade;
      sCol[idx+3] = 0.2*fade; sCol[idx+4] = 0.4*fade; sCol[idx+5] = 0.35*fade;
    }
  }
  data.shootLines.geometry.attributes.position.needsUpdate = true;
  data.shootLines.geometry.attributes.color.needsUpdate = true;
}

/* ── Entry point ── */
export async function initThreeScene({ canvas, prefersReducedMotion = false } = {}) {
  if (sceneState || !canvas) return sceneState;
  if (prefersReducedMotion || isLowPower() || !hasWebGL()) {
    document.body.classList.add("scene-fallback");
    return null;
  }

  let THREE;
  try { THREE = await import(THREE_CDN); }
  catch { document.body.classList.add("scene-fallback"); return null; }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  /* Camera — looking straight into the sky */
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);

  const data = buildSky(THREE, scene);

  let frameId = 0, running = false;
  let mx = 0, my = 0;
  let smx = 0, smy = 0; // smoothed mouse
  let prevTime = 0;

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  function onPointer(e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }
  function onOrientation(e) {
    mx = Math.max(-1, Math.min(1, (Number(e.gamma) || 0) / 45));
    my = Math.max(-1, Math.min(1, ((Number(e.beta) || 45) - 45) / 45));
  }

  function frame(now) {
    if (!running) return;
    frameId = requestAnimationFrame(frame);
    const t = now * 0.001;
    const dt = Math.min(t - prevTime, 0.05);
    prevTime = t;

    /* Smooth cursor following */
    smx += (mx - smx) * 0.02;
    smy += (my - smy) * 0.02;

    /* Very slow scene rotation — like Earth rotating under the stars */
    scene.rotation.y = t * 0.003 + smx * 0.08;
    scene.rotation.x = smy * 0.06;
    scene.rotation.z = t * 0.001;

    animate(data, t, dt);
    renderer.render(scene, camera);
  }

  function start() { if (!running) { running = true; prevTime = performance.now() * 0.001; frameId = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(frameId); }
  function onVis() { document.hidden ? stop() : start(); }

  window.addEventListener("resize", onResize);
  window.addEventListener("mousemove", onPointer, { passive: true });
  window.addEventListener("deviceorientation", onOrientation, { passive: true });
  document.addEventListener("visibilitychange", onVis);

  start();
  document.body.classList.add("scene-ready");

  sceneState = {
    destroy() {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onPointer);
      window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("visibilitychange", onVis);
      renderer.dispose();
      sceneState = null;
      document.body.classList.remove("scene-ready");
    },
  };
  return sceneState;
}
