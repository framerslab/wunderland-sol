---
sidebar_position: 33
---

# Cloud Hosting Providers

Wunderland agents can be deployed to **9 cloud hosting providers** through the unified deployment system. Each provider is backed by a set of tools that handle project creation, build configuration, deployment, and domain management. The `siteDeploy` orchestration tool selects the best provider automatically based on your project's framework, or you can specify one explicitly.

For end-to-end deployment walkthroughs, see the [Site Deploy Orchestration](./site-deploy.md) guide.

## Provider Overview

| Provider | Tier | Best For | Tools | Required Secrets |
|----------|------|----------|-------|------------------|
| **Vercel** | P0 | Next.js, React, frontend frameworks | 6 | `VERCEL_TOKEN`, `VERCEL_ORG_ID` |
| **Cloudflare Pages** | P0 | Static sites, Workers, edge-first apps | 6 | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| **Netlify** | P0 | JAMstack, static sites, form handling | 5 | `NETLIFY_AUTH_TOKEN` |
| **DigitalOcean App Platform** | P1 | Full-stack apps, managed databases | 5 | `DIGITALOCEAN_TOKEN` |
| **Railway** | P1 | Backend services, databases, quick deploys | 5 | `RAILWAY_TOKEN` |
| **Fly.io** | P1 | Containers, global edge, low-latency APIs | 5 | `FLY_API_TOKEN` |
| **AWS (S3 + CloudFront)** | P2 | Enterprise, static hosting, CDN at scale | 4 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| **Heroku** | P2 | Prototypes, simple backend services | 4 | `HEROKU_API_KEY` |
| **Linode (Akamai)** | P2 | VPS hosting, self-managed infrastructure | 4 | `LINODE_TOKEN` |

## Provider Tiers

Providers are organized by integration depth and reliability:

- **P0 (Core)** -- Vercel, Cloudflare Pages, Netlify. First-class support with full tool coverage, automatic framework detection, preview deployments, and domain binding. These providers receive the most testing and are recommended for production use.

- **P1 (Extended)** -- DigitalOcean, Railway, Fly.io. Solid integrations with good tool coverage. Suitable for backend-heavy applications, container workloads, or when you need managed databases alongside your deployment.

- **P2 (Manual)** -- AWS, Heroku, Linode. Functional integrations with fewer automation tools. These require more manual configuration but offer maximum control over infrastructure.

---

## P0 Core Providers

### Vercel

