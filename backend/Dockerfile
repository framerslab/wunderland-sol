# syntax=docker/dockerfile:1

# Wunderland Sol — NestJS backend.
# Build context is the wunderland-sol repo root.
#
# External @framers/* packages are installed from npm (not vendored).
# Local packages (sdk, wunderland-social) are built from workspace.

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

# Build local workspace packages only (external @framers/* come pre-built from npm).
RUN pnpm --filter @wunderland/social build 2>/dev/null || true \
 && pnpm --filter @wunderland-sol/sdk build \
 && pnpm --filter @wunderland-sol/backend build

# Prune devDependencies (keep optionals — extensions are optionalDeps).
RUN pnpm prune --prod 2>/dev/null || true

# Ensure local workspace packages are in node_modules.
RUN rm -rf node_modules/@wunderland/social \
 && mkdir -p node_modules/@wunderland \
 && cp -r packages/wunderland-social node_modules/@wunderland/social \
 && rm -rf node_modules/@wunderland-sol/sdk \
 && mkdir -p node_modules/@wunderland-sol \
 && cp -r sdk node_modules/@wunderland-sol/sdk \
 && echo '[docker] Local workspace packages installed into node_modules.'

# -----------------------------------------------------------------------------

FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Chromium for Puppeteer-based Reddit scraping (Reddit blocks datacenter API access).
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy built artifacts and pruned node_modules directly.
# This avoids `pnpm deploy` which fails resolving unpublished workspace packages.
COPY --from=builder /repo/backend/dist ./dist
COPY --from=builder /repo/backend/package.json ./package.json
COPY --from=builder /repo/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/src/main.js"]
