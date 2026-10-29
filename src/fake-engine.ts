// An in-memory learning engine over made-up records. A test double: it looks
// records up and remembers the calls it received, with no learning logic.
import type { LearningEngine, Principal, Progress } from "./engine.ts";

export type FakeRecord = { principal: Principal; progress: Progress };

export type FakeEngine = LearningEngine & {
  readonly calls: { principal: Principal; competencyId: string }[];
};

export function createFakeEngine(records: FakeRecord[] = []): FakeEngine {
  const calls: FakeEngine["calls"] = [];
  return {
    calls,
    async getProgress(principal, competencyId) {
      calls.push({ principal, competencyId });
      const record = records.find(
        (r) =>
          r.principal.subjectId === principal.subjectId &&
          r.progress.competencyId === competencyId,
      );
      if (!record) throw new Error(`no progress for ${competencyId}`);
      return record.progress;
    },
  };
}
