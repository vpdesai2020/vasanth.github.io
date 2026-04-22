/*  ── Milky Way Night Sky ──
 *  Deep star field with a bright diagonal Milky Way band,
 *  colorful nebula clouds, twinkling stars, and rare shooting stars.
 *  Viewed from inside — like gazing at the night sky.
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

  /* Generate a circular soft-glow texture to replace default square points */
  function makeGlowTexture(size) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const half = size / 2;
    const g = ctx.createRadialGradient(half, half, 0, half, half, half);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.15, "rgba(255,255,255,0.85)");
    g.addColorStop(0.4, "rgba(255,255,255,0.35)");
    g.addColorStop(0.7, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }
  const starTex = makeGlowTexture(64);
  const nebulaTex = makeGlowTexture(128);

  /* The Milky Way band direction — diagonal across the sky */
  const bandAngle = Math.PI * 0.22;
  const cosB = Math.cos(bandAngle);
  const sinB = Math.sin(bandAngle);

  function bandDist(x, y) {
    return Math.abs(-sinB * x + cosB * y);
  }

  /* ═══════════════════════════════════════
     1. BACKGROUND STAR FIELD — 4 000 stars
     Variable sizes for depth, scattered across sky sphere
     ═══════════════════════════════════════ */
  const BG_COUNT = 4000;
  const bgPos = new Float32Array(BG_COUNT * 3);
  const bgCol = new Float32Array(BG_COUNT * 3);
  const bgSizes = new Float32Array(BG_COUNT);
  const bgMeta = [];

  for (let i = 0; i < BG_COUNT; i++) {
    const r = 70 + rand() * 50;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const x = Math.sin(phi) * Math.cos(theta) * r;
    const y = Math.sin(phi) * Math.sin(theta) * r;
    const z = Math.cos(phi) * r;
    bgPos[i * 3] = x; bgPos[i * 3 + 1] = y; bgPos[i * 3 + 2] = z;

    /* Brightness varies with power curve for realism */
    const bright = Math.pow(rand(), 3) * 0.8 + 0.2;
    const tint = rand() > 0.88 ? SKY : rand() > 0.75 ? WARM : rand() > 0.65 ? TEAL : WHITE;
    bgCol[i * 3]     = tint.r * bright;
    bgCol[i * 3 + 1] = tint.g * bright;
    bgCol[i * 3 + 2] = tint.b * bright;

    /* Variable star sizes — most tiny, some larger */
    bgSizes[i] = Math.pow(rand(), 4) * 0.35 + 0.05;

    /* Varied twinkle — some barely flicker, some pulse strongly */
    const twinkleStrength = Math.pow(rand(), 2);
    bgMeta.push({
      phase: rand() * Math.PI * 2,
      speed: 0.2 + rand() * 2,
      twinkle: twinkleStrength,
    });
  }

  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
  bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
  bgGeo.setAttribute("size", new THREE.BufferAttribute(bgSizes, 1));
  const bgMat = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2.5) },
      uScreenScale: { value: Math.max(1, window.innerWidth / 1440) },
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float uPixelRatio;
      uniform float uScreenScale;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixelRatio * uScreenScale * (250.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.15, d);
        gl_FragColor = vec4(vColor, alpha * 0.9);
      }
    `,
    transparent: true, depthWrite: false, vertexColors: true,
    blending: THREE.AdditiveBlending,
  });
  const bgStars = new THREE.Points(bgGeo, bgMat);
  scene.add(bgStars);

  /* ═══════════════════════════════════════
     2. MILKY WAY BAND — 5 000 dense stars
     Concentrated along a diagonal strip
     ═══════════════════════════════════════ */
  const MW_COUNT = 5000;
  const mwPos = new Float32Array(MW_COUNT * 3);
  const mwCol = new Float32Array(MW_COUNT * 3);

  for (let i = 0; i < MW_COUNT; i++) {
    const along = (rand() - 0.5) * 180;
    const across = (gaussRng(rand) - 0.5) * 20;
    const depth = (rand() - 0.5) * 35;

    const x = cosB * along + sinB * across;
    const y = -sinB * along + cosB * across;
    const z = -50 + depth;

    mwPos[i * 3] = x; mwPos[i * 3 + 1] = y; mwPos[i * 3 + 2] = z;

    const centerDist = Math.abs(across) / 10;
    const bright = Math.max(0.12, 1 - centerDist * 0.65) * (0.35 + rand() * 0.65);
    const tint = rand() > 0.7 ? TEAL.clone().lerp(WHITE, 0.5)
      : rand() > 0.5 ? VIOLET.clone().lerp(WHITE, 0.4)
      : rand() > 0.35 ? SKY.clone().lerp(WHITE, 0.6) : WHITE;
    mwCol[i * 3]     = tint.r * bright;
    mwCol[i * 3 + 1] = tint.g * bright;
    mwCol[i * 3 + 2] = tint.b * bright;
  }

  /* Scale factor for large screens */
  const screenScale = Math.max(1, window.innerWidth / 1440);

  const mwGeo = new THREE.BufferGeometry();
  mwGeo.setAttribute("position", new THREE.BufferAttribute(mwPos, 3));
  mwGeo.setAttribute("color", new THREE.BufferAttribute(mwCol, 3));
  const mwMat = new THREE.PointsMaterial({
    size: 0.18 * screenScale,
    map: starTex,
    transparent: true, opacity: 0.85,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const mwStars = new THREE.Points(mwGeo, mwMat);
  scene.add(mwStars);

  /* ═══════════════════════════════════════
     3. MILKY WAY CORE — 2 000 bright center
     Dense concentration at galactic center
     ═══════════════════════════════════════ */
  const MC_COUNT = 2000;
  const mcPos = new Float32Array(MC_COUNT * 3);
  const mcCol = new Float32Array(MC_COUNT * 3);

  for (let i = 0; i < MC_COUNT; i++) {
    const along = (gaussRng(rand) - 0.5) * 35;
    const across = (gaussRng(rand) - 0.5) * 12;
    const depth = (rand() - 0.5) * 14;

    const x = cosB * along + sinB * across;
    const y = -sinB * along + cosB * across;
    const z = -50 + depth;

    mcPos[i * 3] = x; mcPos[i * 3 + 1] = y; mcPos[i * 3 + 2] = z;

    const bright = 0.5 + rand() * 0.5;
    const warmth = rand();
    const c = warmth > 0.6 ? WARM.clone().lerp(WHITE, 0.4)
      : warmth > 0.3 ? TEAL.clone().lerp(WHITE, 0.5)
      : VIOLET.clone().lerp(WHITE, 0.45);
    mcCol[i * 3] = c.r * bright; mcCol[i * 3 + 1] = c.g * bright; mcCol[i * 3 + 2] = c.b * bright;
  }

  const mcGeo = new THREE.BufferGeometry();
  mcGeo.setAttribute("position", new THREE.BufferAttribute(mcPos, 3));
  mcGeo.setAttribute("color", new THREE.BufferAttribute(mcCol, 3));
  const mcMat = new THREE.PointsMaterial({
    size: 0.3 * screenScale,
    map: starTex,
    transparent: true, opacity: 0.9,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const mwCore = new THREE.Points(mcGeo, mcMat);
  scene.add(mwCore);

  /* ═══════════════════════════════════════
     4. NEBULA CLOUDS — 2 500 soft particles
     Colorful gas patches — more visible, gentle drift
     ═══════════════════════════════════════ */
  const NEB_COUNT = 2500;
  const nebPos = new Float32Array(NEB_COUNT * 3);
  const nebCol = new Float32Array(NEB_COUNT * 3);

  /* 14 nebula clusters along the band */
  const nebClusters = [];
  for (let k = 0; k < 14; k++) {
    const along = (rand() - 0.5) * 120;
    const across = (rand() - 0.5) * 15;
    nebClusters.push({
      x: cosB * along + sinB * across,
      y: -sinB * along + cosB * across,
      z: -50 + (rand() - 0.5) * 25,
      r: 6 + rand() * 14,
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

    const c = cl.col.clone().lerp(WHITE, rand() * 0.2);
    nebCol[i * 3] = c.r; nebCol[i * 3 + 1] = c.g; nebCol[i * 3 + 2] = c.b;
  }

  const nebGeo = new THREE.BufferGeometry();
  nebGeo.setAttribute("position", new THREE.BufferAttribute(nebPos, 3));
  nebGeo.setAttribute("color", new THREE.BufferAttribute(nebCol, 3));
  const nebMat = new THREE.PointsMaterial({
    size: 1.6 * screenScale,
    map: nebulaTex,
    transparent: true, opacity: 0.09,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const nebulaPoints = new THREE.Points(nebGeo, nebMat);
  scene.add(nebulaPoints);

  /* ═══════════════════════════════════════
     5. BRIGHT STARS — 100 prominent ones
     Variable glow, some colored, scattered across sky
     ═══════════════════════════════════════ */
  const BR_COUNT = 100;
  const brPos = new Float32Array(BR_COUNT * 3);
  const brCol = new Float32Array(BR_COUNT * 3);
  const brMeta = [];

  for (let i = 0; i < BR_COUNT; i++) {
    const r = 55 + rand() * 55;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    brPos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r;
    brPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    brPos[i * 3 + 2] = Math.cos(phi) * r;

    const tint = rand() > 0.6 ? SKY : rand() > 0.4 ? TEAL : rand() > 0.2 ? WARM : WHITE;
    brCol[i * 3] = tint.r; brCol[i * 3 + 1] = tint.g; brCol[i * 3 + 2] = tint.b;
    brMeta.push({
      phase: rand() * Math.PI * 2,
      speed: 0.5 + rand() * 2.5,
      twinkle: 0.3 + rand() * 0.7,
    });
  }

  const brGeo = new THREE.BufferGeometry();
  brGeo.setAttribute("position", new THREE.BufferAttribute(brPos, 3));
  brGeo.setAttribute("color", new THREE.BufferAttribute(brCol, 3));
  const brMat = new THREE.PointsMaterial({
    size: 0.65 * screenScale,
    map: starTex,
    transparent: true, opacity: 0.9,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const brightStars = new THREE.Points(brGeo, brMat);
  scene.add(brightStars);

  /* ═══════════════════════════════════════
     6. SHOOTING STARS — 3 slots, very rare
     Long luminous trails, one every 20-50 seconds
     First one appears within 5-10s so user sees it
     ═══════════════════════════════════════ */
  const SHOOT_COUNT = 3;
  const TRAIL_SEGS = 16;
  const shootMeta = [];
  for (let i = 0; i < SHOOT_COUNT; i++) {
    shootMeta.push({
      active: false,
      timer: i === 0 ? 3 + rand() * 5 : 18 + rand() * 30,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      trail: [],
      life: 0,
      maxLife: 0.8 + rand() * 1.0,
    });
  }
  /* Each shooting star: TRAIL_SEGS line segments = (TRAIL_SEGS+1) points per star */
  const shootVerts = SHOOT_COUNT * (TRAIL_SEGS + 1);
  const shootPos = new Float32Array(shootVerts * 3);
  const shootCol = new Float32Array(shootVerts * 3);
  const shootIndices = [];
  for (let s = 0; s < SHOOT_COUNT; s++) {
    const base = s * (TRAIL_SEGS + 1);
    for (let j = 0; j < TRAIL_SEGS; j++) {
      shootIndices.push(base + j, base + j + 1);
    }
  }
  const shootGeo = new THREE.BufferGeometry();
  shootGeo.setAttribute("position", new THREE.BufferAttribute(shootPos, 3));
  shootGeo.setAttribute("color", new THREE.BufferAttribute(shootCol, 3));
  shootGeo.setIndex(shootIndices);
  const shootMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending,
    linewidth: 1,
  });
  const shootLines = new THREE.LineSegments(shootGeo, shootMat);
  scene.add(shootLines);

  return {
    bgStars, bgMeta, bgCol,
    mwStars, mwCore, mcMat,
    nebulaPoints, nebMat,
    brightStars, brMeta, brCol,
    shootLines, shootMeta, shootPos, shootCol, TRAIL_SEGS,
    rand,
  };
}

/* ── Per-frame update ── */
function animate(data, t, dt) {
  /* Twinkle background stars — varied intensity per star */
  const sc = data.bgStars.geometry.attributes.color;
  const base = data.bgCol;
  const arr = sc.array;
  const bgLen = data.bgMeta.length;
  for (let i = 0; i < bgLen; i++) {
    const m = data.bgMeta[i];
    const tw = 1 - m.twinkle * 0.4 * (1 - Math.sin(t * m.speed + m.phase)) * 0.5;
    const i3 = i * 3;
    arr[i3]     = base[i3]     * tw;
    arr[i3 + 1] = base[i3 + 1] * tw;
    arr[i3 + 2] = base[i3 + 2] * tw;
  }
  sc.needsUpdate = true;

  /* Twinkle bright stars — more dramatic */
  const bsc = data.brightStars.geometry.attributes.color;
  const bBase = data.brCol;
  const bArr = bsc.array;
  const brLen = data.brMeta.length;
  for (let i = 0; i < brLen; i++) {
    const m = data.brMeta[i];
    const tw = 1 - m.twinkle * (0.5 + 0.5 * Math.sin(t * m.speed + m.phase));
    const v = tw > 0.2 ? tw : 0.2;
    const i3 = i * 3;
    bArr[i3]     = bBase[i3]     * v;
    bArr[i3 + 1] = bBase[i3 + 1] * v;
    bArr[i3 + 2] = bBase[i3 + 2] * v;
  }
  bsc.needsUpdate = true;

  /* Core glow pulse — breathing effect */
  data.mcMat.opacity = 0.8 + 0.12 * Math.sin(t * 0.4) + 0.05 * Math.sin(t * 1.1);

  /* Nebula gentle drift and subtle opacity breathing */
  data.nebulaPoints.rotation.y = Math.sin(t * 0.006) * 0.02;
  data.nebulaPoints.rotation.x = Math.cos(t * 0.004) * 0.012;
  data.nebMat.opacity = 0.08 + 0.02 * Math.sin(t * 0.3);

  /* Shooting stars — rare, with long fading trails */
  const sp = data.shootPos;
  const sCol = data.shootCol;
  const TRAIL = data.TRAIL_SEGS;

  for (let i = 0; i < data.shootMeta.length; i++) {
    const m = data.shootMeta[i];
    const vertBase = i * (TRAIL + 1);

    if (!m.active) {
      m.timer -= dt;
      if (m.timer <= 0) {
        m.active = true;
        m.life = 0;
        m.maxLife = 0.8 + data.rand() * 1.0;
        m.trail = [];
        /* Start from upper portion of visible sky, close to camera */
        const startAngle = data.rand() * Math.PI * 0.8 + Math.PI * 0.1;
        const startY = 8 + data.rand() * 15;
        const startX = (data.rand() - 0.5) * 40;
        const startZ = -15 - data.rand() * 15;
        m.pos.set(startX, startY, startZ);
        /* Streak downward and across */
        const spd = 35 + data.rand() * 30;
        m.vel.set(
          Math.cos(startAngle) * spd,
          -spd * (0.5 + data.rand() * 0.4),
          -data.rand() * 8
        );
      }
      /* Hide off-screen */
      for (let v = 0; v <= TRAIL; v++) {
        const idx = (vertBase + v) * 3;
        sp[idx] = sp[idx+1] = sp[idx+2] = 9999;
        sCol[idx] = sCol[idx+1] = sCol[idx+2] = 0;
      }
    } else {
      m.life += dt;
      const frac = m.life / m.maxLife;

      if (frac >= 1) {
        m.active = false;
        m.timer = 18 + data.rand() * 35;
        m.trail = [];
        for (let v = 0; v <= TRAIL; v++) {
          const idx = (vertBase + v) * 3;
          sp[idx] = sp[idx+1] = sp[idx+2] = 9999;
          sCol[idx] = sCol[idx+1] = sCol[idx+2] = 0;
        }
        continue;
      }

      m.pos.addScaledVector(m.vel, dt);
      m.trail.unshift(m.pos.clone());
      if (m.trail.length > TRAIL + 1) m.trail.length = TRAIL + 1;

      /* Overall brightness: quick ramp up, long graceful fade */
      const globalFade = frac < 0.08
        ? frac / 0.08
        : Math.pow(Math.max(0, 1 - (frac - 0.08) / 0.92), 0.6);

      for (let v = 0; v <= TRAIL; v++) {
        const idx = (vertBase + v) * 3;
        if (v < m.trail.length) {
          const p = m.trail[v];
          sp[idx] = p.x; sp[idx+1] = p.y; sp[idx+2] = p.z;
          /* Trail fades from brilliant head to dim tail */
          const trailFade = Math.pow(1 - v / TRAIL, 1.5);
          const intensity = globalFade * trailFade;
          /* Head is bright white, tail shifts to teal-violet */
          sCol[idx]     = (0.95 + 0.05 * trailFade) * intensity;
          sCol[idx + 1] = (1.0 * trailFade + 0.5 * (1 - trailFade)) * intensity;
          sCol[idx + 2] = (0.9 * trailFade + 0.8 * (1 - trailFade)) * intensity;
        } else {
          sp[idx] = sp[idx+1] = sp[idx+2] = 9999;
          sCol[idx] = sCol[idx+1] = sCol[idx+2] = 0;
        }
      }
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

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  renderer.setPixelRatio(dpr);
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
    /* Update screen-scale uniform for large monitors */
    const newScale = Math.max(1, window.innerWidth / 1440);
    if (data.bgStars.material.uniforms) {
      data.bgStars.material.uniforms.uScreenScale.value = newScale;
    }
    /* Scale PointsMaterial sizes for large screens */
    data.mwStars.material.size = 0.18 * newScale;
    data.mwCore.material.size = 0.3 * newScale;
    data.nebulaPoints.material.size = 1.6 * newScale;
    data.brightStars.material.size = 0.65 * newScale;
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
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("deviceorientation", onOrientation, { passive: true });
  document.addEventListener("visibilitychange", onVis);

  start();
  document.body.classList.add("scene-ready");

  sceneState = {
    destroy() {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("visibilitychange", onVis);
      renderer.dispose();
      sceneState = null;
      document.body.classList.remove("scene-ready");
    },
  };
  return sceneState;
}
