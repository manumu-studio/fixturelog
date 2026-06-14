// Public auth error page. Renders a friendly, non-secret message for Auth.js error codes.
import Link from 'next/link';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'There is a problem with the authentication configuration.',
  AccessDenied: 'Access was denied. You may not have permission to sign in.',
  Verification: 'The sign-in link is no longer valid.',
  OAuthSignin: 'Could not start sign-in with the identity provider.',
  OAuthCallback: 'The identity provider returned an error during sign-in.',
  OAuthCreateAccount: 'Could not create your account. Please try again.',
  Callback: 'The sign-in callback failed. Please try again.',
};

const DEFAULT_MESSAGE = 'Something went wrong during sign-in. Please try again.';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const mapped = error ? ERROR_MESSAGES[error] : undefined;
  const message = mapped ?? DEFAULT_MESSAGE;

  return (
    <main style={{ maxWidth: '32rem', margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1>Sign-in error</h1>
      <p>{message}</p>
      {error ? <p style={{ opacity: 0.7 }}>Error code: {error}</p> : null}
      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
