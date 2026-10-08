"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { Measurements, Sex } from "@/lib/diet-pro/types";

/**
 * Anatomical 3D body for Diet Pro.
 * Geometry: Z-Anatomy (CC BY-SA 4.0), derived from BodyParts3D (DBCLS, CC BY-SA 2.1 JP) —
 * real segmented human anatomy: 180 named muscles, the skeleton and the skin surface,
 * built for the web by scripts/build-anatomy.mjs. Muscles get a fibre shader whose
 * striations run along each muscle's own principal axis.
 * Tape-measure rings are sized from the client's circumferences and drawn around the
 * reference body so the coach can compare them.
 */

export type Body3DHandle = { snapshot: () => string | null };
export type BodyView = "muscles" | "xray" | "skin" | "skeleton";
export type BodyPick = { group: string; label: string; side: string } | null;

type Props = {
  sex: Sex;
  heightCm: number;
  weightKg: number;
  bodyFat: number;
  m: Measurements;
  highlight: string[];
  selected: BodyPick;
  view: BodyView;
  rings: boolean;
  onSelect: (p: BodyPick) => void;
  ref?: Ref<Body3DHandle>;
};

const BRAND = 0xe8394b;
const MUSCLE = 0x9e2f2a;
const SKY = 0x7cc0ee;

/** Circumference defaults (cm) scaled from stature and BMI when a tape value is missing. */
export function filledMeasurements(sex: Sex, heightCm: number, weightKg: number, m: Measurements) {
  const bmi = weightKg / (heightCm / 100) ** 2;
  const s = Math.sqrt(bmi / 22);
  const male = sex === "male";
  const est = {
    neck: (male ? 0.215 : 0.19) * heightCm * s,
    chest: (male ? 0.55 : 0.53) * heightCm * s,
    waist: (male ? 0.47 : 0.44) * heightCm * s * s,
    hip: (male ? 0.56 : 0.6) * heightCm * s,
    arm: (male ? 0.17 : 0.16) * heightCm * s,
    forearm: (male ? 0.155 : 0.14) * heightCm * s,
    thigh: (male ? 0.32 : 0.34) * heightCm * s,
    calf: (male ? 0.215 : 0.21) * heightCm * s,
    wrist: (male ? 0.1 : 0.092) * heightCm,
  };
  const out = {} as Required<Measurements>;
  const estimated: (keyof Measurements)[] = [];
  for (const k of Object.keys(est) as (keyof Measurements)[]) {
    const v = m[k];
    if (v && v > 0) out[k] = v;
    else {
      out[k] = Math.round(est[k] * 10) / 10;
      estimated.push(k);
    }
  }
  return { values: out, estimated };
}

/** Semi-axis a of an ellipse with circumference C and b = k·a (Ramanujan, inverted). */
const ellipseA = (C: number, k: number) => C / (Math.PI * (3 * (1 + k) - Math.sqrt((3 + k) * (1 + 3 * k))));

function labelSprite(text: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(6,17,28,0.88)";
  g.beginPath();
  g.roundRect(4, 8, 248, 48, 12);
  g.fill();
  g.strokeStyle = "rgba(232,57,75,0.95)";
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = "#fff";
  g.font = "600 26px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(0.3, 0.075, 1);
  sp.renderOrder = 20;
  return sp;
}

/**
 * Muscle material with procedural fibre striations along `axis` (world space).
 * Height field h = striation pattern; the normal is bump-perturbed from screen-space
 * derivatives of h (same method as three.js perturbNormalArb).
 */
