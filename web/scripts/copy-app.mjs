/*
 * The app inside the site's build: the playground, built with its base at /app/, copied into
 * public/app, so the deployed site serves it at /app beside its own pages. Not tracked.
 */
import { cp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, '../../playground/dist');
const to = join(here, '../public/app');

await rm(to, { recursive: true, force: true });
await cp(from, to, { recursive: true });
console.log('Copied the app into public/app');
