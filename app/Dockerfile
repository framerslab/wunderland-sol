# syntax=docker/dockerfile:1

# Wunderland Sol — Next.js frontend, standalone repo build.
# Build context is the wunderland-sh repo root.

FROM node:22-bookworm-slim AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Copy the full workspace (filtered by .dockerignore).
COPY . .

# Strip parent monorepo workspace references (only exist when used as submodule).
# Replace workspace:* protocol with npm semver ranges so pnpm fetches from registry.
RUN sed -i '/\.\.\/\.\.\//d' pnpm-workspace.yaml \
 && find . -name 'package.json' -maxdepth 3 -not -path '*/node_modules/*' \
      -exec sed -i \
        's/"workspace:\*"/">=0.1.0"/g; s/"workspace:\^/"^/g; s/"workspace:~/"~/g' \
      {} +

RUN pnpm install --no-frozen-lockfile --shamefully-hoist

# Build local workspace packages, then the Next.js app.
RUN pnpm --filter @wunderland-sol/sdk build \
 && pnpm --filter @wunderland-sol/app build

# -----------------------------------------------------------------------------

FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Copy standalone Next.js build output.
COPY --from=builder /repo/app/.next/standalone ./
COPY --from=builder /repo/app/.next/static ./app/.next/static
COPY --from=builder /repo/app/public ./app/public

EXPOSE 3011
ENV PORT=3011
ENV HOSTNAME="0.0.0.0"

CMD ["node", "app/server.js"]
