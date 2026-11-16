import 'server-only';
import { listRepoDir, once, readRepoFile } from './files';
import { charts, components, type ReferenceComponent } from './references';
import { kebab } from './slugs';

/*
 * The playground's showcase entries (playground/src/showcase/entries), read as text at build time so
 * a server page knows which previews exist without importing them. To render one, a client component
 * imports `entries` / `inUse` from '@playground/showcase/entries' and picks it by `id`; this module
 * only says which ids a page has.
 */

/** One entry, as its file declares it. */
export type EntryInfo = {
    /** The id the playground knows it by ('radio', 'segmented', 'area-chart'). */
    id: string;
    /** Its name on the playground ('Radio group'). */
    name: string;
    /** Its category id ('inputs', 'charts', 'ai' …), as kit.tsx lists them. */
    category: string;
    /** Its one-line description. */
    description: string;
    /** Whether it exports an in-use piece (`inUse`). */
    hasInUse: boolean;
    /** Whether its preview has knobs. */
    hasKnobs: boolean;
    /** Its file from the repository's root ('playground/src/showcase/entries/radio.tsx'). */
    file: string;
    /** The module to import it by in web/ ('@playground/showcase/entries/radio'). */
    importPath: string;
};

const entriesDir = 'playground/src/showcase/entries';

/** A string property of the `entry` object: `name: 'Badge'` or a quoted string over lines. */
const stringField = (source: string, field: string) => {
    const match = new RegExp(
        `\\n\\s{4}${field}:\\s*\\n?\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"|\`([^\`]*)\`)`,
    ).exec(source);
    const value = match?.[1] ?? match?.[2] ?? match?.[3];
    return value?.replace(/\\(.)/g, '$1');
};

const readEntry = (relative: string): EntryInfo | undefined => {
    const source = readRepoFile(`${entriesDir}/${relative}`);
    const start = source.indexOf('export const entry: Entry = {');
    if (start < 0) return undefined;
    const block = source.slice(start);
    const id = stringField(block, 'id');
    if (!id) return undefined;
    const module = relative.replace(/\.tsx$/, '');
    return {
        id,
        name: stringField(block, 'name') ?? id,
        category: stringField(block, 'category') ?? '',
        description: stringField(block, 'description') ?? '',
        hasInUse: /export const inUse\b/.test(source),
        hasKnobs: /\n\s{4}knobs:/.test(block),
        file: `${entriesDir}/${relative}`,
        importPath: `@playground/showcase/entries/${module}`,
    };
};

/** Every showcase entry, components and charts, by file name. */
export const entryInfos = once((): EntryInfo[] => {
    const files = [
        ...listRepoDir(entriesDir)
            .filter(e => e.isFile() && e.name.endsWith('.tsx'))
            .map(e => e.name),
        ...listRepoDir(`${entriesDir}/charts`)
            .filter(e => e.isFile() && e.name.endsWith('.tsx'))
            .map(e => `charts/${e.name}`),
    ];
    return files.map(readEntry).filter((e): e is EntryInfo => Boolean(e));
});

/** One entry by its id. */
export const entryInfo = (id: string) => entryInfos().find(e => e.id === id);

/*
 * Where a components.md heading and an entry's id differ. Everything else matches by kebab case of
 * one of the heading's names ('StatCard' → 'stat-card').
 */
const aliases: Record<string, string[]> = {
    'activity-list': ['activity'],
    'bottom-bar': ['bottom-bar'],
    'continuum-mark': ['logo'],
    'date-picker': ['date-picker', 'date-range-picker'],
    'dropdown-menu': ['menu'],
    'filter-conditions': ['filter-condition'],
    'nav-item': ['sidebar'],
    'progress': ['progress', 'meter'],
    'radio-group': ['radio'],
    'segmented-control': ['segmented'],
    'sidebar-level': ['sidebar-levels'],
    'skeleton': ['skeleton', 'spinner'],
    'slider': ['slider', 'block-slider'],
    'status-dot': ['status-dot'],
    'textarea': ['field'],
};

/** The entries a component is shown by, in order (most have one; Progress · Meter has two). */
export const entriesFor = (item: Pick<ReferenceComponent, 'slug' | 'parts'>): EntryInfo[] => {
    const ids = new Set<string>(aliases[item.slug] ?? []);
    for (const part of item.parts) {
        const id = kebab(part);
        if (entryInfo(id)) ids.add(id);
    }
    if (ids.size === 0 && entryInfo(item.slug)) ids.add(item.slug);
    return [...ids].map(entryInfo).filter((e): e is EntryInfo => Boolean(e));
};

/** Each component of components.md with its entries: the components section's pages. */
export const componentsWithEntries = once(() =>
    components().map(item => ({ ...item, entries: entriesFor(item) })),
);

/** Each chart of charts.md with its entries ('AreaChart · LineChart · BarChart' → area-chart, bar-chart). */
export const chartsWithEntries = once(() =>
    charts().charts.map(item => ({ ...item, entries: entriesFor(item) })),
);
