# ENTRY-010 — Real vessel imagery (Wikimedia CC) + Lightbox cleanup

**Date:** 2026-06-14
**Type:** Enhancement (demo data + UI)
**Version:** v1.3.0 (real-imagery pass)
**Branch:** `feat/client-portal`

## Summary

The fleet stops being illustrated entirely by house-art SVGs. **21 of the 30 demo vessels** — those whose names echo real offshore ships — now display a **Creative Commons photograph of the real, same-named vessel** from Wikimedia Commons, and **16 vessels** carry that ship's **real IMO** (a public-registry fact). The remaining 9 keep the per-type SVG. Two small Fleet-Explorer UI fixes ride along: the Lightbox next/back arrows are gone and the modal's image list is de-duplicated.

## Why Wikimedia, not VesselFinder

The first attempt downloaded photos from VesselFinder's image CDN. Those are **copyrighted by the individual photographers and redistributing them breaches VesselFinder's ToS** — and the original plan ([docs/fleet-real-data-mapping.md](../fleet-real-data-mapping.md)) had already ruled them out. We switched to **Wikimedia Commons**, where each photo is CC-licensed and can be reused with attribution. Every photo's **author + licence** was captured from the Commons API and rendered into the honesty credit:

> `Photo: <author>, <licence> via Wikimedia Commons — a real vessel of the same name, not this demo vessel.`

`imageSource=WIKIMEDIA`. Labelling these `WIKIMEDIA`/CC is only honest because the attribution is real — so we never relabel a non-CC image as CC.

## Key decisions

- **Honesty over coverage.** 4 vessels whose only Commons match was an unrelated/incidental ship (Viking Storm → "Blue Viking", Olympic Hercules → "Lerwick shipping", Siem Atlas → "Rio de Janeiro", Siem Mariner → "Aberdeen Harbour") were **left as SVGs** rather than mislabelled as that vessel.
- **Real IMO, synthetic everything-else.** The 16 IMO-matched vessels get the real IMO; MMSI and all specs stay synthetic for every vessel, so even a real-IMO row will not reconcile as a whole against a live AIS/MarineTraffic lookup. The credit line states the photo is *of a vessel of the same name, not this demo record*.
- **One photo, no carousel.** Each vessel has a single image. `VesselModal` now de-duplicates `[imageUrl, ...images]`, so the Lightbox renders one frame; its prev/next arrows were removed (a one-image gallery had nothing to navigate, and the duplicate created a phantom 2-slide carousel).
- **Repo weight.** Source files reached 18 MB; all 21 were downscaled to ≤1440px / ~80% JPEG (75 MB → 6.7 MB).

## Files touched

- `prisma/seed.ts` — `REAL_VESSEL_PHOTO` map (`{slug, author, license}`) + `realVesselImage()` (`imageSource=WIKIMEDIA`); 16 real IMOs swapped in.
- `public/assets/vessels/real/*.jpg` — 21 CC photos (downscaled).
- `src/components/portal/Lightbox/Lightbox.tsx` — removed the next/back nav buttons.
- `src/features/fleet-explorer/VesselModal/VesselModal.tsx` — de-duplicate the image list.
- Docs: `CHANGELOG.md`, `README.md`, `docs/fleet-roster.md`, `docs/fleet-real-data-mapping.md`.

## Validation

- `npx prisma db seed` → 21 `WIKIMEDIA` + 9 `STOCK`.
- `npm run typecheck` — no new errors (5 pre-existing errors are in unrelated landing WIP). `npm run lint` clean. `npm test` → **322 passing / 47 files** (incl. the seed-image honesty audit).
- `next build` / e2e remain blocked by the in-progress landing WIP typecheck errors — unrelated to this change.
