## Deployment target

Production runs on Google Cloud Run: project `aitryout-485605`, region `asia-south1`, service `gsdd-foundation`. Use `.github/workflows/deploy-cloud-run.yml` as the source of truth for deployment settings. It deploys on pushes to `main` and on manual `workflow_dispatch`; a push to `main` is a production deployment.

The workflow authenticates with GitHub Actions Workload Identity Federation, builds and pushes an Artifact Registry image tagged with the commit SHA, then runs `gcloud run deploy`. `Dockerfile` builds with `npm ci` and `npm run build`, then runs `npm run start -- --hostname 0.0.0.0` on port 8080. Keep `next.config.mjs` compatible with the Next.js server runtime; this deployment does not use static export.

Before any production deployment, check the workflow for current project, region, service, identity, and resource settings. Push to `main` or manually dispatch the workflow only when deployment is requested. Do not use ChatGPT Sites to host this repository; `.openai/hosting.json` is not the production deployment configuration.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
