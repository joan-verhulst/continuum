/*
 * The contracts every part of the server shares. The audit never sees a framework: an adapter
 * turns what a stack renders into the neutral box tree below, and a finding comes back in units,
 * with its fix written for whichever stacks it can be written for.
 */

/** Where the UI lives. Decides which fixes a finding carries first and how a component is named. */
export type Medium =
    | 'react'
    | 'angular'
    | 'vue'
    | 'svelte'
    | 'html'
    | 'css'
    | 'canvas'
    | 'qt'
    | 'other';

export type Mode = 'light' | 'dark';

/**
 * One box as rendered: sizes in px, colours as CSS colour strings. Every field is optional, so an
 * adapter fills what its stack can tell (a DOM snapshot nearly all of it, a QSS file a little).
 */
export type UINode = {
    /** Stable within the tree: a Paper node id, a DOM path, a widget's objectName. */
    id?: string;
    /** 'button', 'input', 'div', 'span', 'text', 'frame', 'QPushButton' … lower case where it is HTML. */
    tag?: string;
    /** ARIA role, given or inferred: 'button', 'tab', 'dialog', 'table', 'row' … */
    role?: string;
    /** A layer name, an accessible name or a class list: whatever names it to a person. */
    name?: string;
    /** The node's own text, trimmed to 120 characters. */
    content?: string;
    /** Where it is written, when known: 'src/app/toolbar.component.html:12', or a component's name. */
    source?: string;
    /** The selector, class list or attributes as written, for matching ('btn btn-primary'). */
    classes?: string;
    box?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        paddingTop?: number;
        paddingRight?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        /** The flex or grid gap; rowGap and columnGap when they differ. */
        gap?: number;
        rowGap?: number;
        columnGap?: number;
        /** One radius, or [top-left, top-right, bottom-right, bottom-left]. */
        radius?: number | [number, number, number, number];
    };
    /** The background colour; absent or 'transparent' when there is none. */
    fill?: string;
    /** A border on every side, or the sides that have one. */
    border?: {
        width: number;
        color: string;
        style?: string;
        sides?: Array<'top' | 'right' | 'bottom' | 'left'>;
    };
    /** box-shadow as CSS writes it; absent or 'none' when there is none. */
    shadow?: string;
    font?: {
        size?: number;
        weight?: number;
        family?: string;
        lineHeight?: number;
        letterSpacing?: number;
        color?: string;
    };
    layout?: {
        display?: string;
        direction?: 'row' | 'column';
        position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
        zIndex?: number;
        opacity?: number;
    };
    /** True for focusable, clickable things: buttons, links, inputs, things with a click handler. */
    interactive?: boolean;
    children?: UINode[];
};

export type Confidence = 'high' | 'medium' | 'low';

/** How a fix is written: CSS, a Tailwind class, a canvas style patch, Qt's stylesheet, or code. */
export type FixMedium = 'css' | 'tailwind' | 'canvas' | 'qss' | 'code';

export type Finding = {
    /** The rule's id, kebab-case: 'colour-role', 'text-tone', 'type-size', 'weight', 'height' … */
    rule: string;
    /**
     * 'fix': mechanical, apply it. 'advise': a judgement or a structural change; propose it to the
     * person, with the reason, before making it.
     */
    severity: 'fix' | 'advise';
    /** high: apply. medium: apply and look. low: ask first (a brand colour near a grey, say). */
    confidence: Confidence;
    /** Where: 'file:line', a node id or DOM path, a selector. */
    at: string;
    /** The node's name or tag, so a person can find it. */
    node?: string;
    /** What property or class is off: 'background-color', 'height', 'class p-[13px]'. */
    property?: string;
    /** What is there, in units: '36px', '#e5e5e5', 'font-weight 600', 'p-[13px]'. */
    found: string;
    /** What Continuum wants, in units and by name: '34px (control)', 'neutral-200 (hairline)'. */
    expected: string;
    /** The rule in one sentence, with where it is stated: 'foundations.md › Heights'. */
    why: string;
    /** The replacement, written per medium; the agent picks the one its stack uses. */
    fix?: Partial<Record<FixMedium, string>>;
    /** For a component finding: the Continuum part it should be. */
    component?: string;
};

export type AuditReport = {
    medium: Medium;
    /** The theme the values were checked against: 'Continuum' or a project's app.css. */
    theme: string;
    mode: Mode;
    summary: { fix: number; advise: number; byRule: Record<string, number> };
    findings: Finding[];
    /** What the audit could not judge, or skipped, said plainly. */
    notes: string[];
};

/* ---------- The audit's one input: facts ---------- */

/**
 * What a value sits on, as far as the reader can tell. A rendered node knows it all; a CSS selector
 * or a class string on an element knows some; a bare literal knows nothing.
 */
export type Subject = {
    /** 'button', 'input', 'td', 'QPushButton', '.card', 'Rectangle' … as the source names it. */
    tag?: string;
    role?: string;
    /** A selector, a class list, a layer name: what a person would search for. */
    name?: string;
    /** What the reader inferred it is. Rules key on this, never on a stack's own names. */
    kind?:
        | 'control'
        | 'icon-control'
        | 'badge'
        | 'row'
        | 'text'
        | 'container'
        | 'floating'
        | 'divider'
        | 'page'
        | 'unknown';
    /** Read text (not a fill or a border): for the text-tone rule. */
    text?: boolean;
    /** Part of a picture: chart, illustration, avatar, image, code highlight. Colours there are data. */
    picture?: boolean;
    /** Already a Continuum part (imported from the library, or rendered by it): only spacing is the page's. */
    library?: boolean;
};

/** How the value was written, so the fix comes back in the same form. */
export type Written = {
    /**
     * 'declaration': property: value in any style syntax. 'utility': a utility class (h-9).
     * 'literal': a value on its own (a hex in code). 'rendered': measured on a rendered node.
     */
    form: 'declaration' | 'utility' | 'literal' | 'rendered';
    /** The original text: 'h-9', 'height: 36px', '#3b82f6', 'Color(0xFF3B82F6)'. */
    text: string;
    /**
     * The syntax a declaration was written in, for writing the fix back: 'css' (CSS, SCSS, Less,
     * Vue/Svelte/Angular styles), 'js' (style objects, camelCase), 'qss', 'qml'.
     */
    syntax?: 'css' | 'js' | 'qss' | 'qml';
};

/**
 * One value, normalised: every reader (rendered tree, declarations, utility classes, literals)
 * produces these, and one rule set judges them. Property names are CSS's, kebab-case, sides spelt
 * out ('padding-left', 'border-top-width'); a literal with no property is 'color'.
 */
export type Fact = {
    /** 'path:line' or a node id: where the finding will point. */
    at: string;
    property: string;
    /** In CSS syntax: '36px', '#3b82f6', '600', '0 4px 12px rgba(0,0,0,.1)'. */
    value: string;
    subject: Subject;
    written: Written;
    /** True when the reader is unsure the value is what it seems (a hex in a TS file): lowers confidence. */
    guessed?: boolean;
};

/** A raw element in markup, for the hand-rolled-part rule. */
export type ElementFact = {
    at: string;
    /** Lower case: 'button', 'input', 'select', 'table', 'dialog', 'hr', 'span'. */
    tag: string;
    attributes: Record<string, string>;
    /** The file imports Continuum (a React project on the library): suggest the component. */
    libraryAvailable: boolean;
};
