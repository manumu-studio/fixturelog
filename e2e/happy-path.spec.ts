// e2e/happy-path.spec.ts — Happy-path e2e: full broker workflow from enquiry through recap — hermetic (no live Open-Meteo)

import { test, expect } from '@playwright/test';

test('broker workflow: enquiry → match → fixture → weather → status transitions → recap', async ({ request }) => {
  // ── Step 1: Health check — verify API is running ─────────────────────────
  // GET /api/health → 200, { status: 'ok' }
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  const healthBody = await health.json() as { status: string };
  expect(healthBody.status).toBe('ok');

  // ── Step 2: List vessels — verify seed data ───────────────────────────────
  // GET /api/vessels?limit=30 → 200. The list route PAGINATES (default limit=20),
  // so a bare GET returns only 20 rows. Request limit=30 and assert the seeded
  // total (the route returns { data, total, page, limit }).
  const vessels = await request.get('/api/vessels?limit=30');
  expect(vessels.status()).toBe(200);
  const vesselsBody = await vessels.json() as { data: unknown[]; total: number };
  expect(Array.isArray(vesselsBody.data)).toBe(true);
  expect(vesselsBody.total).toBe(30);        // seeded vessel count
  expect(vesselsBody.data.length).toBe(30);  // all 30 returned at limit=30

  // ── Discovery: resolve seeded IDs required by the real create schemas ─────
  // The create bodies below use the REAL Zod schemas (RequirementCreateSchema,
  // FixtureCreateSchema) — NOT invented fields. Those schemas require cuid foreign
  // keys, so discover them from seeded records.
  const seededReqList = await request.get('/api/requirements?limit=1');
  const seededReqListBody = await seededReqList.json() as { data: Array<{ id: string }> };
  expect(seededReqListBody.data.length).toBeGreaterThan(0);
  const seededReqId: string = seededReqListBody.data[0]!.id;
  const seededReqDetailResp = await request.get(`/api/requirements/${seededReqId}`);
  const seededReqDetail = await seededReqDetailResp.json() as {
    data: { chartererId: string; regionId: string; workscopeId: string };
  };
  const chartererId: string = seededReqDetail.data.chartererId;
  const regionId: string = seededReqDetail.data.regionId;
  const workscopeId: string = seededReqDetail.data.workscopeId;

  const seededFixList = await request.get('/api/fixtures?limit=1');
  const seededFixListBody = await seededFixList.json() as { data: Array<{ id: string }> };
  expect(seededFixListBody.data.length).toBeGreaterThan(0);
  const seededFixId: string = seededFixListBody.data[0]!.id;
  const seededFixDetailResp = await request.get(`/api/fixtures/${seededFixId}`);
  const seededFixDetail = await seededFixDetailResp.json() as { data: { brokerId: string } };
  const brokerId: string = seededFixDetail.data.brokerId;

  // ── Step 3: Create a new requirement (status defaults to ENQUIRY) ─────────
  // POST /api/requirements → 201. Fields per RequirementCreateSchema.
  const createReq = await request.post('/api/requirements', {
    data: {
      chartererId,
      regionId,
      workscopeId,
      vesselTypeNeeded: 'PSV',
      minDeckAreaM2: 800,
      minDpClass: 'DP2',
      startDate: '2026-08-01',
      charterType: 'SPOT',
      dayRateBudget: 8000,
      notes: 'North Sea PSV — e2e happy-path test',
    },
  });
  expect(createReq.status()).toBe(201);
  const createReqBody = await createReq.json() as { data: { status: string; id: string } };
  expect(createReqBody.data.status).toBe('ENQUIRY');
  const requirementId: string = createReqBody.data.id;

  // ── Step 4: Run matcher on the requirement ────────────────────────────────
  // POST /api/requirements/:id/match → 200
  // Requirement transitions ENQUIRY → SHORTLISTED; results non-empty
  const match = await request.post(`/api/requirements/${requirementId}/match`);
  expect(match.status()).toBe(200);
  const matchBody = await match.json() as {
    data: { results: Array<{ vesselId: string }>; status: string };
  };
  expect(Array.isArray(matchBody.data.results)).toBe(true);
  expect(matchBody.data.results.length).toBeGreaterThan(0);
  expect(matchBody.data.status).toBe('SHORTLISTED');

  // ── Step 5: Get requirement detail — verify status change ─────────────────
  // GET /api/requirements/:id → 200, status === 'SHORTLISTED'
  const reqDetail = await request.get(`/api/requirements/${requirementId}`);
  expect(reqDetail.status()).toBe(200);
  const reqDetailBody = await reqDetail.json() as { data: { status: string } };
  expect(reqDetailBody.data.status).toBe('SHORTLISTED');

  // ── Step 6: Create a fixture from the top-ranked vessel ──────────────────
  // POST /api/fixtures → 201 (fixture starts at its default status, e.g. DRAFT).
  // Fields per FixtureCreateSchema.
  const firstResult = matchBody.data.results[0];
  // Shape already asserted above (results.length > 0); non-null access is safe
  expect(firstResult).toBeDefined();
  const topVesselId: string = firstResult!.vesselId;
  const createFixture = await request.post('/api/fixtures', {
    data: {
      vesselId: topVesselId,
      chartererId,
      brokerId,
      regionId,
      workscopeId,
      requirementId,
      charterType: 'SPOT',
      agreedDayRate: 8000,
      currency: 'GBP',
      commencement: '2026-08-01',
      durationDays: 30,
    },
  });
  expect(createFixture.status()).toBe(201);
  const createFixtureBody = await createFixture.json() as { data: { id: string; vesselId: string; status: string } };
  const fixtureId: string = createFixtureBody.data.id;
  expect(createFixtureBody.data.vesselId).toBe(topVesselId);

  // Drive to NEGOTIATING if not already there
  // Body shape: { toStatus, actor, notes? } — per the real PATCH /api/fixtures/:id/status contract
  if (createFixtureBody.data.status !== 'NEGOTIATING') {
    const toNegotiating = await request.patch(`/api/fixtures/${fixtureId}/status`, {
      data: { toStatus: 'NEGOTIATING', actor: 'broker@equinor.test' },
    });
    expect(toNegotiating.status()).toBe(200);
  }

  // ── Step 7: Verify weather snapshot for a SEEDED fixture (hermetic) ───────
  // GET /api/fixtures/:id for each fixture until one has weatherSnapshots (seeded rows),
  // via the fixture-detail route's weatherSnapshots include.
  // Does NOT call GET /api/weather/marine or POST /api/fixtures/:id/weather (live Open-Meteo).
  const fixturesList = await request.get('/api/fixtures');
  expect(fixturesList.status()).toBe(200);
  const fixturesListBody = await fixturesList.json() as {
    data: Array<{ id: string }>;
  };

  const candidateIds: string[] = (fixturesListBody.data).map((f) => f.id);
  let found = false;
  let weatherFixtureId: string = candidateIds[0] ?? fixtureId;
  for (const candidateId of candidateIds) {
    const detail = await request.get(`/api/fixtures/${candidateId}`);
    if (detail.status() !== 200) continue;
    const detailBody = await detail.json() as { data: { weatherSnapshots?: unknown[] } };
    if (Array.isArray(detailBody.data.weatherSnapshots) && detailBody.data.weatherSnapshots.length > 0) {
      weatherFixtureId = candidateId;
      found = true;
      break;
    }
  }
  // If no seeded fixture has snapshots, the seed did not create the expected snapshots — fail clearly
  expect(found).toBe(true);

  const weatherCheck = await request.get(`/api/fixtures/${weatherFixtureId}`);
  expect(weatherCheck.status()).toBe(200);
  const weatherCheckBody = await weatherCheck.json() as {
    data: { weatherSnapshots: Array<{ workabilityVerdict: string }> };
  };
  expect(Array.isArray(weatherCheckBody.data.weatherSnapshots)).toBe(true);
  expect(weatherCheckBody.data.weatherSnapshots.length).toBeGreaterThan(0);
  const firstSnapshot = weatherCheckBody.data.weatherSnapshots[0];
  // Shape already asserted above (weatherSnapshots.length > 0); non-null access is safe
  expect(firstSnapshot).toBeDefined();
  const verdict: string = firstSnapshot!.workabilityVerdict;
  expect(['WORKABLE', 'MARGINAL', 'NOT_WORKABLE']).toContain(verdict);

  // ── Step 8: Transition fixture status (NEGOTIATING → ON_SUBS) ────────────
  // PATCH /api/fixtures/:id/status → 200
  // Body: { toStatus, actor, notes? } — real shape, not { status }
  const toOnSubs = await request.patch(`/api/fixtures/${fixtureId}/status`, {
    data: {
      toStatus: 'ON_SUBS',
      actor: 'broker@equinor.test',
      notes: 'Board approval + weather window',
    },
  });
  expect(toOnSubs.status()).toBe(200);
  const toOnSubsBody = await toOnSubs.json() as { data: { status: string } };
  expect(toOnSubsBody.data.status).toBe('ON_SUBS');

  // ── Step 9: Create a SubjectItem (REQUIRED before FIXED — subject-lift gate)
  // POST /api/fixtures/:id/subjects → 201
  // { label: 'Board approval' } defaults to PENDING status
  const createSubject = await request.post(`/api/fixtures/${fixtureId}/subjects`, {
    data: { label: 'Board approval' },
  });
  expect(createSubject.status()).toBe(201);
  const createSubjectBody = await createSubject.json() as { data: { status: string; id: string } };
  expect(createSubjectBody.data.status).toBe('PENDING');
  const subjectId: string = createSubjectBody.data.id;

  // ── Step 10: Lift the subject ─────────────────────────────────────────────
  // PATCH /api/fixtures/:id/subjects/:subjectId → 200
  // { status: 'LIFTED' }
  // Gate requires EVERY subject to be LIFTED or WAIVED before ON_SUBS → FIXED
  const liftSubject = await request.patch(`/api/fixtures/${fixtureId}/subjects/${subjectId}`, {
    data: { status: 'LIFTED' },
  });
  expect(liftSubject.status()).toBe(200);
  const liftSubjectBody = await liftSubject.json() as { data: { status: string } };
  expect(liftSubjectBody.data.status).toBe('LIFTED');

  // ── Step 11: Transition fixture status (ON_SUBS → FIXED) ─────────────────
  // PATCH /api/fixtures/:id/status → 200
  // NOTE: this would return non-200 without Steps 9–10 (subject-lift gate blocks it)
  // Body: { toStatus, actor } — real shape
  const toFixed = await request.patch(`/api/fixtures/${fixtureId}/status`, {
    data: { toStatus: 'FIXED', actor: 'broker@equinor.test' },
  });
  expect(toFixed.status()).toBe(200);
  const toFixedBody = await toFixed.json() as { data: { status: string; fixedAt: string | null } };
  expect(toFixedBody.data.status).toBe('FIXED');
  expect(toFixedBody.data.fixedAt).not.toBeNull();

  // ── Step 12: Generate recap ───────────────────────────────────────────────
  // POST /api/fixtures/:id/recap → 201
  const recap = await request.post(`/api/fixtures/${fixtureId}/recap`);
  expect(recap.status()).toBe(201);
  const recapBody = await recap.json() as { data: { generatedMarkdown: string; version: number; mainTerms: unknown } };
  expect(recapBody.data.generatedMarkdown).toBeTruthy();
  expect(recapBody.data.version).toBe(1);
  expect(recapBody.data.mainTerms).toBeDefined();

  // ── Step 13: Verify final state ───────────────────────────────────────────
  // GET /api/fixtures/:id → 200
  const finalState = await request.get(`/api/fixtures/${fixtureId}`);
  expect(finalState.status()).toBe(200);
  const finalStateBody = await finalState.json() as {
    data: {
      status: string;
      recaps: unknown[];
      subjects: Array<{ id: string; status: string }>;
      requirementId: string;
      vesselId: string;
    };
  };
  expect(finalStateBody.data.status).toBe('FIXED');
  expect(Array.isArray(finalStateBody.data.recaps)).toBe(true);
  expect(finalStateBody.data.recaps.length).toBeGreaterThan(0);
  expect(Array.isArray(finalStateBody.data.subjects)).toBe(true);
  const liftedSubject = finalStateBody.data.subjects.find((s) => s.id === subjectId);
  expect(liftedSubject).toBeDefined();
  expect(liftedSubject?.status).toBe('LIFTED');
  expect(finalStateBody.data.requirementId).toBe(requirementId);
  expect(finalStateBody.data.vesselId).toBe(topVesselId);
});
