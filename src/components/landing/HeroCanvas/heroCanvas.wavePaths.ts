// heroCanvas.wavePaths.ts — SSY wave swash paths sampled for HeroCanvas dot placement.

export const WAVE_VIEWBOX = { width: 80, height: 57 } as const;

/** Shared wave swash used for all three stacked ribbon layers in the hero animation. */
export const WAVE_PATHS = [
  'M27.9746 18.9023C29.6059 20.356 33.2861 23.0001 37.9946 23.0001C49.8652 23.0001 55.8155 5.19852 64.3461 3.47967C68.0925 2.72368 70.1188 4.62306 70.9996 5.82663C69.909 1.8793 64.847 -1.11459 59.2255 1.9075C51.0636 6.29678 45.6216 18.7312 36.2348 20.2864C32.7795 20.86 30.3317 20.2074 27.9746 18.9023Z',
] as const;

export interface PathPoint {
  readonly x: number;
  readonly y: number;
}

const SAMPLE_COUNT = 140;
let cachedSamples: PathPoint[][] | null = null;

function samplePath(pathD: string, samples: number): PathPoint[] {
  if (typeof document === 'undefined') {
    return [];
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  const length = path.getTotalLength();
  const points: PathPoint[] = [];

  for (let i = 0; i < samples; i += 1) {
    const point = path.getPointAtLength((i / (samples - 1)) * length);
    points.push({ x: point.x, y: point.y });
  }

  return points;
}

export function getWavePathSamples(): PathPoint[][] {
  if (cachedSamples) {
    return cachedSamples;
  }

  cachedSamples = WAVE_PATHS.map((pathD) => samplePath(pathD, SAMPLE_COUNT));
  return cachedSamples;
}

export function resetWavePathSamples(): void {
  cachedSamples = null;
}

export function interpolatePath(points: PathPoint[], t: number): PathPoint {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const clamped = ((t % 1) + 1) % 1;
  const scaled = clamped * (points.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, points.length - 1);
  const blend = scaled - index;
  const a = points[index];
  const b = points[nextIndex];

  if (!a || !b) {
    return a ?? b ?? { x: 0, y: 0 };
  }

  return {
    x: a.x + (b.x - a.x) * blend,
    y: a.y + (b.y - a.y) * blend,
  };
}
