# Production quality verification

Verified locally on 2026-10-30 with Next.js 15.5.28. Changes are local and have not been deployed.

## Implemented

- Responsive layout, touch targets, focus indicators, reduced-motion support and high-contrast styles.
- Accessible navigation disclosures, keyboard carousel controls, paginated galleries, lightbox focus handling and image fallbacks.
- Validated email/WhatsApp draft forms with truthful submission and document-verification messaging; public dummy news removed.
- Admin request timeouts, status/error feedback, image validation, preview cleanup and file-selection race protection.
- Signed admin sessions, same-origin enforcement, bounded login requests, per-process rate and verification concurrency limits.
- Restricted upload paths, atomic local manifests, GCS generation conflict handling and non-cacheable mutable image responses.
- Security headers, public error recovery, robots, sitemap, hardened container runtime and CI checks.
- Patched PostCSS dependency override without changing the Next.js major version.

## Passed locally

| Check | Result |
| --- | --- |
| `npm run check` | 69 source files parsed successfully |
| `npm run test:storage` | Calendar dates and GCS generation-race visibility regression passed using a mock bucket |
| `npm run test:admin` | Authentication, CSRF, cookies, rate limiting, upload rejection, serving, hiding, deletion and logout passed |
| `npm run build` | Optimized production build passed |
| `npm run test:public` | 23 public routes, assets, pagination, redirects, 404s, headers, robots, sitemap and unauthenticated admin boundaries passed |
| `npm audit --omit=dev` | Zero reported vulnerabilities |
| CSS parsing / `git diff --check` | Passed |

## Release checks outside local verification

- Docker is unavailable on this machine. The container build, scan, unprivileged-user check, image optimizer and HTTP smoke checks are configured in `.github/workflows/quality.yml` and still need a CI run.
- The storage regression uses a mock bucket. Live GCS IAM, durable bucket configuration and Secret Manager bindings were not changed or verified. Follow `docs/admin-gallery-setup.md` before enabling production gallery writes.
- Real-device visual and assistive-technology acceptance testing remains necessary. Source and HTTP checks do not establish WCAG conformance or verify every interactive browser behavior.
- Login rate limiting is per process. Use upstream shared rate limiting for protection across Cloud Run instances.

Deployment remains controlled by `.github/workflows/deploy-cloud-run.yml`. A push to `main` or manual workflow dispatch is a production deployment and requires a deployment request.
