import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createServer, SERVER_NAME } from "./server.ts";

async function connect(): Promise<Client> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverSide);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientSide);
  return client;
}

describe("createServer", () => {
  it("answers the health tool", async () => {
    const client = await connect();
    const result = await client.callTool({ name: "health" });
    expect(result.content).toEqual([
      { type: "text", text: `${SERVER_NAME} is running` },
    ]);
  });
});
