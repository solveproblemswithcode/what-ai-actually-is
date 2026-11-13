import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import type { SceneKey } from "../content/chapters";
import { pinned } from "../state/labels";
import { live, reportTurns, RING_MS, SWEEP_MS } from "../state/live";
import type { Tier } from "./device";
import { BEAM_LENGTH, buildWorld, FIGURE_X, GROUND_Y, NET_CENTER_X, radarLines, WHEEL_RADIUS, type Shape, type World } from "./shapes";
import { hotRegions, SPECS, TURNS_TO_FULL, type SceneSpec } from "./specs";

const FOV = 40;
const TAN_HALF = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const STAGGER = 0.6;

const VERTEX = /* glsl */ `
  attribute vec3 aToS;
  attribute vec3 aFrom;
  attribute vec3 aFromS;
  attribute vec2 aSeed;
  attribute vec2 aSpin;
  attribute vec2 aTint;
  attribute vec2 aGroup;
  attribute float aFrag;
  uniform float uShake, uArc, uDrift, uSweep, uSweepWarm, uNudge, uFlow, uFlowT, uRing, uCore;
  uniform vec3 uOutGlow, uOutWrong, uPale, uWrongColor, uEmber;
  uniform vec3 uHotPos[4];
  uniform vec3 uHotColor[4];
  uniform vec2 uHotRA[4];
  uniform vec2 uRot, uRotX;
  uniform float uGrow, uTurn;
  uniform float uTime, uMix, uStructure, uDensity, uBrightness, uWarm, uAngle, uScale, uMinSize, uMotion, uGrain;
  uniform vec3 uCool, uWarmColor;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float seed = aSeed.x;
    float t = clamp(uMix * ${(1 + STAGGER).toFixed(1)} - seed * ${STAGGER.toFixed(1)}, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    float spin = mix(aSpin.x, aSpin.y, t);
    vec3 p = mix(mix(aFrom, aFromS, uStructure), mix(position, aToS, uStructure), t);
    // Text fragments drift toward the middle, shrink into the network, and start again far out.
    float isFrag = step(0.0001, aFrag) * uFlow;
    float phase = fract(uFlowT + aFrag);
    p *= mix(1.0, mix(1.0, 0.07, phase * phase), isFrag);
    // The garden rises from the ground, a little later for some plants than for others.
    float grown = clamp(uGrow * 1.5 - fract(seed * 3.7) * 0.5, 0.0, 1.0);
    p.y = mix(${GROUND_Y.toFixed(2)}, p.y, grown * grown * (3.0 - 2.0 * grown));
    // The final form turns slowly around its own middle.
    float ct = cos(uTurn), st = sin(uTurn);
    p.xz = mat2(ct, st, -st, ct) * p.xz;
    float a = uAngle * spin;
    float c = cos(a), s = sin(a);
    p.xy = mat2(c, s, -s, c) * p.xy;
    // Mid-flight detour: used when the flowchart collapses before it becomes something else.
    p += vec3(fract(seed * 5.3) - 0.5, -0.9 - fract(seed * 3.1), fract(seed * 9.7) - 0.5) * 1.7 * uArc * 4.0 * t * (1.0 - t);
    float loose = (1.0 - 0.75 * uStructure) * (1.0 - 0.85 * spin);
    vec3 drift = vec3(sin(uTime * 0.5 + seed * 40.0), cos(uTime * 0.4 + seed * 61.0), sin(uTime * 0.45 + seed * 23.0));
    p += drift * 0.09 * max(loose, 0.25) * uDrift * uMotion;
    p *= 1.0 + 0.035 * sin(uTime * 0.55) * (1.0 - spin) * uDrift * uMotion;
    // The flowchart trembles, then bits of it break off and fall.
    float crack = max(0.0, uShake * 1.3 - aSeed.y * 3.0);
    p.x += sin(uTime * 38.0 + p.y * 9.0) * 0.007 * uShake;
    p += vec3((fract(seed * 5.3) - 0.5) * 0.7, -1.0, 0.0) * crack * crack * 1.6;
    // Connections shifting after a correction.
    p += vec3(sin(seed * 91.0 + uTime * 17.0), cos(seed * 37.0 + uTime * 15.0), 0.0) * 0.045 * uNudge;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float visible = max(spin, 1.0 - smoothstep(uDensity - 0.03, uDensity + 0.03, aSeed.y));
    float twinkle = 0.78 + 0.22 * sin(uTime * 1.3 * uMotion + seed * 90.0);
    float size = 0.034 * uGrain * (0.55 + 0.9 * fract(seed * 7.31)) * (1.0 + 0.35 * spin);
    gl_PointSize = max(size * uScale / -mv.z, uMinSize);
    float tint = mix(aTint.x, aTint.y, t);
    float money = step(fract(seed * 13.7), uWarm) * (1.0 - spin);
    vec3 col = tint < 0.0 ? mix(uCool, uPale, -tint) : mix(uCool, uWarmColor, max(tint, money));
    float alpha = visible * uBrightness * twinkle * (0.5 + 0.35 * spin) * (1.0 - smoothstep(0.2, 0.9, crack));
    // A wave of light crossing the network: a guess going forward, or a correction coming back.
    float wave = exp(-(p.x - uSweep) * (p.x - uSweep) / 0.14) * (1.0 - isFrag);
    col = mix(col, mix(vec3(1.0), uWarmColor, uSweepWarm), wave * 0.8);
    alpha *= 1.0 + 2.4 * wave;
    // The path into each answer glows as that answer is chosen or strengthened.
    float grp = t < 0.5 ? aGroup.x : aGroup.y;
    float glow = grp < 0.5 ? 0.0 : (grp < 1.5 ? uOutGlow.x : (grp < 2.5 ? uOutGlow.y : uOutGlow.z));
    float wrong = grp < 0.5 ? 0.0 : (grp < 1.5 ? uOutWrong.x : (grp < 2.5 ? uOutWrong.y : uOutWrong.z));
    col = mix(col, mix(vec3(1.0), uWrongColor, wrong), min(1.0, glow) * 0.55);
    alpha *= 1.0 + 2.2 * glow;
    alpha *= mix(1.0, smoothstep(0.0, 0.08, phase) * (1.0 - smoothstep(0.7, 1.0, phase)), isFrag);
    // A pulse running along a lit beam, and the one node in the middle that every language reaches.
    float ring = exp(-pow(length(p.xy) - uRing, 2.0) / 0.05) * step(0.5, grp) * min(1.0, glow * 2.0);
    col = mix(col, vec3(1.0), ring * 0.8);
    alpha *= 1.0 + 3.5 * ring;
    float core = uCore * exp(-dot(p, p) / 0.06);
    col = mix(col, vec3(1.0, 0.94, 0.82), min(1.0, core));
    alpha *= 1.0 + 4.0 * core;
    // Patches that glow in their own colour (an emotion-like state, or the shortcut on a figure).
    for (int h = 0; h < 4; h++) {
      float hot = uHotRA[h].y * (1.0 - smoothstep(uHotRA[h].x * 0.3, uHotRA[h].x, distance(p, uHotPos[h])));
      col = mix(col, uHotColor[h], min(1.0, hot));
      alpha *= 1.0 + 1.5 * hot;
    }
    // Damage spreading through a figure from its middle: it darkens, turns ember red and cracks.
    float rotAmt = grp < 0.5 ? 0.0 : (grp < 1.5 ? uRot.x : uRot.y);
    float reach = rotAmt * 2.7;
    float rot = step(0.01, rotAmt) * (1.0 - smoothstep(reach - 0.45, reach, distance(p.xy, vec2(grp < 1.5 ? uRotX.x : uRotX.y, 0.35))));
    float fissure = min(abs(sin(p.x * 9.0 + p.y * 4.0 + 1.0)), abs(sin(p.x * 3.0 - p.y * 8.0)));
    col = mix(col, uEmber, rot * 0.92);
    alpha *= (1.0 - 0.22 * rot) * (1.0 - rot * (1.0 - smoothstep(0.0, 0.2, fissure)));
    vColor = col;
    vAlpha = alpha;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * glow * glow * vAlpha, 1.0);
  }
`;

