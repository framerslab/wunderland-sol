# @framers/agentos-skills-registry

Curated skills registry for [AgentOS](https://github.com/framersai/agentos) — 40 SKILL.md prompt modules, typed catalog, and lazy-loading factories.

[![npm](https://img.shields.io/npm/v/@framers/agentos-skills-registry?logo=npm&color=cb3837)](https://www.npmjs.com/package/@framers/agentos-skills-registry)

```bash
npm install @framers/agentos-skills-registry
```

## What's Inside

This is the **single package** for AgentOS skills. It contains:

- **40 curated SKILL.md files** — prompt modules spanning social automation, developer tooling, productivity, research, voice, and more
- **registry.json** — machine-readable index of all skills with metadata
- **Static catalog** (`SKILLS_CATALOG`) — typed array with query helpers
- **Registry factories** — `createCuratedSkillRegistry()`, `createCuratedSkillSnapshot()` (requires `@framers/agentos`)
- **Validation script** — `npm run validate` to lint SKILL.md files

## Quick Start

### 1. Browse the catalog (zero peer deps)

The `./catalog` sub-export has no peer dependencies:

```typescript
import {
  SKILLS_CATALOG,
  searchSkills,
  getSkillsByCategory,
  getSkillByName,
  getAvailableSkills,
  getCategories,
  getSkillsByTag,
} from '@framers/agentos-skills-registry/catalog';

// Search across names, descriptions, and tags
const matches = searchSkills('github');

// Filter by category
const social = getSkillsByCategory('social-automation');

// Filter by installed tools
const available = getAvailableSkills(['web-search', 'filesystem']);

// Get a specific skill
const github = getSkillByName('github');
console.log(github?.requiredSecrets); // ['github.token']

// All unique categories
const categories = getCategories();
// ['automation', 'communication', 'creative', 'developer-tools', 'social-automation', ...]
```

### 2. Load raw registry data

Access the JSON index directly:

```typescript
import { getSkillsCatalog } from '@framers/agentos-skills-registry';

const catalog = await getSkillsCatalog();
console.log(catalog.skills.curated.length); // 40
console.log(catalog.version); // '1.0.0'
```

Or import the raw JSON:

```typescript
import registry from '@framers/agentos-skills-registry/registry.json';
console.log(registry.skills.curated[0].name); // 'weather'
```

### 3. Dynamically load skills into an agent (requires @framers/agentos)

The factory functions lazy-load `@framers/agentos` via dynamic `import()`:

```bash
npm install @framers/agentos-skills-registry @framers/agentos
```

```typescript
import {
  createCuratedSkillRegistry,
  createCuratedSkillSnapshot,
  getBundledCuratedSkillsDir,
  loadSkillByName,
} from '@framers/agentos-skills-registry';

// Option A: Create a live SkillRegistry loaded with all curated skills
const registry = await createCuratedSkillRegistry();

// Or load only a specific curated subset
const selectedRegistry = await createCuratedSkillRegistry({
  skills: ['github', 'weather'],
});

// Option B: Build a prompt snapshot for specific skills
const snapshot = await createCuratedSkillSnapshot({
  skills: ['github', 'weather', 'notion'], // or 'all'
  platform: 'darwin',
});

// Only the selected skills are loaded when you pass an explicit list.
console.log(snapshot.skills.map((skill) => skill.name));
// ['github', 'weather', 'notion']

// Inject the snapshot prompt into your agent's system message
const systemPrompt = `You are an AI assistant.\n\n${snapshot.prompt}`;

// Option C: Load a single SKILL.md lazily with parsed metadata
const githubSkill = await loadSkillByName('github');
console.log(githubSkill?.metadata?.primaryEnv); // 'GITHUB_TOKEN'
console.log(githubSkill?.frontmatter.requires_tools); // ['filesystem']

// Option D: Get the directory path and load manually
const skillsDir = getBundledCuratedSkillsDir();
// → '/path/to/node_modules/@framers/agentos-skills-registry/registry/curated'
```

### 4. Dynamic skill resolution in Wunderland presets

```typescript
// In agent.config.json:
// { "suggestedSkills": ["github", "web-search", "notion"] }

import { getSkillByName } from '@framers/agentos-skills-registry/catalog';
import { createCuratedSkillSnapshot } from '@framers/agentos-skills-registry';

// Validate skill names exist before loading
const skillNames = ['github', 'web-search', 'notion'];
const valid = skillNames.filter((name) => {
  const entry = getSkillByName(name);
  if (!entry) {
    console.warn(`Unknown skill "${name}", skipping`);
    return false;
  }
  return true;
});

// Build snapshot with only validated skills
const snapshot = await createCuratedSkillSnapshot({ skills: valid });
```

When `skills` is a string array, the registry only loads those specific `SKILL.md`
files before building the snapshot. It does not walk the full curated bundle first.
Loaded skills also include parsed `metadata` so consumers do not need to decode
the `metadata.agentos` block manually.

## Two Import Paths

| Import | Peer deps | Use case |
|--------|-----------|----------|
| `@framers/agentos-skills-registry/catalog` | None | UI browsing, search, filtering |
| `@framers/agentos-skills-registry` | `@framers/agentos` (optional) | Runtime loading, snapshots, factories |

The `@framers/agentos` dependency is loaded **lazily** at runtime and cached after first resolution. If it's not installed and you call a factory function, you get a clear error with install instructions.

## Included Skills (40)

The catalog now includes both foundational utility skills and social automation modules, including:

- Information and research: `web-search`, `weather`, `summarize`, `deep-research`
- Developer tools: `github`, `coding-agent`, `git`
- Productivity: `notion`, `obsidian`, `trello`, `apple-notes`, `apple-reminders`
- Social automation: `social-broadcast`, `twitter-bot`, `instagram-bot`, `linkedin-bot`, `facebook-bot`, `threads-bot`, `bluesky-bot`, `mastodon-bot`, `youtube-bot`, `tiktok-bot`, `pinterest-bot`, `reddit-bot`, `blog-publisher`
- Additional categories: `automation`, `communication`, `devops`, `media`, `marketing`, `creative`, `security`

## Community Skills

The catalog supports both **curated** (staff-maintained) and **community** (PR-submitted) skills:

```typescript
import { getCuratedSkills, getCommunitySkills } from '@framers/agentos-skills-registry/catalog';

const curated = getCuratedSkills();   // Staff-verified skills
const community = getCommunitySkills(); // Community-contributed
```

Each entry includes a `source` field (`'curated'` or `'community'`) for provenance filtering.

## Schema Types

Import registry.json schema types for type-safe access:

```typescript
import type {
  SkillRegistryEntry,
  SkillsRegistry,
  SkillInstallSpec,
  SkillMetadata,
} from '@framers/agentos-skills-registry';

// SkillRegistryEntry — shape of entries in registry.json
// SkillsRegistry — shape of the full registry.json file
// SkillInstallSpec — install instructions for skill dependencies
```

## Exports

| Export path | Contents |
|-------------|----------|
| `.` | Full SDK: catalog helpers + factory functions + schema types |
| `./catalog` | Lightweight: `SKILLS_CATALOG`, query helpers (zero peer deps) |
| `./registry.json` | Raw JSON index of all skills |
| `./types` | TypeScript declarations for registry.json schema |

## Relationship to Other Packages

```
@framers/agentos-skills-registry     ← This package (data + SDK)
  ├── registry/curated/*/SKILL.md    (bundled prompt modules)
  ├── registry.json                  (machine-readable index)
  ├── catalog.ts                     (typed queries: search, filter, browse)
  └── index.ts                       (factories: lazy-load @framers/agentos)
        └── @framers/agentos         (optional peer: live SkillRegistry + snapshots)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to submit new skills.

## License

MIT
