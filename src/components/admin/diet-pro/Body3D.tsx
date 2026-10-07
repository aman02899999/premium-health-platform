"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Muscle } from "@/lib/fitness/exercises";
import type { Measurements, Sex } from "@/lib/diet-pro/types";

/**
 * Interactive 3D body map. Segment lengths follow Drillis & Contini (1966) proportions of
 * stature; every limb and the torso are sized from the client's measured circumferences
 * (radius = C / 2π; torso treated as an ellipse). The inner "lean" layer is illustrative:
 * its radius is scaled by √(1 − body-fat %). Muscle groups are clickable.
 */

export type Body3DHandle = { snapshot: () => string | null };
export type BodyView = "skin" | "anatomy";

type Props = {
  sex: Sex;
  heightCm: number;
  weightKg: number;
  bodyFat: number;
  m: Measurements;
  highlight: Muscle[];
  selected: Muscle | null;
  view: BodyView;
  rings: boolean;
  onSelect: (m: Muscle | null) => void;
  ref?: Ref<Body3DHandle>;
};

const BRAND = 0xe8394b;
const NAVY = 0x04466d;

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

/** Semi-axis a of an ellipse with circumference C and b = k·a (Ramanujan's approximation, inverted). */
function ellipseA(C: number, k: number) {
  const per = Math.PI * (3 * (1 + k) - Math.sqrt((3 + k) * (1 + 3 * k)));
  return C / per;
}

function labelSprite(text: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(6,17,28,0.85)";
  g.beginPath();
  g.roundRect(4, 8, 248, 48, 12);
  g.fill();
  g.strokeStyle = "rgba(232,57,75,0.9)";
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
  sp.scale.set(0.36, 0.09, 1);
  sp.renderOrder = 10;
  return sp;
}

