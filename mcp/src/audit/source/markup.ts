import type { SystemValues } from '../../system/values';
import type { ElementFact, UINode } from '../../types';
import { attributesOf, tagEnd } from './scan';
import { subjectOf } from './subject';
import { libraryNames } from './utilities';

/*
 * Elements in markup, whatever writes it: JSX, an Angular, Vue or Svelte template, HTML, a PHP,
 * Blade or ERB view. Two readings. The raw elements the system has a part for (a <button>, an
 * <input>, a <table>, a badge drawn from a span) become element facts, for the rule that asks
 * for the part. And the elements' nesting becomes a skeleton tree, for the checks that need the
 * page's shape (one primary, a container in a container, tabs over a table, one page title).
 */

const raw = /^(button|input|select|textarea|table|dialog|hr)$/;

const badgeClasses = (classes: string) =>
    /(^|[\s_-])(badge|tag|pill|chip|label-small|status)([\s_-]|$)/i.test(classes) ||
    (/(^|\s)rounded-(full|pill|chip)(\s|$)/.test(classes) &&
        /(^|\s)text-(xxs|xs)(\s|$)/.test(classes) &&
        /(^|\s)bg-/.test(classes) &&
        /(^|\s)px-(0\.5|1|1\.5|2|2\.5)(\s|$)/.test(classes));

/** Whether the file imports the library (or a local copy of it), so its parts are one import away. */
export const importsLibrary = (text: string) =>
    /from\s+['"](?:[^'"]*\/)?continuum(?:\/[\w-]+)?['"]/.test(text);

type Tag = {
    name: string;
    attributes: Record<string, string>;
    offset: number;
    end: number;
    selfClosing: boolean;
    closing: boolean;
};

/** Every tag in the text, opening, closing and self-closing, in order. */
const tagsIn = (text: string): Tag[] => {
    const out: Tag[] = [];
    for (const match of text.matchAll(/<(\/?)([A-Za-z][\w.:-]*)/g)) {
        const offset = match.index ?? 0;
        // A generic in TypeScript (useState<string>) is not a tag.
        if (/[\w)\]]$/.test(text.slice(Math.max(0, offset - 1), offset))) continue;
        const end = tagEnd(text, offset + match[0].length);
        const inner = text.slice(offset + match[0].length, end);
        out.push({
            name: match[2] ?? '',
            attributes: match[1] ? {} : attributesOf(inner),
            offset,
            end,
            selfClosing:
                /\/\s*$/.test(inner) || /^(input|hr|br|img|meta|link)$/i.test(match[2] ?? ''),
            closing: match[1] === '/',
        });
    }
    return out;
};

const classesOf = (attributes: Record<string, string>) =>
    [attributes.class, attributes.className, attributes['[class]'], attributes[':class']]
        .filter(Boolean)
        .join(' ');

/** The raw elements in markup that the system has a part for. */
export const readElements = (
    path: string,
    text: string,
    line: (offset: number) => number,
    libraryHint = false,
): ElementFact[] => {
    const library = libraryHint || importsLibrary(text);
    const out: ElementFact[] = [];
    for (const tag of tagsIn(text)) {
        if (tag.closing) continue;
        const name = tag.name;
        const classes = classesOf(tag.attributes);
        const element =
            raw.test(name) ||
            (/^(div|section|aside)$/.test(name) && tag.attributes.role === 'dialog') ||
            (/^(span|div)$/.test(name) && badgeClasses(classes));
        if (!element) continue;
        out.push({
            at: `${path}:${line(tag.offset)}`,
            tag: name.toLowerCase(),
            attributes: tag.attributes,
            libraryAvailable: library,
        });
    }
    return out;
};

/* ---------- The skeleton ---------- */

const primaryWord = /^(primary|filled|contained|solid|cta|accent)$/i;

