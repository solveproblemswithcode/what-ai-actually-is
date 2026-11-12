// Values that change every frame and are shared between the 3D scene and the HTML.
// Kept outside React so that dragging the wheel does not re-render the page.

type Listener = () => void;

export const live = {
  /** True while a finger or mouse is dragging something in the scene. Blocks swipe navigation. */
  dragging: false,
  /** How far the wheel has been turned in total, in full turns. */
  turns: 0,
  /** A push for the wheel, added by the "Spin" button. */
  impulse: 0,
  /** The guessing game talks to the layered network through these. */
  net: {
    /** When the last wave of light started (performance.now()), or 0. */
    sweepAt: 0,
    /** 1 = a guess running forward, -1 = a correction running backward. */
    sweepDir: 1 as 1 | -1,
    /** How brightly each of the three answer paths glows. */
    glow: [0, 0, 0],
    /** 1 if that answer is currently marked wrong. */
    wrong: [0, 0, 0],
    /** Set to 1 to make the connections visibly shift. Fades by itself. */
    nudge: 0,
  },
  /** Chapter 4: the language beams. */
  beam: {
    /** How brightly each of the three beams glows. */
    glow: [0, 0, 0],
    /** When the last pulse started (performance.now()), or 0. */
    ringAt: 0,
    /** -1 = the question travelling in, 1 = the answer travelling out. */
    ringDir: -1 as 1 | -1,
    /** 1 when the node in the middle is lit. */
    core: 0,
  },
  /** Chapter 5: 1 once the emergency message has arrived and the alarm should spread. */
  alarm: 0,
  /** Chapter 6: the toggle. True means the model was told the shortcut is allowed. */
  allowed: true,
  /** Chapter 6: set to true to make the right figure's damage start again from nothing. */
  restartRot: false,
  /** Chapter 8: set to 1 when the visitor adds their sentence. The middle of the form flashes, then it fades. */
  flash: 0,
};

/** How long a pulse takes to travel along a beam, in milliseconds. */
export const RING_MS = 900;

/** How long one wave of light takes to cross the network, in milliseconds. */
export const SWEEP_MS = 950;

const listeners = new Set<Listener>();
let shownTurns = 0;

export function subscribeTurns(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getWholeTurns() {
  return shownTurns;
}

/** Called by the scene. Only notifies React when a full turn is completed. */
export function reportTurns(total: number) {
  live.turns = total;
  const whole = Math.floor(total);
  if (whole !== shownTurns) {
    shownTurns = whole;
    listeners.forEach((fn) => fn());
  }
}