function buildBody(p: Omit<Props, "onSelect" | "ref" | "selected" | "highlight" | "view" | "rings">) {
  const H = p.heightCm / 100; // metres
  const cm = (v: number) => v / 100;
  const { values: M } = filledMeasurements(p.sex, p.heightCm, p.weightKg, p.m);
  const lean = Math.sqrt(Math.max(0.3, 1 - p.bodyFat / 100));
  const male = p.sex === "male";

  // Landmark heights (fraction of stature, Drillis & Contini).
  const y = {
    top: H,
    chin: 0.87 * H,
    neck: 0.85 * H,
    shoulder: 0.818 * H,
    chest: 0.72 * H,
    waist: 0.6 * H,
    hip: 0.53 * H,
    crotch: 0.48 * H,
    knee: 0.285 * H,
    ankle: 0.039 * H,
  };
  const depth = 0.72; // torso depth/width ratio
  const torsoA = (C: number) => ellipseA(cm(C), depth);
  const shoulderHalf = (male ? 0.259 : 0.245) * H * 0.5;

  const skinGroup = new THREE.Group();
  const leanGroup = new THREE.Group();
  const muscles = new THREE.Group();
  const rings = new THREE.Group();

  const skinMat = new THREE.MeshPhysicalMaterial({ color: 0xc89878, roughness: 0.55, clearcoat: 0.25, sheen: 0.4, transparent: true, opacity: 1 });
  const leanMat = new THREE.MeshStandardMaterial({ color: 0x23384d, roughness: 0.7, transparent: true, opacity: 0.9 });

  // Torso: lathe through neck → shoulders → chest → waist → hip → crotch, then squashed front-to-back.
  const profile = [
    [cm(M.neck) / (2 * Math.PI), y.chin],
    [cm(M.neck) / (2 * Math.PI), y.neck],
    [shoulderHalf * 0.92, y.shoulder - 0.01 * H],
    [torsoA(M.chest), y.chest],
    [(torsoA(M.chest) + torsoA(M.waist)) / 2, (y.chest + y.waist) / 2],
    [torsoA(M.waist), y.waist],
    [torsoA(M.hip), y.hip],
    [torsoA(M.hip) * 0.92, y.crotch],
    [0.0001, y.crotch - 0.01 * H],
  ].map(([r, yy]) => new THREE.Vector2(r, yy));
  const torsoGeo = new THREE.LatheGeometry(profile, 48);
  const torso = new THREE.Mesh(torsoGeo, skinMat);
  torso.scale.z = depth;
  skinGroup.add(torso);
  const torsoLean = new THREE.Mesh(torsoGeo, leanMat);
  torsoLean.scale.set(lean, 1, depth * lean);
  leanGroup.add(torsoLean);

  // Head.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065 * H, 32, 24), skinMat);
  head.scale.set(0.85, 1.05, 0.95);
  head.position.y = H - 0.065 * H;
  skinGroup.add(head);

  const limb = (r1: number, r2: number, from: THREE.Vector3, to: THREE.Vector3, group: THREE.Group, mat: THREE.Material, k = 1) => {
    const len = from.distanceTo(to);
    const g = new THREE.CylinderGeometry(r1 * k, r2 * k, len, 28, 1, false);
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    group.add(mesh);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(r2 * k, 20, 14), mat);
    cap.position.copy(to);
    group.add(cap);
    return mesh;
  };

  const R = (C: number) => cm(C) / (2 * Math.PI);
  const joints: Record<string, THREE.Vector3> = {};
  for (const side of [-1, 1]) {
    const sh = new THREE.Vector3(side * shoulderHalf, y.shoulder - 0.02 * H, 0);
    const elbow = new THREE.Vector3(side * (shoulderHalf + 0.03 * H), y.shoulder - 0.186 * H, -0.01 * H);
    const wrist = new THREE.Vector3(side * (shoulderHalf + 0.045 * H), y.shoulder - 0.332 * H, 0.02 * H);
    const hand = new THREE.Vector3(side * (shoulderHalf + 0.05 * H), y.shoulder - 0.42 * H, 0.025 * H);
    const hipJ = new THREE.Vector3(side * 0.095 * H * (male ? 0.95 : 1.05), y.hip - 0.02 * H, 0);
    const knee = new THREE.Vector3(side * 0.07 * H, y.knee, 0.005 * H);
    const ankle = new THREE.Vector3(side * 0.065 * H, y.ankle + 0.02 * H, -0.005 * H);
    const toe = new THREE.Vector3(side * 0.07 * H, 0.012 * H, 0.09 * H);
    Object.assign(joints, { [`sh${side}`]: sh, [`el${side}`]: elbow, [`hip${side}`]: hipJ, [`kn${side}`]: knee });

    for (const [group, mat, k] of [[skinGroup, skinMat, 1], [leanGroup, leanMat, lean]] as const) {
      limb(R(M.arm), R(M.forearm) * 0.95, sh, elbow, group, mat, k);
      limb(R(M.forearm), R(M.wrist), elbow, wrist, group, mat, k);
      limb(R(M.wrist), R(M.wrist) * 0.8, wrist, hand, group, mat, k);
      limb(R(M.thigh), (R(M.thigh) + R(M.calf)) * 0.42, hipJ, knee, group, mat, k);
      limb(R(M.calf) * 0.95, R(M.calf) * 0.55, knee, ankle, group, mat, k);
      limb(R(M.calf) * 0.5, R(M.calf) * 0.35, ankle, toe, group, mat, k);
    }
    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(R(M.arm) * 1.15, 24, 16), skinMat);
    shoulderCap.position.copy(sh);
    skinGroup.add(shoulderCap);
  }

  // Muscle groups: ellipsoids on the lean layer, tagged for picking.
  const addMuscle = (id: Muscle, pos: THREE.Vector3, scale: [number, number, number], rotZ = 0) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), new THREE.MeshStandardMaterial({ color: 0xa8443c, roughness: 0.45, metalness: 0.05, emissive: 0x000000 }));
    mesh.position.copy(pos);
    mesh.scale.set(...scale);
    mesh.rotation.z = rotZ;
    mesh.userData.muscle = id;
    muscles.add(mesh);
  };
  const chestA = torsoA(M.chest) * lean;
  const waistA = torsoA(M.waist) * lean;
  const hipA = torsoA(M.hip) * lean;
  for (const side of [-1, 1]) {
    addMuscle("chest", new THREE.Vector3(side * chestA * 0.42, y.chest + 0.035 * H, chestA * depth * 0.72), [chestA * 0.42, 0.045 * H, chestA * depth * 0.32]);
    addMuscle("shoulders", joints[`sh${side}`].clone().add(new THREE.Vector3(side * 0.01 * H, 0.0, 0)), [R(M.arm) * 1.25 * lean, 0.05 * H, R(M.arm) * 1.2 * lean]);
    const arm = joints[`sh${side}`].clone().lerp(joints[`el${side}`], 0.55);
    addMuscle("biceps", arm.clone().add(new THREE.Vector3(0, 0, R(M.arm) * 0.45 * lean)), [R(M.arm) * 0.6 * lean, 0.06 * H, R(M.arm) * 0.55 * lean]);
    addMuscle("triceps", arm.clone().add(new THREE.Vector3(0, 0, -R(M.arm) * 0.45 * lean)), [R(M.arm) * 0.62 * lean, 0.065 * H, R(M.arm) * 0.55 * lean]);
    addMuscle("back", new THREE.Vector3(side * chestA * 0.5, (y.chest + y.waist) / 2 + 0.03 * H, -chestA * depth * 0.62), [chestA * 0.42, 0.09 * H, chestA * depth * 0.32], side * 0.18);
    addMuscle("glutes", new THREE.Vector3(side * hipA * 0.45, y.hip - 0.015 * H, -hipA * depth * 0.62), [hipA * 0.45, 0.055 * H, hipA * depth * 0.42]);
    const thigh = joints[`hip${side}`].clone().lerp(joints[`kn${side}`], 0.45);
    addMuscle("quads", thigh.clone().add(new THREE.Vector3(0, 0, R(M.thigh) * 0.38 * lean)), [R(M.thigh) * 0.72 * lean, 0.1 * H, R(M.thigh) * 0.62 * lean]);
    addMuscle("hamstrings", thigh.clone().add(new THREE.Vector3(0, 0, -R(M.thigh) * 0.38 * lean)), [R(M.thigh) * 0.68 * lean, 0.095 * H, R(M.thigh) * 0.58 * lean]);
    const calf = joints[`kn${side}`].clone().lerp(new THREE.Vector3(side * 0.065 * H, y.ankle, 0), 0.32);
    addMuscle("calves", calf.clone().add(new THREE.Vector3(0, 0, -R(M.calf) * 0.4 * lean)), [R(M.calf) * 0.6 * lean, 0.065 * H, R(M.calf) * 0.55 * lean]);
  }
  addMuscle("core", new THREE.Vector3(0, (y.chest + y.waist) / 2 - 0.02 * H, waistA * depth * 0.78), [waistA * 0.42, 0.1 * H, waistA * depth * 0.3]);
  addMuscle("back", new THREE.Vector3(0, y.shoulder - 0.03 * H, -chestA * depth * 0.55), [shoulderHalf * 0.7, 0.04 * H, chestA * depth * 0.3]); // traps

  // Measurement rings with labels.
  const ring = (C: number, at: THREE.Vector3, label: string, ellipse = false, labelSide = 1) => {
    const rad = ellipse ? torsoA(C) : R(C);
    const t = new THREE.Mesh(new THREE.TorusGeometry(rad * 1.04, 0.0035 * H, 8, 64), new THREE.MeshBasicMaterial({ color: BRAND }));
    t.rotation.x = Math.PI / 2;
    t.position.copy(at);
    if (ellipse) t.scale.y = depth;
    rings.add(t);
    const s = labelSprite(label);
    s.position.copy(at).add(new THREE.Vector3(labelSide * (rad + 0.2), 0, 0));
    rings.add(s);
  };
  ring(M.neck, new THREE.Vector3(0, y.neck + 0.01 * H, 0), `Neck ${M.neck} cm`, false, -1);
  ring(M.chest, new THREE.Vector3(0, y.chest, 0), `Chest ${M.chest} cm`, true, -1);
  ring(M.waist, new THREE.Vector3(0, y.waist, 0), `Waist ${M.waist} cm`, true, -1);
  ring(M.hip, new THREE.Vector3(0, y.hip, 0), `Hip ${M.hip} cm`, true, 1);
  ring(M.arm, joints["sh1"].clone().lerp(joints["el1"], 0.5), `Arm ${M.arm} cm`, false, 1);
  ring(M.thigh, joints["hip-1"].clone().lerp(joints["kn-1"], 0.3), `Thigh ${M.thigh} cm`, false, -1);
  ring(M.calf, joints["kn1"].clone().lerp(new THREE.Vector3(0.065 * H, y.ankle, 0), 0.3), `Calf ${M.calf} cm`, false, 1);

  const root = new THREE.Group();
  root.add(skinGroup, leanGroup, muscles, rings);
  root.position.y = -H / 2;
  return { root, skinMat, leanGroup, muscles, rings, H };
}

