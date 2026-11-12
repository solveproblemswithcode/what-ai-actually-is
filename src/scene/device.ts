// Decides how heavy the 3D scene may be on this device.

export type Tier = { name: "low" | "mid" | "high"; particles: number; maxDpr: number };

export function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = nav.hardwareConcurrency || 4;
  const mem = nav.deviceMemory || 4;
  const forced = new URLSearchParams(location.search).get("tier");
  let name: Tier["name"] = "high";
  if (coarse && (cores <= 4 || mem <= 3)) name = "low";
  else if (coarse || cores <= 4) name = "mid";
  if (forced === "low" || forced === "mid" || forced === "high") name = forced;
  if (name === "low") return { name, particles: 14000, maxDpr: 1.5 };
  if (name === "mid") return { name, particles: 28000, maxDpr: 2 };
  return { name, particles: 56000, maxDpr: 2 };
}

export function hasWebGL(): boolean {
  if (new URLSearchParams(location.search).has("fallback")) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (new URLSearchParams(location.search).has("reduced")) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
