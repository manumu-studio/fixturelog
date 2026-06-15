// seed-image-assets.test.ts — non-destructive audit of the vessel seed data.
// It verifies that the seed keeps unique vessel identifiers and that every
// referenced seeded image asset exists.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SEED = readFileSync(join(ROOT, 'prisma/seed.ts'), 'utf8');

function matches(pattern: RegExp): string[] {
  return [...SEED.matchAll(pattern)].map((m) => m[1]).filter((value): value is string => value !== undefined);
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupe = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dupe.add(value);
    seen.add(value);
  }
  return [...dupe].sort();
}

describe('vessel image seed audit', () => {
  it('keeps seeded vessel IMO and MMSI values unique', () => {
    expect(duplicates(matches(/imo: '([^']+)'/g))).toEqual([]);
    expect(duplicates(matches(/mmsi: '([^']+)'/g))).toEqual([]);
  });

  it('keeps the intended 30-vessel demo fleet count', () => {
    expect(matches(/imo: '([^']+)'/g)).toHaveLength(30);
  });

  it('references committed vessel image assets only', () => {
    const imagePaths = matches(/'((?:\/assets\/vessels\/)[^']+)'/g);

    expect(imagePaths.length).toBeGreaterThan(0);
    for (const imagePath of imagePaths) {
      expect(existsSync(join(ROOT, 'public', imagePath))).toBe(true);
    }
  });

  it('labels seeded stock images as representative, not named-vessel photos', () => {
    expect(SEED).toContain("imageSource: 'STOCK'");
    expect(SEED).toContain('representative of the vessel type');
    expect(SEED).toContain('not a photograph of this vessel');
  });
});
