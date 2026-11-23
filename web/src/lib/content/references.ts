import 'server-only';
import { once, readRepoFile, referencesDir } from './files';
import { firstSentence, type MdDoc, type MdSection, parseMarkdown, plainText } from './markdown';
import { kebab, words } from './slugs';

/*
 * The continuum-taste skill's references, read at build time: the system's own words are the
 * site's text. Each loader returns plain data (markdown bodies kept as markdown).
 */

/** The reference files by name, without '.md'. 'media/react' reaches the medium files. */
export type ReferenceFile =
    | 'foundations'
    | 'pages'
    | 'components'
    | 'patterns'
    | 'charts'
    | 'theming'
    | 'method'
    | 'media/react'
    | 'media/css'
    | 'media/canvas';

const docs = new Map<string, MdDoc>();

/** A reference file split by its headings: `{ title, intro, sections: ## with their ### children }`. */
export const sections = (file: ReferenceFile): MdDoc => {
    let doc = docs.get(file);
    if (!doc) {
        doc = parseMarkdown(readRepoFile(`${referencesDir}/${file}.md`));
        docs.set(file, doc);
    }
    return doc;
};

/** A reference file's raw markdown (for an llms.txt or a page's .md twin). */
export const referenceMarkdown = (file: ReferenceFile) =>
    readRepoFile(`${referencesDir}/${file}.md`);

/* ---------- Components ---------- */

/** One entry of components.md: a part and its pieces ('FilterMenu · FilterMenuTrigger · …'). */
export type ReferenceComponent = {
    /** The first name, the part itself ('FilterMenu'). */
    name: string;
    /** That name as words, for titles and lists ('Filter menu'). */
    title: string;
    /** Every name in the heading, the part first ('FilterMenu', 'FilterMenuTrigger', …). */
    parts: string[];
    /** Kebab case of `name`: the page's URL, /components/filter-menu. */
    slug: string;
    /** The ## family it is under ('Filtering'), and that family's slug ('filtering'). */
    group: string;
    groupSlug: string;
    /** What it is for, in one plain sentence (from its **For** line, else its first sentence). */
    summary: string;
    /** Its whole entry, markdown: For / Not for / With, its parts, values and states. */
    body: string;
};

/** A ## family of components.md: its name, slug, the text under it and its components. */
export type ComponentGroup = {
    name: string;
    slug: string;
    intro: string;
    components: ReferenceComponent[];
};

/** The **For** sentence of an entry, as plain text ('For the main navigation …' → 'The main navigation …'). */
const forLine = (body: string) => {
    const match = /\*\*For\*\*\s+([\s\S]*?\.)(?=\s|$)/.exec(body);
    if (!match?.[1]) return firstSentence(body);
    const text = plainText(match[1]);
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const toComponent = (section: MdSection, group: MdSection): ReferenceComponent => {
    const parts = section.title.split('·').map(part => plainText(part).trim());
    const name = parts[0] ?? section.title;
    return {
        name,
        title: words(name),
        parts,
        slug: kebab(name),
        group: group.title,
        groupSlug: kebab(group.title),
        summary: forLine(section.body),
        body: section.body,
    };
};

/**
 * components.md as families of components, in its order. A family with no ### entries (Charts,
 * which points at charts.md) keeps its intro and an empty list.
 */
export const componentGroups = once((): ComponentGroup[] =>
    sections('components').sections.map(group => ({
        name: group.title,
        slug: kebab(group.title),
        intro: group.body,
        components: group.children.map(child => toComponent(child, group)),
    })),
);

/** Every component of components.md, flat, in its order. */
export const components = once((): ReferenceComponent[] =>
    componentGroups().flatMap(group => group.components),
);

/** One component by its slug ('filter-menu'), or by any of its parts' names ('FilterMenuItem'). */
export const component = (slugOrName: string) =>
    components().find(c => c.slug === slugOrName || c.parts.includes(slugOrName));

/* ---------- Charts ---------- */

/** One chart of charts.md's "Each chart" ('AreaChart · LineChart · BarChart' is one). */
export type ReferenceChart = {
    name: string;
    /** The name as words ('Area chart'). */
    title: string;
    parts: string[];
    /** /charts/area-chart */
    slug: string;
    summary: string;
    body: string;
};

/** charts.md: its general sections (Which chart, The card, The plot …) and each chart. */
export const charts = once(() => {
    const doc = sections('charts');
    const each = doc.sections.find(s => s.slug === 'each-chart');
    const list: ReferenceChart[] = (each?.children ?? []).map(child => {
        const parts = child.title.split('·').map(part => plainText(part).trim());
        const name = parts[0] ?? child.title;
        return {
            name,
            title: words(name),
            parts,
            slug: kebab(name),
            summary: firstSentence(child.body),
            body: child.body,
        };
    });
    return {
        intro: doc.intro,
        /** Every ## but "Each chart": the rules all charts share. */
        general: doc.sections.filter(s => s.slug !== 'each-chart'),
        charts: list,
    };
});

/* ---------- Pages ---------- */

/** A page kind of pages.md ('Overview', 'Index' …) with its width and anatomy. */
export type PageKind = {
    /** 'Overview', without the width in its heading. */
    name: string;
    /** Its heading's slug ('overview', 'create-or-edit-one-object'). */
    slug: string;
    /** The heading as written, width included ('Overview (`default`, 896)'). */
    heading: string;
    /** What follows the name in the heading, plain ('default, 896'), or '' when none. */
    width: string;
    summary: string;
    body: string;
};

/** pages.md: the shell, column, head and section rules, and each page kind. */
export const pages = once(() => {
    const doc = sections('pages');
    const kindsSection = doc.sections.find(s => s.slug === 'the-page-kinds');
    const kinds: PageKind[] = (kindsSection?.children ?? []).map(child => {
        const name = plainText(child.title.split(/[(:]/)[0] ?? child.title).trim();
        const rest = child.title.slice(child.title.split(/[(:]/)[0]?.length ?? 0);
        return {
            name,
            slug: child.slug,
            heading: child.title,
            width: plainText(rest.replace(/^[\s(:]+|\)\s*$/g, '').replace(/\)\s*:.*$/, '')),
            summary: firstSentence(child.body),
            body: child.body,
        };
    });
    return {
        intro: doc.intro,
        /** Every ## but the page kinds: the shell, the column, the page head, a section … */
        rules: doc.sections.filter(s => s.slug !== 'the-page-kinds'),
        kinds,
    };
});

/* ---------- Foundations ---------- */

/** A ## topic of foundations.md (Colour, Type, Radius, Spacing, Heights, Layout …). */
export type FoundationTopic = {
    name: string;
    /** /foundations/colour */
    slug: string;
    summary: string;
    /** The ## section, its ### children kept: render the body, then each child. */
    section: MdSection;
};

/** foundations.md's topics, in its order. */
export const foundationTopics = once((): FoundationTopic[] =>
    sections('foundations').sections.map(section => ({
        name: plainText(section.title),
        slug: section.slug,
        summary: firstSentence(section.body || section.children[0]?.body || ''),
        section,
    })),
);

/* ---------- The README ---------- */

/** README.md split by its headings: the install guide's source. */
export const readme = once(() => parseMarkdown(readRepoFile('README.md')));
