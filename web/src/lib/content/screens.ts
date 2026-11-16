import 'server-only';
import { once, readRepoFile } from './files';

/*
 * The playground's screens and example blocks, as the playground lists them: `screens` in
 * playground/src/screens/index.tsx and `exampleSections` in playground/src/examples/index.tsx. Read
 * as text, so a server page knows their ids, titles and descriptions without importing the screens
 * (which are client code). To draw one, a client component imports `screens` from '@screens/index'
 * (or `exampleSections` from '@playground/examples') and renders the one with that id:
 * `screens.find(s => s.id === id)?.render(true)` gives the still shot.
 */

export type ScreenInfo = {
    /** The playground's id ('dashboard', 'list', 'detail' … or 'e-live-analytics' for a block). */
    id: string;
    /** 'Dashboard', 'Live analytics'. */
    title: string;
    description: string;
    /** The id, without a block's 'e-' prefix ('live-analytics'). */
    slug: string;
    /** 'screen' for one of the app's seven screens, 'block' for a part of an earlier product. */
    kind: 'screen' | 'block';
    /** The names it imports from continuum and continuum/charts ('Table', 'ChartCard' …). */
    uses: string[];
};

/** The names a file imports from 'continuum' or 'continuum/charts', types left out. */
const libraryImports = (source: string) =>
    [...source.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*'continuum(?:\/charts)?'/g)]
        .flatMap(match => (match[1] ?? '').split(','))
        .map(name => name.trim())
        .filter(name => name && !name.startsWith('type '));

/**
 * What a screen or block uses of the library: its own file's imports, and those of each file beside
 * it it takes a component from (a screen's Workspace, the app's shell). One level deep, so a helper
 * imported for a hook does not bring in the parts of screens that never show here.
 */
const usesOf = (dir: string, file: string) => {
    const source = readRepoFile(`${dir}/${file}.tsx`);
    const names = new Set(libraryImports(source));
    for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/([\w-]+)'/g)) {
        const imported = (match[1] ?? '').split(',').map(name => name.trim());
        if (!imported.some(name => /^[A-Z][a-z]/.test(name))) continue;
        for (const name of libraryImports(readRepoFile(`${dir}/${match[2]}.tsx`))) names.add(name);
    }
    return [...names];
};

/** The file each item of a list renders from: `render: () => <Overview />` or `render: liveAnalyticsExample`. */
const sourceFile = (list: string, id: string) => {
    const after = list.slice(list.indexOf(`id: '${id}'`));
    const name = /render:\s*(?:\(\)\s*=>\s*<(\w+)|(\w+))/.exec(after);
    const symbol = name?.[1] ?? name?.[2];
    if (!symbol) return undefined;
    return new RegExp(String.raw`import\s*\{[^}]*\b${symbol}\b[^}]*\}\s*from\s*'\./([\w-]+)'`).exec(
        list,
    )?.[1];
};

/** Every { id, title, description } object literal in a list's source, in order. */
const readList = (source: string): { id: string; title: string; description: string }[] => {
    const items: { id: string; title: string; description: string }[] = [];
    const quoted = String.raw`'((?:[^'\\]|\\.)*)'`;
    const pattern = new RegExp(
        String.raw`id:\s*${quoted},\s*title:\s*${quoted},\s*description:\s*(?:\n\s*)?${quoted}`,
        'g',
    );
    for (const match of source.matchAll(pattern)) {
        const [, id = '', title = '', description = ''] = match;
        const unquote = (text: string) => text.replace(/\\(.)/g, '$1');
        items.push({ id, title: unquote(title), description: unquote(description) });
    }
    return items;
};

/** The seven screens of one generic app, in the playground's order. */
export const screenInfos = once((): ScreenInfo[] => {
    const dir = 'playground/src/screens';
    const list = readRepoFile(`${dir}/index.tsx`);
    return readList(list).map(item => {
        const file = sourceFile(list, item.id);
        return { ...item, slug: item.id, kind: 'screen', uses: file ? usesOf(dir, file) : [] };
    });
});

/** The blocks rebuilt from earlier products, in the playground's order. */
export const blockInfos = once((): ScreenInfo[] => {
    const dir = 'playground/src/examples';
    const list = readRepoFile(`${dir}/index.tsx`);
    return readList(list).map(item => {
        const file = sourceFile(list, item.id);
        return {
            ...item,
            slug: item.id.replace(/^e-/, ''),
            kind: 'block',
            uses: file ? usesOf(dir, file) : [],
        };
    });
});
