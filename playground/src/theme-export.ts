import {
    createThemeVariables,
    defaultThemeOptions,
    hexToOklch,
    type ThemeMode,
    type ThemeOptions,
} from 'continuum';
import themeCss from 'continuum/theme.css?raw';
import tokensCss from 'continuum/tokens.css?raw';
import { isPreviewing, matchPreset } from './presets';

/*
 * What the builder hands a project: the whole look as a Tailwind v4 theme in Tailwind's own
 * names, and a brief for Claude that sets it up and keeps to it. The values are read off the
 * library's own stylesheets with the theme laid over them, so a project gets exactly what
 * the playground shows.
 */

export type ThemeExport = {
    /** What a person calls it: the preset's name, Brand, or Continuum for the default. */
    label: string;
    /** The builder's options with the corner scale. */
    options: ThemeOptions;
    mode: ThemeMode;
};

export const exportTheme = (theme: ThemeOptions, radius: number, mode: ThemeMode): ThemeExport => {
    if (!isPreviewing(theme, radius)) return { label: 'Continuum', options: {}, mode };
    return {
        label: matchPreset(theme, radius)?.label ?? 'Brand',
        options: { ...theme, ...(radius === 1 ? {} : { radius }) },
        mode,
    };
};

/* ---------- Reading the library's stylesheets ---------- */

type Declarations = Map<string, string>;

/** The custom properties each block of a stylesheet sets, comments dropped and values on one line. */
const declarations = (css: string) => {
    const blocks = new Map<string, Declarations>();
    for (const [, head = '', body = ''] of css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        // What precedes a block may hold imports and sources; its selector is the last of it.
        const selector =
            head
                .split(/[;\n]/)
                .map(part => part.trim())
                .filter(Boolean)
                .pop() ?? '';
        const block = blocks.get(selector) ?? new Map<string, string>();
        for (const part of body.split(';')) {
            const colon = part.indexOf(':');
            const name = part.slice(0, colon).trim();
            if (colon < 0 || !name.startsWith('--')) continue;
            const value = part
                .slice(colon + 1)
                .replace(/\s+/g, ' ')
                .replace(/\( /g, '(')
                .replace(/ \)/g, ')')
                .trim();
            block.set(name, value);
        }
        blocks.set(selector, block);
    }
    return blocks;
};

const tokens = declarations(tokensCss);
const base = tokens.get('.continuum') ?? new Map<string, string>();
const darkDefaults = tokens.get('.continuum[data-mode="dark"]') ?? new Map<string, string>();
const fixed = declarations(themeCss).get('@theme') ?? new Map<string, string>();

/** What projects and components read: everything but the engine's own --continuum- values. */
const publicNames = [...base.keys()].filter(name => !name.startsWith('--continuum-'));

/** Every token for one mode, the theme laid over the defaults as the cascade lays it. */
const scope = (options: ThemeOptions, mode: ThemeMode) => {
    const { light, dark } = createThemeVariables(options);
    return new Map<string, string>([
        ...base,
        ...(mode === 'dark' ? darkDefaults : []),
        ...Object.entries(light),
        ...(mode === 'dark' ? Object.entries(dark) : []),
    ]);
};

/** The position of the first comma outside any brackets, or -1. */
const topLevelComma = (text: string) => {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') depth++;
        else if (text[i] === ')') depth--;
        else if (text[i] === ',' && depth === 0) return i;
    }
    return -1;
};

/** A value with every var() replaced by what it reads in the scope, or by its fallback. */
const resolve = (value: string, values: Declarations, depth = 0): string => {
    if (depth > 24) return value;
    let out = '';
    let from = 0;
    for (let start = value.indexOf('var(', from); start >= 0; start = value.indexOf('var(', from)) {
        let end = start + 3;
        for (let open = 0; end < value.length; end++) {
            if (value[end] === '(') open++;
            if (value[end] === ')' && --open === 0) break;
        }
        const inner = value.slice(start + 4, end);
        const comma = topLevelComma(inner);
        const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
        const found = values.get(name) ?? (comma < 0 ? undefined : inner.slice(comma + 1).trim());
        out +=
            value.slice(from, start) +
            (found === undefined ? `var(${inner})` : resolve(found, values, depth + 1));
        from = end + 1;
    }
    return out + value.slice(from);
};

