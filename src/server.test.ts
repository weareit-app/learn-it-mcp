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

function fakeEngine(): FakeEngine {
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

describe("createServer", () => {
  it("answers the health tool", async () => {
    const client = await connect({ engine: fakeEngine() });
    const result = await client.callTool({ name: "health" });
    expect(result.content).toEqual([
      { type: "text", text: `${SERVER_NAME} is running` },
    ]);
  });
});

describe("get-progress", () => {
  it("asks the engine for the bound principal's progress on the competency", async () => {
    const engine = fakeEngine();
    const client = await connect({ engine, principal: ada });

    await client.callTool({
      name: "get-progress",
      arguments: { competencyId: "graph-of-a-function" },
    });

    expect(engine.calls).toEqual([
      { principal: ada, competencyId: "graph-of-a-function" },
    ]);
  });

  it("returns the engine's progress unchanged, as structured content and JSON text", async () => {
    const client = await connect({ engine: fakeEngine(), principal: ada });

    const result = await client.callTool({
      name: "get-progress",
      arguments: { competencyId: "graph-of-a-function" },
    });

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
    const engine = fakeEngine();
    const client = await connect({ engine });

    const result = await client.callTool({
      name: "get-progress",
      arguments: { competencyId: "graph-of-a-function" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "No authenticated principal is available." },
    ]);
    expect(engine.calls).toEqual([]);
  });

  it("is listed as a read-only, closed-world tool with input and output schemas", async () => {
    const client = await connect({ engine: fakeEngine() });

    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "get-progress");

    expect(tool?.annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(tool?.inputSchema).toMatchObject({
      type: "object",
      properties: { competencyId: { type: "string" } },
      required: ["competencyId"],
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
