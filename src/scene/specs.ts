// What the 3D scene should look like for each step of the story.
import type { SceneKey } from "../content/chapters";
import { BODY, EMOTION_SPOTS, FIGURE_X, RADAR_HUMAN, RADAR_SPOKE, radarAngle, type ShapeName } from "./shapes";

/** Things the visitor controls: the compute slider (0..1) and how much they spun the wheel (0..1). */
export type Interact = { compute: number; boost: number };

export type SceneSpec = {
  shape: ShapeName;
  /** Which set of thin connecting lines to show. */
  lines: "loose" | "net" | "radar" | "none";
  /** How much the particles float about. 1 is the dreamy cloud, 0 is rigid. */
  drift: number;
  /** The flowchart slowly starts to crack while you look at it. */
  shake: boolean;
  /** Seconds between waves of light that run through the layered network on their own. 0 means none. */
  autoSweep: number;
  /** How fast the text fragments drift inward (chapter 3). */
  flowSpeed?: number;
  /** Size of the layered network's thin lines, when the network is shown small. */
  netScale?: number;
  /** Chapter 4: "pick" waits for the visitor to choose a language, "all" lights every beam, "core" shows only the middle. */
  beams?: "pick" | "all" | "core";
  /** Chapter 7: the garden grows up from the ground when the step begins. */
  grow?: boolean;
  /** Chapter 8: how fast the whole form turns, in radians per second. */
  turn?: number;
  /** Chapter 6: how far the damage has spread through the left and the right figure (0 to 1). */
  rot?: (shortcutAllowed: boolean) => [number, number];
  /** Size of the scene in world units that must stay visible. The camera backs off to fit it. */
  fitW: number;
  fitH: number;
  /** Where the camera looks, left to right. Used to centre shapes that are not centred on zero. */
  cx?: number;
  /** The same, up and down. */
  cy?: number;
  /** On a phone, the text panel is taller in this step, so the scene sits smaller and higher. */
  tallPanel?: boolean;
  /** On a phone, a taller fitH, for scenes whose labels need more room above and below. */
  phoneFitH?: number;
  /** How much the camera drifts around. */
  orbit: number;
  /** Share of cloud particles tinted amber ("money"). */
  warm: number;
  /** Speed the wheel turns on its own, in radians per second (clockwise). */
  autoSpin: number;
  wheelDrag: boolean;
  structure: (i: Interact) => number;
  density: (i: Interact) => number;
  brightness: (i: Interact) => number;
};

