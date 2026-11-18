// Run outputs live outside the repo, in ../continuum-evals/runs beside it: screenshots and transcripts are not source.
// Runs the eval jobs: each in its own workspace outside the repo, a fresh headless Claude Code with only what
// its cell allows (the package, the skills, the MCP server, the theme brief), then the harness screenshots,
// type-checks and engine-audits what it left. Resumable: a job with a result is skipped.
// Usage: node labs/evals/harness/run.mjs <root> <group|all> [--concurrency 6] [--only text] [--models haiku,sonnet]
import { spawn, spawnSync } from 'node:child_process';
import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const here = import.meta.dirname;
const evals = resolve(here, '..');
const repo = resolve(evals, '../..');
const [rootArg, group = 'pilot', ...rest] = process.argv.slice(2);
const root = resolve(rootArg);
const flag = (name, fallback) => {
    const at = rest.indexOf(`--${name}`);
    return at === -1 ? fallback : rest[at + 1];
};
const concurrency = Number(flag('concurrency', 6));
const only = flag('only', '');
// A comma-separated list of exact job ids: the lean reruns.
const ids = flag('ids', '').split(',').filter(Boolean);
const out = resolve(flag('out', join(evals, '../../../continuum-evals/runs', '2026-11-18')));
const claude = join(
    homedir(),
    'AppData/Roaming/npm/node_modules/@anthropic-ai/claude-code/bin/claude.exe',
);

const allModels = {
    haiku: 'claude-haiku-5-5',
    sonnet: 'claude-sonnet-5-5',
    opus: 'claude-opus-5-5',
};
const modelKeys = flag('models', 'haiku,sonnet,opus').split(',');

/* ---------- Cells: what a run gets ---------- */

const cells = {
    bare: { starter: 'react-bare', base: 'base-plain', intro: 'bare' },
    pkg: { starter: 'react-continuum', base: 'base-continuum', intro: 'pkg' },
    'pkg-skill': {
        starter: 'react-continuum',
        base: 'base-continuum',
        intro: 'pkg',
        skills: 'full',
    },
    'pkg-mcp': { starter: 'react-continuum', base: 'base-continuum', intro: 'pkg', mcp: true },
    'pkg-both': {
        starter: 'react-continuum',
        base: 'base-continuum',
        intro: 'pkg',
        skills: 'full',
        mcp: true,
    },
    'tok-brief': { starter: 'react-tokens', base: 'base-plain', intro: 'tokens', theme: true },
    // The look held constant and nothing else: Continuum's theme tokens only, no brief, skill, MCP or parts,
    // so a comparison with a Continuum run judges composition, not style.
    'tok-only': {
        starter: 'react-tokens',
        base: 'base-plain',
        intro: 'theme',
        theme: true,
        brief: false,
    },
    'tok-both': {
        starter: 'react-tokens',
        base: 'base-plain',
        intro: 'tokens',
        theme: true,
        skills: 'no-assets',
        mcp: true,
    },
    'html-both': {
        starter: 'html',
        base: 'base-plain',
        intro: 'html',
        skills: 'no-assets',
        mcp: true,
    },
};

const intros = {
    bare: 'Build the screen below in this project: React 19, Vite, Tailwind v4 and lucide-react are set up. Design it yourself as a quiet, dense, precise tool UI, the kind of product people use all day.',
    pkg: "Build the screen below in Continuum. This project uses the Continuum design system: the `continuum` package (React components, imported from 'continuum') is installed and wired up in `src/main.tsx` and `src/app.css`, with Tailwind v4 and lucide-react.",
    theme: "Build the screen below in this project: React 19, Vite, Tailwind v4 and lucide-react are set up. `src/app.css` holds the project's theme in Tailwind's names (colours, type sizes, radii, shadows, spacing): use only its values. Design it yourself as a quiet, dense, precise tool UI, the kind of product people use all day.",
    tokens: "Build the screen below in Continuum, without its component library. The library is not available in this project: do not install, import or copy Continuum's components; build every part yourself in React with Tailwind v4 and lucide-react. `src/app.css` holds the project's Continuum theme in Tailwind's names, and `DESIGN.md` at the root is the project's design brief.",
    html: 'Build the screen below in Continuum, in plain HTML and CSS: `index.html` and `styles.css` (no framework, no Tailwind, no build step; a little vanilla JavaScript is fine). There is no component library here: write every part yourself.',
};

