/*
 * Bundles the server into one file, dist/server.mjs, that runs with plain Node anywhere: the
 * library's maths, the playground's theme export and the skill's markdown are all inside it.
 *
 * - 'continuum' resolves to src/continuum-lib.ts (the maths, no components).
 * - 'continuum/<name>.css?raw' and any '?raw' import is the file's text.
 * - 'virtual:knowledge' is the skill's references, the showcase entries, the components and the
 *   reference screens, read when this runs.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const walk = async (dir, keep) => {
    const out = {};
    const visit = async current => {
        for (const entry of await readdir(current, { withFileTypes: true })) {
            const path = join(current, entry.name);
            if (entry.isDirectory()) await visit(path);
            else if (keep(path)) {
                out[relative(dir, path).split(sep).join('/')] = await readFile(path, 'utf8');
            }
        }
    };
    await visit(dir);
    return out;
};

const skillDir = join(root, '.claude/skills/continuum-taste');

const knowledge = async () => {
    const references = await walk(
        join(skillDir, 'references'),
        path => path.endsWith('.md') && !path.includes(`${join('references', 'screens')}`),
    );
    const entries = await walk(join(root, 'playground/src/showcase/entries'), path =>
        path.endsWith('.tsx'),
    );
    const components = await walk(join(root, 'src/components'), path => /\.tsx?$/.test(path));
    const screens = await walk(join(root, 'playground/src/screens'), path => path.endsWith('.tsx'));
    const skill = await readFile(join(skillDir, 'SKILL.md'), 'utf8');
    return [
        `export const skill = ${JSON.stringify(skill)};`,
        `export const references = ${JSON.stringify(references)};`,
        `export const entries = ${JSON.stringify(entries)};`,
        `export const components = ${JSON.stringify(components)};`,
        `export const screens = ${JSON.stringify(screens)};`,
    ].join('\n');
};

const continuum = {
    name: 'continuum',
    setup(b) {
        b.onResolve({ filter: /^continuum$/ }, () => ({
            path: join(here, 'src/continuum-lib.ts'),
        }));
        b.onResolve({ filter: /\?raw$/ }, args => {
            const bare = args.path.replace(/\?raw$/, '');
            const path = bare.startsWith('continuum/')
                ? join(root, 'src/styles', bare.slice('continuum/'.length))
                : resolve(args.resolveDir, bare);
            return { path, namespace: 'raw' };
        });
        b.onLoad({ filter: /.*/, namespace: 'raw' }, async args => ({
            contents: await readFile(args.path, 'utf8'),
            loader: 'text',
        }));
        b.onResolve({ filter: /^virtual:knowledge$/ }, () => ({
            path: 'knowledge',
            namespace: 'virtual',
        }));
        b.onLoad({ filter: /.*/, namespace: 'virtual' }, async () => ({
            contents: await knowledge(),
            loader: 'js',
        }));
    },
};

const entry = process.argv[2] ?? 'src/server.ts';
const outfile = process.argv[3] ?? 'dist/server.mjs';

await build({
    entryPoints: [join(here, entry)],
    outfile: join(here, outfile),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    plugins: [continuum],
    banner: {
        js: "#!/usr/bin/env node\nimport { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
    },
    logLevel: 'warning',
});

console.log(`Built ${outfile}`);
