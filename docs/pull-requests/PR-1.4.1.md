# PR — v1.4.1 — Landing logo animation parity

**Branch:** `feat/voice-copilot` → `main`
**Type:** Fix (UI polish)

## What this PR does

Polishes the public landing nav logo so it matches the actual FixtureLog mark and uses the same animation shape as the OR Studio reference:

- replaces the simplified three-path draft with a circle plus two separated incomplete capital-M strokes, one upright and one flipped;
- adds a delayed completed-mark reveal under the stroke-draw animation;
- keeps the implementation on `motion.path` so the existing landing tests and Motion mock keep working;
- adjusts the nav instance stroke width to `2.2` so the lines read finer at small size.

## Why it was needed

The Cursor draft copied the idea of the OR Studio animation but not the FixtureLog logo geometry. The mark should create the illusion of two incomplete capital M shapes, separated by a small center gap.

## Verification

```bash
npx eslint src/components/landing/AnimatedLogo/AnimatedLogo.tsx src/components/landing/AnimatedLogo/logoPaths.ts src/components/landing/AnimatedLogo/AnimatedLogo.types.ts src/components/landing/LandingNav/LandingNav.tsx
npx vitest run src/app/page.test.tsx
npx tsc -p tsconfig.build.json --noEmit
npx eslint . --ext .ts,.tsx
npx next build --no-lint
```

Notes:

- Full ESLint exits with zero errors and six existing Prisma seed warnings.
- The local sandbox blocked binding a dev server port, so visual inspection used a Playwright inline SVG render of the rebuilt paths.

## Deployment notes

No migration, no environment variable change, no API change.
