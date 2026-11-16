# GSDD Foundation

Next.js App Router website and authenticated photo gallery administration for Global Skills & Digital Development Foundation.

Use Node.js 22 LTS and install the locked dependencies with `npm ci`. Run `npm run dev` for local development. Copy `.env.example` to `.env.local` and configure admin credentials to use `/admin/`. The public website remains available when admin credentials are absent; administration fails closed.

## Release checks

Run these commands sequentially with no other Next process using this checkout:

```sh
npm run check
npm run test:admin
npm run test:storage
npm run build
npm run test:public
npm run test:review
npm run test:features
npx playwright install chromium
npm run test:ui
npm audit --omit=dev
```

`check` parses application, scripts and test sources; it is a syntax check, not a full lint or type check. The admin integration test uses temporary credentials and isolated local storage. The public smoke test and UI regression tests require a production build. The UI tests start a temporary production server on port 3100 and check homepage image containment, carousel controls and gallery navigation at desktop, tablet and mobile widths. Set `BASE_URL` to test an already-running server instead. Playwright failure screenshots and traces are saved in the ignored `test-results/` directory. Review responsive layout, keyboard navigation, language switching and email handoffs in a browser before release. Visitor enquiries create server-backed tickets visible in the admin support queue. Some other contact controls prepare email or WhatsApp drafts; opening a draft does not confirm delivery.

## Production

Production runs on Google Cloud Run, project `aitryout-485605`, region `asia-south1`, service `gsdd-foundation`. `.github/workflows/deploy-cloud-run.yml` is the deployment source of truth. A push to `main` deploys production; only push or dispatch that workflow when deployment is requested. The application uses the Next.js server runtime, not static export or ChatGPT Sites hosting.

Configure admin secrets and a durable `GALLERY_BUCKET` before enabling gallery administration on Cloud Run. Local filesystem uploads are for development and cannot survive Cloud Run instance replacement. See [admin and gallery setup](docs/admin-gallery-setup.md) for configuration, IAM, secret rotation and backup instructions. Local login throttling is per instance; scaled deployments require upstream rate limiting for shared protection.

## Accounts, records and payment safety

Member registration, approval, blocking, password recovery and login use the same account ledger. Older extended member records, finance donations, enquiries and certificates are imported into their canonical portal collections on first access. Existing portal credentials win over duplicate legacy applications; completed imports are marked to prevent deleted records from being restored. Keep a bucket backup before any release that changes stored data.

JSON updates use GCS generation preconditions and retry the read-modify-write operation on conflicts. New public references are independent of collection length. Production initializes empty collections rather than examples. `GSDD_DEMO_DATA=1` explicitly enables seed examples in an isolated demonstration environment; do not enable it on production.

Password recovery requires `RESEND_API_KEY` plus `NOTIFICATION_FROM_EMAIL`, or a private `NOTIFICATION_WEBHOOK_URL` that delivers the supplied reset code to the intended recipient. Codes expire after 30 minutes, are stored only as hashes and can be used once. Without a delivery provider the page directs members to the office. Existing sessions are invalidated after a password reset. Rate limiting for requests is stored per email; retain upstream rate limiting for scaled public endpoints.

Sandbox checkout is a simulation. It creates no real donation, receipt, campaign credit or active AutoPay mandate. AutoPay registration remains pending authorization without a verified provider; manual debit controls cannot invent successful payments. Staff verify actual submitted payments in Donation Management before receipts are issued.

Membership, certificates, notices and reports link to durable modules. Team administration and appointment issuance explicitly show unavailable controls until their services are implemented. Certificate email and external message delivery are not claimed by these screens.

The deployed application uses native Next.js certificate APIs. No Flask proxy or local port-5000 service is required. The optional Flask backend remains separate: its member/donor/team records require an authenticated, expiring administrator session; its old payment shortcuts are disabled in favor of the canonical reconciliation workflow. `python tests/test_backend_security.py` tests these boundaries with mocked database calls. Legacy SHA-512 Flask passwords require an administrator reset to a scrypt hash; database seeding requires an explicitly supplied `ADMIN_INITIAL_PASSWORD` of at least 12 characters.