type Stage = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  body?: ReturnType<typeof buildBody>;
  onSelect: (m: Muscle | null) => void;
};

function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) {
      (x as THREE.SpriteMaterial).map?.dispose();
      x.dispose();
    }
  });
}

function swapBody(s: Stage, params: Parameters<typeof buildBody>[0]) {
  if (s.body) {
    s.scene.remove(s.body.root);
    disposeTree(s.body.root);
  }
  const body = buildBody(params);
  // Fit the body into a ~1.85-unit-tall frame regardless of stature, keeping proportions.
  body.root.scale.setScalar(1.85 / body.H);
  body.root.position.y = -0.92;
  s.scene.add(body.root);
  s.body = body;
}

function applyView(s: Stage, view: BodyView, rings: boolean, highlight: Set<string>, selected: Muscle | null) {
  const b = s.body;
  if (!b) return;
  b.skinMat.opacity = view === "skin" ? 1 : 0.16;
  b.skinMat.depthWrite = view === "skin";
  b.leanGroup.visible = view === "anatomy";
  b.muscles.visible = view === "anatomy";
  b.rings.visible = rings;
  for (const o of b.muscles.children) {
    const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
    const id = o.userData.muscle as Muscle;
    const on = highlight.has(id);
    const sel = selected === id;
    mat.color.set(sel ? 0x7cc0ee : on ? BRAND : 0x8a3b35);
    mat.emissive.set(sel ? 0x1d5f8a : on ? 0x5a0d16 : 0x000000);
  }
}

