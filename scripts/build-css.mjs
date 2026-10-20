import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwind from '@tailwindcss/postcss';
import postcss from 'postcss';
import scope from './postcss-scope.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'src/styles/pds.css');
const to = resolve(root, 'dist/styles.css');

const result = await postcss([tailwind({ optimize: { minify: false } }), scope()]).process(await readFile(from, 'utf8'), {
    from,
    to,
});

await mkdir(dirname(to), { recursive: true });
await writeFile(to, result.css);

console.log(`dist/styles.css: ${(result.css.length / 1024).toFixed(1)} kB`);
