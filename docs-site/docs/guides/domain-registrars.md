---
sidebar_position: 34
---

# Domain Registrars

Wunderland agents can register domains and manage DNS records through **4 supported domain registrars**. Each registrar integration provides tools for domain search, purchase, DNS configuration, and SSL provisioning. Combined with the [Cloud Hosting Providers](./cloud-providers.md), the agent handles end-to-end domain setup during deployment.

## Registrar Comparison

| Registrar | Tools | DNS Management | WHOIS Privacy | Auto-Renew | Required Secrets |
|-----------|-------|---------------|---------------|------------|------------------|
| **Porkbun** | 5 | Full (A, AAAA, CNAME, TXT, MX, NS, SRV, CAA) | Free | Yes | `PORKBUN_API_KEY`, `PORKBUN_SECRET_KEY` |
| **Namecheap** | 5 | Full (A, AAAA, CNAME, TXT, MX, NS, SRV, CAA) | Free (first year) | Yes | `NAMECHEAP_API_KEY`, `NAMECHEAP_USERNAME` |
| **GoDaddy** | 4 | Full (A, AAAA, CNAME, TXT, MX, NS, SRV) | Paid add-on | Yes | `GODADDY_API_KEY`, `GODADDY_API_SECRET` |
| **Cloudflare Registrar** | 5 | Full (A, AAAA, CNAME, TXT, MX, NS, SRV, CAA) | Free | Yes | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

:::tip
If you use Cloudflare Pages for hosting, choose Cloudflare Registrar. DNS records are configured automatically during deployment, eliminating propagation delays from external nameserver changes.
:::

---

## Porkbun

