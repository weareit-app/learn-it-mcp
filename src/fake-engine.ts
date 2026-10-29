// An in-memory learning engine over made-up records. A test double: it looks
// records up and remembers the calls it received, with no learning logic.
import {
  EngineError,
  type LearningEngine,
  type Principal,
  type Progress,
} from "./engine.ts";

type FakeRecord = { principal: Principal; progress: Progress };

export type FakeEngine = LearningEngine & {
  readonly calls: { principal: Principal; competencyId: string }[];
};

export function createFakeEngine(
  records: FakeRecord[] = [],
  // When set, every call throws this, as a failing engine would.
  { throws }: { throws?: unknown } = {},
): FakeEngine {
  const calls: FakeEngine["calls"] = [];
  return {
    calls,
    async getProgress(principal, competencyId) {
      calls.push({ principal, competencyId });
      if (throws !== undefined) throw throws;
      const record = records.find(
        (record) =>
          record.principal.subjectId === principal.subjectId &&
          record.progress.competencyId === competencyId,
      );
      if (!record) {
        throw new EngineError(
          "unknown-competency",
          `no progress for ${competencyId}`,
        );
      }
      return record.progress;
    },
  };
}
