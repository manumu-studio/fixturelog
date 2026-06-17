// logoPaths.ts — geometry for the FixtureLog circular monogram (three knobs).
//
// The mark is ONE incomplete capital-M (left vertical -> down to the valley ->
// third diagonal up into the top-right corner) plus the SAME M rotated 180
// degrees about the centre (50,50). Because the twin is an exact rotation, the
// figure can never drift out of symmetry.
//
// Each M is drawn FULL: its diagonal arm (line 3) runs all the way into its
// corner and stays intact. The two breaks live at the top-right and bottom-left
// corners, where the OPPOSITE M's vertical is recessed. The recession is an
// ANGLED clip plane (a polygon, not a stroke cap) cut PARALLEL to line 3, so the
// vertical's end face and line 3's interior border are parallel: closing the gap
// would slide the vertical back against the diagonal and reform the corner.

/** Normalized viewBox for the FixtureLog circular monogram mark. */
export const LOGO_VIEWBOX = { width: 100, height: 100 } as const;

// --- Knobs: change these to retune the mark ----------------------------------
/** ratio — circle size: radius in viewBox units (centre 50,50). Bigger = wider ring. */
export const RATIO = 30.3;
/** thickness — outline weight (overridable per instance via the `strokeWidth` prop). */
export const THICKNESS = 2.2;
/** corner_gap — perpendicular width of the slanted slot between line 3 and the recessed vertical. */
export const CORNER_GAP = 2.2;
// -----------------------------------------------------------------------------

type Point = readonly [number, number];

/** Which angled corner the clip plane recesses (none = uncut). */
export type LogoClip = "none" | "topRight" | "bottomLeft";

export interface LogoSegment {
  readonly d: string;
  readonly clip: LogoClip;
}

const CENTRE_SPAN = 100; // p -> (100 - x, 100 - y) is the exact 180deg rotation about (50,50).
const CENTRE: Point = [50, 50];
const TOP_RIGHT: Point = [62.5, 37];
const BOTTOM_LEFT: Point = [37.5, 63];
const VALLEY: Point = [50, 48];
const LEFT_X = 37.5;
const TOP_Y = 37;
const BIG = 300; // half-plane polygons extend this far past the 100x100 viewBox.

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function rotate180([x, y]: Point): Point {
  return [CENTRE_SPAN - x, CENTRE_SPAN - y];
}

function sub(a: Point, b: Point): Point {
  return [a[0] - b[0], a[1] - b[1]];
}

function add(a: Point, b: Point): Point {
  return [a[0] + b[0], a[1] + b[1]];
}

function scale(a: Point, k: number): Point {
  return [a[0] * k, a[1] * k];
}

function dot(a: Point, b: Point): number {
  return a[0] * b[0] + a[1] * b[1];
}

function unit([x, y]: Point): Point {
  const length = Math.hypot(x, y) || 1;
  return [x / length, y / length];
}

function toPath(points: readonly Point[]): string {
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${round(x)} ${round(y)}`)
    .join(" ");
}

// Line 3 runs valley -> corner; this is its unit direction (shared by both Ms).
const DIR3 = unit(sub(TOP_RIGHT, VALLEY));

/** The DIR3-perpendicular that points from `from` toward the centre (the kept side). */
function normalTowardCentre(from: Point): Point {
  const perp: Point = [DIR3[1], -DIR3[0]];
  return dot(perp, sub(CENTRE, from)) >= 0 ? perp : scale(perp, -1);
}

// Half-plane polygon: keep everything at least CORNER_GAP + THICKNESS/2 toward
// the centre of a line through `corner` running parallel to line 3. The recessed
// face ends up parallel to line 3's interior border, opening the slanted slot.
function cornerClipPolygon(corner: Point): string {
  const inward = normalTowardCentre(corner);
  const cut = add(corner, scale(inward, THICKNESS / 2 + CORNER_GAP));
  const along = scale(DIR3, BIG);
  const a = sub(cut, along);
  const b = add(cut, along);
  const corners: readonly Point[] = [a, b, add(b, scale(inward, BIG)), add(a, scale(inward, BIG))];
  return corners.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
}

function buildCircle(radius: number): string {
  const top = round(50 - radius);
  const bottom = round(50 + radius);
  return `M 50 ${top} A ${radius} ${radius} 0 1 1 50 ${bottom} A ${radius} ${radius} 0 1 1 50 ${top}`;
}

function buildSegments(): readonly LogoSegment[] {
  // Upright M: left-vertical bottom -> top -> valley -> top-right corner (full).
  const upright: readonly Point[] = [
    [LEFT_X, BOTTOM_LEFT[1]],
    [LEFT_X, TOP_Y],
    VALLEY,
    TOP_RIGHT,
  ];
  const twin = upright.map(rotate180);
  return [
    { d: buildCircle(RATIO), clip: "none" },
    // Upright's vertical bottom is recessed at the bottom-left; its line 3 stays full.
    { d: toPath(upright), clip: "bottomLeft" },
    // Twin's vertical top is recessed at the top-right; its line 3 stays full.
    { d: toPath(twin), clip: "topRight" },
  ];
}

/** Circle plus the two incomplete-M strokes, computed from the knobs above. */
export const LOGO_SEGMENTS = buildSegments();

/** Angled clip polygons (points strings): one per recessed corner. */
export const LOGO_CLIP = {
  topRight: cornerClipPolygon(TOP_RIGHT),
  bottomLeft: cornerClipPolygon(BOTTOM_LEFT),
} as const;