function fibreMaterial(axis: THREE.Vector3) {
  const mat = new THREE.MeshPhysicalMaterial({ color: MUSCLE, roughness: 0.48, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color(0xff8a7a), sheenRoughness: 0.5 });
  const u = new THREE.Vector3(0, 1, 0);
  if (Math.abs(u.dot(axis)) > 0.9) u.set(1, 0, 0);
  const p1 = new THREE.Vector3().crossVectors(axis, u).normalize();
  const p2 = new THREE.Vector3().crossVectors(axis, p1).normalize();
  const uniforms = { uP1: { value: p1 }, uP2: { value: p2 }, uAxis: { value: axis.clone() } };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFibreW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvFibreW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vFibreW;
uniform vec3 uP1; uniform vec3 uP2; uniform vec3 uAxis;
float fibreH(vec3 w) {
  // Fine fibres plus coarser fascicle bundles, both running along uAxis.
  float wob = sin(dot(w, uAxis) * 23.0) * 0.6;
  float fine = 0.5 + 0.5 * sin(dot(w, uP1) * 700.0 + wob);
  float bundle = 0.5 + 0.5 * sin(dot(w, uP2) * 260.0 + wob * 2.0);
  return fine * 0.55 + bundle * 0.45;
}`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
{
  float h = fibreH(vFibreW);
  // Fade the pattern out where it would alias (far away or at grazing angles).
  float fade = clamp(1.6 - fwidth(dot(vFibreW, uP1) * 700.0), 0.0, 1.0) * clamp(abs(dot(normal, vec3(0.0, 0.0, 1.0))) * 1.6, 0.0, 1.0);
  vec3 sx = dFdx(-vViewPosition); vec3 sy = dFdy(-vViewPosition);
  float dhx = dFdx(h) * 0.006 * fade; float dhy = dFdy(h) * 0.006 * fade;
  vec3 r1 = cross(sy, normal); vec3 r2 = cross(normal, sx);
  float det = dot(sx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  normal = normalize(abs(det) * normal - grad);
  diffuseColor.rgb *= mix(1.0, 0.86 + 0.2 * h, fade);
}`,
      );
  };
  mat.customProgramCacheKey = () => "fibre";
  return mat;
}

/** Principal axis of a geometry's vertices in world space (power iteration on the covariance). */
function principalAxis(mesh: THREE.Mesh) {
  const pos = mesh.geometry.getAttribute("position");
  const v = new THREE.Vector3();
  const mean = new THREE.Vector3();
  const step = Math.max(1, Math.floor(pos.count / 400));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i += step) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    pts.push(v.clone());
    mean.add(v);
  }
  mean.divideScalar(pts.length);
  const c = [0, 0, 0, 0, 0, 0]; // xx xy xz yy yz zz
  for (const p of pts) {
    const x = p.x - mean.x, y = p.y - mean.y, z = p.z - mean.z;
    c[0] += x * x; c[1] += x * y; c[2] += x * z; c[3] += y * y; c[4] += y * z; c[5] += z * z;
  }
  let a = new THREE.Vector3(0.3, 1, 0.2).normalize();
  for (let k = 0; k < 24; k++) {
    a = new THREE.Vector3(c[0] * a.x + c[1] * a.y + c[2] * a.z, c[1] * a.x + c[3] * a.y + c[4] * a.z, c[2] * a.x + c[4] * a.y + c[5] * a.z).normalize();
  }
  return a;
}

/**
 * Gym shorts fitted to the reference body: elliptical rings sampled from the skin's own
 * cross-sections (pelvis, then each thigh), inflated slightly so they sit on the skin.
 */
