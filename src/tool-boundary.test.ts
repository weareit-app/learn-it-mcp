// Boundary checks every tool must pass, run over whatever `tools/list` shows,
// so a new tool is covered without anyone remembering to add a test. A new
// learner tool fails here until it has a valid-input fixture below.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createFakeEngine } from "./fake-engine.ts";
import { createServer } from "./server.ts";

/** Tools that act for no learner, and so need no principal. */
const exemptTools = ["health"];

/** One valid input per learner tool: valid, so only the principal is missing. */
const learnerToolInputs: Record<string, Record<string, unknown>> = {
  "get-progress": { competencyId: "graph-of-a-function" },
};

async function connectWithoutPrincipal() {
  const engine = createFakeEngine();
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer({ engine }).connect(serverSide);
  const client = new Client({ name: "boundary", version: "0.0.0" });
  await client.connect(clientSide);
  return { client, engine };
}

describe("every tool", () => {
  it("is either exempt or a learner tool with a valid-input fixture", async () => {
    const { client } = await connectWithoutPrincipal();
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name).sort();

    expect(names).toEqual(
      [...exemptTools, ...Object.keys(learnerToolInputs)].sort(),
    );
  });

  it("advertises a strict input schema when it takes input", async () => {
    const { client } = await connectWithoutPrincipal();
    const { tools } = await client.listTools();
    const withInput = tools.filter(
      (tool) => Object.keys(tool.inputSchema.properties ?? {}).length > 0,
    );

    expect(withInput.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(Object.keys(learnerToolInputs)),
    );
    for (const tool of withInput) {
      expect(tool.inputSchema, tool.name).toMatchObject({
        additionalProperties: false,
      });
    }
  });

  it.each(Object.entries(learnerToolInputs))(
    "%s refuses valid input without a principal, and never calls the engine",
    async (name, args) => {
      const { client, engine } = await connectWithoutPrincipal();

      const result = await client.callTool({ name, arguments: args });

      expect(result.isError).toBe(true);
      const [text] = result.content as { type: string; text: string }[];
      expect(JSON.parse(text!.text)).toMatchObject({ code: "no-principal" });
      expect(engine.calls).toEqual([]);
    },
  );
});
