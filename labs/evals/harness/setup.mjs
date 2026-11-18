// Prepares everything the runs share, outside the repo so no agent sees it:
//   <root>/base-continuum/node_modules   React, Vite, Tailwind, Playwright and the packed continuum
//   <root>/base-plain/node_modules       the same without continuum
//   <root>/mcp/server.mjs                the built MCP server (self-contained)
//   <root>/skills/{full,no-assets}/      the two skills as built, with and without the component copies
//   <root>/theme/{app.css,DESIGN.md}     the default theme from create_theme
// Usage: node labs/evals/harness/setup.mjs <root>
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = resolve(import.meta.dirname, '../../..');
const root = resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('usage: setup.mjs <root>');
mkdirSync(root, { recursive: true });
const sh = (cmd, cwd = repo) => execSync(cmd, { cwd, stdio: 'inherit' });

// 1. Fresh skill builds and the MCP server.
sh('node scripts/build-css.mjs && node scripts/build-skill.mjs');
for (const variant of ['full', 'no-assets']) {
    const to = join(root, 'skills', variant);
    rmSync(to, { recursive: true, force: true });
    for (const skill of ['continuum-taste', 'continuum-fix-padding']) {
        cpSync(join(repo, '.claude/skills', skill), join(to, skill), { recursive: true });
    }
    if (variant === 'no-assets')
        rmSync(join(to, 'continuum-taste/assets'), { recursive: true, force: true });
}
mkdirSync(join(root, 'mcp'), { recursive: true });
cpSync(join(repo, 'mcp/dist/server.mjs'), join(root, 'mcp/server.mjs'));

// 2. The package as a project would get it (only its "files"), then the two dependency bases.
const packDir = join(root, 'pack');
rmSync(packDir, { recursive: true, force: true });
mkdirSync(packDir, { recursive: true });
sh(`npm pack --pack-destination "${packDir}"`);
const tarball = join(
    packDir,
    readdirSync(packDir).find(file => file.endsWith('.tgz')),
);

const shared = {
    react: '^19.3.1',
    'react-dom': '^19.3.1',
    'lucide-react': '^1.60.0',
    '@fontsource-variable/geist': '^5.3.0',
    vite: '^8.3.4',
    '@vitejs/plugin-react': '^6.1.2',
    tailwindcss: '^4.3.3',
    '@tailwindcss/vite': '^4.3.3',
    typescript: '^5.9.3',
    '@types/react': '^19.2.10',
    '@types/react-dom': '^19.2.3',
    playwright: '^1.56.0',
};
for (const [name, extra] of [
    ['base-plain', {}],
    ['base-continuum', { continuum: `file:${tarball.replace(/\\/g, '/')}` }],
]) {
    const dir = join(root, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify(
            { name, private: true, type: 'module', dependencies: { ...shared, ...extra } },
            null,
            2,
        ),
    );
    if (!existsSync(join(dir, 'node_modules'))) sh('npm install --no-audit --no-fund', dir);
}
sh('npx playwright install chromium', join(root, 'base-plain'));

// 3. The default theme, through the MCP server itself.
const sdk = join(repo, 'mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client');
const { Client } = await import(pathToFileURL(join(sdk, 'index.js')).href);
const { StdioClientTransport } = await import(pathToFileURL(join(sdk, 'stdio.js')).href);
const client = new Client({ name: 'evals-setup', version: '1.0.0' });
await client.connect(
    new StdioClientTransport({ command: 'node', args: [join(root, 'mcp/server.mjs')] }),
);
const result = await client.callTool({
    name: 'create_theme',
    arguments: { label: 'Larder', options: { font: 'geist' } },
});
const theme = JSON.parse(result.content[0].text);
mkdirSync(join(root, 'theme'), { recursive: true });
writeFileSync(join(root, 'theme/app.css'), theme.appCss);
writeFileSync(join(root, 'theme/DESIGN.md'), theme.designMd);
await client.close();
console.log('setup done in', root);
