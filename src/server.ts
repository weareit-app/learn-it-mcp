// The MCP server: its tools, independent of any transport.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  EngineError,
  type EngineErrorCode,
  type LearningEngine,
  type Principal,
  type Progress,
} from "./engine.ts";

export const SERVER_NAME = "learn-it-mcp";

// The output schema mirrors the placeholder `Progress` shape, field for field.
const progressSchema = z.object({
  competencyId: z.string(),
  status: z.string(),
  updatedAt: z.string(),
});

// What the client is told for each typed engine error. The engine's own
// message is never passed on: it may describe the engine's internals.
const engineErrorMessages: Record<EngineErrorCode, string> = {
  "unknown-competency": "The learning engine knows no competency with this ID.",
};

function toolError(code: string, message: string) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ code, message }) },
    ],
    isError: true,
  };
}

export type ServerOptions = {
  engine: LearningEngine;
  /** Set by the trusted host; no tool input can set or change it. */
  principal?: Principal | undefined;
};

export function createServer({ engine, principal }: ServerOptions): McpServer {
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
  server.registerTool(
    "get-progress",
    {
      title: "Get Progress",
      description:
        "The learning engine's progress on one competency, for the learner this server acts for.",
      // Strict: an undeclared field, such as a learner ID, is an error rather
      // than silently dropped.
      inputSchema: z.strictObject({ competencyId: z.string().min(1) }),
      outputSchema: progressSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ competencyId }) => {
      if (!principal) {
        return {
          content: [
            { type: "text", text: "No authenticated principal is available." },
          ],
          isError: true,
        };
      }
      let progress: Progress;
      try {
        progress = await engine.getProgress(principal, competencyId);
      } catch (error) {
        if (error instanceof EngineError) {
          return toolError(error.code, engineErrorMessages[error.code]);
        }
        // Caught here, not by the SDK, which would echo the message.
        return toolError(
          "engine-failure",
          "The learning engine could not answer.",
        );
      }
      return {
        content: [{ type: "text", text: JSON.stringify(progress) }],
        structuredContent: { ...progress },
      };
    },
  );
  return server;
}
