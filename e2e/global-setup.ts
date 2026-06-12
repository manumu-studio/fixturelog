// e2e/global-setup.ts — runs before E2E suite (seed DB in CI)
export default async function globalSetup() {
  if (process.env.CI) {
    const { execSync } = await import('child_process');
    execSync('npx prisma db seed', { stdio: 'inherit' });
  }
}