function buildShorts(skin: THREE.Mesh[], H: number) {
  const pts: THREE.Vector3[] = [];
  const v = new THREE.Vector3();
  for (const m of skin) {
    const pos = m.geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      if (v.y > 0.36 * H && v.y < 0.6 * H) pts.push(v.clone());
    }
  }
  type Ring = { cx: number; cz: number; a: number; b: number };
  /** Split a horizontal slice into separate limbs/trunk by gaps along x. */
  const clusters = (y0: number, y1: number) => {
    const s = pts.filter((p) => p.y >= y0 && p.y < y1).sort((p, q) => p.x - q.x);
    const out: THREE.Vector3[][] = [];
    for (const p of s) {
      const last = out[out.length - 1];
      if (last && p.x - last[last.length - 1].x < 0.02) last.push(p);
      else out.push([p]);
    }
    return out.filter((c) => c.length > 8);
  };
  const ring = (c: THREE.Vector3[]): Ring => {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of c) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, a: ((maxX - minX) / 2) * 1.045, b: ((maxZ - minZ) / 2) * 1.07 };
  };
  const step = 0.01 * H;
  // Hip half-width from the trunk cluster at hip level (the arms are separate clusters there).
  const hipC = clusters(0.525 * H, 0.535 * H).find((c) => c[0].x < 0 && c[c.length - 1].x > 0);
  const hipHalf = hipC ? Math.max(-hipC[0].x, hipC[hipC.length - 1].x) * 1.12 : 0.18;
  const within = (y0: number, y1: number, pred: (p: THREE.Vector3) => boolean) => pts.filter((p) => p.y >= y0 && p.y < y1 && Math.abs(p.x) <= hipHalf && pred(p));
  const SEG = 48;
  const positions: number[] = [];
  const index: number[] = [];
  const tube = (rows: { y: number; r: Ring }[]) => {
    if (rows.length < 2) return;
    const start = positions.length / 3;
    for (const { y, r } of rows) for (let k = 0; k < SEG; k++) {
      // Squircle (|x/a|^3.5 + |z/b|^3.5 = 1): body cross-sections are closer to rounded rectangles.
      const t = (k / SEG) * Math.PI * 2;
      const c = Math.cos(t), sn = Math.sin(t);
      positions.push(r.cx + Math.sign(c) * Math.abs(c) ** (2 / 3.5) * r.a, y, r.cz + Math.sign(sn) * Math.abs(sn) ** (2 / 3.5) * r.b);
    }
    for (let l = 0; l < rows.length - 1; l++) for (let k = 0; k < SEG; k++) {
      const a = start + l * SEG + k, b = start + l * SEG + ((k + 1) % SEG), c = a + SEG, d = b + SEG;
      index.push(a, c, b, b, c, d);
    }
  };
  const rows = (y0: number, y1: number, pred: (p: THREE.Vector3) => boolean) => {
    const out: { y: number; r: Ring }[] = [];
    for (let y = y0; y <= y1 + 1e-6; y += step) {
      const c = within(y - step / 2, y + step / 2, pred);
      if (c.length > 8) out.push({ y, r: ring(c) });
    }
    return out;
  };
  tube(rows(0.43 * H, 0.565 * H, () => true)); // waistband down past the crotch (board-short cut)
  tube(rows(0.395 * H, 0.445 * H, (p) => p.x < -0.004)); // right leg
  tube(rows(0.395 * H, 0.445 * H, (p) => p.x > 0.004)); // left leg
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x0b2f4d, roughness: 0.85, side: THREE.DoubleSide }));
  mesh.renderOrder = 6;
  return mesh;
}

type Stage = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  root: THREE.Group;
  muscles: THREE.Mesh[];
  bones?: THREE.Object3D;
  skin: THREE.Mesh[];
  shorts?: THREE.Mesh;
  skinMat: THREE.MeshPhysicalMaterial;
  boneMat: THREE.MeshStandardMaterial;
  rings: THREE.Group;
  anchors: { arm: THREE.Vector3; thigh: THREE.Vector3; calf: THREE.Vector3; H: number } | null;
  onSelect: (p: BodyPick) => void;
  hover: THREE.Mesh | null;
};

const meta = (o: THREE.Object3D) => (o.userData ?? {}) as { group?: string; label?: string; side?: string };

function applyView(s: Stage, view: BodyView, highlight: Set<string>, selected: BodyPick) {
  const skinVisible = view === "skin" || view === "xray";
  for (const m of s.skin) m.visible = skinVisible;
  if (s.shorts) s.shorts.visible = view === "skin";
  {
    s.skinMat.opacity = view === "skin" ? 1 : 0.2;
    s.skinMat.transparent = view !== "skin";
    s.skinMat.depthWrite = view === "skin";
  }
  if (s.bones) s.bones.visible = view !== "skin";
  s.boneMat.opacity = view === "skeleton" ? 1 : 0.9;
  for (const mesh of s.muscles) {
    mesh.visible = view === "muscles" || view === "xray";
    const d = meta(mesh);
    const mat = mesh.material as THREE.MeshPhysicalMaterial;
    const sel = !!selected && selected.label === d.label && selected.side === d.side;
    const on = highlight.has(d.group ?? "");
    const hov = s.hover === mesh;
    mat.color.set(sel ? SKY : on ? 0xd33b3b : MUSCLE);
    mat.emissive.set(sel ? 0x0f3550 : on ? 0x4a0a10 : hov ? 0x2a0a08 : 0x000000);
  }
}

