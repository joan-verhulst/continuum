import type { Subject } from '../../types';

/*
 * What a value sits on, from the names around it. Every reader asks this one function, whatever
 * it read: a CSS selector, a QML item, an element and its classes, a cva variable, the left side
 * of an assignment. It reads names only (a tag, a class, a type, a role), so a QPushButton, a
 * <button>, a .btn and a buttonVariants are all a control, and nothing here knows a stack.
 */

type Kind = NonNullable<Subject['kind']>;

/** Whole names that would split wrongly into words: QComboBox is a control, not a box. */
const exact: Record<string, Kind> = {
    qcombobox: 'control',
    combobox: 'control',
    qpushbutton: 'control',
    qtoolbutton: 'control',
    qlineedit: 'control',
    qtextedit: 'control',
    qplaintextedit: 'control',
    qspinbox: 'control',
    qdoublespinbox: 'control',
    qdateedit: 'control',
    qcheckbox: 'control',
    qradiobutton: 'control',
    textfield: 'control',
    textinput: 'control',
    textbox: 'control',
    checkbox: 'control',
    iconbutton: 'icon-control',
    qtooltip: 'floating',
    tooltip: 'floating',
    qmenu: 'floating',
    popover: 'floating',
    popup: 'floating',
    dropdown: 'floating',
    listbox: 'floating',
    hovercard: 'floating',
    menubar: 'container',
    qmenubar: 'container',
    toolbar: 'container',
    qtoolbar: 'container',
    navbar: 'container',
    sidebar: 'container',
    qgroupbox: 'container',
    groupbox: 'container',
    qframe: 'container',
    qlabel: 'text',
    qmainwindow: 'page',
    applicationwindow: 'page',
    qdialog: 'floating',
    hr: 'divider',
    tr: 'row',
    td: 'row',
    th: 'row',
    li: 'row',
    table: 'container',
};

/** Single words, in the order they win when a name holds two (the last word decides first). */
const words: Array<[Kind, RegExp]> = [
    ['divider', /^(hr|divider|separator|hline|vline)$/],
    ['badge', /^(badge|tag|pill|chip|kbd|lozenge)$/],
    [
        'control',
        /^(button|btn|input|select|textarea|field|trigger|checkbox|radio|switch|toggle|edit|combo|spinbox|search|stepper|slider)$/,
    ],
    ['row', /^(row|item|option|cell|tr|td|th|li|entry|listitem|menuitem)$/],
    [
        'floating',
        /^(tooltip|tip|popover|popup|dropdown|dialog|modal|toast|snackbar|sheet|drawer|dock|overlay|flyout|menu|listbox|command|palette)$/,
    ],
    [
        'container',
        /^(card|panel|box|container|section|aside|article|wrapper|group|well|tile|fieldset|form|header|footer|nav|toolbar|sidebar|table)$/,
    ],
    ['page', /^(body|html|root|main|page|app|window|screen|layout)$/],
    [
        'text',
        /^(h[1-6]|p|span|label|small|strong|em|b|a|link|text|title|heading|caption|subtitle|description|hint|meta|paragraph|typography|eyebrow|lead|helper|placeholder|message)$/,
    ],
];

/** Names that mark a picture, where a colour is data or identity, not a role. */
const pictureWord =
    /^(svg|path|chart|charts|graph|plot|sparkline|canvas|img|image|picture|video|avatar|illustration|logo|code|syntax|pre|swatch|figure|icon|emoji|flag|map)$/;

/** A name as its words: 'QPushButton' → q push button; 'invoice-list__title' → invoice list title. */
export const wordsOf = (name: string) =>
    name
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

/** Tailwind utilities are not names: 'rounded-md' says nothing about what a thing is. */
const utility =
    /^(-?[a-z]+:)*!?-?(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space|h|w|size|min|max|text|bg|border|rounded|font|leading|tracking|shadow|ring|outline|flex|grid|items|justify|self|place|inset|top|left|right|bottom|z|opacity|overflow|truncate|whitespace|break|cursor|select|pointer|transition|duration|ease|animate|translate|scale|rotate|origin|fill|stroke|divide|sr|not|block|inline|hidden|relative|absolute|fixed|sticky|static|shrink|grow|basis|order|underline|uppercase|lowercase|capitalize|italic|tabular|antialiased|aspect|object|from|via|to|decoration|caret|accent|appearance|isolate|visible|invisible|contents)(-|$)/;

export type Names = {
    /** The tag, element or type as written: 'button', 'QPushButton', 'Rectangle', 'Card'. */
    tag?: string;
    /** Class names, a selector, a variable or a component name: anything a person named it. */
    names?: string[];
    role?: string;
    /** A QML-style item with items inside it: a Rectangle that holds things is a container. */
    hasChildren?: boolean;
    /** The utility classes on it, for the shapes a badge or a floating thing are drawn in. */
    classes?: string;
};

const kindOfName = (name: string): Kind | undefined => {
    const whole = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (exact[whole]) return exact[whole];
    // The most specific word is the last one: card-title is text, menu-item a row.
    const list = wordsOf(name);
    for (let index = list.length - 1; index >= 0; index--) {
        const word = list[index] ?? '';
        if (exact[word]) return exact[word];
        for (const [kind, pattern] of words) if (pattern.test(word)) return kind;
    }
    return undefined;
};

