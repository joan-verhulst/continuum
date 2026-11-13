/*
 * Builds the generated half of the two skills from the one source, so they work in a project
 * that has never seen this repo:
 *
 * - continuum-taste/assets/continuum: src/ (components, lib, charts, the index, the token and
 *   theme sheets) and the prebuilt dist/styles.css.
 * - continuum-taste/references/screens: the playground's screens, as examples.
 * - continuum-fix-padding/scripts/spacing.ts: the spacing formula, which its script runs with Node.
 *
 * These copies are gitignored; SKILL.md and the hand-written references are not. With --install
 * it also copies both skills to ~/.claude/skills, where every project can use them, and
 * registers the MCP server (mcp/dist/server.mjs, built before this runs) with Claude Code.
 */
import { spawnSync } from 'node:child_process';
import { cp, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = join(root, '.claude/skills/continuum-taste');
const fixPadding = join(root, '.claude/skills/continuum-fix-padding');
const assets = join(skill, 'assets/continuum');
const screens = join(skill, 'references/screens');

await rm(assets, { recursive: true, force: true });
await rm(screens, { recursive: true, force: true });

const copies = [
    ['src/components', join(assets, 'components')],
    ['src/lib', join(assets, 'lib')],
    ['src/charts', join(assets, 'charts')],
    ['src/index.ts', join(assets, 'index.ts')],
    ['src/styles/tokens.css', join(assets, 'styles/tokens.css')],
    ['src/styles/theme.css', join(assets, 'styles/theme.css')],
    ['dist/styles.css', join(assets, 'styles.css')],
    // The screens import from 'continuum'; SKILL.md says to point that at the copied folder.
    ['playground/src/screens', screens],
    ['src/lib/spacing.ts', join(fixPadding, 'scripts/spacing.ts')],
];

for (const [from, to] of copies) {
    await cp(join(root, from), to, { recursive: true });
}

console.log(`Built ${basename(skill)} and ${basename(fixPadding)}`);

if (process.argv.includes('--install')) {
    for (const source of [skill, fixPadding]) {
        const target = join(homedir(), '.claude/skills', basename(source));
        await rm(target, { recursive: true, force: true });
        await cp(source, target, { recursive: true });
        console.log(`Installed to ${target}`);
    }

    // The MCP server runs from this clone, so a pull updates it; registered for every project.
    const server = join(root, 'mcp/dist/server.mjs').replaceAll('\\', '/');
    const register = ['mcp', 'add', '--scope', 'user', 'continuum', '--', 'node', server];
    const claude = (args, stdio) =>
        spawnSync('claude', args, { stdio, shell: process.platform === 'win32' });
    // Registering again replaces it, so a moved clone points at its new place.
    claude(['mcp', 'remove', '--scope', 'user', 'continuum'], 'ignore');
    const added = claude(register, 'inherit');
    if (added.status === 0) {
        console.log(`Registered the MCP server with Claude Code: ${server}`);
    } else {
        console.log(`Register the MCP server yourself:\n  claude ${register.join(' ')}`);
    }
    console.log(`For Cursor, VS Code or another client: command "node", argument "${server}"`);
}
