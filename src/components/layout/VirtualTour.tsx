"use client";

// ─── Virtual Tour (Three.js) ────────────────────────────────────────────────
// Shows the future home through the owner's eyes:
//   • INSIDE — first-person walkthrough of furnished rooms (beds, sofas,
//     kitchen, dining…) with clickable furniture that opens the store page.
//   • OUTSIDE — street view of the finished house: walls, windows, parapet
//     roof, water tank, compound wall, gate, driveway, carport, lawn.
//
// Desktop: mouse-drag orbit, wheel zoom; WASD + Q/E to walk.
// Mobile:  one-finger drag, pinch zoom, on-screen D-pad for walking.

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import type { LayoutPlanGeometry, Opening, Room, Wall } from "@/lib/ai/layout/types";
import { furnishPlan, type FurnitureItem } from "@/lib/ai/layout/furniture";
import { buildSiteElements, DEFAULT_ROOF, type SiteElement } from "@/lib/ai/layout/exterior";

interface VirtualTourProps {
  geometry: LayoutPlanGeometry;
  scaleFeetPerPx: number;
  floorLabel?: string;
  className?: string;
}

type ViewMode = "inside" | "outside";

const FLOOR_COLORS = [0xd8cfc4, 0xcfd8d4, 0xd9d2c0, 0xd4cdd8, 0xc9d6d9, 0xdcd0c6];

