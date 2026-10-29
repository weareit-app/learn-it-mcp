# Glossary

Terms as this repository uses them. The rules attached to each live in `docs/architecture/decisions.md` (all dated 2026-10-28); this file defines the words.

**Learning engine**: the component that owns every learning decision: competency state, evidence interpretation, next actions. It is `learn-it`. Here it appears only as the injected `LearningEngine` interface, a local placeholder until `@learn-it/contracts` is pinned. Decision: "The server takes an injected learning engine…"; milestone: `docs/architecture/dependencies.md`.

**Trusted host**: the process that creates the MCP server and authenticates whoever is using it. It alone supplies the principal. Authentication belongs to the trusted host; this repository tests only authorization. Decision: "The server takes an injected learning engine…".

**Principal**: the subject the trusted host authenticated, bound to a server when it is created. Every learner tool acts for it. It is opaque to the adapter, and no tool input can name, override or switch it. Avoid: "learner ID" for this; a learner ID in tool input is exactly what the adapter rejects. Decisions: "The server takes an injected learning engine…", "Tool input".

**Learner tool**: a tool that acts for the principal, and so refuses without one. Every tool is a learner tool except those listed as exempt (now only `health`) in `src/tool-boundary.test.ts`.

**Tool error code**: one word of the public error vocabulary the adapter writes into a `{ code, message }` tool error: `no-principal`, `engine-failure`, and the engine error codes the adapter recognises (now `unknown-competency`). The list is closed. SDK input-validation errors are not tool error codes. Decision: "Tool errors".