const howTo = stack => `## How to work

- ${
    stack === 'html'
        ? 'Write the screen in `index.html` and `styles.css`. `<html>` gets `data-mode="light"` or `data-mode="dark"` from the URL (already wired up in `index.html`).'
        : 'Write the screen in `src/Screen.tsx` (default export; it receives `mode`, "light" or "dark"). You may add files under `src/`.'
}
- The screen is shown full-window at \`/?mode=light\` and \`/?mode=dark\`, the browser's colour scheme set to match. It must work in both.
- \`npm run shot\` saves screenshots to \`shots/\` (light and dark, at 1440 × 900 and 390 × 844) and prints any console errors. Look at them with the Read tool and keep improving until you would ship it.${stack === 'html' ? '' : '\n- `npm run typecheck` checks the types.'}
- Build exactly the content given: invent no extra features, data or copy. No network: draw placeholders for images.
- Don't ask questions: make the call and note it.
- Finish with a short report: what you built, then a list headed "Guesses" of everything you had to decide that the brief${
    stack === 'bare' ? '' : ' or the design system'
} did not settle.`;

/* ---------- Jobs ---------- */

const read = path => readFileSync(join(evals, path), 'utf8');
const jobs = [];
const add = job => jobs.push(job);

const typical = ['t1-orders', 't2-notifications'];
const atypical = ['x1-music-player', 'x2-photo-editor', 'x3-mail-client', 'x4-landing-page'];

const buildPrompt = (screen, cell, extra = '') => {
    const stack =
        cells[cell].intro === 'html'
            ? 'html'
            : cells[cell].intro === 'bare' || cells[cell].intro === 'theme'
              ? 'bare'
              : 'react';
    return `${intros[cells[cell].intro]}\n\n${read(`prompts/build/${screen}.md`)}${extra}\n\n${howTo(stack)}\n`;
};

for (const model of modelKeys) {
    for (const screen of typical) {
        for (const cell of Object.keys(cells)) {
            add({
                group: 'build-typical',
                id: `build-${screen}-${cell}-${model}`,
                kind: 'build',
                model,
                cell,
                prompt: buildPrompt(screen, cell),
            });
        }
    }
    for (const screen of atypical) {
        for (const cell of ['bare', 'pkg-both', 'tok-both', 'tok-only']) {
            add({
                group: 'build-atypical',
                id: `build-${screen}-${cell}-${model}`,
                kind: 'build',
                model,
                cell,
                prompt: buildPrompt(screen, cell),
            });
        }
    }

    const fixtures = [
        'b1-near-miss-settings',
        'b2-generic-dashboard',
        'b3-structure-invoices',
        'b6-clean-settings',
    ];
    for (const fixture of fixtures) {
        for (const cell of ['pkg', 'pkg-skill', 'pkg-mcp', 'pkg-both']) {
            add({
                group: 'audit',
                id: `audit-${fixture.slice(0, 2)}-${cell}-${model}`,
                kind: 'audit',
                model,
                cell,
                fixture,
                disallowed: 'Edit,Write,NotebookEdit',
                prompt: 'Review `src/Screen.tsx` against Continuum, the design system this project uses. List every problem you find, most important first: where it is (line), what is wrong, and the fix. Do not change any file. If nothing is wrong, say so.\n',
            });
        }
    }
    for (const fixture of ['b1-near-miss-settings', 'b3-structure-invoices']) {
        for (const cell of ['pkg', 'pkg-both']) {
            add({
                group: 'improve',
                id: `improve-${fixture.slice(0, 2)}-${cell}-${model}`,
                kind: 'improve',
                model,
                cell,
                fixture,
                prompt: 'Improve `src/Screen.tsx` so it follows Continuum, the design system this project uses. Keep its content and behaviour. `npm run shot` saves screenshots to `shots/` (light and dark, 1440 and 390 wide); look at them with the Read tool. Do not ask questions. When done, list what you changed, and anything you would propose but did not change.\n',
            });
        }
    }

    const triggers = [
        [
            't01',
            true,
            'Add a page that lists our suppliers with their contact person and their last delivery date.',
        ],
        ['t02', true, "Make a dashboard card that shows this week's revenue against last week's."],
        ['t03', true, 'Design a sign-in screen for the app.'],
        ['t04', true, 'Restyle src/Screen.tsx so it looks like the rest of our product.'],
        ['t05', true, 'The cards on our overview feel cramped. What should their padding be?'],
        ['t06', true, 'Add a settings page where people choose their language and time zone.'],
        [
            't07',
            false,
            'Build a pricing landing page for our marketing site, with a big hero and three plans.',
        ],
        [
            't08',
            false,
            'Write a function that parses our CSV order exports into typed objects, with tests.',
        ],
        ['t09', false, 'Set up Vitest for this project.'],
        ['t10', false, 'Explain what React StrictMode does in src/main.tsx.'],
    ];
    for (const [key, expected, text] of triggers) {
        add({
            group: 'trigger',
            id: `trigger-${key}-${model}`,
            kind: 'trigger',
            model,
            cell: 'pkg-skill',
            expected,
            plan: true,
            prompt: `${text}\n\nPlan it only: say how you would do it, then stop. Do not write files.\n`,
        });
    }

    add({
        group: 'theme',
        id: `theme-music-${model}`,
        kind: 'theme',
        model,
        cell: 'tok-both',
        prompt: 'We are starting a desktop music streaming app on Continuum. Make its theme: it opens in dark mode, the accent is a fresh green (#22c55e), the font is Inter, spacing a little roomier than default and corners a little rounder. Write the theme files into this project (replace `src/app.css` and `DESIGN.md`), and tell me whether anything fails contrast and what you would do about it. Do not build any screen.\n',
    });
    add({
        group: 'conflict',
        id: `conflict-t1-orders-pkg-both-${model}`,
        kind: 'build',
        model,
        cell: 'pkg-both',
        prompt: buildPrompt(
            't1-orders',
            'pkg-both',
            '\n**The client also asks**: make the page head a purple-to-pink gradient banner, and give it three filled primary buttons: "New order", "Import" and "Export CSV".\n',
        ),
    });
}

