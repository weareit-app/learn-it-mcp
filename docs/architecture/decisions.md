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

## Changes

- 2026-10-28: Issues and specs move from local Markdown under `.scratch/` to GitHub Issues in `weareit-app/learn-it-mcp`, with GitHub's native sub-issues and blocking links. No issues had been filed locally, so nothing migrates. The five default triage labels are created on GitHub.
- 2026-10-28: Naming. MCP tool names are kebab-case (`get-progress`), following most examples in the MCP TypeScript SDK. TypeScript functions, methods and tool input/output fields are camelCase (`getProgress`, `competencyId`), and TypeScript types are PascalCase (`LearningEngine`). A tool name is this adapter's public MCP name, not a learning-engine operation identifier: once `@learn-it/contracts` publishes its identifiers, the adapter maps each tool to one of them and keeps the kebab-case name rather than adopting the contract's naming. Inherited upstream tools (such as `lean-lsp-mcp`'s, in `lean-on-it`) keep their upstream names.
- 2026-10-28: The server takes an injected learning engine and an optional principal, both supplied by the host that creates it; no tool input can name or change the principal. Without a principal, learner tools refuse and the engine is not called. Until `@learn-it/contracts` is pinned, the engine interface is local and the only engine is an in-memory fake, so the stdio server runs with the fake engine and no principal. The integration milestone is in `dependencies.md`.
- 2026-10-28: Tool input. Every MCP tool's input schema is strict: an undeclared field, such as a learner ID or a principal override, is rejected as a tool error before the engine is called, never silently dropped. Identifier fields must be non-empty strings. Whether an identifier made only of whitespace is valid is left to the `learn-it` contract.
- 2026-10-28: Tool errors. Errors the adapter generates, for authorization (no principal) and for the engine, are `isError: true` with a JSON text block `{ code, message }`, and the adapter writes both. Input-validation errors keep the MCP SDK's standard format: an `isError: true` result whose plain-text message names the invalid field. The codes form a closed list: `no-principal`, `engine-failure`, and the engine error codes the adapter explicitly recognises (now `unknown-competency`). An engine never chooses the code or the message a client sees: an unrecognised code, a hostile thrown value, or a result that fails serialisation or the output schema all become `engine-failure`. Successful results pass through as the engine returned them, extra fields included: the engine is the authority for them, and output projection and strictness are revisited when integrating the published `@learn-it/contracts/v1`. Operator logging of unexpected failures is not decided yet, pending a decision on privacy and sensitive learner data.
