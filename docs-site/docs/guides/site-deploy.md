---
sidebar_position: 35
---

# Site Deploy Orchestration

The `siteDeploy` tool is a high-level orchestration tool that handles end-to-end website deployment: framework detection, provider selection, build, deploy, domain configuration, and DNS setup. Instead of calling individual provider tools manually, you describe what you want and the agent coordinates everything.

For provider-specific details, see [Cloud Hosting Providers](./cloud-providers.md). For domain and DNS configuration, see [Domain Registrars](./domain-registrars.md).

## How It Works

```
siteDeploy receives request
        |
   Framework Detection  (scan project files)
        |
   Provider Selection   (framework -> best provider)
        |
   Project Creation     (create project on provider)
        |
   Build & Deploy       (push code, trigger build)
        |
   Domain Configuration (optional)
        |
   DNS Record Setup     (via registrar tools)
        |
   SSL Provisioning     (automatic on most providers)
        |
   Verification         (check deployment is live)
```

A single natural language request triggers all of these steps. The agent reports progress at each stage and asks for confirmation before purchases (domain registration) or destructive actions (overwriting existing deployments).

## Framework Detection

The orchestrator scans your project directory for framework configuration files and determines the build system:

| Detection Signal | Framework | Build Command | Output Directory |
|-----------------|-----------|---------------|-----------------|
| `next.config.js` / `next.config.mjs` / `next.config.ts` | Next.js | `next build` | `.next` |
| `nuxt.config.ts` / `nuxt.config.js` | Nuxt | `nuxt build` | `.output` |
| `svelte.config.js` | SvelteKit | `vite build` | `build` |
| `astro.config.mjs` / `astro.config.ts` | Astro | `astro build` | `dist` |
| `remix.config.js` | Remix | `remix build` | `build` |
| `gatsby-config.js` / `gatsby-config.ts` | Gatsby | `gatsby build` | `public` |
| `angular.json` | Angular | `ng build` | `dist/<project>` |
| `vite.config.ts` / `vite.config.js` | Vite (generic) | `vite build` | `dist` |
| `Dockerfile` | Docker container | `docker build` | Image |
| `index.html` (no framework config) | Static HTML | None | `.` (root) |
| `package.json` with `main` or `start` | Node.js backend | `npm run build` | Varies |

Detection runs in priority order. If multiple config files exist (for example, both `next.config.js` and `Dockerfile`), the framework-specific config takes precedence. You can override detection:

```json
{
  "tool": "siteDeploy",
  "params": {
    "framework": "docker",
    "provider": "fly"
  }
}
```

## Provider Auto-Selection

After detecting the framework, the orchestrator picks the best hosting provider. The mapping considers framework support, serverless capability, and edge distribution:

| Framework | Default Provider | Fallback |
|-----------|-----------------|----------|
| Next.js | Vercel | Netlify |
| Nuxt | Vercel | Cloudflare Pages |
| SvelteKit | Vercel | Cloudflare Pages |
| Astro | Cloudflare Pages | Netlify |
| Remix | Cloudflare Pages | Vercel |
| Gatsby | Netlify | Vercel |
| Angular | Netlify | Vercel |
| Vite (SPA) | Netlify | Cloudflare Pages |
| Static HTML | Netlify | Cloudflare Pages |
| Docker | Fly.io | Railway |
| Node.js backend | Railway | Fly.io |

The fallback provider is used when the primary provider's credentials are missing. If neither set of credentials is available, the agent tells you which secrets to configure and how.

## End-to-End Examples

### Next.js + Vercel + Porkbun

You have a Next.js app, a Vercel account, and a domain on Porkbun.

```bash
wunderland chat
> Deploy my app to production at mysite.com
```

What happens behind the scenes:

1. **Detect**: Finds `next.config.ts` -- identifies Next.js
2. **Select**: Picks Vercel (default for Next.js), verifies `VERCEL_TOKEN` is set
3. **Create**: `vercel.create-project` -- links the repository
4. **Deploy**: `vercel.deploy` -- triggers build, waits for completion
5. **Domain**: `vercel.add-domain` -- registers `mysite.com` on the Vercel project
6. **DNS**: `porkbun.set-dns` -- creates A record (`76.76.21.21`) and TXT verification record
7. **SSL**: Vercel provisions a Let's Encrypt certificate automatically
8. **Verify**: Agent confirms the site is live at `https://mysite.com`

Total time: 2-5 minutes depending on build duration and DNS propagation.

### Static Site + Cloudflare Pages

A plain HTML/CSS/JS site with no build step.