const pilot = ['build-t1-orders-pkg-both-haiku', 'audit-b1-pkg-both-haiku', 'trigger-t01-haiku'];
const chosen = jobs.filter(
    job =>
        (group === 'all' || job.group === group || (group === 'pilot' && pilot.includes(job.id))) &&
        (!only || job.id.includes(only)) &&
        (!ids.length || ids.includes(job.id)),
);

/* ---------- One run ---------- */

const sh = (cmd, args, cwd, timeout = 180_000, env = process.env) => {
    const result = spawnSync(cmd, args, {
        cwd,
        env,
        encoding: 'utf8',
        timeout,
        shell: process.platform === 'win32' && cmd === 'npx',
    });
    return `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
};

const prepare = job => {
    const cell = cells[job.cell];
    const ws = join(root, 'ws', job.id);
    rmSync(ws, { recursive: true, force: true });
    cpSync(join(here, 'starters', cell.starter), ws, { recursive: true });
    symlinkSync(join(root, cell.base, 'node_modules'), join(ws, 'node_modules'), 'junction');
    if (cell.theme) {
        cpSync(join(root, 'theme/app.css'), join(ws, 'src/app.css'));
        if (cell.brief !== false) cpSync(join(root, 'theme/DESIGN.md'), join(ws, 'DESIGN.md'));
    }
    if (cell.skills)
        cpSync(join(root, 'skills', cell.skills), join(ws, '.claude/skills'), { recursive: true });
    if (job.fixture) {
        cpSync(join(evals, 'fixtures', `${job.fixture}.tsx`), join(ws, 'src/Screen.tsx'));
        const main = join(ws, 'src/main.tsx');
        writeFileSync(
            main,
            readFileSync(main, 'utf8').replace('<Screen mode={mode} />', '<Screen />'),
        );
    }
    const config = join(root, 'configs', `${job.id}.json`);
    mkdirSync(join(root, 'configs'), { recursive: true });
    writeFileSync(
        config,
        JSON.stringify({
            mcpServers: cell.mcp
                ? { continuum: { command: 'node', args: [join(root, 'mcp/server.mjs')] } }
                : {},
        }),
    );
    return { ws, config };
};

const runClaude = (job, ws, config, dir) =>
    new Promise(done => {
        const args = [
            '-p',
            '--model',
            allModels[job.model],
            '--setting-sources',
            'project',
            '--strict-mcp-config',
            '--mcp-config',
            config,
            '--output-format',
            'stream-json',
            '--verbose',
            '--no-session-persistence',
        ];
        if (job.plan) args.push('--permission-mode', 'plan');
        else args.push('--dangerously-skip-permissions');
        if (job.disallowed) args.push('--disallowed-tools', job.disallowed);
        const env = { ...process.env };
        for (const key of Object.keys(env)) if (key.startsWith('CLAUDE')) delete env[key];
        const child = spawn(claude, args, { cwd: ws, env });
        const lines = [];
        let buffer = '';
        child.stdout.on('data', chunk => {
            buffer += chunk;
            const parts = buffer.split('\n');
            buffer = parts.pop();
            lines.push(...parts.filter(Boolean));
        });
        let stderr = '';
        child.stderr.on('data', chunk => (stderr += chunk));
        const limit = setTimeout(() => {
            spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F']);
        }, 45 * 60_000);
        child.on('close', code => {
            clearTimeout(limit);
            if (buffer) lines.push(buffer);
            writeFileSync(join(dir, 'transcript.jsonl'), lines.join('\n'));
            if (stderr) writeFileSync(join(dir, 'stderr.txt'), stderr);
            done({ code, lines });
        });
        child.stdin.end(job.prompt);
    });

const summarise = lines => {
    const tools = {};
    let result;
    for (const line of lines) {
        let event;
        try {
            event = JSON.parse(line);
        } catch {
            continue;
        }
        if (event.type === 'assistant') {
            for (const part of event.message?.content ?? []) {
                if (part.type === 'tool_use') {
                    const name = part.name === 'Skill' ? `Skill:${part.input?.skill}` : part.name;
                    tools[name] = (tools[name] ?? 0) + 1;
                }
            }
        }
        if (event.type === 'result') result = event;
    }
    return { tools, result };
};

let engine;
const audit = async files => {
    if (!engine) {
        const sdk = join(repo, 'mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client');
        const { Client } = await import(pathToFileURL(join(sdk, 'index.js')).href);
        const { StdioClientTransport } = await import(pathToFileURL(join(sdk, 'stdio.js')).href);
        engine = new Client({ name: 'evals', version: '1.0.0' });
        await engine.connect(
            new StdioClientTransport({ command: 'node', args: [join(root, 'mcp/server.mjs')] }),
        );
    }
    const result = await engine.callTool({ name: 'audit_source', arguments: { paths: files } });
    return JSON.parse(result.content[0].text);
};

const runJob = async job => {
    const dir = join(out, job.id);
    if (existsSync(join(dir, 'result.json'))) {
        const previous = JSON.parse(readFileSync(join(dir, 'result.json'), 'utf8'));
        if (previous.ok) return console.log(`skip ${job.id}`);
    }
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'prompt.md'), job.prompt);
    const { ws, config } = prepare(job);
    const started = Date.now();
    console.log(`start ${job.id}`);
    const { code, lines } = await runClaude(job, ws, config, dir);
    const { tools, result } = summarise(lines);
    const record = {
        id: job.id,
        group: job.group,
        kind: job.kind,
        model: job.model,
        cell: job.cell,
        fixture: job.fixture,
        expected: job.expected,
        exit: code,
        ok: Boolean(result && !result.is_error),
        wallMs: Date.now() - started,
        durationMs: result?.duration_ms,
        turns: result?.num_turns,
        costUsd: result?.total_cost_usd,
        usage: result?.usage,
        tools,
    };
    writeFileSync(join(dir, 'final.md'), result?.result ?? '(no result)');

    if (job.kind === 'build' || job.kind === 'improve' || job.kind === 'theme') {
        const html = cells[job.cell].starter === 'html';
        const files = html ? ['index.html', 'styles.css'] : ['src'];
        for (const file of files)
            cpSync(join(ws, file), join(dir, 'files', file), { recursive: true });
        if (existsSync(join(ws, 'DESIGN.md')))
            cpSync(join(ws, 'DESIGN.md'), join(dir, 'files/DESIGN.md'));
        if (job.kind !== 'theme') {
            rmSync(join(ws, 'shots'), { recursive: true, force: true });
            record.shot = sh(process.execPath, ['shot.mjs'], ws, 180_000, {
                ...process.env,
                SHOT_SCALE: '2',
            });
            if (existsSync(join(ws, 'shots')))
                cpSync(join(ws, 'shots'), join(dir, 'shots'), { recursive: true });
            if (!html)
                record.typecheck = sh(
                    process.execPath,
                    [join(ws, 'node_modules/typescript/bin/tsc'), '--noEmit'],
                    ws,
                );
            try {
                const findings = await audit(files.map(file => join(ws, file)));
                writeFileSync(join(dir, 'engine-audit.json'), JSON.stringify(findings, null, 2));
                record.engine = findings.summary;
            } catch (error) {
                record.engine = { error: String(error) };
            }
        }
    }
    writeFileSync(join(dir, 'result.json'), JSON.stringify(record, null, 2));
    console.log(
        `done  ${job.id} ok=${record.ok} ${Math.round(record.wallMs / 60000)}min $${record.costUsd?.toFixed?.(2)}`,
    );
};

console.log(`${chosen.length} jobs, ${concurrency} at a time, into ${out}`);
mkdirSync(out, { recursive: true });
const queue = [...chosen];
await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
        while (queue.length) {
            const job = queue.shift();
            try {
                await runJob(job);
            } catch (error) {
                console.log(`fail  ${job.id}: ${error.stack}`);
            }
        }
    }),
);
await engine?.close();
console.log('all done');