type Wheel = { angle: number; vel: number; held: boolean };

/** The three candidate words shown on the network's answer nodes during the guessing game. */
export type NetWords = { words: string[]; chosen: number; right: boolean };

type SceneProps = {
  sceneKey: SceneKey;
  computeRef: RefObject<number>;
  reduced: boolean;
  tier: Tier;
};

export default function Scene(props: SceneProps) {
  const [degraded, setDegraded] = useState(false);
  const world = useMemo(() => {
    const started = performance.now();
    const built = buildWorld(props.tier.particles);
    // Readable in the browser's performance tools as "wai-world".
    performance.measure("wai-world", { start: started, end: performance.now() });
    return built;
  }, [props.tier.particles]);
  const wheel = useRef<Wheel>({ angle: 0, vel: 0, held: false });
  const spec = SPECS[props.sceneKey];
  return (
    <Canvas
      dpr={degraded ? 1 : [1, props.tier.maxDpr]}
      camera={{ fov: FOV, near: 0.1, far: 200, position: [0, 0, 16] }}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#060914"]} />
      <PerformanceMonitor onDecline={() => setDegraded(true)} />
      <Rig spec={spec} reduced={props.reduced} />
      <Particles world={world} spec={spec} sceneKey={props.sceneKey} wheel={wheel} computeRef={props.computeRef} reduced={props.reduced} degraded={degraded} />
      <WheelDrag active={spec.wheelDrag} wheel={wheel} />
      <LabelProjector wheel={wheel} />
    </Canvas>
  );
}