export const SPECS: Record<SceneKey, SceneSpec> = {
  intro: {
    shape: "cloud", lines: "loose", drift: 1, shake: false, autoSweep: 0, fitW: 5.6, fitH: 5.2, orbit: 0.05, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 0,
    density: () => 0.42,
    brightness: () => 0.8,
  },
  // The cloud gathers energy: brighter, denser, starting to connect, just before the engine starts.
  basics: {
    shape: "cloud", lines: "loose", drift: 1, shake: false, autoSweep: 0,
    fitW: 4.8, fitH: 4.6, orbit: 0.06, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 0.3,
    density: () => 0.75,
    brightness: () => 1,
  },
  compute: {
    shape: "cloud", lines: "loose", drift: 1, shake: false, autoSweep: 0, tallPanel: true, fitW: 4.8, fitH: 4.6, orbit: 0.06, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: (i) => i.compute,
    density: (i) => 0.42 + 0.58 * i.compute,
    brightness: (i) => 0.8 + 0.35 * i.compute,
  },
  money: {
    shape: "cloud", lines: "loose", drift: 1, shake: false, autoSweep: 0, fitW: 4.4, fitH: 4.2, orbit: 0.07, warm: 0.24, autoSpin: 0, wheelDrag: false,
    structure: (i) => Math.max(0.55, i.compute),
    density: () => 0.8,
    brightness: () => 0.95,
  },
  wheel: {
    shape: "wheel", lines: "loose", drift: 1, shake: false, autoSweep: 0, fitW: 8.6, fitH: 7.2, orbit: 0, warm: 0.08, autoSpin: 0.07, wheelDrag: true,
    structure: (i) => 0.25 + 0.75 * i.boost,
    density: (i) => 0.4 + 0.6 * i.boost,
    brightness: (i) => 0.7 + 0.45 * i.boost,
  },
  wheelFast: {
    shape: "wheel", lines: "loose", drift: 1, shake: false, autoSweep: 0, fitW: 8.6, fitH: 7.2, orbit: 0, warm: 0.12, autoSpin: 1.1, wheelDrag: true,
    structure: () => 1,
    density: () => 1,
    brightness: () => 1.2,
  },
  flow: {
    shape: "flow", lines: "none", drift: 0.04, shake: true, autoSweep: 0,
    fitW: 5.9, fitH: 5.9, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 0.75,
    brightness: () => 0.85,
  },
  netForm: {
    shape: "net", lines: "net", drift: 0.35, shake: false, autoSweep: 3.2, cx: -0.65,
    fitW: 6.4, fitH: 4.8, orbit: 0.05, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 0.75,
    brightness: () => 0.8,
  },
  netGame: {
    shape: "net", lines: "net", drift: 0.3, shake: false, autoSweep: 0,
    fitW: 7.8, fitH: 4.8, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 0.85,
    brightness: () => 0.8,
  },
  netFast: {
    shape: "net", lines: "net", drift: 0.3, shake: false, autoSweep: 0.55, cx: -0.65,
    fitW: 6.4, fitH: 4.8, orbit: 0.06, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.9,
  },
  stream: {
    shape: "stream", lines: "net", drift: 0.25, shake: false, autoSweep: 2.6, flowSpeed: 0.05, netScale: 0.5,
    fitW: 6.5, fitH: 6.4, orbit: 0.03, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 0.9,
    brightness: () => 0.8,
  },
  streamWarm: {
    shape: "stream", lines: "net", drift: 0.25, shake: false, autoSweep: 2.2, flowSpeed: 0.035, netScale: 0.5,
    fitW: 4.4, fitH: 4.2, orbit: 0.06, warm: 0.3, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.85,
  },
  streamIn: {
    shape: "stream", lines: "net", drift: 0.25, shake: false, autoSweep: 1.4, flowSpeed: 0.09, netScale: 0.5,
    fitW: 5.4, fitH: 5.2, orbit: 0.05, warm: 0.6, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.95,
  },
  inside: {
    shape: "cloud", lines: "loose", drift: 0.6, shake: false, autoSweep: 0,
    fitW: 3.6, fitH: 3.4, orbit: 0.12, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.95,
  },
  beams: {
    shape: "beams", lines: "none", drift: 0.3, shake: false, autoSweep: 0, beams: "pick", cy: -0.65,
    fitW: 7.6, fitH: 7.8, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 0.9,
    brightness: () => 0.6,
  },
  beamsAll: {
    shape: "beams", lines: "none", drift: 0.3, shake: false, autoSweep: 0, beams: "all", cy: -0.65,
    fitW: 7.6, fitH: 7.8, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.6,
  },
  concept: {
    shape: "beams", lines: "none", drift: 0.4, shake: false, autoSweep: 0, beams: "core",
    fitW: 3.4, fitH: 3.2, orbit: 0.1, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.7,
  },
  emotions: {
    shape: "cloud", lines: "loose", drift: 0.5, shake: false, autoSweep: 0,
    fitW: 5.6, fitH: 4.6, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.7,
  },
  alarm: {
    shape: "cloud", lines: "loose", drift: 0.5, shake: false, autoSweep: 0,
    fitW: 5.6, fitH: 6.6, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.7,
  },
  state: {
    shape: "cloud", lines: "loose", drift: 0.5, shake: false, autoSweep: 0,
    fitW: 4.6, fitH: 4.2, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.7,
  },
  steer: {
    shape: "cloud", lines: "loose", drift: 0.5, shake: false, autoSweep: 0,
    fitW: 5.6, fitH: 4.6, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.7,
  },
  figure: {
    shape: "figure", lines: "none", drift: 0.22, shake: false, autoSweep: 0,
    fitW: 4.4, fitH: 4.6, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.9,
    rot: () => [0, 0],
  },
  figureRot: {
    shape: "figure", lines: "none", drift: 0.22, shake: false, autoSweep: 0,
    fitW: 4.4, fitH: 4.6, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.9,
    rot: () => [1, 1],
  },
  pair: {
    shape: "figures", lines: "none", drift: 0.22, shake: false, autoSweep: 0, cy: 0.55,
    fitW: 5.5, fitH: 5.5, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.9,
    rot: (allowed) => [1, allowed ? 0 : 1],
  },
  pairStory: {
    shape: "figures", lines: "none", drift: 0.22, shake: false, autoSweep: 0, cy: 0.55,
    fitW: 5.5, fitH: 5.5, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.9,
    rot: () => [1, 0],
  },
  bars: {
    shape: "bars", lines: "radar", drift: 0.02, shake: false, autoSweep: 0,
    fitW: 7.5, fitH: 6.2, phoneFitH: 7.3, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.55,
  },
  bars3: {
    shape: "bars", lines: "radar", drift: 0.02, shake: false, autoSweep: 0,
    fitW: 7.5, fitH: 6.2, phoneFitH: 7.3, orbit: 0, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.55,
  },
  garden: {
    shape: "garden", lines: "none", drift: 0.3, shake: false, autoSweep: 0, cy: 0.35, grow: true,
    fitW: 6.6, fitH: 5.2, orbit: 0.02, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.85,
  },
  together: {
    shape: "together", lines: "none", drift: 0.3, shake: false, autoSweep: 0, cy: -0.1,
    fitW: 6.5, fitH: 4.4, orbit: 0.03, warm: 0, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.85,
  },
  storyStream: {
    shape: "stream", lines: "net", drift: 0.25, shake: false, autoSweep: 2.4, flowSpeed: 0.05, netScale: 0.5,
    fitW: 5.6, fitH: 5.4, orbit: 0.05, warm: 0.45, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.9,
  },
  whole: {
    shape: "whole", lines: "none", drift: 0.3, shake: false, autoSweep: 0, cy: 0.25, turn: 0.14,
    fitW: 7.0, fitH: 5.4, orbit: 0, warm: 0.12, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.85,
  },
  wholeEnd: {
    shape: "whole", lines: "none", drift: 0.3, shake: false, autoSweep: 0, cy: -0.9, turn: 0.09,
    fitW: 7.6, fitH: 5.8, orbit: 0, warm: 0.2, autoSpin: 0, wheelDrag: false,
    structure: () => 1,
    density: () => 1,
    brightness: () => 0.9,
  },
};

