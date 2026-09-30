"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Hero WebGL scene: a gold/black hex dumbbell with orbiting rings and gold
// dust. Pointer tilts the scene, scroll spins the dumbbell. Rendering pauses
// when off-screen or the tab is hidden; reduced-motion renders one still frame.

function buildDumbbell(gold: THREE.Material, black: THREE.Material, chrome: THREE.Material) {
  const group = new THREE.Group();

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.3, 32), chrome);
  handle.rotation.z = Math.PI / 2;
  group.add(handle);

  // Knurled grip: thin rings along the centre of the handle.
  for (let i = -6; i <= 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 6, 24), gold);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = i * 0.07;
    group.add(ring);
  }

  for (const side of [-1, 1]) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 32), gold);
    collar.rotation.z = Math.PI / 2;
    collar.position.x = side * 0.72;
    group.add(collar);

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.62, 6), black);
    head.rotation.z = Math.PI / 2;
    head.position.x = side * 1.1;
    group.add(head);

    for (const offset of [-0.31, 0.31]) {
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.06, 6), gold);
      rim.rotation.z = Math.PI / 2;
      rim.position.x = side * 1.1 + offset;
      group.add(rim);
    }

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32), chrome);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = side * 1.44;
    group.add(cap);
  }
  return group;
}

export default function Hero3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL — the CSS backdrop behind the canvas stays visible.
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.4, small ? 8.2 : 7.2);

    const gold = new THREE.MeshPhysicalMaterial({ color: 0xd4a94a, metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    const black = new THREE.MeshPhysicalMaterial({ color: 0x0c0c10, metalness: 0.4, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xe6e6ee, metalness: 1, roughness: 0.12 });

    const rig = new THREE.Group();
    scene.add(rig);

    const dumbbell = buildDumbbell(gold, black, chrome);
    dumbbell.rotation.set(0.35, -0.5, 0.25);
    dumbbell.scale.setScalar(small ? 0.7 : 0.85);
    rig.add(dumbbell);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4a94a, transparent: true, opacity: 0.55 });
    const rings = [2.2, 2.6, 3.05].map((r, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008 + i * 0.002, 8, 160), ringMat);
      ring.rotation.set(Math.PI / 2 + (i - 1) * 0.35, (i - 1) * 0.4, 0);
      rig.add(ring);
      return ring;
    });

    // Small gold "plates" riding the rings.
    const orbiters = rings.map((ring, i) => {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 + i * 0.015), gold);
      ring.add(m);
      return { mesh: m, radius: (ring.geometry as THREE.TorusGeometry).parameters.radius, speed: 0.5 - i * 0.12, phase: i * 2 };
    });

    const count = small ? 500 : 1100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      // Keep dust behind the model so no particle sits right in front of the camera.
      positions[i * 3 + 2] = Math.min(r * Math.cos(phi) - 2, 1.5);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    // Soft round sprite so points render as glowing dots instead of squares.
    const dot = document.createElement("canvas");
    dot.width = dot.height = 32;
    const ctx = dot.getContext("2d")!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,.5)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const dotTex = new THREE.CanvasTexture(dot);
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xf2d88f, size: 0.06, map: dotTex, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    scene.add(dust);

    const key = new THREE.DirectionalLight(0xfff2d0, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rimLight = new THREE.PointLight(0xe23b3b, 30, 12);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      // Wide screens: push the model right, beside the headline.
      // Narrow screens: lift it into the empty top area above the text.
      const wide = w > 1024;
      camera.setViewOffset(w, h, wide ? -w * 0.22 : 0, wide ? 0 : h * 0.24, w, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loop();
    });
    io.observe(mount);

    const clock = new THREE.Clock();
    let raf = 0;
    const render = () => {
      const t = clock.getElapsedTime();
      const scroll = Math.min(window.scrollY / window.innerHeight, 1.5);
      dumbbell.rotation.y = -0.5 + t * 0.35 + scroll * 2.2;
      dumbbell.rotation.x = 0.35 + Math.sin(t * 0.6) * 0.12;
      dumbbell.position.y = Math.sin(t * 1.1) * 0.12 - scroll * 0.6;
      rig.rotation.y += (pointer.x * 0.35 - rig.rotation.y) * 0.05;
      rig.rotation.x += (pointer.y * 0.2 - rig.rotation.x) * 0.05;
      rings.forEach((ring, i) => (ring.rotation.z = t * (0.15 + i * 0.07) * (i % 2 ? -1 : 1)));
      orbiters.forEach((o) => {
        const a = t * o.speed + o.phase;
        o.mesh.position.set(Math.cos(a) * o.radius, Math.sin(a) * o.radius, 0);
        o.mesh.rotation.x = t * 2;
      });
      dust.rotation.y = t * 0.02;
      renderer.render(scene, camera);
    };
    const loop = () => {
      cancelAnimationFrame(raf);
      if (!visible || document.hidden) return;
      render();
      raf = requestAnimationFrame(loop);
    };
    const onVisibility = () => !document.hidden && loop();
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) render();
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) obj.geometry.dispose();
      });
      [gold, black, chrome, ringMat, dust.material as THREE.Material].forEach((m) => m.dispose());
      envTex.dispose();
      dotTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}
