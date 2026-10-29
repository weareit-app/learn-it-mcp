// Starts the server on stdio. There is no network transport: this server is
// for local clients only.
//
// No real learning engine exists yet, and no host authenticates a principal,
// so this runs the fake engine with no records and no principal: learner
// tools are listed but refuse every call.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createFakeEngine } from "./fake-engine.ts";
import { createServer } from "./server.ts";

await createServer({ engine: createFakeEngine() }).connect(
  new StdioServerTransport(),
);
