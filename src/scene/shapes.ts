// Target positions for the one particle system. Every "shape" is just a list of
// places the same particles can fly to, so the cloud can turn into anything.

export type Shape = {
  /** Loose position of each particle. */
  base: Float32Array;
  /** Position when the cloud is fully "structured" (smart). */
  struct: Float32Array;
  /** 1 if the particle belongs to the spinning wheel, else 0. */
  spin: Float32Array;
  /** 0 = cool blue, 1 = warm amber, -1 = chalk white. */
  tint: Float32Array;
  /** 0, or 1 to 3 for particles that light up together (an answer path, or one of the three beams). */
  group: Float32Array;
};

export type ShapeName =
  | "cloud"
  | "wheel"
  | "flow"
  | "net"
  | "stream"
  | "beams"
  | "figure"
  | "figures"
  | "bars"
  | "garden"
  | "together"
  | "whole";

export type World = {
  count: number;
  seed: Float32Array; // two random numbers per particle
  shapes: Record<ShapeName, Shape>;
  /** Line segments of the loose network that appears as the cloud gets smarter. */
  lines: Float32Array;
  /** Line segments of the tidy, layered network from chapter 2. */
  netLines: Float32Array;
  /** For each particle: 0, or a number between 0 and 1 if it is part of a text fragment that drifts inward (chapter 3). */
  frag: Float32Array;
};

export const WHEEL_RADIUS = 2.9;
/** Angles of the four stations, clockwise from the top. */
export const STATION_ANGLES = [Math.PI / 2, 0, -Math.PI / 2, Math.PI];
const STATION_TINTS = [0, 0.35, 1, 0.65];

/** The old idea of software: boxes and arrows. Each entry is a label and where it sits. */
export const FLOW_BOXES: { label: string; x: number; y: number; w: number }[] = [
  { label: "if this", x: 0, y: 2.0, w: 2.0 },
  { label: "then that", x: -1.6, y: -0.8, w: 1.8 },
  { label: "else that", x: 1.6, y: -0.8, w: 1.8 },
  { label: "stop", x: 0, y: -2.3, w: 2.0 },
];

/** The layered network: how many nodes per layer, left to right. The last layer holds the three answers. */
const NET_LAYERS = [4, 6, 6, 3];
const NET_X = [-3.3, -1.53, 0.23, 2.0];
const NET_GAP = [0.95, 0.72, 0.72, 1.25];
const netNode = (layer: number, k: number): [number, number, number] => {
  const y = (k - (NET_LAYERS[layer] - 1) / 2) * NET_GAP[layer];
  return [NET_X[layer], y, Math.sin(layer * 2.1 + k * 1.7) * 0.28];
};
/** Every node of the layered network, column by column. Used by the flat fallback picture. */
export const NET_COLUMNS = NET_LAYERS.map((n, l) => Array.from({ length: n }, (_, k) => netNode(l, k)));
export const NET_OUTPUTS = [0, 1, 2].map((k) => netNode(3, 2 - k)); // top to bottom
/** The layered network is not centred on zero (it leaves room for words on the right). This is its middle. */
export const NET_CENTER_X = -0.65;
/** In chapter 3 the network sits small in the middle while text flows into it. */
export const STREAM_NET_SCALE = 0.5;

/** Chapter 4: the three beams, one per language, and how far out they start. */
export const BEAM_ANGLES = [(Math.PI * 5) / 6, Math.PI / 6, (Math.PI * 3) / 2];
export const BEAM_LENGTH = 2.4;

/** Chapter 5: four spots inside the loose network, used for the emotion-like patterns. */
export const EMOTION_SPOTS = [
  [-0.75, 0.6, 0.2],
  [0.8, 0.55, -0.2],
  [-0.65, -0.65, 0],
  [0.7, -0.6, 0.3],
];

/**
 * Chapter 7: the chart from Anthropic's labor market report (Figure 2) that Chloe Lubinski showed in her talk.
 * For each kind of work: how much AI could do in theory, and how much it is actually used for today (0 to 1).
 * Our own calculation from the same public data, weighted by how many people do each job:
 * theory from Eloundou et al. (2023, "beta"), actual use from Anthropic's Economic Index.
 * Clockwise from the top, in the same order as the original chart.
 */
