/**
 * Security headers applied to every response.
 *
 * The Content-Security-Policy intentionally has no `script-src`, `style-src`,
 * or `img-src` directive. The App Router streams its bootstrap payload as
 * inline `<script>` tags and the site embeds a Google Maps iframe, so a strict
 * script policy would require nonce plumbing that is out of scope here. The
 * directives below still block clickjacking, base-tag injection, plugin
 * content, and off-site form submission without touching legitimate assets.
 *
 * `Strict-Transport-Security` is ignored over plain HTTP (local development)
 * and enforced by browsers after the first HTTPS response from Cloud Run.
 */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
