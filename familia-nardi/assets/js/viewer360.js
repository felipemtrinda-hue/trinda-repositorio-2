/* Família Nardi — visualizador 360° da embalagem (Three.js) */
import * as THREE from "three";
import { OrbitControls } from "../vendor/three/OrbitControls.js";
import { RoomEnvironment } from "../vendor/three/RoomEnvironment.js";

const W = 1, H = 1.79, D = 0.36;      // proporções da embalagem (frente 554 × 993 px)
const NAVY = "#171c6b";

function sideTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = Math.round(256 * H / D);
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, c.width, 0);
  grad.addColorStop(0, "#10145a");
  grad.addColorStop(0.5, NAVY);
  grad.addColorStop(1, "#10145a");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  // frase oficial da lateral da embalagem
  g.fillStyle = "rgba(237,230,218,0.9)";
  g.font = "400 34px Cormorant, Georgia, serif";
  ["Alguns cafés", "despertam, outros", "permanecem."].forEach((t, i) => {
    g.fillText(t, 22, c.height * 0.46 + i * 36);
  });
  return c;
}

function blobShadow() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(20,17,15,0.45)");
  r.addColorStop(1, "rgba(20,17,15,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function bagGeometry() {
  const geo = new THREE.BoxGeometry(W, H, D, 40, 90, 14);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const nx = v.x / (W / 2), ny = (v.y + H / 2) / H;           // ny: 0 base → 1 topo
    const top = THREE.MathUtils.clamp((ny - 0.68) / 0.24, 0, 1);  // sanfona se fecha em diagonal até o fecho
    const body = Math.sin(Math.PI * Math.min(ny / 0.9, 1)) * (1 - top);
    // frente e verso levemente estufados
    if (Math.abs(v.z) > D / 2 - 1e-4) v.z += Math.sign(v.z) * 0.045 * (1 - nx * nx) * body;
    // fecho: profundidade reduzida no topo
    v.z *= THREE.MathUtils.lerp(1, 0.1, top);
    // laterais (sanfona) levemente côncavas
    if (Math.abs(v.x) > W / 2 - 1e-4) v.x -= Math.sign(v.x) * 0.02 * (1 - (2 * v.z / D) ** 2) * body;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export async function mountViewer(root) {
  const stage = root.querySelector("[data-viewer-stage]");
  const canvas = document.createElement("canvas");
  canvas.className = "viewer__canvas";
  canvas.setAttribute("aria-hidden", "true");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    root.classList.add("viewer--fallback");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  const RADIUS = 5.2;
  camera.position.set(0, 0.25, RADIUS);

  await document.fonts.load("400 34px Cormorant").catch(() => {});
  const loader = new THREE.TextureLoader();
  const front = await loader.loadAsync(root.dataset.front);
  front.colorSpace = THREE.SRGBColorSpace;
  front.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // lateral: arte real da embalagem (frase e texto), retificada a partir do render oficial
  const side = root.dataset.side ? await loader.loadAsync(root.dataset.side) : new THREE.CanvasTexture(sideTexture());
  side.colorSpace = THREE.SRGBColorSpace;
  side.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const foil = { roughness: 0.32, metalness: 0.15, clearcoat: 0.7, clearcoatRoughness: 0.22, envMapIntensity: 0.9 };
  const black = new THREE.MeshPhysicalMaterial({ color: "#0e0d0c", ...foil });
  const mats = [
    new THREE.MeshPhysicalMaterial({ map: side, ...foil }),            // +x lateral
    new THREE.MeshPhysicalMaterial({ map: side, ...foil }),            // -x lateral
    black,                                                              // topo
    black,                                                              // base
    // a foto da frente já traz o brilho do filme: reflexo extra bem contido
    new THREE.MeshStandardMaterial({ map: front, roughness: 0.6, metalness: 0, envMapIntensity: 0.25 }), // frente
    black,                                                              // verso (arte a definir)
  ];
  const bag = new THREE.Mesh(bagGeometry(), mats);
  scene.add(bag);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshBasicMaterial({ map: blobShadow(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -H / 2 - 0.01;
  scene.add(shadow);

  const key = new THREE.DirectionalLight("#fff4e6", 2.2);
  key.position.set(-3, 3, 4);
  const rim = new THREE.DirectionalLight("#a9743f", 1.6);
  rim.position.set(3, 1.5, -3);
  scene.add(key, rim, new THREE.AmbientLight("#ffffff", 0.25));

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.minPolarAngle = Math.PI * 0.32;
  controls.maxPolarAngle = Math.PI * 0.6;
  controls.target.set(0, 0, 0);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 1.6;

  stage.appendChild(canvas);
  root.classList.add("viewer--ready");

  // Ângulos pré-definidos ----------------------------------------------
  let tween = null, idleTimer = null;
  const buttons = root.querySelectorAll("[data-angle]");
  function azimuth() { return Math.atan2(camera.position.x, camera.position.z); }
  function setActive(deg) {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.angle) === deg)));
  }
  function goTo(deg) {
    const from = azimuth();
    let to = THREE.MathUtils.degToRad(deg);
    let delta = ((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    tween = { from, delta, t0: performance.now(), dur: reduce ? 1 : 900 };
    pauseAuto();
    setActive(deg);
  }
  function pauseAuto() {
    controls.autoRotate = false;
    root.classList.remove("is-spinning");
    clearTimeout(idleTimer);
    if (!reduce && root.querySelector("[data-spin]").getAttribute("aria-pressed") === "true") {
      idleTimer = setTimeout(() => { controls.autoRotate = true; root.classList.add("is-spinning"); setActive(null); }, 5000);
    }
  }
  const spin = root.querySelector("[data-spin]");
  buttons.forEach((b) => b.addEventListener("click", () => {
    spin.setAttribute("aria-pressed", "false");
    goTo(Number(b.dataset.angle));
  }));
  spin.setAttribute("aria-pressed", String(!reduce));
  if (!reduce) root.classList.add("is-spinning");
  spin.addEventListener("click", () => {
    const on = spin.getAttribute("aria-pressed") !== "true";
    spin.setAttribute("aria-pressed", String(on));
    controls.autoRotate = on;
    root.classList.toggle("is-spinning", on);
    if (on) setActive(null); else clearTimeout(idleTimer);
  });
  controls.addEventListener("start", () => { tween = null; pauseAuto(); setActive(null); root.classList.add("is-dragged"); });

  stage.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? -30 : 30;
    goTo(Math.round(THREE.MathUtils.radToDeg(azimuth()) + step));
    setActive(null);
  });

  // Render apenas quando visível ---------------------------------------
  function resize() {
    const r = stage.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.position.setLength(r.width < 520 ? RADIUS + 0.6 : RADIUS);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = false, raf = 0;
  function frame(now) {
    if (tween) {
      const k = Math.min((now - tween.t0) / tween.dur, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const a = tween.from + tween.delta * e;
      const r = Math.hypot(camera.position.x, camera.position.z);
      camera.position.x = Math.sin(a) * r;
      camera.position.z = Math.cos(a) * r;
      if (k === 1) tween = null;
    }
    controls.update();
    renderer.render(scene, camera);
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(root);
}
