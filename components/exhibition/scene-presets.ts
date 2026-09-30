export type SceneKind = "harbor" | "yard" | "observatory" | "archive" | "water" | "gallery" | "signal" | "canvas" | "studio";

export type ScenePreset = {
  horizon: number;
  water: number;
  depth: number;
  model: "airship" | "sailboat" | null;
  anchor: [number, number];
  scale: number;
};

// Coordinates refer to the original painting, with (0, 0) at its top left.
export const scenePresets: Record<SceneKind, ScenePreset> = {
  harbor: { horizon: .74, water: 1, depth: 1.15, model: "airship", anchor: [.73, .43], scale: .64 },
  yard: { horizon: .69, water: .65, depth: 1.4, model: "airship", anchor: [.47, .36], scale: .38 },
  observatory: { horizon: .64, water: .7, depth: 1.65, model: "airship", anchor: [.54, .4], scale: .23 },
  archive: { horizon: .67, water: .55, depth: 1.75, model: "sailboat", anchor: [.76, .71], scale: .24 },
  water: { horizon: .72, water: .35, depth: .8, model: "sailboat", anchor: [.73, .76], scale: .2 },
  gallery: { horizon: .65, water: .4, depth: 1.2, model: null, anchor: [.7, .5], scale: 0 },
  signal: { horizon: .7, water: .35, depth: 1.25, model: null, anchor: [.7, .5], scale: 0 },
  canvas: { horizon: .75, water: .1, depth: .55, model: null, anchor: [.7, .5], scale: 0 },
  studio: { horizon: .65, water: .1, depth: 1.4, model: null, anchor: [.7, .5], scale: 0 },
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Art-directed depth fields preserve straight architecture and avoid rubber-sheet motion. */
export function paintingDepth(kind: SceneKind, x: number, y: number): number {
  const p = scenePresets[kind];
  const foreground = smooth(p.horizon - .03, 1, y);
  const city = smooth(.38, .9, x) * smooth(.22 + (1 - x) * .52, .85, y);
  let depth = .06 + foreground * .85 + city * .48;
  if (kind === "observatory") depth += smooth(.61, .88, x) * smooth(.32, .82, y) * .9;
  if (kind === "archive" || kind === "studio") {
    depth = .08 + (1 - smooth(.21, .39, x)) * .9 + smooth(.75, 1, y) * 1.15 + (1 - smooth(0, .14, y)) * .5;
  }
  if (kind === "canvas" || kind === "water") depth *= smooth(.28, .92, y) * .65;
  return depth * p.depth;
}

export function paintingWater(kind: SceneKind, x: number, y: number): number {
  const p = scenePresets[kind];
  let mask = smooth(p.horizon, p.horizon + .08, y);
  if (kind === "harbor" || kind === "yard" || kind === "observatory") mask *= 1 - smooth(.34, .88 - (y - p.horizon) * .65, x);
  if (kind === "archive") mask *= smooth(.33, .42, x) * (1 - smooth(.73, .8, y));
  if (kind === "water") mask *= smooth(.57, .72, x) * (1 - smooth(.84, .92, y));
  return mask * p.water;
}
