// The MCP server: its tools, independent of any transport.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  EngineError,
  type EngineErrorCode,
  type LearningEngine,
  type Principal,
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

const engineFailure = () =>
  toolError("engine-failure", "The learning engine could not answer.");

// Turns anything the engine threw into a tool error. Only codes listed in
// `engineErrorMessages` are public; everything else, including a value whose
// inspection itself throws, is a generic failure. This is caught here, not by
// the SDK, which would echo the thrown message.
function engineErrorResult(error: unknown) {
  try {
    if (error instanceof EngineError) {
      const code = error.code;
      if (Object.hasOwn(engineErrorMessages, code)) {
        return toolError(code, engineErrorMessages[code]);
      }
    }
  } catch {
    // Inspecting the thrown value failed: treat it as unexpected.
  }
  return engineFailure();
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
        return toolError(
          "no-principal",
          "No authenticated principal is available.",
        );
      }
      try {
        const progress = await engine.getProgress(principal, competencyId);
        // Serialised and checked here, inside the guard: what the client gets
        // is plain JSON data equal to the engine's result, or a failure.
        const text = JSON.stringify(progress);
        const structuredContent: unknown = JSON.parse(text);
        if (!progressSchema.safeParse(structuredContent).success) {
          return engineFailure();
        }
        return {
          content: [{ type: "text", text }],
          structuredContent: structuredContent as Record<string, unknown>,
        };
      } catch (error) {
        return engineErrorResult(error);
      }
    },
  );
  return server;
}
