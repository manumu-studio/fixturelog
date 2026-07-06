// not-found.tsx — send unknown browser routes back to the public domain landing.
import { redirect } from 'next/navigation';

export default function NotFound() {
  redirect('/');
}
