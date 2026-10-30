FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install exactly the locked dependency tree. No dev dependencies are declared.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

# The runtime only needs the Node binary. Removing npm, npx, yarn, and corepack
# shrinks the attack surface and keeps their bundled dependencies out of image
# vulnerability scans.
RUN rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg

# The image optimizer writes to .next/cache at runtime, so .next is owned by the
# unprivileged runtime user. Everything else stays root-owned and read-only.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder /app/public ./public

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || '8080') + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

# Run Next directly instead of through `npm run start` so Node is PID 1 and
# receives Cloud Run's SIGTERM for a clean shutdown.
CMD ["node", "./node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0"]
