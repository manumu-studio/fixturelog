// portal/documents/page.tsx — Documents: the session charterer's recap drafts + finals,
// with copy/download. Scoped via the recap -> fixture -> charterer chain.
import { requireCharterer } from '@/lib/auth/require-charterer';
import { listDocuments } from '@/lib/services/portal/portal-queries';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { DocumentList } from '@/components/portal/DocumentList';

export default async function DocumentsPage() {
  const ctx = await requireCharterer();
  const documents = await listDocuments(ctx.chartererId);

  return (
    <>
      <PortalPageHeader
        eyebrow="Paperwork"
        title="Documents"
        subline="Recap drafts and final recaps for your fixtures. Copy the text or download the markdown."
      />
      <DocumentList documents={documents} />
    </>
  );
}
