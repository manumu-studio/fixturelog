// next.config.ts — Next.js 15 configuration for FixtureLog
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Vessel imagery is first-party SVG art committed under /public/assets/vessels.
    // Allow the optimizer to serve SVG; attachment disposition + a locked-down CSP
    // keep the served files inert.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
