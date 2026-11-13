import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { SourceFile } from './index';

/*
 * Reading the files audit_source is pointed at: files or folders, walked for every text file a UI
 * can be written in, in any stack, past dependencies and builds, up to a cap so one call stays
 * affordable.
 */

export const fileCap = 400;

const skippedFolders = new Set([
    'node_modules',
    'dist',
    'build',
    'out',
    '.git',
    '.next',
    '.nuxt',
    '.svelte-kit',
    '.angular',
    'coverage',
    'vendor',
    'Pods',
    'DerivedData',
    '.gradle',
    '.dart_tool',
    'bin',
    'obj',
]);

/** The text files a UI is written in, in any stack. JSON only where it holds a theme or tokens. */
export const sourceExtensions = [
    '.tsx',
    '.jsx',
    '.ts',
    '.js',
    '.mjs',
    '.cjs',
    '.vue',
    '.svelte',
    '.astro',
    '.html',
    '.htm',
    '.php',
    '.erb',
    '.hbs',
    '.handlebars',
    '.njk',
    '.liquid',
    '.twig',
    '.cshtml',
    '.razor',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.styl',
    '.qss',
    '.qml',
    '.ui',
    '.xml',
    '.xaml',
    '.kt',
    '.kts',
    '.swift',
    '.dart',
    '.cpp',
    '.cc',
    '.cxx',
    '.c',
    '.h',
    '.hpp',
    '.m',
    '.mm',
    '.cs',
    '.java',
];

export const readable = (path: string) => {
    const lower = path.toLowerCase();
    if (lower.endsWith('.json')) return /(token|theme|colou?r|palette)/.test(basename(lower));
    return sourceExtensions.some(extension => lower.endsWith(extension));
};

/** A path as the findings show it: relative to the working directory when it is inside it. */
const shown = (path: string, cwd: string) => {
    const inside = relative(cwd, path);
    return inside && !inside.startsWith('..') && !isAbsolute(inside)
        ? inside.split(sep).join('/')
        : path.split(sep).join('/');
};

export const readSources = async (paths: string[], cwd = process.cwd()) => {
    const files: SourceFile[] = [];
    const missing: string[] = [];
    let capped = false;
    const visit = async (path: string): Promise<void> => {
        if (files.length >= fileCap) {
            capped = true;
            return;
        }
        const info = await stat(path).catch(() => null);
        if (!info) {
            missing.push(path);
            return;
        }
        if (info.isDirectory()) {
            const entries = await readdir(path, { withFileTypes: true });
            entries.sort((a, b) => a.name.localeCompare(b.name));
            for (const entry of entries) {
                if (entry.isDirectory() && skippedFolders.has(entry.name)) continue;
                if (entry.isFile() && !readable(entry.name)) continue;
                await visit(join(path, entry.name));
            }
        } else if (info.isFile()) {
            // A binary file is no source, whatever its name.
            const content = await readFile(path, 'utf8');
            if (content.slice(0, 2000).includes('\u0000')) return;
            files.push({ path: shown(path, cwd), content });
        }
    };
    for (const path of paths) await visit(resolve(cwd, path));
    return { files, missing, capped };
};

const isTheme = (css: string) => /@theme\b/.test(css) && /--color-neutral-50\s*:/.test(css);

/**
 * The project's theme when none is given: an app.css in Tailwind's names among the files read,
 * or under the working directory's src/.
 */
export const findTheme = async (files: SourceFile[], cwd = process.cwd()) => {
    const given = files.find(file => basename(file.path) === 'app.css' && isTheme(file.content));
    if (given) return { path: given.path, css: given.content };
    const look = async (
        dir: string,
        depth: number,
    ): Promise<{ path: string; css: string } | null> => {
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
            if (!entry.isFile() || entry.name !== 'app.css') continue;
            const css = await readFile(join(dir, entry.name), 'utf8');
            if (isTheme(css)) return { path: shown(join(dir, entry.name), cwd), css };
        }
        if (depth === 0) return null;
        for (const entry of entries) {
            if (!entry.isDirectory() || skippedFolders.has(entry.name)) continue;
            const theme = await look(join(dir, entry.name), depth - 1);
            if (theme) return theme;
        }
        return null;
    };
    return look(join(cwd, 'src'), 3);
};