```bash
wunderland chat
> Put this static site on Cloudflare Pages
```

1. **Detect**: No framework config found, `index.html` present -- static HTML
2. **Select**: User specified Cloudflare Pages explicitly
3. **Create**: `cloudflare.create-project` -- creates a Pages project
4. **Deploy**: `cloudflare.deploy` -- uploads the directory contents
5. **Result**: Site is live at `<project>.pages.dev`

No domain configuration needed unless you want a custom domain.

### Backend API + Railway

An Express.js API with a PostgreSQL dependency.

```bash
wunderland chat
> Deploy this backend to Railway and set up the database
```

1. **Detect**: `package.json` with `"main": "src/index.ts"`, no frontend framework -- Node.js backend
2. **Select**: User specified Railway; verifies `RAILWAY_TOKEN`
3. **Create**: `railway.create-project` -- initializes the project
4. **Deploy**: `railway.deploy` -- pushes code, Nixpacks builds automatically
5. **Env**: `railway.set-env` -- configures `DATABASE_URL`, `PORT`, and other variables
6. **Domain**: `railway.add-domain` -- assigns a `*.up.railway.app` subdomain
7. **Result**: API is live, agent provides the URL and connection string

## Dry-Run Mode

Before executing a real deployment, you can preview what the agent would do:

```bash
wunderland chat --dry-run
> Deploy this app to Vercel with my Porkbun domain
```

In dry-run mode, the agent:

- Runs framework detection and reports the result
- Shows which provider would be selected and why
- Lists all tool calls that would be executed, with parameters
- Estimates the number of API calls and potential costs
- Does **not** create projects, deploy, or modify DNS records

This is useful for auditing the deployment plan before committing, especially when domain purchases or DNS changes are involved.

You can also trigger dry-run from within a normal conversation:

```bash
wunderland chat
> Show me the deployment plan for this app without executing it
```

The agent recognizes intent phrases like "show me the plan," "what would happen if," and "preview the deployment" as dry-run requests.

## Domain Setup and DNS Propagation

When a custom domain is part of the deployment, the agent coordinates between the hosting provider and the domain registrar.

### DNS Propagation Timing

After creating DNS records, changes need to propagate across the global DNS infrastructure:

| Scenario | Typical Propagation Time |
|----------|------------------------|
| Same-provider (e.g., Cloudflare Pages + Cloudflare Registrar) | Instant (< 30 seconds) |
| External registrar, provider nameservers | 5-30 minutes |
| Nameserver migration (changing NS records) | 1-48 hours |
| TTL-dependent updates | Up to the previous TTL value |

The agent handles propagation by:

1. Creating the DNS records via the registrar's API
2. Polling the provider's domain verification endpoint
3. Reporting propagation status to you
4. Retrying SSL provisioning once DNS is confirmed

For fastest results, use the same provider for both hosting and DNS (Cloudflare Pages + Cloudflare Registrar), or set low TTL values on existing records before migration.

### Apex Domains vs Subdomains

Most providers recommend different record types for apex domains (`example.com`) versus subdomains (`www.example.com`):

- **Apex domains**: A record (or ALIAS/ANAME if supported) pointing to the provider's IP
- **Subdomains**: CNAME record pointing to the provider's hostname

The agent selects the correct record type automatically. If your registrar supports ALIAS records (Porkbun, Cloudflare), it uses those for apex domains to avoid the limitations of A records with dynamic IPs.

### Redirect Configuration

The agent also sets up common redirects:

- `www.example.com` redirects to `example.com` (or vice versa, based on your preference)
- HTTP redirects to HTTPS (handled at the provider level after SSL provisioning)

```bash
wunderland chat
> Deploy with domain example.com and redirect www to the apex
```

## Tool Parameters Reference

The `siteDeploy` tool accepts these parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | No | Override auto-selection (`vercel`, `cloudflare`, `netlify`, `railway`, `fly`, `digitalocean`, `aws`, `heroku`, `linode`) |
| `framework` | string | No | Override framework detection |
| `domain` | string | No | Custom domain to configure |
| `registrar` | string | No | Domain registrar to use for DNS (`porkbun`, `namecheap`, `godaddy`, `cloudflare`) |
| `branch` | string | No | Git branch to deploy (default: current branch) |
| `env` | object | No | Environment variables to set on the deployment |
| `region` | string | No | Deployment region (provider-specific) |
| `dryRun` | boolean | No | Preview the deployment plan without executing |

When parameters are omitted, the agent infers them from context: the project directory determines the framework, configured credentials determine the provider, and conversation history determines the domain and registrar.
