import { useCallback, useEffect, useRef, useState } from "react";
import { live } from "./live";

/**
 * Chapter 5: a short scripted scene. 0 = nothing yet, 1 = the message arrives,
 * 2 = the fear-like pattern spreads, 3 = the reply appears.
 */
export function useAlarm(active: boolean) {
  const [stage, setStage] = useState(0);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const play = useCallback(() => {
    clear();
    setStage(0);
    live.alarm = 0;
    timers.current.push(
      window.setTimeout(() => setStage(1), 700),
      window.setTimeout(() => {
        setStage(2);
        live.alarm = 1;
      }, 2300),
      window.setTimeout(() => setStage(3), 4700),
    );
  }, []);
  useEffect(() => {
    if (active) play();
    else {
      clear();
      live.alarm = 0;
    }
    return clear;
  }, [active, play]);
  return { stage, play };
}

export type Alarm = ReturnType<typeof useAlarm>;
