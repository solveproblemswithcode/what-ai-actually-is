// Words that are pinned to places in the 3D scene. The words themselves are ordinary HTML
// (so screen readers and translators can read them); the scene only moves them around.

export type Pinned = {
  el: HTMLElement;
  pos: [number, number, number];
  /** True if the word rides on the spinning wheel. */
  spin: boolean;
};

export const pinned = new Set<Pinned>();
