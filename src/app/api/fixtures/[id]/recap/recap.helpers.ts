// Helper functions for building RecapMainTerms from a Fixture with relations
import type { RecapMainTerms } from '@/lib/services/recap-formatter';
import type { Prisma } from '@prisma/client';

export type FixtureWithRecapIncludes = Prisma.FixtureGetPayload<{
  include: {
    vessel: { include: { owner: true } };
    charterer: true;
    region: true;
    workscope: true;
    broker: true;
    recaps: { select: { version: true } };
  };
}>;

function formatFee(fee: number | null | undefined, currency: string): string | null {
  if (fee === null || fee === undefined) return null;
  return `${fee.toLocaleString('en-GB')} ${currency}`;
}

export function buildMainTerms(fixture: FixtureWithRecapIncludes): RecapMainTerms {
  const { agreedDayRate, currency } = fixture;

  return {
    vessel: fixture.vessel.name,
    vesselType: fixture.vessel.vesselType,
    owners: fixture.vessel.owner.name,
    charterer: fixture.charterer.name,
    hireRate: `${agreedDayRate.toLocaleString('en-GB')} ${currency}/day`,
    mobilisationFee: formatFee(fixture.mobilizationFee, currency),
    demobilisationFee: formatFee(fixture.demobilizationFee, currency),
    deliveryPort: fixture.deliveryPort ?? null,
    redeliveryPort: fixture.redeliveryPort ?? null,
    laycanFrom: fixture.commencement?.toISOString().split('T')[0] ?? null,
    laycanTo: null,
    period:
      fixture.durationDays !== null && fixture.durationDays !== undefined
        ? `${fixture.durationDays} days`
        : 'TBD',
    areaOfOperation: fixture.region.name,
    workscope: fixture.workscope.name,
    governingLaw: 'English Law',
    charterParty:
      fixture.charterPartyForm === 'SUPPLYTIME_2017' ? 'SUPPLYTIME 2017' : 'Other',
  };
}
