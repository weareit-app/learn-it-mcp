import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import type { Principal, Progress } from "./engine.ts";
import { createFakeEngine, type FakeEngine } from "./fake-engine.ts";
import { createServer, SERVER_NAME } from "./server.ts";

const ada: Principal = { subjectId: "synthetic-learner-ada" };
const adaGraphProgress: Progress = {
  competencyId: "graph-of-a-function",
  status: "engine-defined-status",
  updatedAt: "2026-10-28T12:00:00.000Z",
};

function engineWithAdaRecord(): FakeEngine {
  return createFakeEngine([{ principal: ada, progress: adaGraphProgress }]);
}

async function connect(options: {
  engine: FakeEngine;
  principal?: Principal;
}): Promise<Client> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer(options).connect(serverSide);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientSide);
  return client;
}

function getProgress(client: Client, competencyId = "graph-of-a-function") {
  return client.callTool({ name: "get-progress", arguments: { competencyId } });
}

describe("createServer", () => {
  it("answers the health tool", async () => {
    const client = await connect({ engine: engineWithAdaRecord() });
    const result = await client.callTool({ name: "health" });
    expect(result.content).toEqual([
      { type: "text", text: `${SERVER_NAME} is running` },
    ]);
  });
});

describe("get-progress", () => {
  it("asks the engine for the bound principal's progress on the competency", async () => {
    const engine = engineWithAdaRecord();
    const client = await connect({ engine, principal: ada });

    await getProgress(client);

    expect(engine.calls).toEqual([
      { principal: ada, competencyId: "graph-of-a-function" },
    ]);
    // The very principal the host bound, not a copy rebuilt from input.
    expect(engine.calls[0]?.principal).toBe(ada);
  });

  it("returns the engine's progress unchanged, as structured content and JSON text", async () => {
    const client = await connect({
      engine: engineWithAdaRecord(),
      principal: ada,
    });

    const result = await getProgress(client);

    // The SDK client also checks structuredContent against the output schema.
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      competencyId: "graph-of-a-function",
      status: "engine-defined-status",
      updatedAt: "2026-10-28T12:00:00.000Z",
    });
    const [text] = result.content as { type: string; text: string }[];
    expect(text?.type).toBe("text");
    expect(JSON.parse(text!.text)).toEqual(result.structuredContent);
  });

  it("refuses without calling the engine when the host bound no principal", async () => {
    const engine = engineWithAdaRecord();
    const client = await connect({ engine });

    const result = await getProgress(client);

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "No authenticated principal is available." },
    ]);
    expect(engine.calls).toEqual([]);
  });

  it("rejects a learnerId, so a caller cannot choose whose record it reads", async () => {
    const engine = engineWithAdaRecord();
    const client = await connect({ engine, principal: ada });

    const result = await client.callTool({
      name: "get-progress",
      arguments: {
        competencyId: "graph-of-a-function",
        learnerId: "synthetic-learner-bea",
      },
    });

    expect(result.isError).toBe(true);
    expect(engine.calls).toEqual([]);
  });

  it.each([
    [
      "a principal override",
      { principal: { subjectId: "synthetic-learner-bea" } },
    ],
    ["a subjectId", { subjectId: "synthetic-learner-bea" }],
    ["an unrelated field", { verbose: true }],
  ])("rejects %s, an undeclared field", async (_, extra) => {
    const engine = engineWithAdaRecord();
    const client = await connect({ engine, principal: ada });

    const result = await client.callTool({
      name: "get-progress",
      arguments: { competencyId: "graph-of-a-function", ...extra },
    });

    expect(result.isError).toBe(true);
    expect(engine.calls).toEqual([]);
  });

  it.each([
    ["missing", {}],
    ["empty", { competencyId: "" }],
    ["not a string", { competencyId: 42 }],
  ])("rejects a competencyId that is %s", async (_, args) => {
    const engine = engineWithAdaRecord();
    const client = await connect({ engine, principal: ada });

    const result = await client.callTool({
      name: "get-progress",
      arguments: args,
    });

    expect(result.isError).toBe(true);
    expect(engine.calls).toEqual([]);
  });

  // Principal propagation and session separation at the MCP seam only: this
  // says nothing about host authentication or real storage isolation.
  it("answers each server's client for that server's own principal", async () => {
    const bea: Principal = { subjectId: "synthetic-learner-bea" };
    const engine = createFakeEngine([
      { principal: ada, progress: adaGraphProgress },
      {
        principal: bea,
        progress: {
          competencyId: "graph-of-a-function",
          status: "another-engine-defined-status",
          updatedAt: "2026-10-27T09:30:00.000Z",
        },
      },
    ]);
    const adaClient = await connect({ engine, principal: ada });
    const beaClient = await connect({ engine, principal: bea });

    const adaResult = await getProgress(adaClient);
    const beaResult = await getProgress(beaClient);

    expect(adaResult.structuredContent).toEqual({
      competencyId: "graph-of-a-function",
      status: "engine-defined-status",
      updatedAt: "2026-10-28T12:00:00.000Z",
    });
    expect(beaResult.structuredContent).toEqual({
      competencyId: "graph-of-a-function",
      status: "another-engine-defined-status",
      updatedAt: "2026-10-27T09:30:00.000Z",
    });
    expect(engine.calls.map((call) => call.principal)).toEqual([ada, bea]);
  });

  it("is listed as a read-only, closed-world tool with input and output schemas", async () => {
    const client = await connect({ engine: engineWithAdaRecord() });

    const { tools } = await client.listTools();
    const tool = tools.find((tool) => tool.name === "get-progress");

    expect(tool?.annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(tool?.inputSchema).toMatchObject({
      type: "object",
      properties: { competencyId: { type: "string", minLength: 1 } },
      required: ["competencyId"],
      additionalProperties: false,
    });
    expect(tool?.outputSchema).toMatchObject({
      type: "object",
      properties: {
        competencyId: { type: "string" },
        status: { type: "string" },
        updatedAt: { type: "string" },
      },
      required: ["competencyId", "status", "updatedAt"],
    });
  });
});