/** Where on the screen the scene should sit, leaving room for the text. */
function layoutFor(width: number, height: number, tallPanel = false) {
  const desktop = width >= 640 && width > height;
  if (desktop) return { fracW: 0.54, fracH: 0.78, shiftX: 0.2, shiftY: 0, phone: false };
  return tallPanel
    ? { fracW: 0.8, fracH: 0.32, shiftX: 0, shiftY: 0.28, phone: true }
    : { fracW: 0.94, fracH: 0.46, shiftX: 0, shiftY: 0.19, phone: true };
}

function Rig({ spec, reduced }: { spec: SceneSpec; reduced: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const dist = useRef({ value: 0, cx: 0, cy: 0, sx: 0, sy: 0 });
  const lay = layoutFor(size.width, size.height, spec.tallPanel);
  const aspect = size.width / size.height;
  const target = Math.max(
    spec.fitW / (lay.fracW * 2 * TAN_HALF * aspect),
    (lay.phone ? spec.phoneFitH ?? spec.fitH : spec.fitH) / (lay.fracH * 2 * TAN_HALF),
  );

  useEffect(() => {
    const cx = spec.cx ?? 0, cy = spec.cy ?? 0, sx = lay.shiftX, sy = lay.shiftY;
    if (reduced || dist.current.value === 0) {
      gsap.killTweensOf(dist.current);
      Object.assign(dist.current, { value: target, cx, cy, sx, sy });
    } else {
      gsap.to(dist.current, { value: target, cx, cy, sx, sy, duration: 1.3, ease: "power2.inOut", overwrite: true });
    }
  }, [target, spec.cx, spec.cy, lay.shiftX, lay.shiftY, reduced]);


  useFrame(({ clock }) => {
    const d = dist.current.value || target;
    const o = reduced ? 0 : spec.orbit;
    const t = clock.elapsedTime;
    const { cx, cy, sx, sy } = dist.current;
    // Where the scene sits on screen, moved smoothly with the camera.
    const view = camera.view;
    if (!view || Math.abs(view.offsetX + sx * size.width) > 0.5 || Math.abs(view.offsetY - sy * size.height) > 0.5 || view.fullWidth !== size.width || view.fullHeight !== size.height) {
      camera.setViewOffset(size.width, size.height, -sx * size.width, sy * size.height, size.width, size.height);
      camera.updateProjectionMatrix();
    }
    camera.position.set(cx + Math.sin(t * 0.13) * d * o, cy + Math.sin(t * 0.09) * d * o * 0.5, d);
    camera.lookAt(cx, cy, 0);
  });
  return null;
}

type ParticlesProps = {
  world: World;
  spec: SceneSpec;
  sceneKey: SceneKey;
  wheel: RefObject<Wheel>;
  computeRef: RefObject<number>;
  reduced: boolean;
  degraded: boolean;
};

function Particles({ world, spec, sceneKey, wheel, computeRef, reduced, degraded }: ParticlesProps) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const { points, lines, netLines, radarLinesObj, warmLines, uniforms, geometry, lineMaterial, netMaterial, radarMaterial, warmMaterial } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const c = world.shapes.cloud;
    const spin2 = new Float32Array(world.count * 2);
    const tint2 = new Float32Array(world.count * 2);
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(c.base), 3));
    geometry.setAttribute("aToS", new THREE.BufferAttribute(new Float32Array(c.struct), 3));
    geometry.setAttribute("aFrom", new THREE.BufferAttribute(new Float32Array(c.base), 3));
    geometry.setAttribute("aFromS", new THREE.BufferAttribute(new Float32Array(c.struct), 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(world.seed, 2));
    geometry.setAttribute("aSpin", new THREE.BufferAttribute(spin2, 2));
    geometry.setAttribute("aTint", new THREE.BufferAttribute(tint2, 2));
    geometry.setAttribute("aGroup", new THREE.BufferAttribute(new Float32Array(world.count * 2), 2));
    geometry.setAttribute("aFrag", new THREE.BufferAttribute(world.frag, 1));
    const uniforms = {
      uTime: { value: 0 },
      uMix: { value: 1 },
      uStructure: { value: 0 },
      uDensity: { value: 0.42 },
      uBrightness: { value: 0 },
      uWarm: { value: 0 },
      uAngle: { value: 0 },
      uScale: { value: 1000 },
      uMinSize: { value: 2 },
      uMotion: { value: 1 },
      // Fewer particles on weak devices, so each one is drawn a little larger.
      uGrain: { value: Math.pow(56000 / world.count, 0.3) },
      uShake: { value: 0 },
      uArc: { value: 0 },
      uDrift: { value: 1 },
      uSweep: { value: 99 },
      uSweepWarm: { value: 0 },
      uNudge: { value: 0 },
      uFlow: { value: 0 },
      uFlowT: { value: 0 },
      uRing: { value: 99 },
      uCore: { value: 0 },
      uOutGlow: { value: new THREE.Vector3() },
      uOutWrong: { value: new THREE.Vector3() },
      uEmber: { value: new THREE.Color("#e2512f") },
      uHotPos: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) },
      uHotColor: { value: [0, 1, 2, 3].map(() => new THREE.Color()) },
      uHotRA: { value: [0, 1, 2, 3].map(() => new THREE.Vector2(1, 0)) },
      uRot: { value: new THREE.Vector2() },
      uRotX: { value: new THREE.Vector2() },
      uGrow: { value: 1 },
      uTurn: { value: 0 },
      uPale: { value: new THREE.Color("#e4ddcf") },
      uWrongColor: { value: new THREE.Color("#ff8266") },
      uCool: { value: new THREE.Color("#8fb8ff") },
      uWarmColor: { value: new THREE.Color("#ffb469") },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(world.lines, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: "#8fb8ff",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    lines.frustumCulled = false;
    const netGeometry = new THREE.BufferGeometry();
    netGeometry.setAttribute("position", new THREE.BufferAttribute(world.netLines, 3));
    const netMaterial = lineMaterial.clone();
    const netLines = new THREE.LineSegments(netGeometry, netMaterial);
    netLines.frustumCulled = false;
    // The radar chart in chapter 7: crisp grid, spokes and outlines, and the three warm spokes.
    const radar = radarLines();
    const radarGeometry = new THREE.BufferGeometry();
    radarGeometry.setAttribute("position", new THREE.BufferAttribute(radar.positions, 3));
    radarGeometry.setAttribute("color", new THREE.BufferAttribute(radar.colors, 3));
    const radarMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const radarLinesObj = new THREE.LineSegments(radarGeometry, radarMaterial);
    radarLinesObj.frustumCulled = false;
    const warmGeometry = new THREE.BufferGeometry();
    warmGeometry.setAttribute("position", new THREE.BufferAttribute(radar.warm, 3));
    const warmMaterial = new THREE.LineBasicMaterial({
      color: "#ffb469",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const warmLines = new THREE.LineSegments(warmGeometry, warmMaterial);
    warmLines.frustumCulled = false;
    return { points, lines, netLines, radarLinesObj, warmLines, uniforms, geometry, lineMaterial, netMaterial, radarMaterial, warmMaterial };
  }, [world]);

  useEffect(
    () => () => {
      geometry.dispose();
      (points.material as THREE.Material).dispose();
      lines.geometry.dispose();
      lineMaterial.dispose();
      netLines.geometry.dispose();
      netMaterial.dispose();
      radarLinesObj.geometry.dispose();
      radarMaterial.dispose();
      warmLines.geometry.dispose();
      warmMaterial.dispose();
    },
    [geometry, points, lines, lineMaterial, netLines, netMaterial, radarLinesObj, radarMaterial, warmLines, warmMaterial],
  );

  // On a struggling device, draw fewer particles. They are in random order, so any prefix looks even.
  useEffect(() => {
    geometry.setDrawRange(0, degraded ? Math.floor(world.count * 0.6) : world.count);
  }, [degraded, geometry, world.count]);

  // Fly to a new shape. The current in-between positions become the new starting point.
  const currentShape = useRef<Shape>(world.shapes.cloud);
  const enteredAt = useRef(0);
  useEffect(() => {
    enteredAt.current = performance.now();
  }, [spec]);
  useEffect(() => {
    const next = world.shapes[spec.shape];
    if (next === currentShape.current) return;
    const collapsing = currentShape.current === world.shapes.flow;
    currentShape.current = next;
    const attr = (name: string) => geometry.getAttribute(name) as THREE.BufferAttribute;
    const to = attr("position"), toS = attr("aToS"), from = attr("aFrom"), fromS = attr("aFromS");
    const spin = attr("aSpin"), tint = attr("aTint"), group = attr("aGroup");
    const groupA = group.array as Float32Array;
    const toA = to.array as Float32Array, toSA = toS.array as Float32Array;
    const fromA = from.array as Float32Array, fromSA = fromS.array as Float32Array;
    const spinA = spin.array as Float32Array, tintA = tint.array as Float32Array;
    const mix = uniforms.uMix.value;
    for (let i = 0; i < world.count; i++) {
      let t = Math.min(1, Math.max(0, mix * (1 + STAGGER) - world.seed[i * 2] * STAGGER));
      t = t * t * (3 - 2 * t);
      for (let k = i * 3; k < i * 3 + 3; k++) {
        fromA[k] += (toA[k] - fromA[k]) * t;
        fromSA[k] += (toSA[k] - fromSA[k]) * t;
      }
      spinA[i * 2] += (spinA[i * 2 + 1] - spinA[i * 2]) * t;
      tintA[i * 2] += (tintA[i * 2 + 1] - tintA[i * 2]) * t;
      spinA[i * 2 + 1] = next.spin[i];
      tintA[i * 2 + 1] = next.tint[i];
      if (t >= 0.5) groupA[i * 2] = groupA[i * 2 + 1];
      groupA[i * 2 + 1] = next.group[i];
    }
    toA.set(next.base);
    toSA.set(next.struct);
    for (const a of [to, toS, from, fromS, spin, tint, group]) a.needsUpdate = true;
    gsap.killTweensOf(uniforms.uMix);
    if (reduced) {
      uniforms.uMix.value = 1;
    } else {
      uniforms.uMix.value = 0;
      uniforms.uArc.value = collapsing ? 1 : 0;
      gsap.to(uniforms.uMix, { value: 1, duration: collapsing ? 2.6 : 1.5, ease: "power1.inOut" });
    }
  }, [spec.shape, world, geometry, uniforms, reduced]);

  const v3 = useMemo(() => new THREE.Vector3(), []);
  const boost = useRef(0);
  const alarm = useRef(0);
  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const u = uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uMotion.value = reduced ? 0 : 1;
    u.uScale.value = (size.height * dpr) / (2 * TAN_HALF);
    u.uMinSize.value = 1.7 * dpr;

    // The wheel: follows the finger while held, then coasts, then settles to its own slow turn.
    const w = wheel.current;
    if (spec.shape === "wheel") {
      if (live.impulse) {
        w.vel -= live.impulse;
        live.impulse = 0;
      }
      if (!w.held) {
        const cruise = reduced ? 0 : -spec.autoSpin;
        w.vel += (cruise - w.vel) * (1 - Math.exp(-dt * 0.9));
        w.angle += w.vel * dt;
        // Only count turns the visitor caused, not the wheel's own slow drift.
        if (Math.abs(w.vel) > spec.autoSpin + 0.25) reportTurns(live.turns + Math.abs(w.vel * dt) / (Math.PI * 2));
      }
    } else {
      w.vel = 0;
    }
    boost.current = Math.min(1, live.turns / TURNS_TO_FULL);
    u.uAngle.value = w.angle;

    const interact = { compute: computeRef.current ?? 0, boost: boost.current };
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3.2);
    u.uStructure.value += (spec.structure(interact) - u.uStructure.value) * k;
    u.uDensity.value += (spec.density(interact) - u.uDensity.value) * k;
    u.uBrightness.value += (spec.brightness(interact) - u.uBrightness.value) * k;
    u.uWarm.value += (spec.warm - u.uWarm.value) * k;
    u.uDrift.value += (spec.drift - u.uDrift.value) * k;
    const looseTarget = spec.lines === "loose" ? Math.pow(u.uStructure.value, 1.5) * 0.3 * Math.min(1, u.uBrightness.value) : 0;
    lineMaterial.opacity += (looseTarget - lineMaterial.opacity) * k;
    // The tidy network's lines only appear once the particles have mostly arrived.
    // They can be drawn small (chapter 3); the size only changes while they are invisible.
    const scale = spec.netScale ?? 1;
    if (netLines.scale.x !== scale && netMaterial.opacity < 0.02) {
      netLines.scale.setScalar(scale);
      netLines.position.x = scale === 1 ? 0 : -NET_CENTER_X * scale;
    }
    const netTarget = spec.lines === "net" && u.uMix.value > 0.8 && netLines.scale.x === scale ? 0.2 : 0;
    netMaterial.opacity += (netTarget - netMaterial.opacity) * Math.min(1, dt * 5);

    // The radar's crisp lines appear once the particles have mostly arrived.
    const radarTarget = spec.lines === "radar" && u.uMix.value > 0.75 ? 0.85 : 0;
    radarMaterial.opacity += (radarTarget - radarMaterial.opacity) * Math.min(1, dt * 4);
    const warmTarget = sceneKey === "bars3" ? 1 : spec.lines === "radar" && u.uMix.value > 0.75 ? 0.35 : 0;
    warmMaterial.opacity += (warmTarget - warmMaterial.opacity) * Math.min(1, dt * 4);
    // When it is warm, the line is amber; otherwise it shows as a dim grid spoke.
    warmMaterial.color.set(sceneKey === "bars3" ? "#ffb469" : "#5c6273");

    // Text fragments flowing inward.
    u.uFlow.value += ((spec.flowSpeed ? 1 : 0) - u.uFlow.value) * k;
    if (!reduced) u.uFlowT.value = (u.uFlowT.value + dt * (spec.flowSpeed ?? 0)) % 1;

    // The flowchart holds still for a moment, then starts to crack.
    const since = (performance.now() - enteredAt.current) / 1000;
    const shakeTarget = spec.shake && !reduced ? Math.min(1, Math.max(0, (since - 2.2) / 6)) : 0;
    u.uShake.value += (shakeTarget - u.uShake.value) * Math.min(1, dt * 4);

    // Waves of light through the layered network.
    const n = live.net;
    if (spec.lines !== "net") {
      u.uSweep.value = 99;
    } else {
      if (spec.autoSweep && !reduced && performance.now() - n.sweepAt > spec.autoSweep * 1000) {
        n.sweepAt = performance.now();
        n.sweepDir = 1;
      }
      const f = (performance.now() - n.sweepAt) / SWEEP_MS;
      const along = n.sweepDir === 1 ? f : 1 - f;
      const half = 3.3 * scale, mid = scale === 1 ? -0.6 : 0;
      u.uSweep.value = f >= 0 && f <= 1 ? mid - half + along * half * 2 : 99;
      u.uSweepWarm.value = n.sweepDir === 1 ? 0 : 1;
    }
    const inGame = spec.shape === "net" && !spec.autoSweep;
    const fast = spec.shape === "net" && spec.autoSweep > 0 && spec.autoSweep < 1;
    const g = u.uOutGlow.value as THREE.Vector3, wr = u.uOutWrong.value as THREE.Vector3;

    // Chapter 4: pulses along the language beams, and the node in the middle.
    const b = live.beam;
    let coreTo = 0;
    if (spec.beams === "pick") {
      coreTo = b.core;
    } else if (spec.beams === "all") {
      coreTo = 1;
      if (!reduced && performance.now() - b.ringAt > 2400) {
        b.ringAt = performance.now();
        b.ringDir = -1;
      }
    } else if (spec.beams === "core") {
      coreTo = 1;
    }
    const rf = (performance.now() - b.ringAt) / RING_MS;
    u.uRing.value = spec.beams && spec.beams !== "core" && rf >= 0 && rf <= 1 ? BEAM_LENGTH * (b.ringDir === -1 ? 1 - rf : rf) : 99;
    u.uCore.value += (coreTo - u.uCore.value) * Math.min(1, dt * 5);

    const glowTo = (i: number) => {
      if (spec.beams === "pick") return b.glow[i];
      if (spec.beams === "all") return 0.32;
      if (spec.beams === "core") return 0.05;
      return inGame ? n.glow[i] : fast ? 0.35 + 0.3 * Math.sin(clock.elapsedTime * 3 + i * 2.1) : 0;
    };
    const gk = Math.min(1, dt * 6);
    g.set(g.x + (glowTo(0) - g.x) * gk, g.y + (glowTo(1) - g.y) * gk, g.z + (glowTo(2) - g.z) * gk);
    wr.set(inGame ? n.wrong[0] : 0, inGame ? n.wrong[1] : 0, inGame ? n.wrong[2] : 0);
    // Glowing patches (chapters 5 and 6).
    alarm.current += (live.alarm - alarm.current) * (live.alarm ? Math.min(1, dt * 1.1) : Math.min(1, dt * 5));
    const hots = hotRegions(sceneKey, since, reduced ? live.alarm : alarm.current, reduced);
    const hotPos = u.uHotPos.value as THREE.Vector3[], hotColor = u.uHotColor.value as THREE.Color[], hotRA = u.uHotRA.value as THREE.Vector2[];
    for (let h = 0; h < 4; h++) {
      const target = hots[h];
      if (target) {
        // A patch only jumps to a new place or colour while it is dark.
        if (hotRA[h].y < 0.06 || reduced || hotPos[h].distanceToSquared(v3.set(target.pos[0], target.pos[1], target.pos[2])) < 0.01) {
          hotPos[h].set(target.pos[0], target.pos[1], target.pos[2]);
          hotColor[h].set(target.color);
          hotRA[h].x = target.r;
          hotRA[h].y += (target.amt - hotRA[h].y) * (reduced ? 1 : Math.min(1, dt * 6));
        } else {
          hotRA[h].y += (0 - hotRA[h].y) * Math.min(1, dt * 8);
        }
      } else {
        hotRA[h].y += (0 - hotRA[h].y) * Math.min(1, dt * 5);
      }
    }

    // Damage spreading through the figures (chapter 6). It spreads slowly and heals quickly.
    const rot = u.uRot.value as THREE.Vector2, rotX = u.uRotX.value as THREE.Vector2;
    const rotTo = spec.rot ? spec.rot(live.allowed) : [0, 0];
    if (live.restartRot) {
      rot.y = 0;
      live.restartRot = false;
    }
    const creep = (cur: number, to: number) => (reduced ? to : cur + (to - cur) * Math.min(1, dt * (to > cur ? 0.55 : 3)));
    // A lone figure only starts to change a moment after the step begins.
    const waited = sceneKey !== "figureRot" || since > 1.2 || reduced;
    rot.set(creep(rot.x, waited ? rotTo[0] : 0), creep(rot.y, waited ? rotTo[1] : 0));
    const pairX = spec.shape === "figures" ? FIGURE_X : 0;
    rotX.set(rotX.x + (-pairX - rotX.x) * k, rotX.y + (pairX - rotX.y) * k);

    // The garden sinks to the ground as the step begins, then grows.
    if (spec.grow && !reduced) {
      if (since < 0.9) u.uGrow.value += (0 - u.uGrow.value) * Math.min(1, dt * 7);
      else u.uGrow.value = Math.min(1, u.uGrow.value + dt / 3.4);
    } else {
      u.uGrow.value += (1 - u.uGrow.value) * (reduced ? 1 : Math.min(1, dt * 4));
    }
    // The final form turns. Elsewhere the angle unwinds by the shortest way.
    if (spec.turn && !reduced) {
      u.uTurn.value += dt * spec.turn;
      if (u.uTurn.value > Math.PI) u.uTurn.value -= Math.PI * 2;
    } else {
      u.uTurn.value += (0 - u.uTurn.value) * (reduced ? 1 : Math.min(1, dt * 2.5));
    }
    // The visitor's sentence joining the form: a warm flash in the middle.
    live.flash *= Math.exp(-dt * 1.4);
    if (spec.turn) u.uCore.value = Math.max(u.uCore.value, live.flash);

    n.nudge *= Math.exp(-dt * 2.6);
    u.uNudge.value = reduced ? 0 : n.nudge;
  });

  return (
    <>
      <primitive object={lines} />
      <primitive object={netLines} />
      <primitive object={radarLinesObj} />
      <primitive object={warmLines} />
      <primitive object={points} />
    </>
  );
}