const setHandler = (s: Stage, fn: Stage["onSelect"]) => {
  s.onSelect = fn;
};

export function Body3D({ ref, ...props }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const state = useRef<Stage | null>(null);
  const { onSelect } = props;

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const s = state.current;
      if (!s) return null;
      s.renderer.render(s.scene, s.camera);
      return s.renderer.domElement.toDataURL("image/png");
    },
  }));

  // Renderer, camera, lights, controls: once.
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
    camera.position.set(0.9, 0.25, 3.6);
    scene.add(new THREE.HemisphereLight(0xdfe9f5, 0x0a1a2a, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(2, 3, 3);
    scene.add(key);
    const rimR = new THREE.DirectionalLight(BRAND, 2.2);
    rimR.position.set(-3, 1.5, -2);
    scene.add(rimR);
    const rimB = new THREE.DirectionalLight(NAVY, 2.5);
    rimB.position.set(3, -1, -3);
    scene.add(rimB);
    // Floor disc.
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.75, 64), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.92;
    scene.add(floor);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 6;
    controls.target.set(0, 0, 0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.8;
    controls.addEventListener("start", () => (controls.autoRotate = false));
    state.current = { renderer, scene, camera, controls, onSelect: () => {} };

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

    // Click to pick a muscle (ignore drags).
    const ray = new THREE.Raycaster();
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const body = state.current?.body;
      if (!body) return;
      const hit = ray.intersectObjects(body.muscles.children, false)[0];
      state.current?.onSelect((hit?.object.userData.muscle as Muscle) ?? null);
    };
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
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      disposeTree(scene);
      renderer.dispose();
      el.removeChild(renderer.domElement);
      state.current = null;
    };
  }, []);

  // After the stage exists (effects run in order), keep the click handler current.
  useEffect(() => {
    if (state.current) setHandler(state.current, onSelect);
  }, [onSelect]);

  // Rebuild the body when the client's numbers change.
  const { sex, heightCm, weightKg, bodyFat, m } = props;
  const mKey = JSON.stringify(m);
  useEffect(() => {
    if (state.current) swapBody(state.current, { sex, heightCm: Math.min(230, Math.max(120, heightCm || 170)), weightKg: weightKg || 70, bodyFat: bodyFat || 20, m: JSON.parse(mKey) });
  }, [sex, heightCm, weightKg, bodyFat, mKey]);

  // View mode, rings, highlights: cheap updates.
  const { view, rings, highlight, selected } = props;
  const hKey = highlight.join(",");
  useEffect(() => {
    if (state.current) applyView(state.current, view, rings, new Set(hKey ? hKey.split(",") : []), selected);
  }, [view, rings, hKey, selected, sex, heightCm, weightKg, bodyFat, mKey]);

  return <div ref={mount} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" aria-label="Interactive 3D body model — drag to rotate, click a muscle" role="img" />;
}
