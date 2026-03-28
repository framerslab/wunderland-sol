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
# Replace workspace:* for EXTERNAL packages with npm ranges. Keep local packages.
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
            pkg[section][name] = ver.replace("workspace:*","latest").replace("workspace:^","^").replace("workspace:~","~"); \
            changed = true; \
          } \
        } \
        if (changed) fs.writeFileSync(f, JSON.stringify(pkg, null, 2) + "\n"); \
      } catch {} \
    } \
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

RUN rm -f pnpm-lock.yaml
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
