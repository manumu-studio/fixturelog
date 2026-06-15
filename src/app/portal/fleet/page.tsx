// portal/fleet/page.tsx — compatibility route for old portal fleet links. The canonical
// available-vessels view now lives at /map.
import { redirect } from 'next/navigation';

export default async function FleetExplorerPage() {
  redirect('/map');
}
