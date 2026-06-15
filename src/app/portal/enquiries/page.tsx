// portal/enquiries/page.tsx — My Enquiries: all of the session charterer's requirements.
import { requireCharterer } from '@/lib/auth/require-charterer';
import { listEnquiries } from '@/lib/services/portal/portal-queries';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { PortalButton } from '@/components/portal/PortalButton';
import { EnquiryList } from '@/components/portal/EnquiryList';

export default async function MyEnquiriesPage() {
  const ctx = await requireCharterer();
  const enquiries = await listEnquiries(ctx.chartererId);

  return (
    <>
      <PortalPageHeader
        eyebrow="Your requirements"
        title="My enquiries"
        subline="Every requirement you've posted, with its current status."
        actions={<PortalButton href="/portal/enquiries/new">Create enquiry</PortalButton>}
      />
      <EnquiryList enquiries={enquiries} />
    </>
  );
}
