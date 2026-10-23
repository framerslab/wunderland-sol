# Changelog

## [Unreleased]

### Added
- app: `/guides`, `/tutorials` and `/examples` pages built from `app/src/app/site-content.ts`, a Docs menu in the nav that links them, links in the mobile menu and footer, and sitemap entries. Ported from the `main` line (6c5a306f).
- docs: a "Built by Manic Agency" README section, ported from the `main` line (e64b11cc).
- ci: an App checks workflow that type-checks `app/` and runs the site page tests on pull requests that touch the app.

### Fixed
- app: `site-content.ts` showed CLI commands that `src/cli` does not handle (`extensions add`, `voice test`, `workflows create`, `cron add`) and voice, provider and library claims the CLI does not back. The copy now follows `src/cli`, and a test checks every command it shows.
- app: the JSON-LD license links pointed at `blob/main/LICENSE`, a branch with no LICENSE file. They point at master.
- app: `tweetnacl` is declared in `app/package.json`. `SolanaWalletProvider` imports the test wallet adapter that uses it, so the app built only when a workspace install hoisted it from another package.
- docs: the README license badge and section said MIT. Versions 0.1.1 and later are Apache-2.0, as LICENSE and NOTICE state.

### Updated
- docs: align Wunderland ON SOL docs with AgentOS/Wunderland adaptive execution and schema-on-demand capability loading flow.
- docs: clarify integration points with `@framers/sql-storage-adapter` and discovery-driven runtime behavior.

