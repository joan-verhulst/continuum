import { headingSlug } from './slugs';

/*
 * The references are plain markdown with ## and ### headings. This splits a file by its headings
 * (ignoring any inside code fences) into a tree a page can render or index. Bodies stay markdown;
 * render them with the docs' markdown renderer, or strip them to plain text for a description.
 */

/** A heading and what is under it. */
export type MdSection = {
    /** The heading's text as written, inline markdown kept ('Overview (`default`, 896)'). */
    title: string;
    /** Its words before any parenthesis or colon, kebab case ('overview'): stable for anchors and URLs. */
    slug: string;
    level: 2 | 3;
    /** The markdown under the heading up to the next heading of any level. */
    body: string;
    /** The ### sections under a ##; empty under a ###. */
    children: MdSection[];
};

/** A whole file: its # title, the text before the first ##, and its ## sections. */
export type MdDoc = { title: string; intro: string; sections: MdSection[] };

/** Splits a markdown file by its #, ## and ### headings. */
export const parseMarkdown = (text: string): MdDoc => {
    const doc: MdDoc = { title: '', intro: '', sections: [] };
    // The section being read (none before the first ##) and its lines so far.
    let open: MdSection | undefined;
    let lines: string[] = [];
    let fenced = false;
    const close = () => {
        const body = lines.join('\n').trim();
        if (open) open.body = body;
        else doc.intro = body;
    };

    for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
        if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
        const heading = fenced ? null : /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
        if (!heading) {
            lines.push(line);
            continue;
        }
        const level = heading[1]?.length ?? 1;
        const title = heading[2] ?? '';
        if (level === 1) {
            doc.title = title;
            continue;
        }
        close();
        const section: MdSection = {
            title,
            slug: headingSlug(title),
            level: level as 2 | 3,
            body: '',
            children: [],
        };
        const parent = doc.sections.at(-1);
        if (level === 3 && parent) parent.children.push(section);
        else doc.sections.push(section);
        open = section;
        lines = [];
    }
    close();
    return doc;
};

/** A ## section's whole markdown, its own body and every ### under it with their headings. */
export const fullBody = (section: MdSection) =>
    [section.body, ...section.children.map(child => `### ${child.title}\n\n${child.body}`)]
        .filter(Boolean)
        .join('\n\n');

/** Finds a section by its slug, at any level. */
export const findSection = (doc: MdDoc, slug: string): MdSection | undefined => {
    for (const section of doc.sections) {
        if (section.slug === slug) return section;
        const child = section.children.find(c => c.slug === slug);
        if (child) return child;
    }
    return undefined;
};

/** Inline markdown to plain text: no emphasis, code ticks or links, for a description or a title. */
export const plainText = (markdown: string) =>
    markdown
        .replace(/```[\s\S]*?```/g, '')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\*\*([^*]*)\*\*/g, '$1')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
        .replace(/^\s*[-*]\s+/gm, '')
        .replace(/^\s*\|.*\|\s*$/gm, '')
        .replace(/\s+/g, ' ')
        .trim();

/** The first sentence of some markdown, as plain text: the opening line a page and its meta use. */
export const firstSentence = (markdown: string) => {
    const text = plainText(markdown);
    // A full stop followed by a space and a capital, or the end; numbers like "1.5" do not end it.
    const match = /^(.+?[.!?])(?=\s+[A-Z(]|$)/.exec(text);
    return (match?.[1] ?? text).trim();
};

/** Plain text cut to a length at a word, for a meta description (about 155 characters). */
export const clip = (text: string, max = 155) => {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`;
};
