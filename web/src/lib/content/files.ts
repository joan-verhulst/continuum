import 'server-only';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/*
 * Reading the repository's own files at build time. Every page is generated from sources that
 * already exist (the skill's references, the playground's entries and screens, the MCP manifest,
 * the README), so the site reads them where they live and never keeps a copy.
 */

/** The repository's root: next runs in web/, whose parent holds pnpm-workspace.yaml. */
export const repoRoot = (() => {
    for (const dir of [process.cwd(), path.join(process.cwd(), '..')]) {
        if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    }
    throw new Error(`Could not find the repository root from ${process.cwd()}`);
})();

/** A path in the repository, from its root ('README.md', '.claude/skills/…'). */
export const repoPath = (...parts: string[]) => path.join(repoRoot, ...parts);

/** A file's text, by its path from the repository's root. */
export const readRepoFile = (relative: string) => readFileSync(repoPath(relative), 'utf8');

/** The names in a folder of the repository, by its path from the root. */
export const listRepoDir = (relative: string) =>
    readdirSync(repoPath(relative), { withFileTypes: true });

/** The continuum-taste skill's references folder, from the root. */
export const referencesDir = '.claude/skills/continuum-taste/references';

/** Caches a loader's result for the life of the build (or the dev server's process). */
export const once = <T>(load: () => T) => {
    let value: { v: T } | undefined;
    return () => {
        value ??= { v: load() };
        return value.v;
    };
};