const round = (value: number, digits: number) => Number(value.toFixed(digits));

/** Sums the radii out to pixels and turns relative colours into plain ones, so the file reads as values. */
const tidy = (value: string) =>
    value
        .replace(
            /min\(calc\(([\d.]+)px \* ([\d.]+)\), calc\(([\d.]+)px \+ ([\d.]+)px\)\)/g,
            (_, raw, scale, size, cap) =>
                `${round(Math.min(Number(raw) * Number(scale), Number(size) + Number(cap)), 2)}px`,
        )
        .replace(
            /calc\(([\d.]+)px \* ([\d.]+)\)/g,
            (_, raw, scale) => `${round(Number(raw) * Number(scale), 2)}px`,
        )
        .replace(/oklch\(from (#[0-9a-f]{6}) l c calc\(h \+ (\d+)\)\)/gi, (match, hex, turn) => {
            const colour = hexToOklch(hex);
            return colour
                ? `oklch(${round(colour.l, 3)} ${round(colour.c, 3)} ${round((colour.h + Number(turn)) % 360, 1)})`
                : match;
        });

/* ---------- app.css ---------- */

const fontPackages: Record<string, string> = {
    geist: '@fontsource-variable/geist',
    inter: '@fontsource-variable/inter',
};

const fontNames: Record<string, string> = {
    geist: 'Geist',
    inter: 'Inter',
    system: 'the system UI font',
};

const fontOf = (options: ThemeOptions) => options.font ?? defaultThemeOptions.font;

/** Tailwind turns these namespaces into utilities; anything else is a plain variable. */
const utility = /^--(color|font|text|radius|shadow|container|spacing|ease|tracking)-/;

const declare = (name: string, value: string) => `    ${name}: ${value};`;

/**
 * The look as a Tailwind v4 entry: Continuum's tokens under Tailwind's names, resolved to
 * values for the theme, light in the theme and dark wherever data-mode="dark" is set.
 */
export const tailwindEntry = (theme: ThemeExport) => {
    const light = scope(theme.options, 'light');
    const dark = scope(theme.options, 'dark');
    const read = (values: Declarations, name: string) =>
        tidy(resolve(values.get(name) ?? '', values));
    const tokensWhere = (test: (name: string) => boolean) =>
        publicNames.filter(test).map(name => declare(name, read(light, name)));
    const fixedWhere = (test: (name: string) => boolean) =>
        [...fixed].filter(([name]) => test(name)).map(([name, value]) => declare(name, value));
    const font = fontPackages[fontOf(theme.options)];
    const ramp = /^--color-(neutral|primary|success|warning|error)-/;
    const changed = publicNames.filter(name => read(dark, name) !== read(light, name));

    const sections = [
        [
            '    /* Five ramps, 50 the surface and 950 the strongest text, then each role. */',
            ...fixedWhere(name => name.startsWith('--color-')),
            '',
            ...tokensWhere(name => ramp.test(name)),
            '',
            ...tokensWhere(
                name =>
                    name.startsWith('--color-') &&
                    !ramp.test(name) &&
                    !name.startsWith('--color-chart-'),
            ),
            '',
            ...tokensWhere(name => name.startsWith('--color-chart-')),
        ],
        [
            ...fixedWhere(name => name === '--font-*'),
            ...tokensWhere(name => name === '--font-sans'),
            ...fixedWhere(name => name === '--font-mono'),
        ],
        fixedWhere(name => name.startsWith('--text-')),
        fixedWhere(name => name.startsWith('--font-weight-')),
        fixedWhere(name => name.startsWith('--tracking-')),
        [
            '    /* Radii nest: a panel holds cards, a card items, an item chips. */',
            ...fixedWhere(name => name === '--radius-*' || name === '--radius-xs'),
            ...tokensWhere(name => name.startsWith('--radius-')),
            ...fixedWhere(name => name === '--radius-full'),
        ],
        [
            ...fixedWhere(name => name.startsWith('--shadow-')),
            ...tokensWhere(name => name.startsWith('--shadow-')),
        ],
        fixedWhere(name => name.startsWith('--ease-')),
        [
            '    /* The 4px grid: p-1 is 4px, gap-3 12px. */',
            declare('--spacing', '4px'),
            ...tokensWhere(name => name.startsWith('--spacing-')),
        ],
        [
            '    /* max-w-content · max-w-content-wide · max-w-content-dense */',
            ...tokensWhere(name => name.startsWith('--container-')),
        ],
    ];

    return `/*
 * ${theme.label}, as a Tailwind v4 theme: Continuum's colours, type, radii, shadows, spacing
 * and widths under Tailwind's own names, so bg-neutral-50, text-xs, rounded-card,
 * shadow-float and max-w-content come from here, and the components read the same names.
 * Light is the theme; dark applies wherever data-mode="dark" is set, as
 * <Theme mode="dark"> sets it.${
     font ? `\n * The font is read from the page: import '${font}' in the entry script.` : ''
 }
 */
@import "tailwindcss";

@custom-variant dark (&:where([data-mode="dark"], [data-mode="dark"] *));

/* static: charts read some of these from script, so every one is written out. */
@theme static {
${sections.map(lines => lines.join('\n')).join('\n\n')}
}

/* Values the components read that Tailwind has no utility for. */
:root {
${publicNames
    .filter(name => !utility.test(name))
    .map(name => declare(name, read(light, name)))
    .join('\n')}
}

/* Dark mode: the same names, the ramps read back to front. */
[data-mode="dark"] {
    color-scheme: dark;
${changed.map(name => declare(name, read(dark, name))).join('\n')}
}

@layer base {
    body,
    [data-mode] {
        font-family: var(--font-sans);
        font-size: var(--text-xs);
        line-height: 1.25;
        letter-spacing: var(--tracking-normal);
        color: var(--color-neutral-950);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
}
`;
};

/* ---------- DESIGN.md ---------- */

/** The theme's choices in words, one row each. */
const themeRows = (options: ThemeOptions): [string, string][] => {
    const action = options.action ?? defaultThemeOptions.action;
    const neutral = options.neutral ?? defaultThemeOptions.neutral;
    const radius = options.radius ?? 1;
    const font = fontOf(options);
    const shine = {
        flat: 'flat',
        lit: 'lit: a top highlight and a ring on the action',
        glossy: 'glossy: a top highlight, a ring and a gradient on the action',
    };

    return [
        [
            'Accent',
            options.accent
                ? `\`${options.accent}\`, the primary ramp's 500; its other ten steps are built from it`
                : "none: the primary ramp is Continuum's indigo, `#3939e5`, kept for information and the assistant",
        ],
        [
            'Action',
            action === 'accent'
                ? 'the accent: it fills the primary button, checked controls and the active rail item'
                : '`neutral-950`, near-black in light mode and near-white in dark: it fills the primary button, checked controls and the active rail item',
        ],
        ['Shine', shine[options.actionStyle ?? defaultThemeOptions.actionStyle]],
        ['Font', fontNames[font] ?? `\`${font}\``],
        ['Corners', radius === 1 ? 'as drawn' : `${Math.round(radius * 100)}% of the drawn radii`],
        [
            'Greys',
            neutral.tint === 0
                ? 'achromatic'
                : `tinted: hue ${neutral.hue}, chroma ${neutral.tint} at the 500`,
        ],
        [
            'Selection',
            options.tint === 'accent'
                ? "the accent's palest step, with its 700 for text"
                : 'a translucent grey wash',
        ],
        [
            'Segments',
            options.segment === 'raised'
                ? 'the active one raised as a chip on the track'
                : 'the active one filled with the action colour',
        ],
        [
            'Dock',
            options.dock === 'rounded'
                ? '10px corners on the dock and the rail, 8px on chips'
                : 'full pills',
        ],
        [
            'Data colours',
            options.charts
                ? `the theme's own set, \`chart-1\` to \`chart-5\`: ${options.charts.steps.map(hex => `\`${hex}\``).join(', ')}`
                : options.accent
                  ? 'the accent leads; three hues a quarter turn apart complete the set'
                  : 'the primary leads, then orange, aqua and yellow, in an order that keeps neighbours apart for colour-blind readers',
        ],
    ];
};

/** DESIGN.md: how the project is set up, what its theme is, and the rules in brief, for Claude. */
export const designBrief = (theme: ThemeExport) => {
    const { label, options, mode } = theme;
    const font = fontPackages[fontOf(options)];
    const rows = themeRows(options).map(([row, value]) => `| ${row} | ${value} |`);

    return `# Design

The UI is built with Continuum, a design system for tool UI, in the ${label === 'Continuum' ? 'default theme' : `${label} theme`}. The look is quiet, dense and precise: 13px type, hairline borders, one action colour, almost no shadow, and controls on two heights, 34 and 38px, so anything beside anything lines up.

Use the \`continuum-taste\` skill for any UI work when it is installed: it holds the components, the full rules and reference screens. This file holds what is particular to this project and the rules in brief, so they hold without it.

The values live in \`src/app.css\`; this file is how to use them. Write the utility (\`bg-neutral-50\`, \`rounded-card\`), never the value behind it.

## Setup

- \`src/app.css\` is the Tailwind entry and the whole theme, in Tailwind's own names: the colour ramps and roles, the font, the type scale, the radii, the shadows, the 4px spacing grid and the content widths. It puts these in place of Tailwind's palette, type, radii and shadows, so Tailwind's defaults (\`bg-gray-100\`, \`rounded-lg\`) do not exist here.
- The components live in \`src/components/continuum/\`, copied from the skill's \`assets/continuum/\` with its folders as they are. They read the names \`app.css\` sets, so leave out the copied \`styles/\` folder: \`app.css\` takes its place. Import components from its \`index.ts\` and charts from \`charts/index.ts\`. In a new project, scaffold Vite, React 19, TypeScript and Tailwind v4 first.
- The app sits inside \`<Theme mode="${mode}">\`. Dark mode is \`mode="dark"\`: the same theme with every ramp reversed, from the \`[data-mode="dark"]\` block in \`app.css\`. Everything styled sits inside the \`Theme\`; portalled parts open it again on their own.
- Dependencies: \`@base-ui/react class-variance-authority clsx tailwind-merge lucide-react react-day-picker\`${font ? `, and \`${font}\`, imported in the entry script` : ''}. Charts also need visx, d3 and motion; the skill lists them.

## The theme

| | |
| --- | --- |
${rows.join('\n')}

To change the look, change the values in \`app.css\`, and their dark counterparts in the \`[data-mode="dark"]\` block with them, or build the theme again in the Continuum playground and export it. Components never name a theme: anything that should differ per product is a token, never a one-off class.

## Rules

### Colour

- Only tokens: the \`neutral\`, \`primary\`, \`success\`, \`warning\` and \`error\` ramps, steps 50 to 950. Never hex values, \`bg-white\` or \`dark:\` variants: dark mode flips every ramp, so \`neutral-50\` is the surface in both.
- By step: \`neutral-50\` the surface (panels, cards, dialogs), \`neutral-100\` the canvas behind the panel, \`neutral-200\` every hairline, \`neutral-500\` placeholders and hints, \`neutral-600\` secondary text and icons, \`neutral-950\` primary text.
- One action colour, \`bg-action text-on-action\`, for the primary button, checked controls and the active rail item. One primary action per view, and nothing decorative.
- Selection is a wash, not a colour: \`bg-neutral-950/5\` on hover, \`bg-selected\` (a step stronger) on what is current, selected or open, \`bg-tint text-tint-fg\` where it should be coloured.
- Status colours only in badges, deltas, icon tiles and invalid states, as two colours from one ramp: \`bg-success-500/20 text-success-700\`. Never a solid \`-100\` fill, never an outline.
- Data takes \`chart-1\` to \`chart-5\` for steps in order, the \`chart-series-*\` set for independent series. Label what a colour marks: never colour alone.

### Type

- \`text-xs\` (13px) is the base; \`text-xxs\` for badges, counts and hints; \`text-sm\` for dialog titles; input values stay \`text-xs\`. Larger only for headline numbers and page titles.
- Two weights, \`font-normal\` and \`font-medium\`. No semibold or bold, no all caps.
- Hierarchy through colour and weight, not size: labels quiet in \`neutral-600\`, data loud in \`neutral-950\` at medium.
- Numbers \`tabular-nums\`, right-aligned in tables. Text that overflows truncates; it does not wrap or grow the control.

### Surfaces

- Hairlines over shadows: a card is \`border border-neutral-200\` on the page's own colour. \`shadow-float\` only on what floats (menus, popovers, the dock), \`shadow-sheet\` on dialogs and sheets.
- Space, not dividers, between sections and groups. A divider only between the rows of a bordered list or table, and full width in dialogs, sheets and menus. No card inside a card, no card round a header.

### Layout

- The shell: \`AppShell\` on the \`neutral-100\` canvas, the \`Sidebar\` straight on it, an \`AppPanel\` inset 8px, a 54px \`HeaderBar\` with the page's breadcrumb, then a centred \`PageContent\` column. A page starts 96px below the header bar, 128px on a large screen; \`PageContent\` sets it, so never pass a smaller top padding.
- The column is as wide as the content is dense: \`max-w-content-narrow\` for making or editing one thing (its fields stacked), \`max-w-content\` for settings, overviews and details, \`max-w-content-wide\` for a table of several columns, \`max-w-content-dense\` for a very dense one. Never edge to edge unless asked.
- An item from a list opens on its own page, with the breadcrumb back; never a pane docked beside the list. Every page has its breadcrumb.
- Controls sit on 34px (buttons, small inputs, nav items) or 38px (fields, large buttons, the dock), nothing between.
- Space on the 4px grid, and tight: \`gap-1.5\` to \`gap-2\` inside controls, \`gap-3\` to \`gap-4\` between blocks, \`p-4\` or \`p-5\` in cards, \`gap-12\` between page sections.

### Radius

- The radii nest, each smaller than what holds it: \`rounded-panel\`, \`rounded-card\`, \`rounded-control\`, \`rounded-item\`, \`rounded-chip\`. Never Tailwind's \`rounded-md\` or \`rounded-lg\`, which do not exist here.
- Something inset in a rounded container takes its radius less the inset: \`rounded-[calc(var(--radius-item)-2px)]\` in a \`p-0.5\` track.

### Icons and motion

- \`lucide-react\` at \`strokeWidth={2}\`: 16px, 12px in badges and chips, in the colour of the text.
- Colour changes take \`duration-150\` on the properties named, never \`transition-all\`. Entries take \`duration-200 ease-out-strong\` from \`opacity-0\` and a small move or scale. Nothing over 250ms, nothing bouncy, and \`motion-reduce:transition-none\`.

## Before finishing

Components first; only tokens; hairlines, not shadows; space, not dividers; width by density; heights on 34 or 38; two weights; one action colour; a visible focus ring; everything inside the \`Theme\`. Look at every screen, in light and in dark, before calling it done.
`;
};
