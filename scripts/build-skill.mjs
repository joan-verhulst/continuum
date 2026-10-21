/*
 * Bundles the system into the continuum-taste skill, so the skill works in a
 * project that has never seen this repo: the components, the tokens, the
 * prebuilt stylesheet and the recreated screens as examples. With --install it
 * also copies the skill to ~/.claude/skills, where every project can use it.
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = resolve(root, '.claude/skills/continuum-taste');
const assets = join(skill, 'assets/continuum');
const screens = join(skill, 'references/screens');

await rm(assets, { recursive: true, force: true });
await rm(screens, { recursive: true, force: true });
await mkdir(join(assets, 'styles'), { recursive: true });
await mkdir(screens, { recursive: true });

await cp(join(root, 'src/components'), join(assets, 'components'), { recursive: true });
await cp(join(root, 'src/lib'), join(assets, 'lib'), { recursive: true });
await cp(join(root, 'src/index.ts'), join(assets, 'index.ts'));
await cp(join(root, 'src/styles/tokens.css'), join(assets, 'styles/tokens.css'));
await cp(join(root, 'src/styles/theme.css'), join(assets, 'styles/theme.css'));
await cp(join(root, 'dist/styles.css'), join(assets, 'styles.css'));

// The screens import from the package; in a host project that is wherever the assets were copied.
for (const file of await readdir(join(root, 'playground/src/screens'))) {
    const source = await readFile(join(root, 'playground/src/screens', file), 'utf8');
    await writeFile(join(screens, file), source);
}

console.log(`Bundled the system into ${skill}`);

if (process.argv.includes('--install')) {
    const target = join(homedir(), '.claude/skills/continuum-taste');
    await rm(target, { recursive: true, force: true });
    await cp(skill, target, { recursive: true });
    console.log(`Installed to ${target}`);
}
