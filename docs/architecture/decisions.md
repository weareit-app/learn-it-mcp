# Architecture decisions

The one record of this repository's decisions, newest last within each section. Changing an agreed choice in `AGENTS.md` adds a dated entry here.

## Starting point

Decided when the repository was generated (see its first commit).

- Visibility: public.
- Licence. Repository: AGPL-3.0-or-later.
- TypeScript on Node 24.21.0 with pnpm 11.25.0: strict TypeScript run through Node's type stripping (no build step), Biome for formatting and lint, Vitest for tests.
- No learning policy, evidence semantics or persistence schema; those belong to learn-it.
- A tool call never chooses which learner it acts for.
- `learn-it` is a planned dependency: the architecture intends it, but it is not in the package files yet. Adding it is a recorded integration milestone, once `learn-it` publishes a version to pin.
- Decisions live in this file; `docs/adr/` is not used, and `tools/decision-records/check-no-adr-folder.mjs` fails if it exists.