/** A patch of the scene that glows in its own colour. */
export type Hot = { pos: number[]; r: number; amt: number; color: string };

export const EMOTIONS = [
  { word: "afraid", color: "#ff6a45" },
  { word: "calm", color: "#cfe2ff" },
  { word: "loving", color: "#ffb469" },
  { word: "desperate", color: "#ff4d3a" },
];
const SHORTCUT = "#ffb469";

/**
 * Which patches glow right now. "t" is seconds since the step began,
 * "alarm" is how far the alarm in chapter 5 has spread (0 to 1).
 */
export function hotRegions(key: SceneKey, t: number, alarm: number, still: boolean): Hot[] {
  const wave = (period: number) => (still ? 0.8 : Math.pow(Math.sin(Math.PI * ((t % period) / period)), 0.7));
  switch (key) {
    case "emotions": {
      const k = still ? 0 : Math.floor(t / 2.6) % 4;
      return [{ pos: EMOTION_SPOTS[k], r: 0.85, amt: wave(2.6), color: EMOTIONS[k].color }];
    }
    case "alarm":
      return [{ pos: [0.2, 0.1, 0], r: 0.35 + 1.25 * alarm, amt: alarm, color: EMOTIONS[0].color }];
    case "state":
      return [{ pos: [0.2, 0.1, 0], r: 1.2, amt: 0.5 + (still ? 0 : 0.12 * Math.sin(t * 1.6)), color: EMOTIONS[0].color }];
    case "steer": {
      const k = still ? 0 : Math.floor(t / 3.2) % 2;
      return [{ pos: EMOTION_SPOTS[k ? 1 : 0], r: 0.95, amt: wave(3.2), color: EMOTIONS[k ? 1 : 3].color }];
    }
    case "figure":
    case "figureRot":
      return [{ pos: [BODY.torso[0], BODY.torso[1], 0], r: 0.42, amt: Math.min(1, t / 1.5), color: SHORTCUT }];
    case "pair":
    case "pairStory":
      return [-1, 1].map((side) => ({ pos: [side * FIGURE_X, BODY.torso[1], 0], r: 0.42, amt: 1, color: SHORTCUT }));
    case "bars3":
      // The three kinds of work the talk singles out: their spokes glow amber.
      return RADAR_HUMAN.map((r) => ({
        pos: [Math.cos(radarAngle(r.k)) * RADAR_SPOKE * 0.55, Math.sin(radarAngle(r.k)) * RADAR_SPOKE * 0.55, 0],
        r: 1.25,
        amt: Math.min(1, t / 1.2),
        color: SHORTCUT,
      }));
    default:
      return [];
  }
}

/** Full turns of the wheel needed to bring the cloud to full strength. */
export const TURNS_TO_FULL = 3;
