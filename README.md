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
npm audit --omit=dev
```

`check` parses application, scripts and test sources; it is a syntax check, not a full lint or type check. The admin integration test uses temporary credentials and isolated local storage. The public smoke test requires a production build. Review responsive layout, keyboard navigation, language switching and email handoffs in a browser before release. Visitor enquiry forms prepare email drafts; they do not submit data to a backend or create application records.

## Production

Production runs on Google Cloud Run, project `aitryout-485605`, region `asia-south1`, service `gsdd-foundation`. `.github/workflows/deploy-cloud-run.yml` is the deployment source of truth. A push to `main` deploys production; only push or dispatch that workflow when deployment is requested. The application uses the Next.js server runtime, not static export or ChatGPT Sites hosting.

Configure admin secrets and a durable `GALLERY_BUCKET` before enabling gallery administration on Cloud Run. Local filesystem uploads are for development and cannot survive Cloud Run instance replacement. See [admin and gallery setup](docs/admin-gallery-setup.md) for configuration, IAM, secret rotation and backup instructions. Local login throttling is per instance; scaled deployments require upstream rate limiting for shared protection.