Developer-friendly registrar with competitive pricing and a clean API. Porkbun offers free WHOIS privacy on all domains and supports the full range of DNS record types.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `PORKBUN_API_KEY` | API key from [porkbun.com/account/api](https://porkbun.com/account/api) |
| `PORKBUN_SECRET_KEY` | Secret key (generated alongside the API key) |

**Available Tools:** `porkbun.search-domain`, `porkbun.register-domain`, `porkbun.set-dns`, `porkbun.list-dns`, `porkbun.delete-dns`

**DNS Capabilities:** A, AAAA, CNAME, TXT, MX, NS, SRV, CAA, ALIAS, TLSA

**Example:**

```bash
wunderland chat
> Search for available .com domains related to "moonlanding" and register the best one
```

The agent calls `porkbun.search-domain` with variations, presents pricing, and upon confirmation registers the domain with `porkbun.register-domain`.

---

## Namecheap

One of the largest registrars with broad TLD support and a mature API. Namecheap includes free WhoisGuard privacy for the first year.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `NAMECHEAP_API_KEY` | API key from [ap.www.namecheap.com/settings/tools/apiaccess](https://ap.www.namecheap.com/settings/tools/apiaccess/) |
| `NAMECHEAP_USERNAME` | Namecheap account username |

**Available Tools:** `namecheap.search-domain`, `namecheap.register-domain`, `namecheap.set-dns`, `namecheap.list-dns`, `namecheap.get-nameservers`

**DNS Capabilities:** A, AAAA, CNAME, TXT, MX, NS, SRV, CAA, URL Redirect

:::note
Namecheap API access requires a minimum account balance or approved API access request. Whitelist your IP address in the API settings.
:::

---

## GoDaddy

The largest domain registrar by volume. GoDaddy provides a REST API for domain management, though WHOIS privacy is a paid add-on.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `GODADDY_API_KEY` | API key from [developer.godaddy.com](https://developer.godaddy.com/) |
| `GODADDY_API_SECRET` | API secret (generated with the key) |

**Available Tools:** `godaddy.search-domain`, `godaddy.register-domain`, `godaddy.set-dns`, `godaddy.list-dns`

**DNS Capabilities:** A, AAAA, CNAME, TXT, MX, NS, SRV

:::warning
GoDaddy's production API requires a paid plan for domain purchases. The OTE (test) environment is free but does not execute real registrations.
:::

---

## Cloudflare Registrar

At-cost domain registration through Cloudflare. No markup on registration or renewal fees. Domains registered through Cloudflare automatically use Cloudflare's nameservers, which means DNS changes propagate instantly for Cloudflare-hosted sites.

**Required Secrets:**

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with zone and registrar permissions from [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID (found on the dashboard overview page) |

**Available Tools:** `cloudflare.search-domain`, `cloudflare.register-domain`, `cloudflare.set-dns`, `cloudflare.list-dns`, `cloudflare.configure-ssl`

**DNS Capabilities:** A, AAAA, CNAME, TXT, MX, NS, SRV, CAA, proxied records (orange-cloud)

**Example:**

```bash
wunderland chat
> Register example.dev on Cloudflare and point it to my Cloudflare Pages project
```

Because both hosting and DNS live within Cloudflare, the agent skips nameserver migration and configures the CNAME record directly. SSL is provisioned automatically.

---

## DNS Record Types Reference

When the agent configures DNS for your deployment, it creates the appropriate record types based on the hosting provider's requirements:

| Record Type | Purpose | Example Value | Used By |
|-------------|---------|---------------|---------|
| **A** | Maps domain to IPv4 address | `76.76.21.21` | All providers (direct IP) |
| **AAAA** | Maps domain to IPv6 address | `2606:4700::1` | Cloudflare, DigitalOcean, Fly.io |
| **CNAME** | Aliases domain to another hostname | `cname.vercel-dns.com` | Vercel, Netlify, Cloudflare Pages |
| **TXT** | Verification and metadata | `vercel-verification=abc123` | Domain ownership verification |
| **MX** | Mail server routing | `10 mail.example.com` | Email configuration |
| **NS** | Nameserver delegation | `ns1.cloudflare.com` | Registrar-level configuration |
| **SRV** | Service location records | `0 5 443 api.example.com` | Service discovery, SIP, XMPP |
| **CAA** | Certificate authority authorization | `0 issue "letsencrypt.org"` | SSL policy enforcement |

### Typical DNS Setup Per Provider

Each hosting provider requires different DNS configuration:

- **Vercel** -- CNAME record pointing to `cname.vercel-dns.com` (subdomains) or A record to `76.76.21.21` (apex domains)
- **Cloudflare Pages** -- CNAME record pointing to `<project>.pages.dev`
- **Netlify** -- CNAME to `<site>.netlify.app` or A record to Netlify's load balancer IP
- **Railway** -- CNAME to the Railway-provided domain
- **Fly.io** -- A/AAAA records to the Fly.io allocated IPs (provided after `fly.add-certificate`)
- **DigitalOcean** -- CNAME to the App Platform URL
- **AWS CloudFront** -- CNAME to the CloudFront distribution domain (`d1234.cloudfront.net`)
- **Heroku** -- CNAME to the Heroku DNS target
- **Linode** -- A record to the Linode instance IP

---

## SSL/TLS Auto-Provisioning

All P0 and P1 providers handle SSL certificate provisioning automatically:

| Provider | SSL Method | Wildcard Support |
|----------|-----------|-----------------|
| Vercel | Automatic (Let's Encrypt) | Yes |
| Cloudflare Pages | Automatic (Cloudflare CA) | Yes |
| Netlify | Automatic (Let's Encrypt) | Yes (Pro plan) |
| Railway | Automatic (Let's Encrypt) | No |
| Fly.io | Automatic (Let's Encrypt) | No |
| DigitalOcean | Automatic (Let's Encrypt) | No |
| AWS CloudFront | ACM (manual request) | Yes |
| Heroku | Automatic (ACM) | No |
| Linode | Manual (Certbot/Let's Encrypt) | Yes (with DNS challenge) |

The agent handles SSL setup as part of the deployment flow. For providers that require manual certificate requests (AWS ACM), the agent walks you through the validation process.

---

## Combining Registrars with Providers

The `siteDeploy` tool coordinates between your registrar and hosting provider. A typical flow:

1. Agent detects the framework and selects a hosting provider
2. Agent deploys the project and receives the provider's DNS target
3. Agent calls the registrar's `set-dns` tool to create the required records
4. Agent verifies DNS propagation
5. SSL certificate is provisioned automatically

You can mix any registrar with any provider. The agent knows which DNS records each provider needs and creates them through your registrar's API.

```bash
wunderland chat
> Deploy my Next.js app to Vercel with the domain I have on Porkbun
```

This triggers: `vercel.deploy` followed by `porkbun.set-dns` (CNAME to `cname.vercel-dns.com`) followed by `vercel.add-domain`.
