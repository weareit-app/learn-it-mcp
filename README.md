# learn-it-mcp

MCP adapter over the learn-it engine; no learning logic of its own.

Its purpose is to let AI agents take part in evidence-aware adaptive learning: understand a learner's state, choose and present a learning interaction, submit the attempt with the help that was given, and ask what should happen next. Reading progress is one small part of that. `learn-it` owns every learning decision; this repository is the agent-facing transport. Scope: [learn-it-mcp#2](https://github.com/weareit-app/learn-it-mcp/issues/2); engine specification: [learn-it#2](https://github.com/weareit-app/learn-it/issues/2).

Status: early. One learner tool, `get-progress`, runs over stdio against an in-memory fake engine; with no authenticated principal it refuses every call. The real learning engine (`learn-it`) is not integrated yet.

## Getting started

```sh
pnpm install
pnpm check
```

`pnpm check` runs typecheck, Biome, the Vitest tests, and the skills-sync and decision-record checks.

## Licence

- Repository: AGPL-3.0-or-later.
