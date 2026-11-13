/*
 * Writes manifest.json beside this file: the server's name, version, tools and prompts as the
 * built bundle declares them, for the playground's MCP page to list without importing the
 * server. Runs after build.mjs; tracked, so the page builds without building the server first.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const server = await import(pathToFileURL(join(here, 'dist/server.mjs')).href);

const manifest = {
    name: server.name,
    version: server.version,
    tools: server.tools.map(tool => ({
        name: tool.name,
        title: tool.title,
        description: tool.description,
    })),
    prompts: server.prompts.map(prompt => ({
        name: prompt.name,
        title: prompt.title,
        description: prompt.description,
        args: Object.entries(prompt.args).map(([name, schema]) => ({
            name,
            description: schema.description ?? '',
        })),
    })),
};

await writeFile(join(here, 'manifest.json'), `${JSON.stringify(manifest, null, 4)}\n`);
console.log(
    `Wrote manifest.json: ${manifest.tools.length} tools, ${manifest.prompts.length} prompts`,
);
