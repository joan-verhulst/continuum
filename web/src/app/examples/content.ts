import 'server-only';
import {
    blockInfos,
    charts,
    components,
    firstSentence,
    type PageKind,
    pages,
    type ScreenInfo,
    screenInfos,
} from '@/lib/content';

/*
 * The examples section: the app's reference screens, each built as one page kind of pages.md, then
 * the blocks rebuilt from earlier products, as the playground lists them. A screen's page carries its
 * kind's anatomy; every example lists the parts it imports from the library.
 */

/** "Create or edit one object" reads as "Create or edit" in a title and a URL. */
export const kindName = (kind: PageKind) => kind.name.replace(/ one object$/, '');

/** settings-page, create-or-edit-page. */
export const kindSlug = (kind: PageKind) =>
    `${kindName(kind)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}-page`;

/** A page kind of pages.md, by its slug, and the reference screen that is built as it. */
const kindScreens: Record<string, string> = {
    overview: 'dashboard',
    index: 'list',
    detail: 'detail',
    'create-or-edit-one-object': 'form',
    settings: 'settings',
    assistant: 'agent',
    'sign-in': 'sign-in',
};

export type Example = ScreenInfo & {
    /** /examples/<path>: a screen by its page kind (settings-page), a block by its own slug. */
    path: string;
    /** The page kind a screen is built as. */
    pageKind?: PageKind;
    /** "Settings page" for a screen, "Block" for a block. */
    label: string;
};

/** Every example, in the index's order: the screens in the page kinds' order, then the blocks. */
export const examples = (): Example[] => {
    const screens = screenInfos();
    const kinds = pages().kinds.flatMap(kind => {
        const screen = screens.find(item => item.id === kindScreens[kind.slug]);
        if (!screen) return [];
        return [
            { ...screen, path: kindSlug(kind), pageKind: kind, label: `${kindName(kind)} page` },
        ];
    });
    const blocks = blockInfos().map(block => ({ ...block, path: block.slug, label: 'Block' }));
    return [...kinds, ...blocks];
};

export const exampleBySlug = (slug: string) => examples().find(item => item.path === slug);

/** The page's opening sentence: what the example is, then the playground's own line on it. */
export const exampleLead = (example: Example) => {
    const what = example.description.charAt(0).toLowerCase() + example.description.slice(1);
    if (!example.pageKind) return `A block of an earlier product, rebuilt in Continuum: ${what}`;
    const kind = kindName(example.pageKind).toLowerCase();
    return `${/^[aeiou]/.test(kind) ? 'An' : 'A'} ${kind} page built in Continuum: ${what}`;
};

/** The meta title: "Settings page example", "Live analytics example". */
export const exampleTitle = (example: Example) =>
    `${example.pageKind ? example.label : example.title} example`;

/*
 * Kinds whose section opens on a numbered anatomy, or on a sentence that does not read after "The …
 * page": their opening line, in the same terms as the anatomy under it.
 */
const kindLeads: Record<string, string> = {
    detail: 'A detail page holds everything about one object, stacked in one column at 896: its title row, its facets in tabs, then its numbers and facts.',
    'create-or-edit-one-object':
        'A create or edit page holds the fields of one object, stacked in short sections in a 640 column, with one primary action at the end.',
    settings:
        'A settings page holds one area of settings in a 640 column: a card per group, a row per setting, one control per row.',
    'sign-in':
        'The sign-in page sits outside the app’s shell: one card, 400 wide, centred on the canvas, with the fields and one way in.',
};

/** The one plain sentence a page kind opens with. */
export const kindLead = (kind: PageKind) => {
    const own = kindLeads[kind.slug];
    if (own) return own;
    // The first paragraph only: the anatomy's numbered list follows it.
    const summary = firstSentence(kind.body.split(/\n\s*\n/)[0] ?? '');
    return `The ${kindName(kind).toLowerCase()} page ${summary.charAt(0).toLowerCase()}${summary.slice(1)}`;
};

/** The reference files the anatomy points at, as links to their pages on the site. */
const fileLinks: Record<string, string> = {
    'components.md': '[Components](/components)',
    'charts.md': '[Charts](/charts)',
    'pages.md': '[the page kinds](/examples#screens)',
    'patterns.md': 'the recipes',
    'method.md': 'the method',
};

/** A reference file named in the text (`components.md`) as a link to its page on the site. */
const linkFiles = (markdown: string) => {
    let text = markdown;
    for (const [file, link] of Object.entries(fileLinks)) {
        text = text.replaceAll(`\`${file}\``, link);
    }
    return text;
};

/** The kind's body without the opening sentence the lead already says. */
export const kindAnatomy = (kind: PageKind) => {
    if (kindLeads[kind.slug]) return linkFiles(kind.body);
    const [first, ...rest] = kind.body.split(/\n\s*\n/);
    return linkFiles(/^\s*(\d+\.|-)\s/.test(first ?? '') ? kind.body : rest.join('\n\n'));
};

/** The kind's row of the "On a narrow screen" table, as markdown, if it has one. */
export const kindNarrow = (kind: PageKind) => {
    const narrow = pages().rules.find(rule => rule.slug === 'on-a-narrow-screen');
    const name = kindName(kind).toLowerCase();
    for (const line of narrow?.body.split('\n') ?? []) {
        const cells = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
        if (!cells?.[1] || !cells[2]) continue;
        const kinds = cells[1].toLowerCase().split(/,\s*/);
        if (kinds.includes(name)) return linkFiles(cells[2]);
    }
    return undefined;
};

/** The components and charts an example imports, in the references' order. */
export const exampleParts = (example: Example) => {
    const uses = new Set(example.uses);
    return [
        ...components()
            .filter(item => item.parts.some(part => uses.has(part)))
            .map(item => ({
                href: `/components/${item.slug}`,
                title: item.name,
                meta: item.group,
                description: item.summary,
            })),
        ...charts()
            .charts.filter(item => item.parts.some(part => uses.has(part)))
            .map(item => ({
                href: `/charts/${item.slug}`,
                title: item.name,
                meta: 'Charts',
                description: item.summary,
            })),
    ];
};

/** The examples that import any of these parts, as cards. */
export const examplesUsing = (parts: readonly string[]) =>
    examples()
        .filter(example => parts.some(part => example.uses.includes(part)))
        .map(example => ({
            href: `/examples/${example.path}`,
            title: example.title,
            meta: example.label,
            description: example.description,
        }));
