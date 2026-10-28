// The MCP server: its tools, independent of any transport.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const SERVER_NAME = "learn-it-mcp";

export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: "0.0.0" });
  server.registerTool(
    "health",
    {
      title: "Health",
      description: "Reports that the server is running, and its name.",
    },
    async () => ({
      content: [{ type: "text", text: `${SERVER_NAME} is running` }],
    }),
  );
  return server;
}