function placeRings(s: Stage, m: Required<Measurements>) {
  for (const c of [...s.rings.children]) {
    s.rings.remove(c);
    const mesh = c as THREE.Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material as THREE.SpriteMaterial | undefined;
    mat?.map?.dispose();
    mat?.dispose();
  }
  const a = s.anchors;
  if (!a) return;
  const H = a.H;
  const cm = (v: number) => v / 100;
  const depth = 0.72;
  const ring = (C: number, at: THREE.Vector3, text: string, ellipse: boolean, side: number) => {
    const r = ellipse ? ellipseA(cm(C), depth) : cm(C) / (2 * Math.PI);
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0032, 8, 72), new THREE.MeshBasicMaterial({ color: BRAND, depthTest: false, transparent: true, opacity: 0.95 }));
    t.renderOrder = 15;
    t.rotation.x = Math.PI / 2;
    if (ellipse) t.scale.y = depth;
    t.position.copy(at);
    s.rings.add(t);
    const sp = labelSprite(text);
    sp.position.copy(at).add(new THREE.Vector3(side * (r + 0.19), 0, 0));
    s.rings.add(sp);
  };
  ring(m.neck, new THREE.Vector3(0, 0.845 * H, 0.0), `Neck ${m.neck} cm`, false, -1);
  ring(m.chest, new THREE.Vector3(0, 0.725 * H, 0.0), `Chest ${m.chest} cm`, true, -1);
  ring(m.waist, new THREE.Vector3(0, 0.6 * H, 0.0), `Waist ${m.waist} cm`, true, 1);
  ring(m.hip, new THREE.Vector3(0, 0.515 * H, -0.01), `Hip ${m.hip} cm`, true, -1);
  ring(m.arm, a.arm, `Arm ${m.arm} cm`, false, 1);
  ring(m.thigh, a.thigh, `Thigh ${m.thigh} cm`, false, -1);
  ring(m.calf, a.calf, `Calf ${m.calf} cm`, false, 1);
}

