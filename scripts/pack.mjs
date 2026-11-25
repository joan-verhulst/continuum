/*
 * Builds the two npm packages into pack/ (not tracked), ready to publish:
 *
 * - pack/ui, @contui/ui: the library compiled to JavaScript with its types (dist/), its source
 *   (src/, which theme.css points Tailwind at and agents read), the prebuilt stylesheet, both skills
 *   as built, the MCP server's bundle, and the CLI as its bin. Compiled, so a project's own
 *   TypeScript settings never check the library's source, and no bundler needs to transpile it.
 * - pack/contui, contui: the CLI alone, so `npx contui init` works in any project.
 *
 * The workspace itself still takes the library as source (package.json's exports); only the
 * published copy is compiled. `pnpm build:package` builds the stylesheet, the server and the
 * skills first, then runs this. Publish with `npm publish pack/ui` and `npm publish pack/contui`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'pack');
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

/** Compiles src/ into `dir`: a .js and a .d.ts for each file, 'use client' kept where it is. */
const compile = async dir => {
    const tsc = join(root, 'node_modules/typescript/bin/tsc');
    const args = ['-p', join(root, 'tsconfig.json'), '--noEmit', 'false', '--declaration'];
    const result = spawnSync(
        process.execPath,
        [tsc, ...args, '--outDir', dir, '--rootDir', join(root, 'src')],
        { stdio: 'inherit' },
    );
    if (result.status !== 0) throw new Error('tsc could not compile src/');
    // ESM resolvers want the file itself: './button' is './button.js', './lib' is './lib/index.js'.
    const relative = /(from\s*|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]*)\2/g;
    for (const name of await readdir(dir, { recursive: true })) {
        if (!/\.(js|d\.ts)$/.test(name)) continue;
        const file = join(dir, name);
        const text = await readFile(file, 'utf8');
        const fixed = text.replace(relative, (match, lead, quote, spec) => {
            const base = join(dirname(file), spec);
            if (existsSync(`${base}.js`)) return `${lead}${quote}${spec}.js${quote}`;
            if (existsSync(join(base, 'index.js')))
                return `${lead}${quote}${spec}/index.js${quote}`;
            return match;
        });
        if (fixed !== text) await writeFile(file, fixed);
    }
};

/** The workspace's exports, a TypeScript entry ('./src/index.ts') read from its compiled copy. */
const compiledExports = Object.fromEntries(
    Object.entries(manifest.exports).map(([key, target]) => {
        if (!target.endsWith('.ts')) return [key, target];
        const base = target.replace(/^\.\/src\//, './dist/').replace(/\.ts$/, '');
        return [key, { types: `${base}.d.ts`, default: `${base}.js` }];
    }),
);

const repository = { type: 'git', url: 'git+https://github.com/joan-verhulst/continuum.git' };
const shared = {
    version: manifest.version,
    license: manifest.license,
    type: 'module',
    repository,
    homepage: 'https://github.com/joan-verhulst/continuum#readme',
    engines: { node: '>=20' },
    publishConfig: { access: 'public' },
};

const write = (path, value) => writeFile(path, `${JSON.stringify(value, null, 4)}\n`);

const copy = async (dir, pairs) => {
    for (const [from, to] of pairs) {
        await cp(join(root, from), join(dir, to), { recursive: true });
    }
};

await rm(out, { recursive: true, force: true });

// @contui/ui: everything a project installs.
const ui = join(out, 'ui');
await mkdir(ui, { recursive: true });
await copy(ui, [
    ['src', 'src'],
    ['dist/styles.css', 'dist/styles.css'],
    ['.claude/skills/continuum-taste', 'skills/continuum-taste'],
    ['.claude/skills/continuum-fix-padding', 'skills/continuum-fix-padding'],
    ['mcp/dist/server.mjs', 'mcp/server.mjs'],
    ['cli/contui.mjs', 'cli/contui.mjs'],
    ['README.md', 'README.md'],
    ['LICENSE', 'LICENSE'],
]);
await compile(join(ui, 'dist'));
await write(join(ui, 'package.json'), {
    name: manifest.name,
    description: manifest.description,
    ...shared,
    sideEffects: manifest.sideEffects,
    types: compiledExports['.'].types,
    exports: { ...compiledExports, './package.json': './package.json' },
    bin: { contui: './cli/contui.mjs' },
    dependencies: manifest.dependencies,
    peerDependencies: manifest.peerDependencies,
    // A project outside React installs it for the skills, the server and the tokens alone.
    peerDependenciesMeta: Object.fromEntries(
        Object.keys(manifest.peerDependencies).map(name => [name, { optional: true }]),
    ),
});

// contui: the CLI alone.
const cli = join(out, 'contui');
await mkdir(cli, { recursive: true });
await copy(cli, [
    ['cli/contui.mjs', 'cli/contui.mjs'],
    ['LICENSE', 'LICENSE'],
]);
await write(join(cli, 'package.json'), {
    name: 'contui',
    description: `Sets Continuum up in a project: installs ${manifest.name}, its Claude skills and its MCP server.`,
    ...shared,
    bin: { contui: './cli/contui.mjs' },
});
await writeFile(
    join(cli, 'README.md'),
    `# contui

Sets [Continuum](${shared.homepage}) up in a project, as a dependency:

\`\`\`sh
npx contui init
\`\`\`

It installs \`${manifest.name}\`, copies its Claude skills into \`.claude/skills\`, registers its MCP server in
\`.mcp.json\`, and adds \`contui sync\` to the project's \`postinstall\`, so the skills follow the installed version.
`,
);

console.log(`Packed ${manifest.name} and contui ${manifest.version} into pack/`);
