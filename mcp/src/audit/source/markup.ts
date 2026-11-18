import type { SystemValues } from '../../system/values';
import type { ElementFact, UINode } from '../../types';
import { attributesOf, tagEnd } from './scan';
import { subjectOf } from './subject';
import { libraryNames } from './utilities';

/*
 * Elements in markup, whatever writes it: JSX, an Angular, Vue or Svelte template, HTML, a PHP,
 * Blade or ERB view. The text is read once into a tree of elements, and the tree is read three
 * ways. The raw elements the system has a part for (a <button>, an <input>, a <table>, a badge
 * drawn from a span) become element facts, for the rule that asks for the part, each with what
 * it sits in. A class string learns the element it is on and what that element holds. And the
 * nesting becomes a skeleton tree, for the checks that need the page's shape (one primary, a
 * container in a container, tabs over a table, a line between sections, a narrow column holding a
 * wide table).
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
        // A generic in TypeScript (useState<string>) is not a tag; a closing tag never is one.
        if (!match[1] && /[\w)\]]$/.test(text.slice(Math.max(0, offset - 1), offset))) continue;
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

/** One element as written, with the elements written inside it. */
export type Element = Tag & { classes: string; parent?: Element; children: Element[] };

/**
 * The elements of a file as a tree. An element written inside another's attribute (a control
 * passed as a prop: <SettingRow control={<Switch />} />) is that element's child, since it is
 * drawn inside it.
 */
export const parseMarkup = (text: string): Element[] => {
    const roots: Element[] = [];
    const stack: Array<{ element: Element; until?: number }> = [];
    for (const tag of tagsIn(text)) {
        // An element that held others only in its attributes ends where its tag ends.
        while (stack.length && (stack.at(-1)?.until ?? Number.POSITIVE_INFINITY) < tag.offset)
            stack.pop();
        if (tag.closing) {
            const at = stack.map(each => each.element.name).lastIndexOf(tag.name);
            if (at >= 0) stack.length = at;
            continue;
        }
        const parent = stack.at(-1)?.element;
        const element: Element = { ...tag, classes: classesOf(tag.attributes), children: [] };
        if (parent) {
            element.parent = parent;
            parent.children.push(element);
        } else roots.push(element);
        stack.push(tag.selfClosing ? { element, until: tag.end } : { element });
    }
    return roots;
};

/** Every element of a parsed file, in the order written. */
export const allElements = (roots: Element[]): Element[] =>
    roots.flatMap(each => [each, ...allElements(each.children)]);

/** The innermost element whose tag holds an offset: the element a class string is written on. */
export const elementAt = (elements: Element[], offset: number) => {
    let best: Element | undefined;
    for (const element of elements)
        if (element.offset < offset && offset <= element.end) best = element;
    return best;
};

/** The elements around one, innermost first. */
const ancestorsOf = (element: Element) => {
    const out: Element[] = [];
    for (let parent = element.parent; parent; parent = parent.parent) out.push(parent);
    return out;
};

/** The raw elements in markup that the system has a part for. */
export const readElements = (
    path: string,
    text: string,
    elements: Element[],
    line: (offset: number) => number,
    libraryHint = false,
): ElementFact[] => {
    const library = libraryHint || importsLibrary(text);
    const out: ElementFact[] = [];
    for (const tag of elements) {
        const name = tag.name;
        const element =
            raw.test(name) ||
            (/^(div|section|aside)$/.test(name) && tag.attributes.role === 'dialog') ||
            (/^(span|div)$/.test(name) && badgeClasses(tag.classes));
        if (!element) continue;
        const fact: ElementFact = {
            at: `${path}:${line(tag.offset)}`,
            tag: name.toLowerCase(),
            attributes: tag.attributes,
            libraryAvailable: library,
        };
        const within = ancestorsOf(tag)
            .slice(0, 6)
            .map(each => `${each.name} ${each.classes}`.trim());
        if (within.length) fact.within = within;
        out.push(fact);
    }
    return out;
};

/* ---------- The skeleton ---------- */

const primaryWord = /^(primary|filled|contained|solid|cta|accent)$/i;

const hues =
    'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

