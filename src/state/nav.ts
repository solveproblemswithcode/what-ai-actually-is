import { useCallback, useEffect, useMemo, useState } from "react";
import { CHAPTERS } from "../content/chapters";
import { live } from "./live";

type Pos = { chapter: number; step: number };

const FLAT: Pos[] = CHAPTERS.flatMap((c, ci) => c.steps.map((_, si) => ({ chapter: ci, step: si })));

function fromHash(): number {
  const m = /^#chapter-(\d+)$/.exec(location.hash);
  if (!m) return 0;
  const i = FLAT.findIndex((p) => CHAPTERS[p.chapter].id === Number(m[1]));
  return i < 0 ? 0 : i;
}

/** Keeps track of where the visitor is, and keeps the address bar in step (for example #chapter-1). */
export function useNav() {
  const [index, setIndex] = useState(fromHash);
  const pos = FLAT[index];

  const go = useCallback((i: number) => setIndex(Math.min(FLAT.length - 1, Math.max(0, i))), []);
  const next = useCallback(() => setIndex((i) => Math.min(FLAT.length - 1, i + 1)), []);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goChapter = useCallback((id: number) => {
    const i = FLAT.findIndex((p) => CHAPTERS[p.chapter].id === id);
    if (i >= 0) setIndex(i);
  }, []);

  useEffect(() => {
    const hash = `#chapter-${CHAPTERS[pos.chapter].id}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }, [pos.chapter]);

  useEffect(() => {
    const onHash = () => {
      const i = fromHash();
      setIndex((cur) => (FLAT[cur].chapter === FLAT[i].chapter ? cur : i));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return useMemo(
    () => ({ index, total: FLAT.length, chapter: pos.chapter, step: pos.step, go, next, prev, goChapter }),
    [index, pos.chapter, pos.step, go, next, prev, goChapter],
  );
}

/** Scroll, arrow keys and swipes all move one step. */
export function useAdvanceInputs(next: () => void, prev: () => void, blocked: boolean) {
  useEffect(() => {
    if (blocked) return;
    let coolUntil = 0;
    let acc = 0;
    const step = (dir: 1 | -1) => {
      const now = performance.now();
      if (now < coolUntil) return;
      coolUntil = now + 850;
      acc = 0;
      (dir === 1 ? next : prev)();
    };

    const inPanel = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-noswipe]");

    const onWheel = (e: WheelEvent) => {
      if (inPanel(e.target) || e.ctrlKey) return;
      acc += e.deltaY;
      if (Math.abs(acc) > 50) step(acc > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      const onButton = el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement;
      if (e.key === "PageDown") step(1);
      else if (e.key === "PageUp") step(-1);
      else if (typing) return;
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") step(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") step(-1);
      else if (e.key === " " && !onButton) step(1);
      else return;
      e.preventDefault();
    };

    let sx = 0, sy = 0, tracking = false;
    const onTouchStart = (e: TouchEvent) => {
      tracking = e.touches.length === 1 && !inPanel(e.target);
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking || live.dragging) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < 48) return;
      // Swipe up or left goes forward, down or right goes back.
      if (ay > ax * 1.2) step(dy < 0 ? 1 : -1);
      else if (ax > ay * 1.2) step(dx < 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, prev, blocked]);
}
