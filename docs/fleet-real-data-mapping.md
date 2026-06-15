# Fleet real-data upgrade — mapping & plan (queued for a fresh session)

Goal: replace the placeholder vessel identity/imagery with **license-clean real data** for the
vessels whose names match real ships. Keep the honesty stance intact.

## The honest pattern (per vessel)
real name → **real IMO** (public registry fact) → **real specs** (built/GT/dims, facts) →
**Wikimedia Commons photo** (CC-licensed) with attribution.

- `imageSource = WIKIMEDIA`
- `imageCredit` template (use verbatim — this is what keeps it honest):
  > "Photo: <author>, <CC licence> via Wikimedia Commons — a real vessel of the same name, not the demo vessel."
- **Do NOT** use VesselFinder `static.vesselfinder.net/ship-photo/…` images (© photographer, against ToS).
- Verify each real IMO's **vessel type matches our seeded type** before committing (name matches can be a different ship class).
- Leave the unmatched vessels (~5–14) as the honest SVGs.

## Real IMOs recovered via VesselFinder (by name) — 16
Normand Pioneer 9179751 · Normand Ranger 9413432 · Skandi Olympia 9417359 ·
Havila Phoenix 9407990 · Island Vanguard 9356189 · Viking Prince 9596296 ·
Olympic Zeus 9424728 · Siem Pilot 9510307 · Normand Drott 9447964 · Skandi Vega 9435715 ·
Island Challenger 9371696 · Normand Vision 9665530 · Skandi Constructor 9431642 ·
Island Performer 9682045 · Olympic Energy 9603829 (no photo) · Skandi Acergy 9387217

## Wikimedia Commons photo matches — 25/30 (re-query for exact file URL + licence + author)
Found: Normand Pioneer, Normand Ranger, Skandi Saigon, Skandi Olympia, Havila Phoenix,
Havila Commander, Island Vanguard, Viking Prince, Olympic Zeus, Siem Pilot, Normand Drott,
Skandi Vega, Havila Neptune, Island Challenger, Viking Storm (partial — "Blue Viking"),
Olympic Hercules, Siem Atlas, Normand Vision, Skandi Constructor, Island Performer,
Olympic Energy, Normand Clipper, Skandi Acergy, Siem Mariner (may be incidental), Skandi Arctic.
> Re-run the Commons search next session to capture the **exact file URL + licence (CC BY / BY-SA) + author**
> for attribution. Verify the "partial/incidental" ones (Viking Storm, Siem Mariner) are the right ship.

## Next-session steps
1. For matched vessels: set real IMO + real specs + Wikimedia image URL + `imageSource=WIKIMEDIA` + the credit line.
2. Decide hot-link vs. download-and-commit the images (hot-link `upload.wikimedia.org` with attribution is acceptable; committing is more robust).
3. `npx prisma db seed`, then `npm run typecheck && lint && test && build` (and e2e if images render in `/map`).
4. Update the honesty note in `docs/fleet-roster.md` (some vessels now real IMO + real photo).

## ✅ Executed (2026-06-14)

Done as described, with **Wikimedia Commons** as the photo source (VesselFinder rejected on ©/ToS as planned):

- **21 vessels** got a CC-licensed Wikimedia Commons photograph of the real, same-named ship, downloaded to `public/assets/vessels/real/<slug>.jpg`, `imageSource=WIKIMEDIA`. Each carries the verbatim honesty credit `Photo: <author>, <licence> via Wikimedia Commons — a real vessel of the same name, not this demo vessel.` (author + licence captured per file via the Commons API; licences are CC BY 2.0 / CC BY-SA 2.0 / CC BY-SA 4.0).
- **16 real IMOs** set in `prisma/seed.ts` (the IMO-matched set); the other 5 photo'd vessels keep synthetic IMOs (no registry number recovered) — the photo is still honest via the credit line. MMSI + specs remain synthetic for all 30.
- **4 vessels excluded** because their only Commons hit was an unrelated/incidental ship — left as house-art SVGs rather than mislabelled: **Viking Storm** (hit "Blue Viking"), **Olympic Hercules** ("Lerwick shipping"), **Siem Atlas** ("Rio de Janeiro"), **Siem Mariner** ("Aberdeen Harbour").
- Source images were large (≤18 MB); all downscaled to **≤1440px / ~80% JPEG** (75 MB → 6.7 MB total).
- Wiring: `seed.ts` `REAL_VESSEL_PHOTO` map (`{slug, author, license}`) + `realVesselImage()`; a single photo per vessel (`images=[url]`), de-duplicated in `VesselModal` so the gallery shows one image (the Lightbox next/back arrows were also removed).
- Verified: `npx prisma db seed` → 21 WIKIMEDIA + 9 STOCK; typecheck (no new errors), lint, and 322 unit tests all green.

## 🔜 Queued for next session (user-requested, 2026-06-15)
Two more vessels to photograph — **download + commit** to `public/assets/vessels/real/` like the 21 (do NOT hot-link; `shipspotting.com` isn't in `next.config` remotePatterns and would break `next/image`). Source is ShipSpotting (© — user accepted the risk for their own demo; capture author/licence if shown, else mark source honestly):
1. **Olympic Hercules** (#19) — real IMO **9235672**; image `https://www.shipspotting.com/photos/big/1/6/0/1873061.jpg?cb=0`. Set the real IMO in `seed.ts` too.
2. **Eidesvik Sentinel** (#28) — photo is of the real **"Viking Sentinel"** (Eidesvik ERRV). ⚠️ Name mismatch: rename the vessel to **Viking Sentinel** (its real name) before applying the photo, else the "real vessel of the same name" credit line is false. Still need the image **URL** (user pasted an inline image last session, no link).
3. **Siem Mariner** (#29) — IMO still synthetic `9876027` (no real IMO recovered). Image `https://cyansentinel.com/wp-content/uploads/2024/12/mariner-sentinel-gal-1.jpg`. ⚠️ Two flags: the file is **"mariner-sentinel"** (CyanSentinel's *Mariner Sentinel*), **not** Siem Mariner — another name mismatch; and it's a **company-site © image**, not CC. To stay honest, either rename #29 to the real vessel's name or don't claim "same name"; capture/attribute the source.
4. **Tidewater Resolute** (#13) — real vessel in the photo is **"RESOLUTE"**, hull-stamped **IMO `9298090`** (set this real IMO in `seed.ts`). ⚠️ Partial name ("Resolute" vs our "Tidewater Resolute"); still need the image **URL** (user pasted inline, no link). Confirm the real Resolute is an AHTS/OSV to match our type.

### ✅ Display ordering executed (2026-06-15)
The `/map` fleet query now sorts vessels **with a real/attributed photo** (`imageSource = WIKIMEDIA`, `OPERATOR`, or `EXTERNAL`) first, then places the **house-art SVG / no-real-photo** vessels at the end. This is implemented in `src/lib/services/portal/portal-fleet.ts`, not by hand in the UI.