/** Marked as the filled, primary action by an attribute or a class. */
const primaryMarked = (attributes: Record<string, string>, classes: string) =>
    ['variant', 'color', 'type', 'kind', 'appearance', 'severity', 'intent', 'mode'].some(name =>
        primaryWord.test((attributes[name] ?? '').trim()),
    ) ||
    /(^|[\s_-])(btn|button)[-_]{1,2}primary(\s|$)|(^|\s)(primary|is-primary)(\s|$)/.test(classes) ||
    /(^|\s)bg-(action|primary-[5-7]00|blue-[5-7]00|indigo-[5-7]00|sky-[5-7]00)(\s|$)/.test(
        classes,
    ) ||
    'mat-flat-button' in attributes ||
    'mat-raised-button' in attributes;

const roleOfTag = (name: string, attributes: Record<string, string>) => {
    if (attributes.role) return attributes.role;
    const lower = name.toLowerCase();
    if (lower === 'button' || /(^|\.)(Button)$/.test(name)) return 'button';
    if (lower === 'hr') return 'separator';
    if (lower === 'table' || /^Table$/.test(name)) return 'table';
    if (/^h[1-6]$/.test(lower)) return 'heading';
    if (/^(TabsList|TabList|mat-tab-group)$/.test(name)) return 'tablist';
    return undefined;
};

/**
 * The nesting of a file's elements as a box tree with no measures: tag, role, classes, its text
 * and where it is written. A primary action carries the action colour as its fill and a bordered
 * container the hairline, both values that pass every rule, so only the shape is judged.
 */
export const readSkeleton = (
    path: string,
    text: string,
    line: (offset: number) => number,
    system: SystemValues,
): UINode | undefined => {
    const tags = tagsIn(text);
    if (tags.length < 3) return undefined;
    const action = system.colours.light.find(token => token.name === 'action')?.hex;
    const hairline = system.colours.light.find(token => token.name === 'neutral-200')?.hex;
    const card = system.radii.find(token => token.name === 'card')?.px;
    const library = libraryNames(text);
    const root: UINode = { id: path, tag: 'file', name: path, children: [] };
    const stack: Array<{ node: UINode; name: string }> = [{ node: root, name: '' }];
    for (const [index, tag] of tags.entries()) {
        if (tag.closing) {
            const at = stack.map(each => each.name).lastIndexOf(tag.name);
            if (at > 0) stack.length = at;
            continue;
        }
        const classes = classesOf(tag.attributes);
        const role = roleOfTag(tag.name, tag.attributes);
        const subject = subjectOf({ tag: tag.name, names: [classes], role, classes });
        const next = tags[index + 1];
        const content = text
            .slice(tag.end + 1, next?.offset ?? tag.end + 1)
            .replace(/\{[^}]*\}/g, '')
            .trim()
            .slice(0, 120);
        const node: UINode = {
            tag: tag.name,
            source: `${path}:${line(tag.offset)}`,
            name: [tag.attributes['aria-label'], tag.attributes.variant, classes]
                .filter(Boolean)
                .join(' ')
                .slice(0, 120),
            children: [],
        };
        if (role) node.role = role;
        if (classes) node.classes = classes;
        if (content && !/[<>]/.test(content)) node.content = content;
        if (subject.kind === 'control' || subject.kind === 'icon-control' || role === 'button')
            node.interactive = true;
        if (node.interactive && action && primaryMarked(tag.attributes, classes)) {
            node.fill = action;
        }
        if (
            hairline &&
            subject.kind === 'container' &&
            !library.has(tag.name) &&
            (/(^|[\s_-])(card|panel|box|well)([\s_-]|$)/i.test(classes) ||
                (/(^|\s)border(\s|$)/.test(classes) && /(^|\s)rounded-/.test(classes)))
        ) {
            node.border = { width: 1, color: hairline };
            if (card) node.box = { radius: card };
        }
        stack.at(-1)?.node.children?.push(node);
        if (!tag.selfClosing) stack.push({ node, name: tag.name });
    }
    return root;
};
