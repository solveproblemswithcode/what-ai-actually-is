import { useCallback, useEffect, useRef, useState } from "react";
import { live, RING_MS } from "./live";

/**
 * Chapter 4: the visitor picks a language. A pulse runs in along that beam,
 * the node in the middle lights up, and the answer runs back out.
 */
export function useBeams(active: boolean) {
  const [picked, setPicked] = useState(-1);
  const [stage, setStage] = useState<"idle" | "in" | "core" | "done">("idle");
  const [answered, setAnswered] = useState([false, false, false]);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const pick = useCallback((k: number) => {
    clear();
    const b = live.beam;
    setPicked(k);
    setStage("in");
    b.glow = [0.06, 0.06, 0.06];
    b.glow[k] = 0.5;
    b.core = 0;
    b.ringDir = -1;
    b.ringAt = performance.now();
    timers.current.push(
      window.setTimeout(() => {
        setStage("core");
        b.core = 1;
      }, RING_MS),
      window.setTimeout(() => {
        b.ringDir = 1;
        b.ringAt = performance.now();
      }, RING_MS + 550),
      window.setTimeout(() => {
        setStage("done");
        setAnswered((a) => a.map((v, i) => v || i === k));
      }, RING_MS * 2 + 550),
    );
  }, []);

  useEffect(() => {
    if (!active) {
      clear();
      setStage((s) => (s === "in" || s === "core" ? "idle" : s));
      return;
    }
    // Coming (back) to this step: show the beams faintly, keep whatever was already answered.
    live.beam.glow = [0.06, 0.06, 0.06].map((v, i) => (i === picked && stage === "done" ? 0.5 : v));
    live.beam.core = stage === "done" ? 1 : 0;
    // Only when the step becomes active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  useEffect(() => clear, []);

  return { picked, stage, answered, pick, coreLit: stage === "core" || stage === "done" };
}

export type Beams = ReturnType<typeof useBeams>;
