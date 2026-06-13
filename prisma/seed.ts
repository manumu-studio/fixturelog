// prisma/seed.ts — Idempotent seed for FixtureLog (SPEC-001 §4.1)
// Re-runnable: clears all tables then recreates deterministic demo data.
// Used by CI e2e for a known database state.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FixtureLog database...');

  // Clear in reverse FK order
  await prisma.weatherSnapshot.deleteMany();
  await prisma.recap.deleteMany();
  await prisma.subjectItem.deleteMany();
  await prisma.fixture.deleteMany();
  await prisma.positionSnapshot.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.rateBenchmark.deleteMany();
  await prisma.vessel.deleteMany();
  await prisma.workscope.deleteMany();
  await prisma.region.deleteMany();
  await prisma.broker.deleteMany();
  await prisma.charterer.deleteMany();
  await prisma.owner.deleteMany();

  // --- Owners ---
  const owners = await Promise.all([
    prisma.owner.create({ data: { name: 'Tidewater Inc.', country: 'US' } }),
    prisma.owner.create({ data: { name: 'Solstad Offshore ASA', country: 'Norway' } }),
    prisma.owner.create({ data: { name: 'DOF ASA', country: 'Norway' } }),
    prisma.owner.create({ data: { name: 'Havila Shipping ASA', country: 'Norway' } }),
    prisma.owner.create({ data: { name: 'Island Offshore AS', country: 'Norway' } }),
    prisma.owner.create({ data: { name: 'Eidesvik Offshore ASA', country: 'Norway' } }),
    prisma.owner.create({ data: { name: 'Olympic Shipping AS', country: 'Norway' } }),
    prisma.owner.create({ data: { name: 'Siem Offshore AS', country: 'Norway' } }),
  ]);
  const [tidewater, solstad, dof, havila, island, eidesvik, olympic, siem] = owners;

  // --- Charterers ---
  // Contact fields use role-based desks + reserved `.example` addresses — clearly demo data, never live.
  const charterers = await Promise.all([
    prisma.charterer.create({ data: { name: 'TotalEnergies SE', sector: 'Oil & Gas', contactName: 'Marine Logistics Desk', contactEmail: 'chartering@totalenergies.example', contactPhone: '+33 1 47 44 45 46' } }),
    prisma.charterer.create({ data: { name: 'Equinor ASA', sector: 'Oil & Gas', contactName: 'Vessel Chartering', contactEmail: 'chartering@equinor.example', contactPhone: '+47 51 99 00 00' } }),
    prisma.charterer.create({ data: { name: 'Shell plc', sector: 'Oil & Gas', contactName: 'Upstream Marine', contactEmail: 'marine@shell.example', contactPhone: '+44 20 7934 1234' } }),
    prisma.charterer.create({ data: { name: 'BP plc', sector: 'Oil & Gas', contactName: 'Offshore Logistics', contactEmail: 'logistics@bp.example', contactPhone: '+44 20 7496 4000' } }),
    prisma.charterer.create({ data: { name: 'Aker Solutions ASA', sector: 'Subsea/Engineering', contactName: 'Procurement Desk', contactEmail: 'procurement@akersolutions.example', contactPhone: '+47 67 51 30 00' } }),
    prisma.charterer.create({ data: { name: 'Subsea 7 SA', sector: 'Subsea/Engineering', contactName: 'Vessel Management', contactEmail: 'vessels@subsea7.example', contactPhone: '+44 1224 333000' } }),
  ]);
  const [total, equinor, shell, bp] = charterers;

  // --- Brokers ---
  const brokers = await Promise.all([
    prisma.broker.create({ data: { name: 'James Mitchell', office: 'Aberdeen', email: 'j.mitchell@fixturelog.demo' } }),
    prisma.broker.create({ data: { name: 'Karen Nygaard', office: 'Stavanger', email: 'k.nygaard@fixturelog.demo' } }),
    prisma.broker.create({ data: { name: 'Tom Richardson', office: 'London', email: 't.richardson@fixturelog.demo' } }),
    prisma.broker.create({ data: { name: 'Lisa Chen', office: 'Singapore', email: 'l.chen@fixturelog.demo' } }),
  ]);
  const [mitchell, nygaard, richardson] = brokers;

  // --- Regions ---
  const regions = await Promise.all([
    prisma.region.create({ data: { code: 'NORTH_SEA', name: 'North Sea', centerLat: 57.5, centerLng: 1.5 } }),
    prisma.region.create({ data: { code: 'BRAZIL', name: 'Brazil', centerLat: -22.0, centerLng: -40.0 } }),
    prisma.region.create({ data: { code: 'US_GULF', name: 'US Gulf of Mexico', centerLat: 27.5, centerLng: -90.0 } }),
    prisma.region.create({ data: { code: 'WEST_AFRICA', name: 'West Africa', centerLat: 4.0, centerLng: 5.0 } }),
    prisma.region.create({ data: { code: 'MIDDLE_EAST', name: 'Middle East', centerLat: 25.0, centerLng: 54.0 } }),
    prisma.region.create({ data: { code: 'SE_ASIA', name: 'Southeast Asia', centerLat: 1.5, centerLng: 104.0 } }),
    prisma.region.create({ data: { code: 'MEDITERRANEAN', name: 'Mediterranean', centerLat: 36.0, centerLng: 15.0 } }),
  ]);
  const [northSea, _brazil, _usGulf, westAfrica] = regions;

  // --- Workscopes ---
  const workscopes = await Promise.all([
    prisma.workscope.create({ data: { code: 'SUPPLY', name: 'Platform Supply', description: 'Cargo and equipment supply runs to offshore installations' } }),
    prisma.workscope.create({ data: { code: 'ANCHOR_HANDLING', name: 'Anchor Handling', description: 'Anchor handling and towing for rig positioning' } }),
    prisma.workscope.create({ data: { code: 'RIG_MOVE', name: 'Rig Move', description: 'Towing and positioning of drilling rigs' } }),
    prisma.workscope.create({ data: { code: 'TOWING', name: 'Towing', description: 'Open-water towing of structures and vessels' } }),
    prisma.workscope.create({ data: { code: 'CONSTRUCTION', name: 'Construction Support', description: 'Support for offshore construction and installation' } }),
    prisma.workscope.create({ data: { code: 'IMR', name: 'Inspection, Maintenance & Repair', description: 'Subsea inspection, maintenance, and repair operations' } }),
    prisma.workscope.create({ data: { code: 'ROV_SUPPORT', name: 'ROV Support', description: 'ROV deployment and subsea intervention' } }),
    prisma.workscope.create({ data: { code: 'STANDBY', name: 'Emergency Standby', description: 'Emergency response and rescue standby duty' } }),
    prisma.workscope.create({ data: { code: 'WIND_OM', name: 'Wind Farm O&M', description: 'Offshore wind farm operations and maintenance' } }),
  ]);
  const [supply, anchorHandling, _rigMove, _towing, construction, _imr, _rovSupport, standby] = workscopes;

  // --- Vessels + Position Snapshots ---
  const vesselData = [
    // PSVs (12)
    { name: 'Tidewater Atlas', imo: '9876001', mmsi: '258001001', vesselType: 'PSV' as const, owner: tidewater, deckAreaM2: 850, bollardPullT: 75, dpClass: 'DP2' as const, builtYear: 2015, status: 'OPEN' as const, region: northSea, port: 'Aberdeen', lat: 57.15, lng: -2.09 },
    { name: 'Tidewater Endurance', imo: '9876002', mmsi: '258001002', vesselType: 'PSV' as const, owner: tidewater, deckAreaM2: 900, bollardPullT: 80, dpClass: 'DP2' as const, builtYear: 2017, status: 'OPEN' as const, region: northSea, port: 'Stavanger', lat: 58.97, lng: 5.73 },
    { name: 'Normand Pioneer', imo: '9876003', mmsi: '258001003', vesselType: 'PSV' as const, owner: solstad, deckAreaM2: 1000, bollardPullT: 85, dpClass: 'DP2' as const, builtYear: 2014, status: 'OPEN' as const, region: northSea, port: 'Aberdeen', lat: 57.14, lng: -2.08 },
    { name: 'Normand Ranger', imo: '9876004', mmsi: '258001004', vesselType: 'PSV' as const, owner: solstad, deckAreaM2: 920, bollardPullT: 78, dpClass: 'DP2' as const, builtYear: 2016, status: 'ON_HIRE' as const, region: northSea, port: 'Bergen', lat: 60.39, lng: 5.32 },
    { name: 'Skandi Saigon', imo: '9876005', mmsi: '258001005', vesselType: 'PSV' as const, owner: dof, deckAreaM2: 880, bollardPullT: 72, dpClass: 'DP2' as const, builtYear: 2013, status: 'OPEN' as const, region: northSea, port: 'Esbjerg', lat: 55.47, lng: 8.45 },
    { name: 'Skandi Olympia', imo: '9876006', mmsi: '258001006', vesselType: 'PSV' as const, owner: dof, deckAreaM2: 950, bollardPullT: 82, dpClass: 'DP2' as const, builtYear: 2018, status: 'OPEN' as const, region: northSea, port: 'Peterhead', lat: 57.51, lng: -1.77 },
    { name: 'Havila Phoenix', imo: '9876007', mmsi: '258001007', vesselType: 'PSV' as const, owner: havila, deckAreaM2: 870, bollardPullT: 70, dpClass: 'DP2' as const, builtYear: 2012, status: 'OPEN' as const, region: northSea, port: 'Montrose', lat: 56.71, lng: -2.47 },
    { name: 'Havila Commander', imo: '9876008', mmsi: '258001008', vesselType: 'PSV' as const, owner: havila, deckAreaM2: 830, bollardPullT: 68, dpClass: 'DP2' as const, builtYear: 2011, status: 'YARD' as const, region: northSea, port: 'Stavanger', lat: 58.96, lng: 5.74 },
    { name: 'Island Vanguard', imo: '9876009', mmsi: '258001009', vesselType: 'PSV' as const, owner: island, deckAreaM2: 960, bollardPullT: 88, dpClass: 'DP2' as const, builtYear: 2019, status: 'OPEN' as const, region: northSea, port: 'Aberdeen', lat: 57.16, lng: -2.10 },
    { name: 'Viking Prince', imo: '9876010', mmsi: '258001010', vesselType: 'PSV' as const, owner: eidesvik, deckAreaM2: 840, bollardPullT: 73, dpClass: 'DP2' as const, builtYear: 2014, status: 'OPEN' as const, region: northSea, port: 'Bergen', lat: 60.40, lng: 5.33 },
    { name: 'Olympic Zeus', imo: '9876011', mmsi: '258001011', vesselType: 'PSV' as const, owner: olympic, deckAreaM2: 750, bollardPullT: 60, dpClass: 'DP1' as const, builtYear: 2010, status: 'OPEN' as const, region: northSea, port: 'Great Yarmouth', lat: 52.61, lng: 1.73 },
    { name: 'Siem Pilot', imo: '9876012', mmsi: '258001012', vesselType: 'PSV' as const, owner: siem, deckAreaM2: 890, bollardPullT: 76, dpClass: 'DP2' as const, builtYear: 2016, status: 'ON_HIRE' as const, region: northSea, port: 'Den Helder', lat: 52.96, lng: 4.76 },
    // AHTS (8)
    { name: 'Tidewater Resolute', imo: '9876013', mmsi: '258001013', vesselType: 'AHTS' as const, owner: tidewater, deckAreaM2: 550, bollardPullT: 200, dpClass: 'DP2' as const, builtYear: 2014, status: 'OPEN' as const, region: northSea, port: 'Aberdeen', lat: 57.14, lng: -2.07 },
    { name: 'Normand Drott', imo: '9876014', mmsi: '258001014', vesselType: 'AHTS' as const, owner: solstad, deckAreaM2: 600, bollardPullT: 280, dpClass: 'DP3' as const, builtYear: 2012, status: 'OPEN' as const, region: northSea, port: 'Stavanger', lat: 58.98, lng: 5.72 },
    { name: 'Skandi Vega', imo: '9876015', mmsi: '258001015', vesselType: 'AHTS' as const, owner: dof, deckAreaM2: 580, bollardPullT: 260, dpClass: 'DP3' as const, builtYear: 2015, status: 'OPEN' as const, region: northSea, port: 'Bergen', lat: 60.38, lng: 5.31 },
    { name: 'Havila Neptune', imo: '9876016', mmsi: '258001016', vesselType: 'AHTS' as const, owner: havila, deckAreaM2: 520, bollardPullT: 180, dpClass: 'DP2' as const, builtYear: 2010, status: 'ON_HIRE' as const, region: northSea, port: 'Aberdeen', lat: 57.13, lng: -2.06 },
    { name: 'Island Challenger', imo: '9876017', mmsi: '258001017', vesselType: 'AHTS' as const, owner: island, deckAreaM2: 620, bollardPullT: 300, dpClass: 'DP3' as const, builtYear: 2016, status: 'OPEN' as const, region: northSea, port: 'Peterhead', lat: 57.50, lng: -1.78 },
    { name: 'Viking Storm', imo: '9876018', mmsi: '258001018', vesselType: 'AHTS' as const, owner: eidesvik, deckAreaM2: 540, bollardPullT: 190, dpClass: 'DP2' as const, builtYear: 2013, status: 'OPEN' as const, region: northSea, port: 'Esbjerg', lat: 55.48, lng: 8.46 },
    { name: 'Olympic Hercules', imo: '9876019', mmsi: '258001019', vesselType: 'AHTS' as const, owner: olympic, deckAreaM2: 560, bollardPullT: 210, dpClass: 'DP2' as const, builtYear: 2011, status: 'LAID_UP' as const, region: northSea, port: 'Montrose', lat: 56.72, lng: -2.48 },
    { name: 'Siem Atlas', imo: '9876020', mmsi: '258001020', vesselType: 'AHTS' as const, owner: siem, deckAreaM2: 590, bollardPullT: 270, dpClass: 'DP3' as const, builtYear: 2017, status: 'OPEN' as const, region: northSea, port: 'Stavanger', lat: 58.99, lng: 5.75 },
    // MPSV (4)
    { name: 'Normand Vision', imo: '9876021', mmsi: '258001021', vesselType: 'MPSV' as const, owner: solstad, deckAreaM2: 1100, bollardPullT: 100, dpClass: 'DP3' as const, builtYear: 2018, status: 'OPEN' as const, region: northSea, port: 'Aberdeen', lat: 57.17, lng: -2.11 },
    { name: 'Skandi Constructor', imo: '9876022', mmsi: '258001022', vesselType: 'MPSV' as const, owner: dof, deckAreaM2: 1200, bollardPullT: 110, dpClass: 'DP3' as const, builtYear: 2016, status: 'OPEN' as const, region: northSea, port: 'Bergen', lat: 60.41, lng: 5.34 },
    { name: 'Island Performer', imo: '9876023', mmsi: '258001023', vesselType: 'MPSV' as const, owner: island, deckAreaM2: 1050, bollardPullT: 95, dpClass: 'DP3' as const, builtYear: 2015, status: 'ON_HIRE' as const, region: northSea, port: 'Stavanger', lat: 58.95, lng: 5.71 },
    { name: 'Olympic Energy', imo: '9876024', mmsi: '258001024', vesselType: 'MPSV' as const, owner: olympic, deckAreaM2: 900, bollardPullT: 85, dpClass: 'DP2' as const, builtYear: 2014, status: 'OPEN' as const, region: northSea, port: 'Great Yarmouth', lat: 52.62, lng: 1.74 },
    // ERRV (3)
    { name: 'Havila Guardian', imo: '9876025', mmsi: '258001025', vesselType: 'ERRV' as const, owner: havila, deckAreaM2: 300, bollardPullT: null, dpClass: 'DP1' as const, builtYear: 2008, status: 'OPEN' as const, region: northSea, port: 'Aberdeen', lat: 57.12, lng: -2.05 },
    { name: 'Eidesvik Sentinel', imo: '9876026', mmsi: '258001026', vesselType: 'ERRV' as const, owner: eidesvik, deckAreaM2: 280, bollardPullT: null, dpClass: 'DP1' as const, builtYear: 2006, status: 'OPEN' as const, region: northSea, port: 'Peterhead', lat: 57.49, lng: -1.76 },
    { name: 'Siem Mariner', imo: '9876027', mmsi: '258001027', vesselType: 'ERRV' as const, owner: siem, deckAreaM2: 320, bollardPullT: null, dpClass: 'DP1' as const, builtYear: 2009, status: 'ON_HIRE' as const, region: northSea, port: 'Montrose', lat: 56.70, lng: -2.46 },
    // CSV (2)
    { name: 'Normand Clipper', imo: '9876028', mmsi: '258001028', vesselType: 'CSV' as const, owner: solstad, deckAreaM2: 1500, bollardPullT: 120, dpClass: 'DP3' as const, builtYear: 2013, status: 'OPEN' as const, region: northSea, port: 'Stavanger', lat: 58.97, lng: 5.74 },
    { name: 'Skandi Acergy', imo: '9876029', mmsi: '258001029', vesselType: 'CSV' as const, owner: dof, deckAreaM2: 1800, bollardPullT: 130, dpClass: 'DP3' as const, builtYear: 2010, status: 'OPEN' as const, region: northSea, port: 'Aberdeen', lat: 57.18, lng: -2.12 },
    // DSV (1)
    { name: 'Skandi Arctic', imo: '9876030', mmsi: '258001030', vesselType: 'DSV' as const, owner: dof, deckAreaM2: 700, bollardPullT: null, dpClass: 'DP3' as const, builtYear: 2012, status: 'OPEN' as const, region: northSea, port: 'Bergen', lat: 60.42, lng: 5.35 },
  ];

  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const vessels = [];
  for (const v of vesselData) {
    const vessel = await prisma.vessel.create({
      data: {
        name: v.name,
        imo: v.imo,
        mmsi: v.mmsi,
        vesselType: v.vesselType,
        ownerId: v.owner.id,
        deckAreaM2: v.deckAreaM2,
        bollardPullT: v.bollardPullT,
        dpClass: v.dpClass,
        builtYear: v.builtYear,
        status: v.status,
        openRegionId: v.region.id,
        openPort: v.port,
        openDate: v.status === 'OPEN' ? sevenDaysOut : null,
      },
    });
    // Position snapshot for every vessel
    await prisma.positionSnapshot.create({
      data: {
        vesselId: vessel.id,
        capturedAt: now,
        lat: v.lat,
        lng: v.lng,
        portName: v.port,
        availabilityFrom: v.status === 'OPEN' ? sevenDaysOut : null,
        source: 'SEEDED',
        confidence: 'MEDIUM',
      },
    });
    vessels.push(vessel);
  }

  // Index vessels by name for fixture references
  const vesselByName = Object.fromEntries(vessels.map((v) => [v.name, v]));

  // --- Rate Benchmarks ---
  const benchmarkData = [
    { vesselType: 'PSV' as const, min: 5500, median: 7134, max: 9500, source: 'Seabreeze Offshore Market Report' },
    { vesselType: 'AHTS' as const, min: 40000, median: 56798, max: 75000, source: 'Seabreeze Offshore Market Report' },
    { vesselType: 'MPSV' as const, min: 18000, median: 25000, max: 35000, source: 'Industry estimate' },
    { vesselType: 'ERRV' as const, min: 3200, median: 4500, max: 6000, source: 'Industry estimate' },
    { vesselType: 'CSV' as const, min: 25000, median: 35000, max: 50000, source: 'Industry estimate' },
    { vesselType: 'DSV' as const, min: 35000, median: 45000, max: 60000, source: 'Industry estimate' },
  ];
  for (const b of benchmarkData) {
    await prisma.rateBenchmark.create({
      data: {
        regionId: northSea.id,
        vesselType: b.vesselType,
        basisDate: new Date('2026-06-01'),
        minRate: b.min,
        medianRate: b.median,
        maxRate: b.max,
        source: b.source,
      },
    });
  }

  // --- Requirements ---
  const req1 = await prisma.requirement.create({
    data: {
      chartererId: equinor.id,
      regionId: northSea.id,
      workscopeId: supply.id,
      vesselTypeNeeded: 'PSV',
      minDeckAreaM2: 800,
      minDpClass: 'DP2',
      startDate: new Date('2026-07-01'),
      durationDays: 30,
      charterType: 'SPOT',
      dayRateBudget: 8000,
      status: 'ENQUIRY',
      sourceChannel: 'Email',
      notes: 'Equinor Johan Sverdrup supply rotation',
    },
  });

  const req2 = await prisma.requirement.create({
    data: {
      chartererId: shell.id,
      regionId: northSea.id,
      workscopeId: anchorHandling.id,
      vesselTypeNeeded: 'AHTS',
      minBollardPullT: 180,
      minDpClass: 'DP2',
      startDate: new Date('2026-07-15'),
      durationDays: 14,
      charterType: 'SPOT',
      dayRateBudget: 60000,
      status: 'SHORTLISTED',
      sourceChannel: 'Phone',
      notes: 'Shell Shearwater rig move',
    },
  });

  await prisma.requirement.create({
    data: {
      chartererId: total.id,
      regionId: westAfrica.id,
      workscopeId: construction.id,
      vesselTypeNeeded: 'MPSV',
      minDeckAreaM2: 1000,
      minDpClass: 'DP3',
      startDate: new Date('2026-08-01'),
      durationDays: 90,
      charterType: 'TERM',
      dayRateBudget: 28000,
      status: 'NEGOTIATING',
      sourceChannel: 'Broker referral',
      notes: 'TotalEnergies Egina construction campaign',
    },
  });

  await prisma.requirement.create({
    data: {
      chartererId: bp.id,
      regionId: northSea.id,
      workscopeId: standby.id,
      vesselTypeNeeded: 'ERRV',
      minDpClass: 'DP1',
      startDate: new Date('2026-07-01'),
      durationDays: 180,
      charterType: 'TERM',
      dayRateBudget: 5000,
      status: 'ENQUIRY',
      sourceChannel: 'Email',
      notes: 'BP Clair Ridge ERRV rotation',
    },
  });

  // --- Fixtures ---
  // Fixture 1: Normand Pioneer → Equinor (NEGOTIATING)
  await prisma.fixture.create({
    data: {
      requirementId: req1.id,
      vesselId: vesselByName['Normand Pioneer'].id,
      chartererId: equinor.id,
      brokerId: mitchell.id,
      regionId: northSea.id,
      workscopeId: supply.id,
      charterType: 'SPOT',
      status: 'NEGOTIATING',
      agreedDayRate: 7500,
      currency: 'GBP',
      durationDays: 30,
      deliveryPort: 'Aberdeen',
      redeliveryPort: 'Aberdeen',
      commencement: new Date('2026-07-01'),
      charterPartyForm: 'SUPPLYTIME_2017',
    },
  });

  // Fixture 2: Island Challenger → Shell (ON_SUBS)
  const fixture2 = await prisma.fixture.create({
    data: {
      requirementId: req2.id,
      vesselId: vesselByName['Island Challenger'].id,
      chartererId: shell.id,
      brokerId: nygaard.id,
      regionId: northSea.id,
      workscopeId: anchorHandling.id,
      charterType: 'SPOT',
      status: 'ON_SUBS',
      agreedDayRate: 58000,
      currency: 'GBP',
      durationDays: 14,
      deliveryPort: 'Aberdeen',
      redeliveryPort: 'Stavanger',
      commencement: new Date('2026-07-15'),
      charterPartyForm: 'SUPPLYTIME_2017',
      subjectsSummary: 'Board approval, class survey, weather window',
    },
  });

  // Subject items for ON_SUBS fixture
  const fiveDaysOut = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  await prisma.subjectItem.createMany({
    data: [
      { fixtureId: fixture2.id, label: 'Charterer board approval', status: 'PENDING', dueAt: sevenDaysOut, owner: 'Shell' },
      { fixtureId: fixture2.id, label: 'Class survey confirmation', status: 'PENDING', dueAt: fiveDaysOut, owner: 'Island Offshore' },
      { fixtureId: fixture2.id, label: 'Weather window confirmation', status: 'LIFTED', owner: 'Broker' },
    ],
  });

  // Fixture 3: Havila Guardian → BP (FIXED)
  const fixture3 = await prisma.fixture.create({
    data: {
      vesselId: vesselByName['Havila Guardian'].id,
      chartererId: bp.id,
      brokerId: richardson.id,
      regionId: northSea.id,
      workscopeId: standby.id,
      charterType: 'TERM',
      status: 'FIXED',
      agreedDayRate: 4800,
      currency: 'GBP',
      durationDays: 180,
      deliveryPort: 'Aberdeen',
      redeliveryPort: 'Aberdeen',
      commencement: new Date('2026-07-01'),
      charterPartyForm: 'SUPPLYTIME_2017',
      fixedAt: new Date('2026-06-10'),
    },
  });

  // --- Weather Snapshots ---
  // Snapshot 1: WORKABLE conditions for the FIXED fixture (Havila Guardian → BP)
  // wave 1.2 < 2.0 threshold, swell 1.8 < 2.5 threshold → WORKABLE
  await prisma.weatherSnapshot.create({
    data: {
      fixtureId: fixture3.id,
      lat: 57.12,
      lng: -2.05,
      waveHeightM: 1.2,
      swellHeightM: 1.8,
      windWaveHeightM: 0.6,
      workabilityVerdict: 'WORKABLE',
      laycanFrom: new Date('2026-07-01'),
      laycanTo: new Date('2026-12-28'),
      fetchedAt: new Date('2026-06-10T09:00:00Z'),
    },
  });

  // Snapshot 2: MARGINAL conditions for the ON_SUBS fixture (Island Challenger → Shell)
  // wave 2.5 ≥ 2.0 (above WORKABLE), swell 3.2 ≥ 2.5 (above WORKABLE) → MARGINAL
  // wave 2.5 < 3.0 threshold, swell 3.2 < 4.0 threshold → not NOT_WORKABLE
  await prisma.weatherSnapshot.create({
    data: {
      fixtureId: fixture2.id,
      lat: 57.50,
      lng: -1.78,
      waveHeightM: 2.5,
      swellHeightM: 3.2,
      windWaveHeightM: 1.5,
      workabilityVerdict: 'MARGINAL',
      laycanFrom: new Date('2026-07-15'),
      laycanTo: new Date('2026-07-29'),
      fetchedAt: new Date('2026-06-10T09:30:00Z'),
    },
  });

  // Recap for FIXED fixture (minimal until RecapFormatter ships)
  await prisma.recap.create({
    data: {
      fixtureId: fixture3.id,
      version: 1,
      mainTerms: {
        vessel: 'Havila Guardian',
        vesselType: 'ERRV',
        owners: 'Havila Shipping ASA',
        charterer: 'BP plc',
        hireRate: '4,800 GBP/day',
        deliveryPort: 'Aberdeen',
        redeliveryPort: 'Aberdeen',
        period: '180 days',
        workscope: 'Emergency Standby',
        governingLaw: 'English Law',
        charterParty: 'SUPPLYTIME 2017',
      },
      generatedMarkdown: [
        '# Fixture Recap',
        '',
        '**Vessel:** Havila Guardian (ERRV)',
        '**Owners:** Havila Shipping ASA',
        '**Charterer:** BP plc',
        '**Hire Rate:** 4,800 GBP/day',
        '**Delivery:** Aberdeen',
        '**Redelivery:** Aberdeen',
        '**Period:** 180 days',
        '**Workscope:** Emergency Standby',
        '**Charter Party:** SUPPLYTIME 2017',
        '**Governing Law:** English Law',
        '',
        '---',
        '*Generated by FixtureLog*',
      ].join('\n'),
      generatedText: [
        'FIXTURE RECAP',
        '',
        'Vessel: Havila Guardian (ERRV)',
        'Owners: Havila Shipping ASA',
        'Charterer: BP plc',
        'Hire Rate: 4,800 GBP/day',
        'Delivery: Aberdeen',
        'Redelivery: Aberdeen',
        'Period: 180 days',
        'Workscope: Emergency Standby',
        'Charter Party: SUPPLYTIME 2017',
        'Governing Law: English Law',
        '',
        'Generated by FixtureLog',
      ].join('\n'),
      approvedByBrokerId: richardson.id,
    },
  });

  console.log('Seed complete.');
  console.log(`  ${owners.length} owners`);
  console.log(`  ${charterers.length} charterers`);
  console.log(`  ${brokers.length} brokers`);
  console.log(`  ${regions.length} regions`);
  console.log(`  ${workscopes.length} workscopes`);
  console.log(`  ${vessels.length} vessels + position snapshots`);
  console.log(`  ${benchmarkData.length} rate benchmarks`);
  console.log(`  4 requirements`);
  console.log(`  3 fixtures (NEGOTIATING, ON_SUBS, FIXED)`);
  console.log(`  3 subject items`);
  console.log(`  1 recap`);
  console.log(`  2 weather snapshots`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