/** Filled in a saturated colour (a gradient's start counts), or dark with white text on it. */
const filledClasses = (classes: string) =>
    new RegExp(`(^|\\s)(bg|from)-(${hues})-[5-9]00(\\s|/|$)`).test(classes) ||
    (/(^|\s)bg-(black|(neutral|gray|zinc|slate|stone)-(800|900|950))(\s|$)/.test(classes) &&
        /(^|\s)text-white(\s|$)/.test(classes));

/** Marked as the filled, primary action by an attribute or a class. */
const primaryMarked = (attributes: Record<string, string>, classes: string) =>
    ['variant', 'color', 'type', 'kind', 'appearance', 'severity', 'intent', 'mode'].some(name =>
        primaryWord.test((attributes[name] ?? '').trim()),
    ) ||
    /(^|[\s_-])(btn|button)[-_]{1,2}primary(\s|$)|(^|\s)(primary|is-primary)(\s|$)/.test(classes) ||
    /(^|\s)bg-(action|primary-[5-7]00)(\s|$)/.test(classes) ||
    filledClasses(classes) ||
    'mat-flat-button' in attributes ||
    'mat-raised-button' in attributes;

/**
 * The library's parts that are the primary action: the dock's action always, a Button with no
 * variant (its default is primary).
 */
const libraryPrimary = (name: string, attributes: Record<string, string>) =>
    name === 'DockAction' || (name === 'Button' && !attributes.variant);

const roleOfTag = (name: string, attributes: Record<string, string>) => {
    if (attributes.role) return attributes.role;
    const lower = name.toLowerCase();
    if (lower === 'button' || /(^|\.)(Button|DockAction)$/.test(name)) return 'button';
    if (lower === 'hr' || /^(Separator|Divider)$/.test(name)) return 'separator';
    if (lower === 'table' || /^(Table|DataTable|DataGrid)$/.test(name)) return 'table';
    if (lower === 'th' || /^(TableHead|TableHeaderCell|TableColumnHeader)$/.test(name))
        return 'columnheader';
    if (lower === 'tr' || name === 'TableRow') return 'row';
    if (/^h[1-6]$/.test(lower)) return 'heading';
    if (/^(TabsList|TabList|mat-tab-group)$/.test(name)) return 'tablist';
    if (/^(TabsContent|TabsPanel|TabPanel|mat-tab)$/.test(name)) return 'tabpanel';
    if (/^((Alert)?Dialog|Sheet|Drawer|Modal)(Content)?$/.test(name)) return 'dialog';
    if (/^(DropdownMenu|ContextMenu|Menu|Popover)(Content)?$/.test(name)) return 'menu';
    return undefined;
};

/** The widths a page column is given by name, and Tailwind's max-w steps, in px. */
const columnWidths: Record<string, number> = { narrow: 640, default: 896, wide: 1080, dense: 1280 };
const maxWidths: Record<string, number> = {
    xs: 320,
    sm: 384,
    md: 448,
    lg: 512,
    xl: 576,
    '2xl': 672,
    '3xl': 768,
    '4xl': 896,
    '5xl': 1024,
    '6xl': 1152,
    '7xl': 1280,
};

/** The width a column is written at: width="narrow", or a max-w class. */
const columnWidth = (attributes: Record<string, string>, classes: string) => {
    const named = columnWidths[attributes.width ?? ''];
    if (named) return named;
    const step = /(^|\s)max-w-(\w+|\[\d+px\])(\s|$)/.exec(classes)?.[2] ?? '';
    return maxWidths[step] ?? (/^\[(\d+)px\]$/.test(step) ? Number(step.slice(1, -3)) : undefined);
};

/**
 * The nesting of a file's elements as a box tree with no measures: tag, role, classes, its text
 * and where it is written. A primary action carries the action colour as its fill and a bordered
 * container the hairline, both values that pass every rule, so only the shape is judged.
 */