export function VirtualTour({ geometry, scaleFeetPerPx, floorLabel, className }: VirtualTourProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const walkRef = useRef<{ pos: THREE.Vector3; yaw: number }>({ pos: new THREE.Vector3(), yaw: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const rafRef = useRef<number>(0);
  const modeRef = useRef<"orbit" | "walk">("orbit");
  const exitWalkRef = useRef<() => void>(() => {});
  const viewRef = useRef<ViewMode>("inside");
  const pickablesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());

  const [view, setView] = useState<ViewMode>("inside");
  const [mode, setMode] = useState<"orbit" | "walk">("orbit");
  const [hint, setHint] = useState<string | null>(null);
  const [selected, setSelected] = useState<FurnitureItem | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [isTouch] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  );

  const rooms = useMemo(() => geometry.rooms ?? [], [geometry]);
  const walls = useMemo(() => geometry.walls ?? [], [geometry]);
  const openings = useMemo(() => geometry.openings ?? [], [geometry]);

  // Plan spans SPAN feet horizontally.
  const SPAN = scaleFeetPerPx > 0 ? Math.max(30, Math.min(120, 1024 * scaleFeetPerPx)) : 45;
  const planAspect = 0.75; // image aspect fallback used by furniture/site math

  // Normalized plan coords → world feet, centered at house center.
  const toWorld = useCallback(
    (x: number, y: number): [number, number] => [(x - 0.5) * SPAN, (y - 0.5) * SPAN * planAspect],
    [SPAN, planAspect]
  );

  const furniture = useMemo(
    () => furnishPlan(rooms, planAspect, SPAN),
    [rooms, planAspect, SPAN]
  );
  const site = useMemo(
    () => buildSiteElements(rooms, SPAN, planAspect),
    [rooms, SPAN, planAspect]
  );

  // ─── Scene build (rebuilt on view / geometry / restart) ───────────────────
  /* eslint-disable react-hooks/immutability -- imperative Three.js scene construction; no React state is touched */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || rooms.length === 0) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: !coarse });
    renderer.setPixelRatio(Math.min(coarse ? 1.75 : 2, window.devicePixelRatio));
    renderer.setSize(mount.clientWidth, Math.max(340, mount.clientHeight));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(viewRef.current === "inside" ? 0x0f172a : 0x87b5d4);
    scene.fog = new THREE.Fog(scene.background as THREE.Color, viewRef.current === "inside" ? 60 : 150, viewRef.current === "inside" ? 220 : 420);

    const camera = new THREE.PerspectiveCamera(
      viewRef.current === "inside" ? 72 : 55,
      mount.clientWidth / Math.max(340, mount.clientHeight),
      0.1,
      600
    );

    // ─── Lighting ─────────────────────────────────────────────────────────
    const hemi = new THREE.HemisphereLight(0xffffff, 0x334155, 1.05);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2dd, 2.4);
    sun.position.set(45, 70, 35);
    sun.castShadow = true;
    const sh = coarse ? 1024 : 2048;
    sun.shadow.mapSize.set(sh, sh);
    sun.shadow.camera.left = -110;
    sun.shadow.camera.right = 110;
    sun.shadow.camera.top = 110;
    sun.shadow.camera.bottom = -110;
    sun.shadow.camera.far = 260;
    scene.add(sun);

    // ─── Ground ───────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ color: viewRef.current === "inside" ? 0x1e293b : 0x6f9e63, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    scene.add(ground);

    const house = new THREE.Group();
    scene.add(house);

    const mesh = (
      geo: THREE.BufferGeometry,
      color: number,
      opts: { x: number; y: number; z: number; ry?: number; rough?: number; metal?: number; op?: number } 
    ) => {
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color,
          roughness: opts.rough ?? 0.85,
          metalness: opts.metal ?? 0,
          transparent: opts.op !== undefined && opts.op < 1,
          opacity: opts.op ?? 1,
        })
      );
      m.position.set(opts.x, opts.y, opts.z);
      if (opts.ry) m.rotation.y = opts.ry;
      m.castShadow = true;
      m.receiveShadow = true;
      house.add(m);
      return m;
    };

    const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

    // ─── Floors ───────────────────────────────────────────────────────────
    const shapeFrom = (poly: { x: number; y: number }[]) => {
      const s = new THREE.Shape();
      poly.forEach((p, i) => {
        const [wx, wz] = toWorld(p.x, p.y);
        if (i === 0) s.moveTo(wx, wz);
        else s.lineTo(wx, wz);
      });
      s.closePath();
      return s;
    };
    rooms.forEach((room, i) => {
      const floor = new THREE.Mesh(
        new THREE.ShapeGeometry(shapeFrom(room.polygon)),
        new THREE.MeshStandardMaterial({ color: FLOOR_COLORS[i % FLOOR_COLORS.length], roughness: 0.8 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.02;
      floor.receiveShadow = true;
      house.add(floor);
    });

    // ─── Walls with door/window openings ──────────────────────────────────
    const wallMatColor = 0xe9e4db;
    for (const wall of walls) {
      const [ax, az] = toWorld(wall.a.x, wall.a.y);
      const [bx, bz] = toWorld(wall.b.x, wall.b.y);
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 0.5) continue;
      const hFt = wall.heightFt || DEFAULT_ROOF.heightFt;
      const tFt = wall.thicknessFt || 0.4;
      const angle = Math.atan2(bz - az, bx - ax);

      for (const seg of splitWallForOpenings(openings, len)) {
        if (seg.kind === "solid") {
          mesh(box((seg.t1 - seg.t0) * len, hFt, tFt), wallMatColor, { x: ax + Math.cos(angle) * ((seg.t0 + seg.t1) / 2) * len, y: hFt / 2, z: az + Math.sin(angle) * ((seg.t0 + seg.t1) / 2) * len, ry: -angle });
        } else if (seg.kind === "door") {
          const head = Math.min(hFt - 0.5, seg.opening?.headFt ?? 7);
          mesh(box((seg.t1 - seg.t0) * len, hFt - head, tFt), wallMatColor, { x: ax + Math.cos(angle) * ((seg.t0 + seg.t1) / 2) * len, y: head + (hFt - head) / 2, z: az + Math.sin(angle) * ((seg.t0 + seg.t1) / 2) * len, ry: -angle });
        } else {
          const sill = seg.opening?.sillFt ?? 3.5;
          const head = seg.opening?.headFt ?? 7;
          const cx2 = ax + Math.cos(angle) * ((seg.t0 + seg.t1) / 2) * len;
          const cz2 = az + Math.sin(angle) * ((seg.t0 + seg.t1) / 2) * len;
          mesh(box((seg.t1 - seg.t0) * len, sill, tFt), wallMatColor, { x: cx2, y: sill / 2, z: cz2, ry: -angle });
          mesh(box((seg.t1 - seg.t0) * len, hFt - head, tFt), wallMatColor, { x: cx2, y: head + (hFt - head) / 2, z: cz2, ry: -angle });
          mesh(box((seg.t1 - seg.t0) * len - 0.3, head - sill - 0.3, 0.12), 0xbfe3ff, { x: cx2, y: (sill + head) / 2, z: cz2, ry: -angle, rough: 0.15, metal: 0.4, op: 0.85 });
          // frame
          mesh(box((seg.t1 - seg.t0) * len, 0.15, tFt + 0.1), 0x5f6b76, { x: cx2, y: sill + 0.07, z: cz2, ry: -angle, metal: 0.3 });
          mesh(box((seg.t1 - seg.t0) * len, 0.15, tFt + 0.1), 0x5f6b76, { x: cx2, y: head - 0.07, z: cz2, ry: -angle, metal: 0.3 });
        }
      }
    }

    // ─── Furniture (inside view; clickable) ───────────────────────────────
    const pickables: THREE.Mesh[] = [];
    if (viewRef.current === "inside") {
      for (const f of furniture) {
        const [wx, wz] = toWorld(f.x, f.y);
        const g = buildFurnitureMesh(f, wx, wz);
        house.add(g.group);
        g.pickables.forEach(p => {
          p.userData.item = f;
          pickables.push(p);
        });
        // price tag sprite (visible up close)
        const tag = makeTagSprite(`₹${f.priceInr.toLocaleString("en-IN")}`);
        tag.position.set(wx, f.h + 1.1, wz);
        tag.scale.set(6, 1.6, 1);
        tag.userData.alwaysFace = true;
        house.add(tag);
        pickables.push(tag as unknown as THREE.Mesh);
        tag.userData.item = f;
      }
    }

    // ─── Roof + parapet + tank (outside view) ─────────────────────────────
    if (viewRef.current === "outside") {
      let bx0 = 1, by0 = 1, bx1 = 0, by1 = 0;
      for (const r of rooms) {
        bx0 = Math.min(bx0, ...r.polygon.map(p => p.x));
        bx1 = Math.max(bx1, ...r.polygon.map(p => p.x));
        by0 = Math.min(by0, ...r.polygon.map(p => p.y));
        by1 = Math.max(by1, ...r.polygon.map(p => p.y));
      }
      const [wx0, wz0] = toWorld(bx0, by0);
      const [wx1, wz1] = toWorld(bx1, by1);
      const HW = Math.abs(wx1 - wx0);
      const HD = Math.abs(wz1 - wz0);
      const cx = (wx0 + wx1) / 2;
      const cz = (wz0 + wz1) / 2;
      const wallTop = DEFAULT_ROOF.heightFt;
      const ov = DEFAULT_ROOF.overhangFt;

      // slab
      mesh(box(HW + ov * 2, 0.6, HD + ov * 2), 0xcfc9bf, { x: cx, y: wallTop + 0.3, z: cz });
      // parapet
      const ph = DEFAULT_ROOF.parapetFt;
      mesh(box(HW + ov * 2, ph, 0.35), 0xd8d2c8, { x: cx, y: wallTop + 0.6 + ph / 2, z: wz0 - ov + 0.175 });
      mesh(box(HW + ov * 2, ph, 0.35), 0xd8d2c8, { x: cx, y: wallTop + 0.6 + ph / 2, z: wz1 + ov - 0.175 });
      mesh(box(0.35, ph, HD + ov * 2), 0xd8d2c8, { x: wx0 - ov + 0.175, y: wallTop + 0.6 + ph / 2, z: cz });
      mesh(box(0.35, ph, HD + ov * 2), 0xd8d2c8, { x: wx1 + ov - 0.175, y: wallTop + 0.6 + ph / 2, z: cz });

      // staircase headroom block + overhead tank
      mesh(box(8, 7.5, 6), 0xded8cd, { x: cx + HW / 4, y: wallTop + 4.35, z: cz + HD / 5 });
      const tank = mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 20), 0x3d6fb0, { x: cx - HW / 4, y: wallTop + 5.6, z: cz - HD / 5, rough: 0.5 });
      tank.name = "waterTank";

      // name plate near entrance
      const plate = makeTextPlate(floorLabel || "My Home");
      plate.position.set(cx, 8.6, wz0 - ov - 0.4);
      house.add(plate);

      // ─── Site elements: compound wall, gate, driveway, lawn ───────────
      for (const el of site as SiteElement[]) {
        const hx = cx + el.x;
        const hz = cz + el.y;
        if (el.kind === "lawn") {
          const m = mesh(box(el.w, Math.max(0.06, el.h), el.d), el.color, { x: hx, y: 0.04, z: hz, rough: 1 });
          m.castShadow = false;
          continue;
        }
        if (el.kind === "pathway" || el.kind === "driveway") {
          const m = mesh(box(el.w, Math.max(0.08, el.h), el.d), el.color, { x: hx, y: 0.05, z: hz, rough: 0.95 });
          m.castShadow = false;
          continue;
        }
        if (el.kind === "gate") {
          // two leaves with bars
          const leafW = el.w / 2;
          for (const s of [-1, 1]) {
            const frame = mesh(box(leafW, el.h, 0.15), 0x39434d, { x: hx + s * leafW / 2, y: el.h / 2, z: hz, metal: 0.6, rough: 0.4 });
            frame.name = "gate";
            for (let b = 0; b < 5; b++) {
              mesh(box(0.08, el.h - 0.5, 0.08), 0x39434d, { x: hx + s * leafW / 2 + (b - 2) * (leafW / 5), y: el.h / 2, z: hz, metal: 0.6, rough: 0.4 });
            }
          }
          continue;
        }
        if (el.kind === "carport") {
          // 4 pillars + flat canopy (open sides)
          const px = el.w / 2 - 0.5;
          const pz = el.d / 2 - 0.5;
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            mesh(box(0.7, el.h, 0.7), 0xd8d2c8, { x: hx + sx * px, y: el.h / 2, z: hz + sz * pz });
          }
          mesh(box(el.w + 1.5, 0.5, el.d + 1.5), 0x7f8b96, { x: hx, y: el.h + 0.25, z: hz, rough: 0.6, metal: 0.2 });
          continue;
        }
        mesh(box(el.w, el.h, el.d), el.color, { x: hx, y: el.h / 2, z: hz, rough: el.kind === "gatePillar" ? 0.7 : 0.9 });
      }
    }

    pickablesRef.current = pickables;

    // ─── Cameras per view ─────────────────────────────────────────────────
    let theta = viewRef.current === "outside" ? Math.PI * 0.82 : Math.PI / 4;
    let phi = viewRef.current === "outside" ? Math.PI / 3.4 : Math.PI / 3.2;
    let radius = viewRef.current === "outside" ? Math.max(80, SPAN * 2.2) : Math.max(45, SPAN * 1.15);
    const target = new THREE.Vector3(0, viewRef.current === "outside" ? 6 : 0, 0);

    const updateOrbit = () => {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.cos(theta),
        Math.max(1.5, target.y + radius * Math.cos(phi)),
        target.z + radius * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(target);
    };

    // walk spawn: center of the first room, facing the room label
    const spawnWalk = () => {
      const room = rooms[0];
      const cxp = room.polygon.reduce((s, p) => s + p.x, 0) / room.polygon.length;
      const cyp = room.polygon.reduce((s, p) => s + p.y, 0) / room.polygon.length;
      const [wx, wz] = toWorld(cxp, cyp);
      walkRef.current.pos.set(wx, 0, wz);
      walkRef.current.yaw = Math.PI;
    };
    if (modeRef.current === "walk" && viewRef.current === "inside") spawnWalk();
    else updateOrbit();

    // ─── Pointer interaction: orbit / pinch / click-pick ──────────────────
    const activePointers = new Map<number, { x: number; y: number }>();
    let pinchStart = 0;
    let pinchStartRadius = radius;
    let downAt: { x: number; y: number; t: number } | null = null;

    const pinchDist = () => {
      const p = [...activePointers.values()];
      return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    };

    const onDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { renderer.domElement.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      if (activePointers.size === 2) {
        pinchStart = pinchDist();
        pinchStartRadius = radius;
      }
    };

    const onMove = (e: PointerEvent) => {
      const prev = activePointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (modeRef.current === "walk") {
        if (activePointers.size === 1) walkRef.current.yaw -= dx * 0.006;
        return;
      }
      if (activePointers.size === 2) {
        const d = pinchDist();
        if (pinchStart > 10 && d > 10) {
          radius = Math.max(8, Math.min(420, pinchStartRadius * (pinchStart / d)));
          updateOrbit();
        }
        return;
      }
      theta -= dx * 0.006;
      phi = Math.max(0.12, Math.min(1.5, phi - dy * 0.005));
      updateOrbit();
    };

    const onUp = (e: PointerEvent) => {
      // Click (not drag) → pick furniture
      if (downAt && activePointers.size === 1) {
        const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
        const dt = performance.now() - downAt.t;
        if (moved < 6 && dt < 400) {
          const rect = renderer.domElement.getBoundingClientRect();
          const ndc = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );
          raycasterRef.current.setFromCamera(ndc, camera);
          const hits = raycasterRef.current.intersectObjects(pickablesRef.current, false);
          if (hits.length > 0) {
            const item = (hits[0].object.userData as { item?: FurnitureItem }).item;
            if (item) {
              setSelected(item);
            }
          } else {
            setSelected(null);
          }
        }
      }
      activePointers.delete(e.pointerId);
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };

    const onWheel = (e: WheelEvent) => {
      if (modeRef.current !== "orbit") return;
      radius = Math.max(8, Math.min(420, radius + e.deltaY * 0.08));
      updateOrbit();
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    // ─── Loop ─────────────────────────────────────────────────────────────
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      if (modeRef.current === "walk" && viewRef.current === "inside") {
        const speed = coarse ? 0.5 : 0.6;
        const k = keysRef.current;
        const dir = new THREE.Vector3();
        const fwd = new THREE.Vector3(Math.sin(walkRef.current.yaw), 0, Math.cos(walkRef.current.yaw));
        const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
        if (k["w"] || k["arrowup"]) dir.add(fwd);
        if (k["s"] || k["arrowdown"]) dir.sub(fwd);
        if (k["a"] || k["arrowleft"]) dir.add(right);
        if (k["d"] || k["arrowright"]) dir.sub(right);
        if (k["q"]) walkRef.current.yaw += 0.045;
        if (k["e"]) walkRef.current.yaw -= 0.045;
        if (dir.lengthSq() > 0) {
          dir.normalize().multiplyScalar(speed);
          const next = walkRef.current.pos.clone().add(dir);
          if (isWalkable(next, rooms, toWorld)) walkRef.current.pos.copy(next);
        }
        camera.position.set(walkRef.current.pos.x, 5.3, walkRef.current.pos.z);
        camera.lookAt(
          walkRef.current.pos.x + Math.sin(walkRef.current.yaw) * 10,
          4.9,
          walkRef.current.pos.z + Math.cos(walkRef.current.yaw) * 10
        );
      }
      // price tags face the camera
      scene.traverse((o) => {
        if ((o as THREE.Sprite).isSprite) o.quaternion.copy(camera.quaternion);
      });
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      if (!mountRef.current) return;
      const w2 = mountRef.current.clientWidth;
      const h2 = Math.max(340, mountRef.current.clientHeight);
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length, walls.length, openings.length, SPAN, renderKey, view, furniture]);
  /* eslint-enable react-hooks/immutability */

  // ─── Keyboard ───────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (selected) setSelected(null); else if (modeRef.current === "walk") exitWalkRef.current(); }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("keydown", esc);    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("keydown", esc);
    };
  }, [selected]);

  const switchView = (v: ViewMode) => {
    viewRef.current = v;
    setView(v);
    setSelected(null);
    setMode("orbit");
    modeRef.current = "orbit";
    setHint(v === "outside"
      ? isTouch ? "Drag to orbit the house · pinch to zoom" : "Drag to orbit · scroll to zoom"
      : null);
  };

  const enterWalk = () => {
    if (viewRef.current !== "inside") { switchView("inside"); }
    modeRef.current = "walk";
    setMode("walk");
    setHint(isTouch
      ? "Arrow pad to move · ⟲ ⟳ to turn · tap furniture to see it online"
      : "W A S D move · Q / E or drag to turn · click furniture to see price & store");
  };

  const exitWalk = () => {
    modeRef.current = "orbit";
    setMode("orbit");
    setHint(null);
  };
  useEffect(() => {
    exitWalkRef.current = exitWalk;
  });

  const hold = (key: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keysRef.current[key] = true; },
    onPointerUp: () => { keysRef.current[key] = false; },
    onPointerLeave: () => { keysRef.current[key] = false; },
    onPointerCancel: () => { keysRef.current[key] = false; },
  });

  if (rooms.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 text-slate-300 rounded-xl ${className ?? ""}`} style={{ minHeight: 340 }}>
        <p className="text-sm">No rooms extracted yet — run the analyzer first.</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className ?? ""}`} style={{ height: "clamp(360px, 60vh, 580px)" }}>
      <div ref={mountRef} className="absolute inset-0" />

      {/* View + mode switches */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
        <button
          onClick={() => switchView("inside")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "inside" ? "bg-white text-slate-900" : "bg-white/20 text-white hover:bg-white/30"}`}
        >
          🛋 Inside
        </button>
        <button
          onClick={() => switchView("outside")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "outside" ? "bg-white text-slate-900" : "bg-white/20 text-white hover:bg-white/30"}`}
        >
          🏠 Outside
        </button>
        {view === "inside" && (
          <button
            onClick={mode === "walk" ? exitWalk : enterWalk}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === "walk" ? "bg-emerald-400 text-slate-900" : "bg-white/20 text-white hover:bg-white/30"}`}
          >
            🚶 {mode === "walk" ? "Stop walking" : "Walk through"}
          </button>
        )}
      </div>

      {floorLabel && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-black/40 text-white text-xs font-medium max-w-[38%] truncate">
          {floorLabel}
        </div>
      )}

      {/* Furniture product card */}
      {selected && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-20 bg-white rounded-xl shadow-2xl border border-border p-4">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-2 right-2 text-text-muted hover:text-text-primary text-sm leading-none"
            aria-label="Close"
          >
            ✕
          </button>
          <p className="text-[11px] uppercase tracking-wide text-text-muted">{selected.store} · Furniture</p>
          <p className="text-sm font-semibold text-text-primary mt-0.5">{selected.label}</p>
          <p className="text-lg font-bold text-accent mt-1">
            ₹{selected.priceInr.toLocaleString("en-IN")}
          </p>
          <a
            href={selected.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-center px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            View in {selected.store} →
          </a>
          <p className="text-[10px] text-text-muted mt-2">Indicative price — click through for current listing.</p>
        </div>
      )}

      {/* Walk controls */}
      {mode === "walk" && view === "inside" && (
        <>
          <div className="absolute bottom-4 left-4 z-10 grid grid-cols-3 grid-rows-3 gap-1 select-none">
            <span />
            <button aria-label="Move forward" {...hold("w")} className="w-11 h-11 rounded-lg bg-black/45 text-white flex items-center justify-center active:bg-white/40 touch-none">▲</button>
            <span />
            <button aria-label="Strafe left" {...hold("a")} className="w-11 h-11 rounded-lg bg-black/45 text-white flex items-center justify-center active:bg-white/40 touch-none">◀</button>
            <button aria-label="Move backward" {...hold("s")} className="w-11 h-11 rounded-lg bg-black/45 text-white flex items-center justify-center active:bg-white/40 touch-none">▼</button>
            <button aria-label="Strafe right" {...hold("d")} className="w-11 h-11 rounded-lg bg-black/45 text-white flex items-center justify-center active:bg-white/40 touch-none">▶</button>
          </div>
          <div className="absolute bottom-4 right-4 z-10 flex gap-2 select-none">
            <button aria-label="Turn left" {...hold("q")} className="w-11 h-11 rounded-full bg-black/45 text-white flex items-center justify-center active:bg-white/40 touch-none">⟲</button>
            <button aria-label="Turn right" {...hold("e")} className="w-11 h-11 rounded-full bg-black/45 text-white flex items-center justify-center active:bg-white/40 touch-none">⟳</button>
          </div>
        </>
      )}

      {hint && (
        <div className="absolute bottom-20 sm:bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg bg-black/60 text-white text-xs text-center max-w-[85%]">
          {hint}
        </div>
      )}

      {contextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-900/95 text-white">
          <p className="text-sm font-medium">The 3D engine was paused to save memory.</p>
          <button
            onClick={() => { setContextLost(false); setRenderKey(k => k + 1); }}
            className="px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-medium hover:bg-slate-200"
          >
            Restart 3D tour
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Furniture mesh factory ─────────────────────────────────────────────────

function buildFurnitureMesh(
  f: FurnitureItem,
  wx: number,
  wz: number
): { group: THREE.Group; pickables: THREE.Mesh[] } {
  const group = new THREE.Group();
  group.position.set(wx, 0, wz);
  group.rotation.y = f.rot;
  const pickables: THREE.Mesh[] = [];

  const mat = (color: number, rough = 0.8, metal = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

  const add = (
    geo: THREE.BufferGeometry, color: number,
    x: number, y: number, z: number, ry = 0, rough = 0.8, metal = 0
  ) => {
    const m = new THREE.Mesh(geo, mat(color, rough, metal));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    pickables.push(m);
    return m;
  };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

  switch (f.kind) {
    case "bed":
    case "singleBed": {
      add(B(f.w, 1.3, f.d), f.color, 0, 0.65, 0);                 // base
      add(B(f.w - 0.5, 0.7, f.d - 1.2), 0xf3efe6, 0, 1.55, 0.3);  // mattress
      add(B(f.w, 2.4, 0.35), f.color, 0, 1.2, -f.d / 2 + 0.15);   // headboard
      add(B(f.w - 0.4, 0.35, 1), 0xffffff, -f.w / 4, 2, -f.d / 2 + 1, 0, 0.95); // pillow
      add(B(f.w - 0.4, 0.35, 1), 0xffffff, f.w / 4, 2, -f.d / 2 + 1, 0, 0.95);
      break;
    }
    case "bedside":
      add(B(f.w, f.h * 0.6, f.d), f.color, 0, f.h * 0.3, 0);
      add(B(f.w + 0.15, 0.12, f.d + 0.15), 0x3d3227, 0, f.h * 0.62, 0, 0, 0.4);
      break;
    case "wardrobe": {
      add(B(f.w, f.h, f.d), f.color, 0, f.h / 2, 0);
      add(B(0.12, f.h - 0.4, 0.05), 0x5b4a38, -0.3, f.h / 2, f.d / 2 + 0.03, 0, 0.3, 0.6);
      add(B(0.12, f.h - 0.4, 0.05), 0x5b4a38, 0.3, f.h / 2, f.d / 2 + 0.03, 0, 0.3, 0.6);
      break;
    }
    case "sofa":
    case "sofaL": {
      add(B(f.w, 1, f.d), f.color, 0, 0.5, 0, 0, 0.95);           // seat
      add(B(f.w, 1.6, 0.45), f.color, 0, 1.3, -f.d / 2 + 0.2, 0, 0.95); // back
      add(B(0.45, 1.2, f.d), f.color, -f.w / 2 + 0.2, 1, 0, 0, 0.95);
      add(B(0.45, 1.2, f.d), f.color, f.w / 2 - 0.2, 1, 0, 0, 0.95);
      add(B(f.w / 3, 0.5, 0.4), 0xd8b56a, -f.w / 4, 1.5, -f.d / 2 + 0.8, 0, 0.95); // cushion
      add(B(f.w / 3, 0.5, 0.4), 0xd8b56a, f.w / 4, 1.5, -f.d / 2 + 0.8, 0, 0.95);
      break;
    }
    case "coffeeTable":
      add(B(f.w, 0.25, f.d), f.color, 0, f.h * 0.75, 0, 0, 0.5);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        add(B(0.15, f.h * 0.75, 0.15), 0x4d4034, sx * (f.w / 2 - 0.2), f.h * 0.37, sz * (f.d / 2 - 0.2));
      }
      break;
    case "tvUnit": {
      add(B(f.w, f.h, f.d), f.color, 0, f.h / 2, 0, 0, 0.6);
      add(B(f.w * 0.75, f.w * 0.45, 0.12), 0x111418, 0, f.h + f.w * 0.25, 0, 0, 0.3, 0.5); // TV
      break;
    }
    case "diningTable": {
      add(B(f.w, 0.25, f.d), f.color, 0, 2.3, 0, 0, 0.5);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        add(B(0.25, 2.3, 0.25), 0x5d4a36, sx * (f.w / 2 - 0.4), 1.15, sz * (f.d / 2 - 0.4));
      }
      for (let i = 0; i < 4; i++) {
        const ax = (i % 2 === 0 ? -1 : 1) * (f.w / 2 + 0.6);
        const az = (i < 2 ? -1 : 1) * (f.d / 2 + 0.4);
        add(B(1.3, 0.2, 1.3), 0x6b5138, ax, 1.5, az, 0, 0.9);       // chair seat
        add(B(1.3, 1.4, 0.2), 0x6b5138, ax, 2.2, az + (i < 2 ? -0.55 : 0.55), 0, 0.9);
      }
      break;
    }
    case "fridge": {
      add(B(f.w, f.h, f.d), f.color, 0, f.h / 2, 0, 0, 0.35, 0.55);
      add(B(0.08, f.h * 0.35, 0.08), 0x7d8a94, f.w / 2 - 0.25, f.h * 0.65, f.d / 2 + 0.05, 0, 0.3, 0.7);
      break;
    }
    case "kitchenCounter": {
      add(B(f.w, f.h * 0.55, f.d), f.color, 0, f.h * 0.275, 0);
      add(B(f.w + 0.2, 0.2, f.d + 0.2), 0x2f2f2f, 0, f.h * 0.6, 0, 0, 0.3); // counter top
      add(B(f.w * 0.35, f.h * 0.4, 0.3), 0x9aa5ad, -f.w * 0.25, f.h * 0.8, -f.d / 2 + 0.5, 0, 0.4, 0.5); // chimney hint
      // sink
      add(B(1.6, 0.12, 1.4), 0xd9dee2, f.w * 0.22, f.h * 0.62, 0, 0, 0.25, 0.7);
      break;
    }
    case "toilet": {
      add(B(f.w, f.h * 0.5, f.d * 0.6), 0xf2f2f0, 0, f.h * 0.25, 0.2, 0, 0.4); // bowl
      add(B(f.w * 0.8, f.h * 0.5, f.d * 0.3), 0xf2f2f0, 0, f.h * 0.7, -f.d / 2 + 0.35, 0, 0.4); // tank
      break;
    }
    case "washbasin": {
      add(new THREE.CylinderGeometry(f.w / 2, f.w / 2.4, 0.5, 18), 0xf2f2f0, 0, 2.5, 0, 0, 0.3);
      add(B(0.12, 2.3, 0.12), 0xb8bec4, 0, 1.15, 0, 0, 0.3, 0.6); // pedestal
      break;
    }
    case "shower":
      add(B(f.w, 0.06, f.d), f.color, 0, 0.05, 0, 0, 0.9); // tray
      add(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), 0xc0c8ce, 0, 7, 0, 0, 0.3, 0.7);
      break;
    case "desk":
      add(B(f.w, 0.2, f.d), f.color, 0, 2.3, 0, 0, 0.6);
      add(B(f.w * 0.9, 2.2, 0.2), f.color, 0, 1.1, -f.d / 2 + 0.15); // modesty panel
      break;
    case "chair":
      add(B(f.w, 0.2, f.d), f.color, 0, 1.4, 0, 0, 0.9);
      add(B(f.w, 1.6, 0.2), f.color, 0, 2.2, -f.d / 2 + 0.1, 0, 0.9);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        add(B(0.1, 1.4, 0.1), 0x263238, sx * (f.w / 2 - 0.1), 0.7, sz * (f.d / 2 - 0.1), 0, 0.6);
      }
      break;
    case "bookshelf": {
      add(B(f.w, f.h, f.d), f.color, 0, f.h / 2, 0);
      for (let i = 1; i < 4; i++) {
        add(B(f.w - 0.2, 0.08, f.d - 0.1), 0x6b5138, 0, (f.h / 4) * i, 0, 0, 0.7);
      }
      break;
    }
    case "pooja":
      add(B(f.w, f.h, f.d), f.color, 0, f.h / 2, 0, 0, 0.55);
      add(new THREE.ConeGeometry(f.w * 0.42, 0.9, 4), 0xd4a24a, 0, f.h + 0.45, 0, Math.PI / 4, 0.5);
      break;
    case "plant": {
      add(new THREE.CylinderGeometry(f.w / 2.4, f.w / 3, 1.1, 12), 0xa8703d, 0, 0.55, 0, 0, 0.9); // pot
      add(new THREE.SphereGeometry(f.h * 0.32, 10, 8), f.color, 0, f.h * 0.62, 0, 0, 1); // foliage
      break;
    }
    case "rug":
    default: {
      const m = add(B(f.w, 0.06, f.d), f.color, 0, 0.05, 0, 0, 1);
      m.castShadow = false;
      break;
    }
  }

  // invisible larger hit-target for easy tapping on phones
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(f.w, 1.5), Math.max(f.h, 1.5), Math.max(f.d, 1.5)),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(0, Math.max(f.h, 1.5) / 2, 0);
  group.add(hit);
  pickables.push(hit);

  return { group, pickables };
}

// ─── Sprites ────────────────────────────────────────────────────────────────

function makeTagSprite(text: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 44;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(15,23,42,0.78)";
  ctx.beginPath();
  ctx.roundRect(2, 2, 124, 40, 10);
  ctx.fill();
  ctx.font = "700 22px system-ui, sans-serif";
  ctx.fillStyle = "#7dd3fc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 64, 23);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.renderOrder = 10;
  return s;
}

function makeTextPlate(text: string): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(4, 4, 504, 88, 14);
  ctx.fill();
  ctx.strokeStyle = "#caa24d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, 492, 76, 10);
  ctx.stroke();
  ctx.font = "700 40px Georgia, serif";
  ctx.fillStyle = "#f5e9c8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 1.7),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })
  );
  return m;
}

// ─── Wall splitting (same logic as before) ──────────────────────────────────

interface WallSeg { kind: "solid" | "door" | "window"; t0: number; t1: number; opening?: Opening }

function splitWallForOpenings(allOpenings: Opening[], wallLenFt: number): WallSeg[] {
  const segs: WallSeg[] = [];
  const doors = allOpenings.filter((o) => o.kind !== "window");
  const windows = allOpenings.filter((o) => o.kind === "window");

  const marks: Array<{ o: Opening; t0: number; t1: number }> = [];
  doors.forEach((o, i) => {
    const t = Math.min(0.9, 0.35 + i * 0.4);
    const half = Math.min(0.2, o.widthFt / Math.max(4, wallLenFt) / 2);
    marks.push({ o, t0: Math.max(0, t - half), t1: Math.min(1, t + half) });
  });
  windows.forEach((o, i) => {
    const t = Math.min(0.9, 0.55 + i * 0.5);
    const half = Math.min(0.25, o.widthFt / Math.max(4, wallLenFt) / 2);
    marks.push({ o, t0: Math.max(0, t - half), t1: Math.min(1, t + half) });
  });

  marks.sort((a, b) => a.t0 - b.t0);
  let cursor = 0;
  for (const m of marks) {
    if (m.t0 <= cursor) continue;
    segs.push({ kind: "solid", t0: cursor, t1: m.t0 });
    segs.push({ kind: m.o.kind === "window" ? "window" : "door", t0: m.t0, t1: m.t1, opening: m.o });
    cursor = m.t1;
  }
  if (cursor < 1) segs.push({ kind: "solid", t0: cursor, t1: 1 });
  return segs;
}

/** Collision: keep the walker inside at least one room polygon. */
function isWalkable(
  p: THREE.Vector3,
  rooms: Room[],
  toWorld: (x: number, y: number) => [number, number]
): boolean {
  for (const room of rooms) {
    const poly = room.polygon;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, zi] = toWorld(poly[i].x, poly[i].y);
      const [xj, zj] = toWorld(poly[j].x, poly[j].y);
      const intersect =
        zi > p.z !== zj > p.z &&
        p.x < ((xj - xi) * (p.z - zi)) / (zj - zi + 1e-9) + xi;
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

// Wall type import kept for public signature clarity
export type { Wall };