export function Body3D({ ref, ...props }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const state = useRef<Stage | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const s = state.current;
      if (!s) return null;
      s.renderer.render(s.scene, s.camera);
      return s.renderer.domElement.toDataURL("image/png");
    },
  }));

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let disposed = false;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.02, 30);
    camera.position.set(0.6, 1.15, 3.9);
    scene.add(new THREE.HemisphereLight(0xe8eef6, 0x1a0f0f, 1.2));
    const key = new THREE.DirectionalLight(0xfff4ea, 2.6);
    key.position.set(1.8, 3, 2.6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fc4ff, 0.9);
    fill.position.set(-2.5, 1.5, 1.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(BRAND, 2.2);
    rim.position.set(-1.5, 2, -3);
    scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.6, 64), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.1 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.6;
    controls.maxDistance = 6;
    controls.target.set(0, 0.95, 0);
    controls.screenSpacePanning = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.6;
    controls.addEventListener("start", () => (controls.autoRotate = false));

    const root = new THREE.Group();
    scene.add(root);
    const rings = new THREE.Group();
    root.add(rings);
    const skinMat = new THREE.MeshPhysicalMaterial({ color: 0xc99a7e, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffd2bf), clearcoat: 0.15, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.FrontSide });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xe9e0cc, roughness: 0.65, transparent: true, opacity: 0.9 });
    const stage: Stage = { renderer, scene, camera, controls, root, muscles: [], skin: [], skinMat, boneMat, rings, anchors: null, onSelect: () => {}, hover: null };
    state.current = stage;

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Load the three anatomy layers.
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const load = (url: string) => loader.loadAsync(url).then((g) => g.scene);
    Promise.all([load("/anatomy/muscles.glb"), load("/anatomy/bones.glb"), load("/anatomy/skin.glb")])
      .then(([muscles, bones, skin]) => {
        if (disposed) return;
        for (const g of [muscles, bones, skin]) {
          root.add(g);
          g.updateMatrixWorld(true);
        }
        muscles.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.computeVertexNormals();
          // GLTFLoader puts glTF extras on the node's userData.
          const extras = meta(mesh).group ? mesh.userData : meta(mesh.parent ?? mesh);
          mesh.userData = { ...extras };
          mesh.material = fibreMaterial(principalAxis(mesh));
          stage.muscles.push(mesh);
        });
        bones.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.computeVertexNormals();
          mesh.material = boneMat;
        });
        stage.bones = bones;
        skin.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.computeVertexNormals();
          mesh.material = skinMat;
          mesh.renderOrder = 5;
          stage.skin.push(mesh);
        });
        // Anchors for limb rings from the actual muscle positions.
        const box = new THREE.Box3();
        const centreOf = (group: string, side: string) => {
          box.makeEmpty();
          for (const m of stage.muscles) if (meta(m).group === group && meta(m).side === side) box.expandByObject(m);
          return box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
        };
        const H = new THREE.Box3().setFromObject(skin).max.y;
        stage.shorts = buildShorts(stage.skin, H);
        root.add(stage.shorts);
        stage.anchors = { arm: centreOf("biceps", "left"), thigh: centreOf("quads", "right"), calf: centreOf("calves", "left"), H };
        stage.anchors.thigh.y = 0.42 * H;
        stage.anchors.calf.y = 0.2 * H;
        setStatus("ready");
      })
      .catch((e) => {
        console.error("[anatomy] load failed", e);
        if (!disposed) setStatus("error");
      });

    // Pointer: hover tooltip and click-to-select (ignore drags).
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const pick = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const visible = stage.muscles.filter((m) => m.visible);
      return (ray.intersectObjects(visible, false)[0]?.object as THREE.Mesh | undefined) ?? null;
    };
    const onMove = (e: PointerEvent) => {
      if (e.buttons) return;
      const hit = pick(e);
      if (hit !== stage.hover) {
        stage.hover = hit;
        const d = hit ? meta(hit) : null;
        setHoverLabel(d ? `${d.label}${d.side ? ` (${d.side})` : ""}` : null);
      }
    };
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const hit = pick(e);
      const d = hit ? meta(hit) : null;
      stage.onSelect(d?.label ? { group: d.group ?? "", label: d.label, side: d.side ?? "" } : null);
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) {
          (x as THREE.SpriteMaterial).map?.dispose();
          x.dispose();
        }
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
      state.current = null;
    };
  }, []);

  const { onSelect } = props;
  useEffect(() => {
    if (state.current) setStage(state.current, "onSelect", onSelect);
  }, [onSelect]);

  const { view, rings, highlight, selected, m } = props;
  const hKey = highlight.join(",");
  const mKey = JSON.stringify(m);
  const selKey = selected ? `${selected.label}|${selected.side}` : "";
  useEffect(() => {
    const s = state.current;
    if (!s || status !== "ready") return;
    applyView(s, view, new Set(hKey ? hKey.split(",") : []), selKey ? { group: "", label: selKey.split("|")[0], side: selKey.split("|")[1] } : null);
  }, [view, hKey, selKey, status, hoverLabel]);
  useEffect(() => {
    const s = state.current;
    if (!s || status !== "ready") return;
    placeRings(s, JSON.parse(mKey));
    setVisible(s.rings, rings);
  }, [mKey, rings, status]);

  return (
    <div className="relative h-full w-full">
      <div ref={mount} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" aria-label="Interactive 3D anatomy — drag to rotate, scroll to zoom, click a muscle" role="img" />
      {status === "loading" && <p className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-white/50">Loading 3D anatomy (≈3.4 MB)…</p>}
      {status === "error" && <p className="absolute inset-0 grid place-items-center px-6 text-center text-xs text-amber-300">The 3D anatomy could not load. Check the connection and reload.</p>}
      {hoverLabel && <p className="pointer-events-none absolute left-3 top-14 rounded-lg bg-black/70 px-2 py-1 text-[11px] text-white ring-1 ring-white/10">{hoverLabel}</p>}
      {props.sex === "female" && status === "ready" && (
        <p className="pointer-events-none absolute bottom-6 left-2 max-w-[70%] rounded-lg bg-black/60 px-2 py-1 text-[10px] leading-snug text-white/70 ring-1 ring-white/10">
          Reference anatomy (male scan). Muscle names, positions and fibre directions are the same in women; tape rings use her measurements.
        </p>
      )}
      <p className="pointer-events-none absolute bottom-1.5 right-2 text-[9px] text-white/35">
        Anatomy: Z-Anatomy / BodyParts3D © DBCLS · CC BY-SA 4.0
      </p>
    </div>
  );
}

// Small mutation helpers kept outside the component (React compiler lint rules).
function setStage<K extends keyof Stage>(s: Stage, k: K, v: Stage[K]) {
  s[k] = v;
}
function setVisible(o: THREE.Object3D, v: boolean) {
  o.visible = v;
}