export const readSkeleton = (
    path: string,
    text: string,
    roots: Element[],
    line: (offset: number) => number,
    system: SystemValues,
): UINode | undefined => {
    if (allElements(roots).length < 3) return undefined;
    const action = system.colours.light.find(token => token.name === 'action')?.hex;
    const hairline = system.colours.light.find(token => token.name === 'neutral-200')?.hex;
    const radius = (name: string) => system.radii.find(token => token.name === name)?.px;
    const library = libraryNames(text);
    const before = (at: number) => text.slice(Math.max(0, at - 40), at);
    const siblingsOf = (tag: Element) => tag.parent?.children ?? roots;
    /** The second branch of a choice (cond ? <A /> : <B />), its first branch just before it. */
    const otherBranch = (tag: Element) => {
        const siblings = siblingsOf(tag);
        const previous = siblings[siblings.indexOf(tag) - 1];
        return Boolean(
            previous &&
                /\?[\s(]*$/.test(before(previous.offset)) &&
                /(\)|>)\s*:\s*\(?\s*$/.test(before(tag.offset)),
        );
    };
    /**
     * A branch of a choice: only one of the two is drawn at a time, so each is a view of its own,
     * and a primary action in each is still one.
     */
    const branch = (tag: Element) => {
        const siblings = siblingsOf(tag);
        const next = siblings[siblings.indexOf(tag) + 1];
        return otherBranch(tag) || Boolean(next && otherBranch(next));
    };
    const wrap = (tag: Element): UINode => {
        const node = nodeOf(tag);
        return branch(tag)
            ? { tag: 'view', role: 'region', source: node.source, children: [node] }
            : node;
    };
    const nodeOf = (tag: Element): UINode => {
        const classes = tag.classes;
        const role = roleOfTag(tag.name, tag.attributes);
        const subject = subjectOf({ tag: tag.name, names: [classes], role, classes });
        const content = text
            .slice(tag.end + 1)
            .split('<')[0]
            ?.replace(/\{[^}]*\}/g, '')
            .trim()
            .slice(0, 120);
        const node: UINode = {
            tag: tag.name,
            source: `${path}:${line(tag.offset)}`,
            name: [
                tag.attributes['aria-label'],
                tag.attributes.variant,
                tag.attributes.orientation,
                classes,
            ]
                .filter(Boolean)
                .join(' ')
                .slice(0, 120),
            children: tag.children.map(wrap),
        };
        if (role) node.role = role;
        if (classes) node.classes = classes;
        if (content && !/[<>]/.test(content)) node.content = content;
        if (subject.kind === 'control' || subject.kind === 'icon-control' || role === 'button')
            node.interactive = true;
        const part = library.has(tag.name);
        const primary =
            (part && libraryPrimary(tag.name, tag.attributes)) ||
            primaryMarked(tag.attributes, classes);
        if (node.interactive && action && primary) node.fill = action;
        // A container that draws the hairline: the library's cards and framed tables, or one
        // drawn by hand as a card.
        const framed =
            part &&
            (/Card$/.test(tag.name) ||
                (role === 'table' && tag.attributes.variant !== 'rows' && tag.name !== 'DataGrid'));
        const drawn =
            !part &&
            subject.kind === 'container' &&
            (/(^|[\s_-])(card|panel|box|well)([\s_-]|$)/i.test(classes) ||
                (/(^|\s)border(\s|$)/.test(classes) && /(^|\s)rounded-/.test(classes)));
        const width = columnWidth(tag.attributes, classes);
        if (width) node.box = { width };
        if (hairline && (framed || drawn)) {
            node.border = { width: 1, color: hairline };
            const corner = role === 'table' ? radius('control') : radius('card');
            if (corner) node.box = { ...node.box, radius: corner };
        }
        return node;
    };
    // A component that returns one of several screens (a state each, by early returns) draws one
    // at a time: each returned tree is a view of its own, with its own one primary action.
    const returned = (root: Element) =>
        /\breturn\s*\(?\s*$/.test(text.slice(Math.max(0, root.offset - 20), root.offset));
    const views = roots.filter(returned).length > 1;
    const children = roots.map(root => {
        const node = wrap(root);
        return views && returned(root)
            ? { tag: 'view', role: 'region', source: node.source, children: [node] }
            : node;
    });
    return { id: path, tag: 'file', name: path, children };
};
