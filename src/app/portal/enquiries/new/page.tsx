// portal/enquiries/new/page.tsx — hosts the Create Enquiry form. Reads an optional prefill
// (vessel type + region) from the query, used by Fleet Explorer's "Use in enquiry" deep link.
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { PortalCard } from '@/components/portal/PortalCard';
import { CreateEnquiryForm } from '@/features/enquiry/CreateEnquiryForm';
import type { CreateEnquiryPrefill } from '@/features/enquiry/CreateEnquiryForm';

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const prefill: CreateEnquiryPrefill = {};
  const vesselType = firstParam(sp.vesselType);
  const regionCode = firstParam(sp.regionCode);
  if (vesselType !== undefined) prefill.vesselType = vesselType;
  if (regionCode !== undefined) prefill.regionCode = regionCode;

  return (
    <>
      <PortalPageHeader
        eyebrow="New enquiry"
        title="Create an enquiry"
        subline="Tell us what you need and we'll recommend vessels from the fleet."
      />
      <PortalCard>
        <CreateEnquiryForm prefill={prefill} />
      </PortalCard>
    </>
  );
}