/** Lets the visitor grab the wheel and turn it. */
function WheelDrag({ active, wheel }: { active: boolean; wheel: RefObject<Wheel> }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!active) return;
    const el = gl.domElement;
    const v = new THREE.Vector3();
    const toScreen = (x: number, y: number) => {
      v.set(x, y, 0).project(camera);
      const r = el.getBoundingClientRect();
      return [r.left + (v.x * 0.5 + 0.5) * r.width, r.top + (-v.y * 0.5 + 0.5) * r.height];
    };
    let pointer = -1, last = 0, lastTime = 0, cx = 0, cy = 0;
    const angleOf = (e: PointerEvent) => Math.atan2(-(e.clientY - cy), e.clientX - cx);
    const down = (e: PointerEvent) => {
      [cx, cy] = toScreen(0, 0);
      const [rx, ry] = toScreen(WHEEL_RADIUS, 0);
      const ring = Math.hypot(rx - cx, ry - cy);
      const d = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (d > ring * 1.45 || d < ring * 0.2) return;
      pointer = e.pointerId;
      el.setPointerCapture(pointer);
      last = angleOf(e);
      lastTime = performance.now();
      wheel.current.held = true;
      wheel.current.vel = 0;
      live.dragging = true;
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const a = angleOf(e);
      let d = a - last;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      last = a;
      const now = performance.now();
      const dt = Math.max(0.008, (now - lastTime) / 1000);
      lastTime = now;
      const w = wheel.current;
      w.angle += d;
      w.vel = w.vel * 0.6 + (d / dt) * 0.4;
      reportTurns(live.turns + Math.abs(d) / (Math.PI * 2));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = -1;
      wheel.current.held = false;
      wheel.current.vel = THREE.MathUtils.clamp(wheel.current.vel, -9, 9);
      el.style.cursor = "grab";
      // Let the page's swipe handler see that this touch was a wheel drag before clearing the flag.
      setTimeout(() => (live.dragging = false), 50);
    };
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.style.cursor = "";
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      wheel.current.held = false;
      live.dragging = false;
    };
  }, [active, gl, camera, wheel]);
  return null;
}

/** Moves the pinned HTML words so they stay on top of their place in the 3D scene. */
function LabelProjector({ wheel }: { wheel: RefObject<Wheel> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    if (!pinned.size) return;
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const c = Math.cos(wheel.current.angle), s = Math.sin(wheel.current.angle);
    for (const p of pinned) {
      const [x, y, z] = p.pos;
      if (p.spin) v.set(x * c - y * s, x * s + y * c, z);
      else v.set(x, y, z);
      v.project(camera);
      const px = (v.x * 0.5 + 0.5) * size.width, py = (-v.y * 0.5 + 0.5) * size.height;
      p.el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      p.el.style.visibility = "visible";
    }
  });
  return null;
}