describe("get-progress engine errors", () => {
  function errorOf(result: Awaited<ReturnType<typeof getProgress>>) {
    const [text] = result.content as { type: string; text: string }[];
    return JSON.parse(text!.text);
  }

  it("reports an unknown competency with a stable error code", async () => {
    const client = await connect({
      engine: engineWithAdaRecord(),
      principal: ada,
    });

    const result = await getProgress(client, "no-such-competency");

    expect(result.isError).toBe(true);
    expect(errorOf(result)).toEqual({
      code: "unknown-competency",
      message: "The learning engine knows no competency with this ID.",
    });
  });

  it("reports an unexpected engine failure generically, without its message or stack", async () => {
    const failure = new Error("connection to db-internal-7 refused");
    const client = await connect({
      engine: createFakeEngine([], { throws: failure }),
      principal: ada,
    });

    const result = await getProgress(client);

    expect(result.isError).toBe(true);
    expect(errorOf(result)).toEqual({
      code: "engine-failure",
      message: "The learning engine could not answer.",
    });
    const wire = JSON.stringify(result);
    expect(wire).not.toContain("db-internal-7");
    expect(wire).not.toContain(failure.stack!.split("\n")[1]!.trim());
  });

  it.each([
    [
      "an unknown competency",
      "unknown-competency",
      engineWithAdaRecord(),
      "no-such-competency",
    ],
    [
      "an engine failure",
      "engine-failure",
      createFakeEngine([], { throws: new Error("boom") }),
      "graph-of-a-function",
    ],
  ])(
    "returns %s as an error, not as progress",
    async (_, code, engine, competencyId) => {
      const client = await connect({ engine, principal: ada });

      const result = await getProgress(client, competencyId);

      // The SDK skips output-schema validation for an error result; were it
      // applied, the call would fail with an output validation error instead.
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toBeUndefined();
      expect(errorOf(result).code).toBe(code);
    },
  );
});