const badgeShape = (classes: string) =>
    /(^|\s)rounded-(full|pill|chip)(\s|$)/.test(classes) &&
    /(^|\s)text-(xxs|xs|\[1[01]px\])(\s|$)/.test(classes) &&
    /(^|\s)bg-/.test(classes) &&
    /(^|\s)(px-(0\.5|1|1\.5|2|2\.5)|h-(4|5|chip))(\s|$)/.test(classes);

/** A box drawn with utilities: a border or a fill, rounded, padded. A card by its shape. */
const containerShape = (classes: string) =>
    /(^|\s)(border|border-\d|bg-[a-z])/.test(classes) &&
    /(^|\s)rounded-(lg|xl|2xl|3xl|card|panel|\[)/.test(classes) &&
    /(^|\s)p[xy]?-([3-9]|1\d|\[)/.test(classes);

const roles: Record<string, Kind> = {
    button: 'control',
    textbox: 'control',
    combobox: 'control',
    checkbox: 'control',
    switch: 'control',
    radio: 'control',
    searchbox: 'control',
    tab: 'control',
    row: 'row',
    option: 'row',
    menuitem: 'row',
    listitem: 'row',
    dialog: 'floating',
    alertdialog: 'floating',
    menu: 'floating',
    listbox: 'floating',
    tooltip: 'floating',
    separator: 'divider',
    heading: 'text',
    status: 'badge',
    img: 'unknown',
};

/**
 * The subject of a value from what names it. The tag speaks first when it is HTML's own element
 * (a <button> is a control whatever its classes say), then the role, then the names from the most
 * specific; a layout type (Row, Column, a *Layout) is no kind of its own.
 */
export const subjectOf = ({ tag, names = [], role, hasChildren, classes = '' }: Names): Subject => {
    const meaningful = names
        .flatMap(name => name.split(/\s+/))
        .filter(name => name && !utility.test(name));
    const all = [tag, ...meaningful].filter((name): name is string => !!name);
    const picture = all.some(name => wordsOf(name).some(word => pictureWord.test(word)));
    let kind: Kind | undefined;
    const lowerTag = tag?.toLowerCase() ?? '';
    const htmlTag = tag && tag === lowerTag;
    if (htmlTag && ['button', 'input', 'select', 'textarea'].includes(lowerTag)) {
        kind = classes.split(/\s+/).some(name => /^size-/.test(name)) ? 'icon-control' : 'control';
    } else if (htmlTag && lowerTag === 'span' && badgeShape(classes)) kind = 'badge';
    else if (role && roles[role]) kind = roles[role];
    if (
        !kind &&
        tag &&
        /^(Row|Column|Flow|Grid|Stack|\w*Layout|[HVZ]Stack|Item|Box|Spacer)$/.test(tag)
    )
        kind = undefined;
    else if (!kind && tag && !htmlTag) kind = kindOfName(tag);
    if (!kind) {
        for (let index = meaningful.length - 1; index >= 0 && !kind; index--)
            kind = kindOfName(meaningful[index] ?? '');
    }
    if (!kind && htmlTag) kind = kindOfName(lowerTag);
    if (!kind && badgeShape(classes)) kind = 'badge';
    if (!kind && containerShape(classes)) kind = 'container';
    if (!kind && tag === 'Rectangle' && hasChildren) kind = 'container';
    if (!kind && /(^|\s)(fixed|absolute)(\s|$)/.test(classes) && /(^|\s)z-/.test(classes))
        kind = 'floating';
    // A control named with an icon in it is the square icon control.
    if (
        kind === 'control' &&
        all.some(name => /icon/i.test(name)) &&
        !/text|label/i.test(all.join(' '))
    )
        kind = 'icon-control';
    const subject: Subject = { kind: kind ?? 'unknown' };
    if (tag) subject.tag = tag;
    if (role) subject.role = role;
    const name = [...names].filter(Boolean).join(' ').trim();
    if (name) subject.name = name.length > 120 ? `${name.slice(0, 119)}…` : name;
    if (picture) subject.picture = true;
    return subject;
};

/* ---------- Selectors ---------- */

/** A selector's last compound, split from its combinators: '.card > .btn:hover' → '.btn:hover'. */
const lastCompound = (selector: string) => {
    let depth = 0;
    let start = 0;
    for (let index = 0; index < selector.length; index++) {
        const char = selector[index];
        if (char === '(' || char === '[') depth++;
        if (char === ')' || char === ']') depth--;
        if (depth === 0 && (char === ' ' || char === '>' || char === '+' || char === '~'))
            start = index + 1;
    }
    return selector.slice(start).trim();
};

/**
 * The subject of a rule from its selector: the last compound of each selector in the list, its
 * type, classes, id and sub-control as names. When the selectors in a list disagree on what they
 * are, the subject is unknown.
 */
export const subjectOfSelector = (selector: string, hasChildren = false): Subject => {
    const list = selector
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    const subjects = list.map(part => {
        const compound = lastCompound(part);
        const tag = /^([A-Za-z][\w-]*)/.exec(compound)?.[1];
        const names = [
            ...[...compound.matchAll(/[.#]([\w-]+)/g)].map(match => match[1] ?? ''),
            ...[...compound.matchAll(/::([\w-]+)/g)].map(match => match[1] ?? ''),
        ];
        const role = /\[role=["']?(\w+)/.exec(compound)?.[1];
        return subjectOf({ tag, names, role, hasChildren });
    });
    const first = subjects[0] ?? { kind: 'unknown' as const };
    const same = subjects.every(each => each.kind === first.kind);
    return {
        ...first,
        kind: same ? first.kind : 'unknown',
        name: selector.replace(/\s+/g, ' ').trim().slice(0, 120),
    };
};
