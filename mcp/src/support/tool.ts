import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

/*
 * One file per tool and per prompt, each exporting a definition built with `defineTool` or
 * `definePrompt`; server.ts lists them in the order a client shows them. A tool's description
 * says what it reads and when to call it; its body runs inside `guard`, so a failure comes back
 * as a tool error that names the way out, never a stack trace.
 */

export type ToolAnnotations = {
    readOnlyHint?: boolean;
    idempotentHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
};

export type ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape> = {
    /** snake_case, verb first: get_component, audit_ui. */
    name: string;
    title: string;
    /** What it returns and when to call it, for the agent choosing a tool. */
    description: string;
    input: Shape;
    annotations: ToolAnnotations;
    handle: (args: z.infer<z.ZodObject<Shape>>) => Promise<CallToolResult> | CallToolResult;
};

/** Every Continuum tool reads the system and changes nothing: read-only, idempotent, closed world. */
export const readOnly: ToolAnnotations = {
    readOnlyHint: true,
    idempotentHint: true,
    destructiveHint: false,
    openWorldHint: false,
};

/**
 * Reads files from the local disk (audit_source): still read-only, but it reaches past the system.
 */
export const readsDisk: ToolAnnotations = { ...readOnly, openWorldHint: true };

export const defineTool = <Shape extends z.ZodRawShape>(tool: ToolDefinition<Shape>) => tool;

export type PromptDefinition<Shape extends Record<string, z.ZodType<string | undefined>>> = {
    name: string;
    title: string;
    description: string;
    args: Shape;
    handle: (args: { [K in keyof Shape]: z.infer<Shape[K]> }) => string;
};

export const definePrompt = <Shape extends Record<string, z.ZodType<string | undefined>>>(
    prompt: PromptDefinition<Shape>,
) => prompt;

/** A tool error the agent can recover from: what went wrong and the call that fixes it. */
export class ToolError extends Error {}

/** Structured data, also written out as JSON text for clients that only read text. */
export const structured = (data: Record<string, unknown>): CallToolResult => ({
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
});

/** Prose: a spec, an anatomy, a recipe. Markdown as the skill writes it. */
export const text = (markdown: string): CallToolResult => ({
    content: [{ type: 'text', text: markdown }],
});

export const error = (message: string): CallToolResult => ({
    content: [{ type: 'text', text: message }],
    isError: true,
});

/** Runs a tool body; a ToolError is handed back as it is, anything else as a plain failure. */
export const guard = async (run: () => Promise<CallToolResult> | CallToolResult) => {
    try {
        return await run();
    } catch (cause) {
        if (cause instanceof ToolError) return error(cause.message);
        const message = cause instanceof Error ? cause.message : String(cause);
        return error(
            `The tool failed: ${message}. Check the arguments against the tool's schema and call it again.`,
        );
    }
};

export const registerTool = (server: McpServer, tool: ToolDefinition) => {
    server.registerTool(
        tool.name,
        {
            title: tool.title,
            description: tool.description,
            inputSchema: tool.input,
            annotations: { title: tool.title, ...tool.annotations },
        },
        // The SDK validates the arguments against `input` before this runs.
        (args: unknown) => guard(() => tool.handle(args as never)),
    );
};

export const registerPrompt = (
    server: McpServer,
    prompt: PromptDefinition<Record<string, z.ZodType<string | undefined>>>,
) => {
    server.registerPrompt(
        prompt.name,
        { title: prompt.title, description: prompt.description, argsSchema: prompt.args },
        (args: unknown): GetPromptResult => ({
            messages: [
                {
                    role: 'user',
                    content: { type: 'text', text: prompt.handle(args as never) },
                },
            ],
        }),
    );
};
