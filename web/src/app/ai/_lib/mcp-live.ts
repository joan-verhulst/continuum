import 'server-only';
import { execFileSync } from 'node:child_process';
import { once, repoPath } from '@/lib/content/files';
import { examples } from './examples';

/*
 * What the MCP server itself says, asked at build time. The manifest (mcp/manifest.json) has each
 * tool's name and description but not its arguments, so a node process of its own imports the
 * built bundle (mcp/dist/server.mjs, tracked, so a clone has it without building), reads every
 * tool's input schema, runs each tool page's example call and hands back the real answers. A
 * process of its own, so the bundler never sees the server's code, and once per build.
 */

export type ToolArgument = {
    name: string;
    /** As a person reads it: 'string', "one of 'light', 'dark'", 'array of object'. */
    type: string;
    required: boolean;
    description: string;
};

export type LiveTool = {
    name: string;
    args: ToolArgument[];
    /** The arguments of the example call, as the site shows it. */
    example: Record<string, unknown> | null;
    /** The server's answer to it: the text of its content, unclipped. */
    output: string;
};

export type McpLive = {
    tools: LiveTool[];
    /** The default theme's DESIGN.md, as create_theme (and the theme builder) writes it. */
    designMd: string;
};

/** Runs the probe once; a failure stops the build, since every tool page needs it. */
export const mcpLive = once((): McpLive => {
    const out = execFileSync(
        process.execPath,
        [
            repoPath('web/src/app/ai/_lib/mcp-probe.mjs'),
            repoPath('mcp/dist/server.mjs'),
            JSON.stringify(examples),
        ],
        // In mcp/, as its tests run it: a tool that looks for a project's app.css finds none.
        { cwd: repoPath('mcp'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    return JSON.parse(out) as McpLive;
});

/** One tool as the server declares it. */
export const liveTool = (name: string) => mcpLive().tools.find(tool => tool.name === name);

/* ---------- Clipping an answer for the page ---------- */

/** A long string or list inside a JSON answer, cut so the shape shows and the bulk does not. */
const clipValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
        return value.length > 180
            ? `${value.slice(0, 140).trimEnd()}… (${value.length} characters)`
            : value;
    }
    if (Array.isArray(value)) {
        const kept = value.slice(0, 2).map(clipValue);
        return value.length > 2 ? [...kept, `… ${value.length - 2} more`] : kept;
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, clipValue(item)]),
        );
    }
    return value;
};

/**
 * An answer short enough to read on a page: JSON with its long strings and lists cut, prose to its
 * first lines. Says how much was left out, so the reader knows it is a part.
 */
export const clipAnswer = (output: string, maxLines = 32) => {
    let text = output.trim();
    if (text.startsWith('{')) {
        try {
            text = JSON.stringify(clipValue(JSON.parse(text)), null, 2);
        } catch {
            // Not JSON after all: cut it as prose.
        }
    }
    const lines = text.split('\n');
    if (lines.length <= maxLines) return text;
    return `${lines.slice(0, maxLines).join('\n')}\n… ${lines.length - maxLines} more lines`;
};

/** A call as an MCP client sends it: the tools/call params. */
export const callText = (name: string, args: Record<string, unknown> | null) =>
    JSON.stringify({ name, arguments: args ?? {} }, null, 2);
