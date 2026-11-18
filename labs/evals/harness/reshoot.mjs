// Re-screenshots finished Continuum builds in another theme, without running a model again: each run's own
// src/ in a fresh React workspace whose app.css is that theme from create_theme. The shots land beside the
// run's own, in shots-<label>/.
// Usage: node labs/evals/harness/reshoot.mjs <root> <runs dir> <label> '<options json>' <run id> [run id …]
import { spawnSync } from 'node:child_process';
import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const here = import.meta.dirname;
const repo = resolve(here, '../../..');
const [rootArg, runsArg, label, optionsJson, ...ids] = process.argv.slice(2);
const root = resolve(rootArg);
const runs = resolve(runsArg);

const sdk = join(repo, 'mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client');
const { Client } = await import(pathToFileURL(join(sdk, 'index.js')).href);
const { StdioClientTransport } = await import(pathToFileURL(join(sdk, 'stdio.js')).href);
const client = new Client({ name: 'evals-reshoot', version: '1.0.0' });
await client.connect(
    new StdioClientTransport({ command: 'node', args: [join(root, 'mcp/server.mjs')] }),
);
const result = await client.callTool({
    name: 'create_theme',
    arguments: { label, options: { font: 'geist', ...JSON.parse(optionsJson) } },
});
const { appCss } = JSON.parse(result.content[0].text);
await client.close();

for (const id of ids) {
    const ws = join(root, 'reshoot', `${id}-${label}`);
    rmSync(ws, { recursive: true, force: true });
    cpSync(join(here, 'starters/react-continuum'), ws, { recursive: true });
    symlinkSync(join(root, 'base-continuum/node_modules'), join(ws, 'node_modules'), 'junction');
    cpSync(join(runs, id, 'files/src'), join(ws, 'src'), { recursive: true });
    // Builds made before SidebarAccount's plan became detail: carry the old prop over, so the account
    // line still shows.
    const screen = join(ws, 'src/Screen.tsx');
    if (existsSync(screen)) {
        const code = readFileSync(screen, 'utf8');
        if (code.includes('SidebarAccount'))
            writeFileSync(screen, code.replace(/\bplan=/g, 'detail='));
    }
    // The theme in place of the package's own: the components read the names app.css sets.
    writeFileSync(join(ws, 'src/app.css'), `${appCss}\n@source "../node_modules/continuum/src";\n`);
    const shot = spawnSync(process.execPath, ['shot.mjs'], {
        cwd: ws,
        encoding: 'utf8',
        env: { ...process.env, SHOT_SCALE: '2' },
    });
    const to = join(runs, id, `shots-${label}`);
    rmSync(to, { recursive: true, force: true });
    if (existsSync(join(ws, 'shots'))) {
        mkdirSync(to, { recursive: true });
        cpSync(join(ws, 'shots'), to, { recursive: true });
    }
    console.log(id, (shot.stdout ?? '').trim().split('\n').pop());
}
