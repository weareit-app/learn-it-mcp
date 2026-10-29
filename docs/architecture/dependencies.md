# Dependencies

Versions are pinned exactly. A new or upgraded dependency is the newest release at least two weeks old, unless a note here says why not. Review a new dependency's source, licence and install scripts before adding it, and record it here.

- Node 24.21.0 and pnpm 11.25.0, pinned in `mise.toml` and `packageManager`; `mise` is optional.
- Tooling: `@biomejs/biome` 2.5.15, `@types/node` 24.19.2, `typescript` 5.9.3, `vitest` 5.0.5.
- `@modelcontextprotocol/sdk` 1.32.1 (MIT, released 2026-10-05; 1.32.2 was too new on 2026-10-28) with `zod` 4.6.7. Only its stdio transport is used. The SDK also depends on HTTP server packages (express, hono) for transports this repository does not use.

## Integration milestone: `@learn-it/contracts`

Not a dependency yet. On 2026-10-28, `@learn-it/contracts` and `@learn-it/engine` were unpublished, private 0.0.0 packages with no release, so there was nothing to pin. Until there is, the adapter uses a local learning-engine interface (`src/engine.ts`: `LearningEngine`, `Principal`, `Progress`) and an in-memory test double (`src/fake-engine.ts`). Nothing in them is copied from `learn-it`, and no `learn-it` version appears in the package files.

The milestone, once `learn-it` publishes a version to pin:

1. Add `@learn-it/contracts` at that exact version, reviewed and recorded here like any new dependency.
2. Replace the local `LearningEngine`, `Principal` and `Progress` shapes with the contract's own, and derive the tools' input and output schemas from the contract.
3. Map each MCP tool name (such as `get-progress`) to the contract's operation identifier. The tool names themselves stay unchanged (see the naming decision in `decisions.md`).
4. Run the in-memory MCP client tests against the contract's conformance fixtures, if `learn-it` publishes any, and keep the fake engine only as a test double.