export const RADAR = [
  { label: "Management", theory: 0.47, used: 0.13 },
  { label: "Business & finance", theory: 0.54, used: 0.28 },
  { label: "Computer & math", theory: 0.75, used: 0.36, key: true },
  { label: "Architecture & engineering", theory: 0.52, used: 0.05 },
  { label: "Life & social sciences", theory: 0.45, used: 0.1 },
  { label: "Social services", theory: 0.32, used: 0.04 },
  { label: "Legal", theory: 0.46, used: 0.2, key: true },
  { label: "Education & library", theory: 0.37, used: 0.18 },
  { label: "Arts & media", theory: 0.49, used: 0.19 },
  { label: "Healthcare practitioners", theory: 0.35, used: 0.05 },
  { label: "Healthcare support", theory: 0.21, used: 0.02 },
  { label: "Protective service", theory: 0.24, used: 0.03 },
  { label: "Food & serving", theory: 0.14, used: 0.01, key: true, human: true },
  { label: "Grounds maintenance", theory: 0.03, used: 0.01, key: true, human: true },
  { label: "Personal care", theory: 0.18, used: 0.02, key: true, human: true },
  { label: "Sales", theory: 0.41, used: 0.27 },
  { label: "Office & admin", theory: 0.6, used: 0.34, key: true },
  { label: "Agriculture", theory: 0.14, used: 0.01 },
  { label: "Construction", theory: 0.12, used: 0.01 },
  { label: "Installation & repair", theory: 0.16, used: 0.02 },
  { label: "Production", theory: 0.17, used: 0.01 },
  { label: "Transportation", theory: 0.18, used: 0 },
];
/** World units for a value of 1, and how far out the spokes and labels sit. */
export const RADAR_SCALE = 2.6;
export const RADAR_SPOKE = 2.08;
export const RADAR_LABEL = 2.16;
export const radarAngle = (k: number) => Math.PI / 2 - (k / RADAR.length) * Math.PI * 2;
/** Each label sits just past the tip of its own spoke, on the outside. */
export const radarLabelSide = (k: number): "center-above" | "center-below" | "start" | "end" => {
  const c = Math.cos(radarAngle(k));
  if (Math.abs(c) < 0.15) return Math.sin(radarAngle(k)) > 0 ? "center-above" : "center-below";
  return c > 0 ? "start" : "end";
};

/**
 * Crisp lines for the radar: grid rings and spokes (dim), and the outlines of both areas.
 * Returns positions and colours for one LineSegments, plus the three warm spokes separately.
 */
export function radarLines() {
  const pos: number[] = [], col: number[] = [];
  const seg = (a: number[], b: number[], c: number[]) => {
    pos.push(a[0], a[1], 0, b[0], b[1], 0);
    col.push(...c, ...c);
  };
  const grid = [0.32, 0.36, 0.45], theory = [0.56, 0.72, 1], used = [1, 0.97, 0.92];
  const at = (k: number, r: number) => [Math.cos(radarAngle(k)) * r, Math.sin(radarAngle(k)) * r];
  for (const ring of [0.2, 0.4, 0.6, 0.8]) {
    const r = ring * RADAR_SCALE, n = 72;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      seg([Math.cos(a0) * r, Math.sin(a0) * r], [Math.cos(a1) * r, Math.sin(a1) * r], ring === 0.8 ? [0.5, 0.55, 0.65] : grid);
    }
  }
  RADAR.forEach((r, k) => {
    if (!r.human) seg([0, 0], at(k, RADAR_SPOKE), grid);
    const k1 = (k + 1) % RADAR.length;
    seg(at(k, Math.max(r.theory, 0.01) * RADAR_SCALE), at(k1, Math.max(RADAR[k1].theory, 0.01) * RADAR_SCALE), theory);
    seg(at(k, Math.max(r.used, 0.008) * RADAR_SCALE), at(k1, Math.max(RADAR[k1].used, 0.008) * RADAR_SCALE), used);
  });
  const warm: number[] = [];
  RADAR.forEach((r, k) => {
    if (!r.human) return;
    const tip = at(k, RADAR_SPOKE);
    warm.push(0, 0, 0, tip[0], tip[1], 0);
  });
  return { positions: new Float32Array(pos), colors: new Float32Array(col), warm: new Float32Array(warm) };
}
/** The middle of the three kinds of work the talk singles out, used to aim the glow. */
export const RADAR_HUMAN = RADAR.map((r, k) => ({ ...r, k })).filter((r) => r.human);

