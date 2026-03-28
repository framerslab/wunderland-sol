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
# Replace workspace:* protocol for EXTERNAL packages (@framers/*, wunderland)
# with npm semver ranges. Keep workspace:* for LOCAL packages (@wunderland-sol/*,
# @wunderland/*) which are always in the Docker build context.
RUN sed -i '/\.\.\/\.\.\//d' pnpm-workspace.yaml \
 && node -e ' \
    const fs = require("fs"); const path = require("path"); \
    const localScopes = ["@wunderland-sol/", "@wunderland/"]; \
    function fix(f) { \
      try { \
        const pkg = JSON.parse(fs.readFileSync(f, "utf8")); let changed = false; \
        for (const section of ["dependencies","devDependencies","optionalDependencies","peerDependencies"]) { \
          if (!pkg[section]) continue; \
          for (const [name, ver] of Object.entries(pkg[section])) { \
            if (typeof ver !== "string" || !ver.startsWith("workspace:")) continue; \
            if (localScopes.some(s => name.startsWith(s))) continue; \
            pkg[section][name] = ver.replace("workspace:*",">=0.1.0").replace("workspace:^","^").replace("workspace:~","~"); \
            changed = true; \
          } \
        } \
        if (changed) fs.writeFileSync(f, JSON.stringify(pkg, null, 2) + "\n"); \
      } catch {} \
    } \
    const glob = require("path"); \
    function walk(dir, depth) { \
      if (depth > 3) return; \
      for (const e of fs.readdirSync(dir, {withFileTypes:true})) { \
        if (e.name === "node_modules") continue; \
        const p = path.join(dir, e.name); \
        if (e.isDirectory()) walk(p, depth+1); \
        else if (e.name === "package.json") fix(p); \
      } \
    } \
    walk(".", 0); \
  '

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
