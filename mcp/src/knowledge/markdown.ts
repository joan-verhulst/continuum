import { references } from 'virtual:knowledge';

/*
 * Reading the skill's markdown: split a file by its headings, and the small text helpers the
 * lookups share (a name compared without case or punctuation, a sentence, a word's stem).
 */

export type Section = {
    heading: string;
    /** 2 for ##, 3 for ###. */
    level: number;
    /** The heading and the ## it sits under: ['Colour', 'Roles']. */
    path: string[];
    /** The text under the heading, its subheadings included, without the heading line itself. */
    body: string;
};

const cache = new Map<string, Section[]>();

/** A references file's ## and ### sections, in order; fenced code is never read as a heading. */
export const sections = (file: string): Section[] => {
    const known = cache.get(file);
    if (known) return known;
    const lines = (references[file] ?? '').split(/\r?\n/);
    const heads: Array<{ line: number; level: number; heading: string }> = [];
    let fenced = false;
    lines.forEach((line, index) => {
        if (line.startsWith('```')) fenced = !fenced;
        const match = fenced ? null : /^(#{2,3}) (.+?)\s*$/.exec(line);
        if (match?.[1] && match[2])
            heads.push({ line: index, level: match[1].length, heading: match[2] });
    });
    let parent = '';
    const out = heads.map((head, index) => {
        // A section runs to the next heading of its own level or above.
        const end =
            heads.slice(index + 1).find(next => next.level <= head.level)?.line ?? lines.length;
        if (head.level === 2) parent = head.heading;
        return {
            heading: head.heading,
            level: head.level,
            path: head.level === 2 ? [head.heading] : [parent, head.heading],
            body: lines
                .slice(head.line + 1, end)
                .join('\n')
                .trim(),
        };
    });
    cache.set(file, out);
    return out;
};

/** A section as markdown again, its heading on top. */
export const render = (section: Section) =>
    `${'#'.repeat(section.level)} ${section.heading}\n\n${section.body}`;

/** 'Dropdown menu', 'dropdown-menu' and 'DropdownMenu' all compare as 'dropdownmenu'. */
export const squash = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

/** 'DropdownMenu' → 'dropdown-menu', the showcase's file names. */
export const kebab = (value: string) =>
    value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();

/** 'StatCard' → 'stat card', how the prose names a part. */
export const words = (value: string) => kebab(value).replace(/-/g, ' ');

/** The first sentence, markdown emphasis taken off. */
export const firstSentence = (body: string) => {
    const plain = body
        .replace(/\*\*/g, '')
        .replace(/^[-|].*$/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
    return /^.*?[.!?](?=\s|$)/.exec(plain)?.[0] ?? plain.slice(0, 160);
};

/** A word reduced to a rough stem, so 'filters', 'filtering' and 'filter' meet. */
export const stem = (word: string) => {
    if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
    if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
    if (word.length > 5 && word.endsWith('ed')) return word.slice(0, -2);
    if (/(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
    return word;
};

const stopWords = new Set(
    'a an the of to and or for in on with my i how do does build show make one it is as at by from that this what need want some into be can should when where which page ui'.split(
        ' ',
    ),
);

/** Lower case, punctuation out, stop words out, stemmed. */
export const tokens = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .split(' ')
        .filter(word => word && !stopWords.has(word))
        .map(stem);

/** Edit distance, for "did you mean". */
export const distance = (a: string, b: string) => {
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
        const current = [i];
        for (let j = 1; j <= b.length; j++) {
            current[j] = Math.min(
                (previous[j] ?? 0) + 1,
                (current[j - 1] ?? 0) + 1,
                (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
            );
        }
        previous = current;
    }
    return previous[b.length] ?? 0;
};
