# Coding standards

Rules for review that need judgement. Rules a check can enforce live in checks instead: Biome and `tsc` cover style and types, and `src/tool-boundary.test.ts` covers strict tool input and refusal without a principal for every listed tool. The decisions behind these rules are in `docs/architecture/decisions.md`; where this file and a decision differ, the decision wins.

## Tool handlers: error containment

These rules apply to every MCP tool handler. They carry out the 2026-10-28 decisions "Tool errors" and "The server takes an injected learning engine…".

1. **Everything the engine hands back stays inside the handler's guard.** The call to the engine, classifying anything it throws, serialising its result and checking that result against the output schema all run inside the handler's own `try`. An engine-derived value never reaches the SDK's default error handling, which echoes a thrown message to the client. Review for work done on engine output after the guard closes, and for a classification step that could itself throw outside it.
2. **The adapter writes every error it generates.** Authorization and engine errors are `isError: true` with a `{ code, message }` JSON text block. The adapter chooses both the code and the message, and the code comes from the closed list in the "Tool errors" decision. An unrecognised engine code, an engine's own message, or a stack trace becomes `engine-failure`. Input-validation errors are different: the MCP SDK generates them before the handler runs, and they keep the SDK's standard format. Review for any path that lets an engine-chosen string reach the client, and for adapter code that rewraps SDK validation errors.