/** Where the ground is in the garden scenes, and where the three renamed kinds of work are pinned. */
export const GROUND_Y = -1.6;
export const GARDEN_SPOTS = [
  [-1.9, 0.75],
  [0, 1.45],
  [1.9, 0.75],
];

/** Chapter 6: the two figures stand this far left and right of the middle. */
export const FIGURE_X = 1.35;
/** Places on a figure's body, measured from the figure's own middle. */
export const BODY = { head: [0, 1.55], torso: [0, 0.35], hand: [0.74, -0.12] };

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildWorld(count: number): World {
  const rand = mulberry32(20261111);
  const gauss = () => {
    const u = Math.max(rand(), 1e-6);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };

  const seed = new Float32Array(count * 2);
  for (let i = 0; i < count * 2; i++) seed[i] = rand();

  // The soft cloud from the intro.
  const cloudBase = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0, r = 9;
    while (r > 2.3) {
      x = gauss() * 0.8;
      y = gauss() * 0.7;
      z = gauss() * 0.8;
      r = Math.hypot(x, y, z);
    }
    cloudBase.set([x, y, z], i * 3);
  }

  // A small network hidden inside the cloud: nodes, and threads between near neighbours.
  const NODES = 46;
  const nodes: number[][] = [];
  let guard = 0;
  while (nodes.length < NODES && guard++ < 20000) {
    const p = [gauss() * 0.85, gauss() * 0.75, gauss() * 0.85];
    if (Math.hypot(p[0], p[1], p[2]) > 1.65) continue;
    if (nodes.some((n) => Math.hypot(n[0] - p[0], n[1] - p[1], n[2] - p[2]) < 0.42)) continue;
    nodes.push(p);
  }
  const edgeSet = new Set<string>();
  const edgesOf: number[][] = nodes.map(() => []);
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => ({ j, d: Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) }))
      .filter((e) => e.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3);
    for (const { j } of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edgesOf[i].push(j);
      edgesOf[j].push(i);
    }
  });
  const lines = new Float32Array(edgeSet.size * 6);
  let li = 0;
  for (const key of edgeSet) {
    const [a, b] = key.split("-").map(Number);
    lines.set(nodes[a], li);
    lines.set(nodes[b], li + 3);
    li += 6;
  }

  // Where each cloud particle settles once the cloud is "smart".
  const cloudStruct = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const px = cloudBase[i * 3], py = cloudBase[i * 3 + 1], pz = cloudBase[i * 3 + 2];
    let best = 0, bestD = Infinity;
    for (let n = 0; n < nodes.length; n++) {
      const d = (nodes[n][0] - px) ** 2 + (nodes[n][1] - py) ** 2 + (nodes[n][2] - pz) ** 2;
      if (d < bestD) { bestD = d; best = n; }
    }
    const node = nodes[best];
    const roll = rand();
    if (roll < 0.4) {
      cloudStruct.set([node[0] + gauss() * 0.05, node[1] + gauss() * 0.05, node[2] + gauss() * 0.05], i * 3);
    } else if (roll < 0.86 && edgesOf[best].length) {
      const other = nodes[edgesOf[best][Math.floor(rand() * edgesOf[best].length)]];
      const u = rand();
      cloudStruct.set(
        [
          node[0] + (other[0] - node[0]) * u + gauss() * 0.016,
          node[1] + (other[1] - node[1]) * u + gauss() * 0.016,
          node[2] + (other[2] - node[2]) * u + gauss() * 0.016,
        ],
        i * 3,
      );
    } else {
      cloudStruct.set([px * 1.12, py * 1.12, pz * 1.12], i * 3);
    }
  }

  const zeros = new Float32Array(count);
  const cloud: Shape = { base: cloudBase, struct: cloudStruct, spin: zeros, tint: zeros, group: zeros };

  // The wheel: about a third of the particles leave the cloud and form a ring around it.
  const wBase = new Float32Array(cloudBase);
  const wStruct = new Float32Array(cloudStruct);
  const wSpin = new Float32Array(count);
  const wTint = new Float32Array(count);
  const TWO_PI = Math.PI * 2;
  const tintAt = (angle: number) => {
    // Blend between the two stations on either side of this angle.
    const turn = (((Math.PI / 2 - angle) % TWO_PI) + TWO_PI) % TWO_PI; // 0 at top, clockwise
    const f = (turn / TWO_PI) * 4;
    const k = Math.floor(f) % 4;
    return STATION_TINTS[k] + (STATION_TINTS[(k + 1) % 4] - STATION_TINTS[k]) * (f - Math.floor(f));
  };
  for (let i = 0; i < count; i++) {
    if (rand() > 0.36) continue;
    let angle: number, radius: number, z: number;
    if (rand() < 0.5) {
      const k = Math.floor(rand() * 4);
      angle = STATION_ANGLES[k] + gauss() * 0.12;
      radius = WHEEL_RADIUS + gauss() * 0.12;
      z = gauss() * 0.1;
    } else {
      angle = rand() * TWO_PI;
      radius = WHEEL_RADIUS + gauss() * 0.03;
      z = gauss() * 0.03;
    }
    const p = [Math.cos(angle) * radius, Math.sin(angle) * radius, z];
    wBase.set(p, i * 3);
    wStruct.set(p, i * 3);
    wSpin[i] = 1;
    wTint[i] = tintAt(angle);
  }
  const wheel: Shape = { base: wBase, struct: wStruct, spin: wSpin, tint: wTint, group: zeros };

  // The flowchart: every particle lines up on a box edge or an arrow. Flat and stiff on purpose.
  const segs: number[][] = [];
  const box = (x: number, y: number, w: number, h: number) => {
    const l = x - w / 2, r = x + w / 2, t = y + h / 2, b = y - h / 2;
    segs.push([l, t, r, t], [r, t, r, b], [r, b, l, b], [l, b, l, t]);
  };
  for (const b of FLOW_BOXES) box(b.x, b.y, b.w, 0.7);
  segs.push([0, 1.15, 1, 0.55], [1, 0.55, 0, -0.05], [0, -0.05, -1, 0.55], [-1, 0.55, 0, 1.15]); // the decision diamond
  segs.push([0, 1.65, 0, 1.15]);
  segs.push([-1, 0.55, -1.6, 0.55], [-1.6, 0.55, -1.6, -0.45], [1, 0.55, 1.6, 0.55], [1.6, 0.55, 1.6, -0.45]);
  segs.push([-1.6, -1.15, -1.6, -1.6], [-1.6, -1.6, 0, -1.6], [1.6, -1.15, 1.6, -1.6], [1.6, -1.6, 0, -1.6], [0, -1.6, 0, -1.95]);
  const segLen = segs.map((g) => Math.hypot(g[2] - g[0], g[3] - g[1]));
  const segTotal = segLen.reduce((p, q) => p + q, 0);
  const fBase = new Float32Array(count * 3);
  const fTint = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    if (rand() < 0.1) {
      fBase.set([gauss() * 2.2, gauss() * 2.2, gauss() * 0.6], i * 3);
      fTint[i] = -0.4;
      continue;
    }
    let pick = rand() * segTotal, k = 0;
    while (pick > segLen[k] && k < segs.length - 1) pick -= segLen[k++];
    const g = segs[k], u = rand();
    fBase.set([g[0] + (g[2] - g[0]) * u + gauss() * 0.012, g[1] + (g[3] - g[1]) * u + gauss() * 0.012, gauss() * 0.01], i * 3);
    fTint[i] = -1;
  }
  const flow: Shape = { base: fBase, struct: fBase, spin: zeros, tint: fTint, group: zeros };

  // The layered network: nodes in columns, every node wired to every node in the next column.
  const netEdges: { a: number[]; b: number[]; out: number }[] = [];
  for (let l = 0; l < NET_LAYERS.length - 1; l++)
    for (let i = 0; i < NET_LAYERS[l]; i++)
      for (let j = 0; j < NET_LAYERS[l + 1]; j++)
        netEdges.push({ a: netNode(l, i), b: netNode(l + 1, j), out: l === NET_LAYERS.length - 2 ? 3 - j : 0 });
  const netLines = new Float32Array(netEdges.length * 6);
  netEdges.forEach((e, k) => {
    netLines.set(e.a, k * 6);
    netLines.set(e.b, k * 6 + 3);
  });
  const allNodes: { p: number[]; out: number }[] = [];
  NET_LAYERS.forEach((n, l) => {
    for (let k = 0; k < n; k++) allNodes.push({ p: netNode(l, k), out: l === NET_LAYERS.length - 1 ? 3 - k : 0 });
  });
  const nBase = new Float32Array(count * 3);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const roll = rand();
    if (roll < 0.3) {
      const n = allNodes[Math.floor(rand() * allNodes.length)];
      const r = n.out ? 0.11 : 0.085;
      nBase.set([n.p[0] + gauss() * r, n.p[1] + gauss() * r, n.p[2] + gauss() * r], i * 3);
      out[i] = n.out;
    } else if (roll < 0.93) {
      const e = netEdges[Math.floor(rand() * netEdges.length)];
      const u = rand();
      nBase.set(
        [
          e.a[0] + (e.b[0] - e.a[0]) * u + gauss() * 0.014,
          e.a[1] + (e.b[1] - e.a[1]) * u + gauss() * 0.014,
          e.a[2] + (e.b[2] - e.a[2]) * u + gauss() * 0.014,
        ],
        i * 3,
      );
      out[i] = e.out;
    } else {
      nBase.set([gauss() * 2.6 - 0.6, gauss() * 1.7, gauss() * 0.9], i * 3);
    }
  }
  const net: Shape = { base: nBase, struct: nBase, spin: zeros, tint: zeros, group: out };

  // Chapter 3: a small network in the middle, and thousands of tiny "lines of text" around it.
  // Each fragment is a few short rows of particles with gaps, like words on a page.
  const sBase = new Float32Array(count * 3);
  const sTint = new Float32Array(count);
  const frag = new Float32Array(count);
  let left = 0, fc = [0, 0, 0], fRows = 1, fWidth = 0.5, fPhase = 0.5, fTintValue = 1, fGap = 0;
  for (let i = 0; i < count; i++) {
    if (rand() < 0.28) {
      sBase.set(
        [(nBase[i * 3] - NET_CENTER_X) * STREAM_NET_SCALE, nBase[i * 3 + 1] * STREAM_NET_SCALE, nBase[i * 3 + 2] * STREAM_NET_SCALE],
        i * 3,
      );
      continue;
    }
    if (left === 0) {
      const a = rand() * TWO_PI, tilt = (rand() - 0.5) * 1.1, R = 3.1 + rand() * 3.6;
      fc = [Math.cos(a) * Math.cos(tilt) * R, Math.sin(a) * Math.cos(tilt) * R, Math.sin(tilt) * R * 0.6];
      fRows = 1 + Math.floor(rand() * 3);
      fWidth = 0.35 + rand() * 0.5;
      fPhase = 0.02 + rand() * 0.96;
      fTintValue = rand() < 0.55 ? 0.55 + rand() * 0.45 : -0.9;
      fGap = rand();
      left = 6 + fRows * 7;
    }
    left--;
    let u = rand();
    // Leave gaps in each row so it reads as words.
    for (let tries = 0; tries < 4 && ((u * 4.3 + fGap) % 1) < 0.2; tries++) u = rand();
    const row = Math.floor(rand() * fRows);
    sBase.set([fc[0] + (u - 0.5) * fWidth, fc[1] - row * 0.085 + gauss() * 0.006, fc[2]], i * 3);
    sTint[i] = fTintValue;
    frag[i] = fPhase;
  }
  const stream: Shape = { base: sBase, struct: sBase, spin: zeros, tint: sTint, group: zeros };

  // Chapter 4: the loose network in the middle, one bright node at its heart, and three beams leading in.
  const bBase = new Float32Array(count * 3);
  const bGroup = new Float32Array(count);
  const bTint = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const roll = rand();
    if (roll < 0.36) {
      const k = Math.floor(rand() * 3);
      const r = 0.25 + Math.pow(rand(), 0.8) * (BEAM_LENGTH - 0.25);
      const spread = 0.02 + r * 0.018;
      bBase.set(
        [Math.cos(BEAM_ANGLES[k]) * r + gauss() * spread, Math.sin(BEAM_ANGLES[k]) * r + gauss() * spread, gauss() * spread],
        i * 3,
      );
      bGroup[i] = k + 1;
      bTint[i] = -0.35;
    } else if (roll < 0.43) {
      bBase.set([gauss() * 0.09, gauss() * 0.09, gauss() * 0.09], i * 3);
    } else {
      bBase.set([cloudStruct[i * 3] * 0.62, cloudStruct[i * 3 + 1] * 0.62, cloudStruct[i * 3 + 2] * 0.62], i * 3);
    }
  }
  const beams: Shape = { base: bBase, struct: bBase, spin: zeros, tint: bTint, group: bGroup };

  // Chapter 6: an abstract standing figure made of points. No face, on purpose.
  const bodyPoint = (reach = 0): number[] => {
    const part = rand();
    const along = (a: number[], b: number[], r: number) => {
      const u = rand();
      return [a[0] + (b[0] - a[0]) * u + gauss() * r, a[1] + (b[1] - a[1]) * u + gauss() * r, gauss() * r];
    };
    const side = rand() < 0.5 ? -1 : 1;
    if (part < 0.14) {
      const a = rand() * TWO_PI, v = rand() * 2 - 1, r = 0.3 * (0.7 + 0.3 * rand()), w = Math.sqrt(1 - v * v);
      return [Math.cos(a) * w * r, 1.55 + v * r, Math.sin(a) * w * r * 0.8];
    }
    if (part < 0.54) {
      const y = -0.25 + rand() * 1.4;
      const half = 0.34 + 0.2 * Math.pow((y + 0.25) / 1.4, 1.5);
      const edge = rand() < 0.45 ? (rand() < 0.5 ? -1 : 1) * (1 - Math.abs(gauss()) * 0.06) : rand() * 2 - 1;
      return [edge * half, y, gauss() * 0.14];
    }
    // "reach" stretches one arm out to the side, toward another figure.
    if (part < 0.72)
      return side === reach
        ? along([side * 0.56, 1.08], [side * 1.55, 0.55], 0.065)
        : along([side * 0.56, 1.08], [side * 0.76, -0.14], 0.07);
    return along([side * 0.2, -0.25], [side * 0.3, -1.75], 0.09);
  };
  const local = new Float32Array(count * 3);
  const dust = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    if (rand() < 0.05) {
      dust[i] = 1;
      local.set([gauss() * 1.6, gauss() * 1.4, gauss() * 0.8], i * 3);
    } else {
      local.set(bodyPoint(), i * 3);
    }
  }
  const soloGroup = new Float32Array(count);
  for (let i = 0; i < count; i++) soloGroup[i] = dust[i] ? 0 : 1;
  const figure: Shape = { base: local, struct: local, spin: zeros, tint: zeros, group: soloGroup };
  const pairBase = new Float32Array(count * 3);
  const pairGroup = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const right = rand() < 0.5;
    pairGroup[i] = dust[i] ? 0 : right ? 2 : 1;
    pairBase.set([local[i * 3] + (right ? FIGURE_X : -FIGURE_X), local[i * 3 + 1], local[i * 3 + 2]], i * 3);
  }
  const figures: Shape = { base: pairBase, struct: pairBase, spin: zeros, tint: zeros, group: pairGroup };

  // Chapter 7, first half: the radar chart. A faint area for what AI could do in theory,
  // a bright core for what it is actually used for, and thin spokes so the empty wedges still show.
  const radarPoint = (key: "theory" | "used", edge: boolean): number[] => {
    const n = RADAR.length;
    const radius = (k: number) => Math.max(RADAR[k % n][key] * RADAR_SCALE, key === "used" ? 0.05 : 0.08);
    const weights = RADAR.map((_, k) => (radius(k) ** 2 + radius(k + 1) ** 2) / 2);
    const total = weights.reduce((p, q) => p + q, 0);
    let pick = rand() * total, k = 0;
    while (pick > weights[k] && k < n - 1) pick -= weights[k++];
    const t = rand();
    const a = radarAngle(k) + (radarAngle(k + 1) - radarAngle(k)) * t;
    // Straight edges between spokes, like the original chart.
    const r0 = radius(k), r1 = radius(k + 1);
    const p0 = [Math.cos(radarAngle(k)) * r0, Math.sin(radarAngle(k)) * r0];
    const p1 = [Math.cos(radarAngle(k + 1)) * r1, Math.sin(radarAngle(k + 1)) * r1];
    const ex = p0[0] + (p1[0] - p0[0]) * t, ey = p0[1] + (p1[1] - p0[1]) * t;
    const f = edge ? 1 - Math.abs(gauss()) * 0.015 : Math.sqrt(rand());
    void a;
    return [ex * f, ey * f, gauss() * 0.012];
  };
  const barsBase = new Float32Array(count * 3);
  const barsTint = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const roll = rand();
    let p: number[];
    if (roll < 0.06) {
      // A soft trail of points along the three spokes the talk singles out. They glow amber in step 2.
      const h = RADAR_HUMAN[Math.floor(rand() * RADAR_HUMAN.length)], r = 0.15 + rand() * (RADAR_SPOKE - 0.15);
      p = [Math.cos(radarAngle(h.k)) * r + gauss() * 0.02, Math.sin(radarAngle(h.k)) * r + gauss() * 0.02, 0];
      barsTint[i] = -0.6;
    } else if (roll < 0.6) {
      p = radarPoint("theory", false);
      barsTint[i] = 0;
    } else if (roll < 0.95) {
      p = radarPoint("used", false);
      barsTint[i] = -1;
    } else {
      p = [gauss() * 2.4, gauss() * 2.2, gauss() * 0.6];
      barsTint[i] = 0;
    }
    barsBase.set(p, i * 3);
  }
  const bars: Shape = { base: barsBase, struct: barsBase, spin: zeros, tint: barsTint, group: zeros };

  // Plants: a curved stem, a few leaves, and a blossom on top. Returns a point and how warm it is.
  type Plant = { x: number; z: number; h: number; lean: number; size: number };
  const plantPoint = (pl: Plant): number[] => {
    const part = rand();
    const stem = (u: number) => [pl.x + pl.lean * u * u, GROUND_Y + pl.h * u, pl.z];
    if (part < 0.34) {
      const c = stem(rand());
      return [c[0] + gauss() * 0.015, c[1], c[2] + gauss() * 0.015, 0.55];
    }
    if (part < 0.62) {
      const u = 0.25 + Math.floor(rand() * 3) * 0.22, c = stem(u), dir = rand() < 0.5 ? -1 : 1;
      const a = rand() * TWO_PI, r = Math.sqrt(rand());
      const lx = Math.cos(a) * r * 0.22 * pl.size, ly = Math.sin(a) * r * 0.07 * pl.size;
      return [c[0] + dir * (0.2 * pl.size + lx), c[1] + ly + Math.abs(lx) * 0.35, c[2] + gauss() * 0.02, 0.72];
    }
    const top = stem(1), a = rand() * TWO_PI;
    const petal = (0.13 + 0.09 * Math.abs(Math.cos(a * 3))) * pl.size * (0.35 + 0.65 * Math.sqrt(rand()));
    return [top[0] + Math.cos(a) * petal, top[1] + Math.sin(a) * petal, top[2] + gauss() * 0.03, rand() < 0.75 ? 1 : -1];
  };
  const groundPoint = (halfWidth: number): number[] => {
    const x = (rand() * 2 - 1) * halfWidth;
    return [x, GROUND_Y + Math.abs(gauss()) * 0.09, gauss() * 0.5, 0.6];
  };
  const putPoint = (base: Float32Array, tint: Float32Array, i: number, p: number[]) => {
    base.set([p[0], p[1], p[2]], i * 3);
    tint[i] = p[3];
  };

  // The garden: nine plants of different heights.
  const gardenPlants: Plant[] = [-2.6, -1.9, -1.25, -0.6, 0, 0.65, 1.3, 1.9, 2.55].map((x, k) => ({
    x,
    z: Math.sin(k * 2.4) * 0.35,
    h: [1.5, 2.3, 1.2, 1.9, 3.0, 1.6, 2.0, 2.3, 1.35][k],
    lean: Math.sin(k * 1.7) * 0.3,
    size: [0.9, 1.15, 0.8, 1, 1.3, 0.9, 1, 1.15, 0.85][k],
  }));
  const gBase = new Float32Array(count * 3), gTint = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const pl = gardenPlants[Math.floor(rand() * gardenPlants.length)];
    putPoint(gBase, gTint, i, rand() < 0.16 ? groundPoint(3.1) : plantPoint(pl));
  }
  const garden: Shape = { base: gBase, struct: gBase, spin: zeros, tint: gTint, group: zeros };

  // Two people at a shared table, reaching toward each other, in the garden.
  const sidePlants: Plant[] = [-2.75, -2.2, 2.2, 2.75, -0.45, 0.5].map((x, k) => ({
    x,
    z: k > 3 ? -0.9 : Math.sin(k * 2.1) * 0.3,
    h: [1.7, 2.6, 2.5, 1.6, 3.1, 2.9][k],
    lean: Math.sin(k * 1.3) * 0.25,
    size: [0.9, 1.1, 1.1, 0.9, 1, 0.95][k],
  }));
  const tBase = new Float32Array(count * 3), tTint = new Float32Array(count);
  const PERSON = 0.72, PERSON_X = 1.3;
  for (let i = 0; i < count; i++) {
    const roll = rand();
    if (roll < 0.56) {
      const side = roll < 0.28 ? -1 : 1;
      const b = bodyPoint(-side);
      putPoint(tBase, tTint, i, [side * PERSON_X + b[0] * PERSON, GROUND_Y + (b[1] + 1.75) * PERSON, b[2] * PERSON, 0.85]);
    } else if (roll < 0.66) {
      // The table: a round top seen from the side, and one leg.
      const a = rand() * TWO_PI, r = rand() < 0.6 ? 1 : Math.sqrt(rand());
      const top = rand() < 0.8;
      putPoint(tBase, tTint, i, top ? [Math.cos(a) * 0.62 * r, GROUND_Y + 0.95 + Math.sin(a) * 0.1 * r, 0, -0.7] : [gauss() * 0.03, GROUND_Y + rand() * 0.95, 0, -0.5]);
    } else if (roll < 0.76) {
      putPoint(tBase, tTint, i, groundPoint(3.1));
    } else {
      putPoint(tBase, tTint, i, plantPoint(sidePlants[Math.floor(rand() * sidePlants.length)]));
    }
  }
  const together: Shape = { base: tBase, struct: tBase, spin: zeros, tint: tTint, group: zeros };

  // Chapter 8: everything in one form. The network in the middle, a ring of plants around it, text circling above.
  const wBase2 = new Float32Array(count * 3), wTint2 = new Float32Array(count);
  const ringPlants: Plant[] = Array.from({ length: 12 }, (_, k) => ({ x: 0, z: 0, h: 1.0 + (k % 3) * 0.45, lean: 0.2, size: 0.85 }));
  for (let i = 0; i < count; i++) {
    const roll = rand();
    if (roll < 0.42) {
      wBase2.set([cloudStruct[i * 3] * 0.85, cloudStruct[i * 3 + 1] * 0.85 + 0.25, cloudStruct[i * 3 + 2] * 0.85], i * 3);
    } else if (roll < 0.72) {
      // A plant, placed on a circle around the middle.
      const k = Math.floor(rand() * ringPlants.length), a = (k / ringPlants.length) * TWO_PI;
      const p = plantPoint(ringPlants[k]);
      const radius = 2.1 + p[0];
      putPoint(wBase2, wTint2, i, [Math.cos(a) * radius - Math.sin(a) * p[2], p[1] - 0.2, Math.sin(a) * radius + Math.cos(a) * p[2], p[3]]);
    } else {
      // A text fragment from chapter 3, bent onto a tilted halo.
      const a = Math.atan2(sBase[i * 3 + 1], sBase[i * 3]) + sBase[i * 3] * 0.15, r = 2.7 + (seed[i * 2] - 0.5) * 0.7;
      putPoint(wBase2, wTint2, i, [Math.cos(a) * r, 1.2 + Math.sin(a * 2) * 0.35 + (seed[i * 2 + 1] - 0.5) * 0.5, Math.sin(a) * r, rand() < 0.5 ? -0.9 : 0.8]);
    }
  }
  const whole: Shape = { base: wBase2, struct: wBase2, spin: zeros, tint: wTint2, group: zeros };

  return {
    count,
    seed,
    shapes: { cloud, wheel, flow, net, stream, beams, figure, figures, bars, garden, together, whole },
    lines,
    netLines,
    frag,
  };
}
