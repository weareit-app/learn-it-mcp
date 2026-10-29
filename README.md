# learn-it-mcp

MCP adapter over the learn-it engine; no learning logic of its own.

Status: early. One learner tool, `get-progress`, runs over stdio against an in-memory fake engine; with no authenticated principal it refuses every call. The real learning engine (`learn-it`) is not integrated yet.

## Getting started

```sh
pnpm install
pnpm check
```

`pnpm check` runs typecheck, Biome, the Vitest tests, and the skills-sync and decision-record checks.

## Licence

- Repository: AGPL-3.0-or-later.