The default choice for Next.js applications. Vercel handles builds, serverless functions, edge middleware, and preview deployments out of the box.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `VERCEL_TOKEN` | Personal access token from [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization or team ID (found in project settings) |

**Available Tools:** `vercel.create-project`, `vercel.deploy`, `vercel.set-env`, `vercel.list-deployments`, `vercel.add-domain`, `vercel.rollback`

**Best For:** Next.js, React, Svelte, Nuxt, Astro, any framework with a `build` command.

**Example:**

```bash
wunderland chat
> Deploy this Next.js app to Vercel and connect my domain
```

The agent detects `next.config.js`, selects Vercel, creates the project, deploys, and configures the custom domain -- all in one conversation.

:::tip
Vercel auto-detects framework settings from your repository. For monorepos, set the `rootDirectory` in your project settings or pass it as a tool parameter.
:::

---

### Cloudflare Pages

Edge-first hosting with Cloudflare Workers integration. Ideal for static sites that need global distribution, or applications using Cloudflare Workers for server-side logic.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token from [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID (found on the dashboard overview page) |

**Available Tools:** `cloudflare.create-project`, `cloudflare.deploy`, `cloudflare.set-env`, `cloudflare.list-deployments`, `cloudflare.add-domain`, `cloudflare.purge-cache`

**Best For:** Static sites, Astro, SvelteKit, Remix (with Workers adapter), any project targeting edge compute.

**Example:**

```bash
wunderland chat
> Deploy my static site to Cloudflare Pages with the cloudflare.com domain I already own
```

:::note
If you also use Cloudflare Registrar for your domain, DNS records are configured automatically. See the [Domain Registrars](./domain-registrars.md) guide.
:::

---

### Netlify

A mature platform for JAMstack and static sites with built-in form handling, identity, and serverless functions.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `NETLIFY_AUTH_TOKEN` | Personal access token from [app.netlify.com/user/applications](https://app.netlify.com/user/applications) |

**Available Tools:** `netlify.create-site`, `netlify.deploy`, `netlify.set-env`, `netlify.list-deploys`, `netlify.add-domain`

**Best For:** Static sites, Hugo, Gatsby, Eleventy, simple React SPAs.

**Example:**

```bash
wunderland chat
> Build and deploy my Hugo blog to Netlify
```

---

## P1 Extended Providers

### DigitalOcean App Platform

Managed platform for full-stack applications with built-in databases, object storage, and monitoring.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `DIGITALOCEAN_TOKEN` | API token from [cloud.digitalocean.com/account/api/tokens](https://cloud.digitalocean.com/account/api/tokens) |

**Available Tools:** `digitalocean.create-app`, `digitalocean.deploy`, `digitalocean.set-env`, `digitalocean.list-deployments`, `digitalocean.add-domain`

**Best For:** Full-stack Node.js/Python apps, projects needing managed PostgreSQL or Redis alongside the deployment.

---

### Railway

One-command deploys with automatic Nixpacks detection. Railway excels at backend services and database-backed applications.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `RAILWAY_TOKEN` | Project token from [railway.app/account/tokens](https://railway.app/account/tokens) |

**Available Tools:** `railway.create-project`, `railway.deploy`, `railway.set-env`, `railway.list-deployments`, `railway.add-domain`

**Best For:** Backend APIs, database-heavy apps, services that need persistent processes.

**Example:**

```bash
wunderland chat
> Deploy my Express API to Railway and add a PostgreSQL database
```

---

### Fly.io

Container-based deployments with global edge distribution. Fly.io runs your app close to users via micro-VMs.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `FLY_API_TOKEN` | Auth token from `fly auth token` or [fly.io/user/personal_access_tokens](https://fly.io/user/personal_access_tokens) |

**Available Tools:** `fly.create-app`, `fly.deploy`, `fly.set-env`, `fly.list-machines`, `fly.add-certificate`

**Best For:** Docker-based deployments, globally distributed APIs, WebSocket servers, long-running processes.

**Example:**

```bash
wunderland chat
> Deploy this Dockerfile to Fly.io in the iad region
```

---

## P2 Manual Providers

### AWS (S3 + CloudFront)

Static site hosting via S3 buckets with CloudFront CDN distribution. The most scalable option for high-traffic static sites, but requires more configuration.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM access key with S3 and CloudFront permissions |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |

**Available Tools:** `aws.create-bucket`, `aws.deploy-static`, `aws.configure-cdn`, `aws.invalidate-cache`

**Best For:** Enterprise static hosting, sites requiring fine-grained CDN control, existing AWS infrastructure.

:::warning
AWS deployments require IAM permissions for S3, CloudFront, and optionally Route 53. Use a scoped IAM policy rather than root credentials.
:::

---

### Heroku

Simplified platform for prototypes and small backend services. Heroku's buildpack system auto-detects your stack.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `HEROKU_API_KEY` | API key from [dashboard.heroku.com/account](https://dashboard.heroku.com/account) |

**Available Tools:** `heroku.create-app`, `heroku.deploy`, `heroku.set-config`, `heroku.add-domain`

**Best For:** Quick prototypes, simple Node.js/Python/Ruby backends, Heroku Postgres.

---

### Linode (Akamai)

VPS-based hosting for teams that want full server control. Linode deployments provision a Nanode/Linode instance and configure it via StackScripts or SSH.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `LINODE_TOKEN` | Personal access token from [cloud.linode.com/profile/tokens](https://cloud.linode.com/profile/tokens) |

**Available Tools:** `linode.create-instance`, `linode.deploy`, `linode.configure-dns`, `linode.list-instances`

**Best For:** Self-managed servers, custom runtime environments, applications needing root access.

---

## Auto-Selection Logic

When you use the `siteDeploy` tool without specifying a provider, the orchestrator selects one based on your project:

| Framework Detected | Default Provider | Reason |
|--------------------|-----------------|--------|
| Next.js (`next.config.*`) | Vercel | Native Next.js support, serverless functions |
| Nuxt (`nuxt.config.*`) | Vercel | SSR support, edge middleware |
| SvelteKit (`svelte.config.*`) | Vercel | Adapter-auto compatibility |
| Astro (`astro.config.*`) | Cloudflare Pages | Edge-first, static-first defaults |
| Remix (`remix.config.*`) | Cloudflare Pages | Workers adapter, edge rendering |
| Static HTML (no framework) | Netlify | Simple drag-and-deploy, no config needed |
| Dockerfile present | Fly.io | Container-native, global distribution |
| Express/Fastify/NestJS | Railway | Backend-optimized, auto-detection |
| Unknown | Vercel | Broadest framework support as fallback |

You can override auto-selection:

```bash
wunderland chat
> Deploy this to Railway instead of Vercel
```

Or in the tool call directly:

```json
{
  "tool": "siteDeploy",
  "params": {
    "provider": "railway",
    "domain": "api.example.com"
  }
}
```

## Cost Considerations

Most providers offer generous free tiers suitable for agent-deployed projects:

| Provider | Free Tier | Paid Starting At |
|----------|-----------|-----------------|
| Vercel | 100 GB bandwidth, serverless limits | $20/mo (Pro) |
| Cloudflare Pages | Unlimited bandwidth, 500 builds/mo | $5/mo (Workers Paid) |
| Netlify | 100 GB bandwidth, 300 build minutes | $19/mo (Pro) |
| Railway | $5 free credit/mo | Usage-based |
| Fly.io | 3 shared VMs, 160 GB transfer | Usage-based |
| DigitalOcean | $200 free credit (60 days) | $5/mo (Basic) |
| AWS S3 + CF | 5 GB S3, 50 GB CloudFront (12 months) | Usage-based |
| Heroku | Eco dynos $5/mo | $7/mo (Basic) |
| Linode | $100 free credit (60 days) | $5/mo (Nanode) |

The agent factors in cost when making provider recommendations. If you ask for "the cheapest option for a static site," it will suggest Cloudflare Pages (unlimited free bandwidth) over Vercel or Netlify.
