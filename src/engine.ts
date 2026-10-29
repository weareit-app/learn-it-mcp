// The learning engine as this adapter sees it: transport-neutral, with no MCP
// types. These shapes are local placeholders until `@learn-it/contracts`
// publishes a version to pin; they are then replaced by the contract's own
// (see docs/architecture/dependencies.md). The adapter never interprets them.

/**
 * The subject the trusted host authenticated. Opaque to the adapter: it is
 * passed to the engine, never built from tool input.
 */
export type Principal = { readonly subjectId: string };

/** The engine's progress for one competency, as the engine reports it. */
export type Progress = {
  readonly competencyId: string;
  readonly status: string;
  readonly updatedAt: string;
};

export interface LearningEngine {
  getProgress(principal: Principal, competencyId: string): Promise<Progress>;
}
