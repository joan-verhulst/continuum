import {
    chartHarmonies,
    createThemeVariables,
    defaultThemeOptions,
    drawnType,
    drawnUnit,
    hexToOklch,
    rampSteps,
    type ThemeMode,
    type ThemeOptions,
    themeChartSeries,
    themeFontFamilies,
} from 'continuum';
import themeCss from 'continuum/theme.css?raw';
import tokensCss from 'continuum/tokens.css?raw';
import { heightChoices, isPreviewing, typeChoices, unitChoices } from './presets';

/*
 * What the builder hands a project: the whole look as a Tailwind v4 theme in Tailwind's own
 * names, and a brief for Claude that sets it up and keeps to it. The values are read off the
 * library's own stylesheets with the theme laid over them, so a project gets exactly what
 * the playground shows.
 */

export type ThemeExport = {
    /** What a person calls it: the project's name, or Continuum for the default theme. */
    label: string;
    /** The project's theme, its corner scale included. */
    options: ThemeOptions;
    mode: ThemeMode;
};

export const exportTheme = (theme: ThemeOptions, label: string, mode: ThemeMode): ThemeExport =>
    isPreviewing(theme)
        ? { label, options: theme, mode }
        : { label: 'Continuum', options: {}, mode };

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

/**
 * Every token's value as a theme writes it for one mode, each var() followed to the value it reads:
 * what an element in the theme is painted with. Unknown names give undefined.
 */
export const themeToken = (options: ThemeOptions, mode: ThemeMode) => {
    const values = scope(options, mode);
    return (name: string) => {
        const value = values.get(name);
        return value === undefined ? undefined : resolve(value, values);
    };
};

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
        // A height drawn from another (a control less its padding) sums out once that one is pixels.
        .replace(
            /calc\(([\d.]+)px ([+-]) ([\d.]+)px\)/g,
            (_, a, sign, b) => `${round(Number(a) + (sign === '-' ? -1 : 1) * Number(b), 2)}px`,
        )
        .replace(/oklch\(from (#[0-9a-f]{6}) l c calc\(h \+ (\d+)\)\)/gi, (match, hex, turn) => {
            const colour = hexToOklch(hex);
            return colour
                ? `oklch(${round(colour.l, 3)} ${round(colour.c, 3)} ${round((colour.h + Number(turn)) % 360, 1)})`
                : match;
        });

/* ---------- app.css ---------- */

const fontPackages: Record<string, string> = Object.fromEntries(
    Object.entries(themeFontFamilies).map(([id, font]) => [id, font.package]),
);

const fontNames: Record<string, string> = Object.fromEntries(
    Object.entries(themeFontFamilies).map(([id, font]) => [id, font.family]),
);

const fontOf = (options: ThemeOptions) => options.font ?? defaultThemeOptions.font;

/** Tailwind turns these namespaces into utilities; anything else is a plain variable. */
const utility =
    /^--((color|font|text|radius|shadow|container|spacing|ease|tracking|leading)-|spacing$)/;

const declare = (name: string, value: string) => `    ${name}: ${value};`;

/**
 * The look as a Tailwind v4 entry: Continuum's tokens under Tailwind's names, resolved to
 * values for the theme, light in the theme and dark wherever data-mode="dark" is set.
 */
/** The keyframes the animate tokens name, copied from theme.css as they are. */
const keyframes = [...themeCss.matchAll(/@keyframes [\w-]+ \{[\s\S]*?\n {4}\}/g)]
    .map(match => match[0].replace(/^ {4}/gm, ''))
    .join('\n\n');

/** The fixed size grid from theme.css, copied as it is: a project's own utilities need it too. */
const fixedSizes = (
    /\/\* sizes: start \*\/\n([\s\S]*?)\/\* sizes: end \*\//.exec(themeCss)?.[1] ?? ''
).trim();

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
        [
            ...fixedWhere(name => name === '--text-*'),
            ...tokensWhere(name => name.startsWith('--text-')),
        ],
        fixedWhere(name => name.startsWith('--font-weight-')),
        tokensWhere(name => name.startsWith('--tracking-') || name.startsWith('--leading-')),
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
        [
            ...fixedWhere(name => name.startsWith('--ease-')),
            "    /* The charts' two motions: marks wiping in once, and a waiting block's shine. */",
            ...fixedWhere(name => name.startsWith('--animate-')),
        ],
        [
            '    /* The spacing unit: p-1 is one unit, gap-3 three. Control heights and panel widths do not follow it. */',
            declare('--spacing', read(light, '--spacing')),
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

${keyframes}

${fixedSizes}

@layer base {
    body,
    [data-mode] {
        font-family: var(--font-sans);
        font-size: var(--text-xs);
        line-height: var(--leading-normal);
        letter-spacing: var(--tracking-normal);
        color: var(--color-neutral-950);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
}
`;
};

/* ---------- DESIGN.md ---------- */

/**
 * How the harmony finds series 2 to 4, in words, with the geometry it was worked within: its
 * spread, custom hues as clockwise turns of the primary's, and the steps held by hand.
 */
const dataHarmonyInWords = (options: ThemeOptions, harmony: string) => {
    const info = chartHarmonies.find(item => item.id === options.chartHarmony);
    const turns = options.chartHarmony === 'custom' ? options.chartTurns : undefined;
    const clockwise = (turn: number) => `+${Math.round(((turn % 360) + 360) % 360)}°`;
    const hues =
        turns?.length === 3
            ? `custom hues at ${inWords(turns.map(clockwise))} (turns of the primary's hue on the oklch wheel)`
            : info?.spread && options.chartSpread !== undefined
              ? `${harmony} hues, ${
                    info.spread.name === 'width'
                        ? `a rectangle ${options.chartSpread}° wide`
                        : `${options.chartSpread}° spread`
                },`
              : `${options.chartHarmony === 'custom' ? 'auto' : harmony} hues`;
    // A held step is kept per hue; the series it lands on is the one the search ordered it into.
    const series = themeChartSeries(options);
    const held = (options.chartHarmony && options.chartHarmony !== 'auto' ? [0, 1, 2] : []).flatMap(
        i => {
            const step = options.chartSteps?.[series?.members[i] ?? i];
            return typeof step === 'number' ? [`series ${i + 2} at the ${rampSteps[step]}`] : [];
        },
    );
    return held.length
        ? `${hues} complete the set: ${inWords(held)}, held by hand (a step lighter in dark); the rest each at the step that keeps neighbours apart for every reader`
        : `${hues} complete the set, each at the step that keeps neighbours apart for every reader`;
};

/** A list in words: "a", "a and b", "a, b and c". */
const inWords = (items: readonly string[]) =>
    items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

/** The theme's choices in words, one row each. */
const themeRows = (options: ThemeOptions): [string, string][] => {
    const action = options.action ?? defaultThemeOptions.action;
    const neutral = options.neutral ?? defaultThemeOptions.neutral;
    const radius = options.radius ?? 1;
    const font = fontOf(options);
    const type = options.type ?? drawnType;

    const size = options.size ?? 1;
    const unit = options.unit ?? drawnUnit;
    const named = (choices: readonly { value: number; label: string }[], value: number) =>
        choices.find(choice => choice.value === value)?.label.toLowerCase();
    const harmony = (
        chartHarmonies.find(item => item.id === (options.chartHarmony ?? 'auto'))?.label ?? 'Auto'
    ).toLowerCase();
    const shine = {
        flat: 'flat',
        lit: 'lit: a top highlight and a ring on the action',
        glossy: 'glossy: a top highlight, a ring and a gradient on the action',
    };

    return [
        [
            'Accent',
            options.accent
                ? `\`${options.accent}\`, the primary ramp's ${options.accentStep ?? defaultThemeOptions.accentStep}; its other ten steps are built from it the way Tailwind builds its palette`
                : "none: the primary ramp is Continuum's indigo, `#3939e5`, kept for information and the assistant",
        ],
        [
            'Gamut',
            (options.gamut ?? defaultThemeOptions.gamut) === 'p3'
                ? "Display P3, as Tailwind's palette: the ramps are `oklch()` values, and a screen that cannot show one shows the nearest it can"
                : 'sRGB: every colour is one every screen shows',
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
            'Type',
            `${named(typeChoices, type) ?? 'own'}: ${type}px base, every size on the scale following it, rounded to whole pixels`,
        ],
        [
            'Padding',
            `${named(unitChoices, unit) ?? 'own'}: a ${unit}px spacing unit, so p-3 is ${unit * 3}px; every padding, gap and margin is a multiple of it, rounded to whole pixels. Pick the classes with the padding formula as ever`,
        ],
        [
            'Heights',
            `${named(heightChoices, size) ?? 'own'}: controls ${Math.round(34 * size)} and ${Math.round(38 * size)}px, table rows ${Math.round(40 * size) + 1}px`,
        ],
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
            'Sidebar',
            `${
                (
                    {
                        tinted: "the page you are on on the primary's 100 with its 700 as text (in dark the 600 at 20% with the 200)",
                        tint: "the page you are on on the primary's 100 with its 700 as text",
                        raised: 'the page you are on raised on the canvas (the surface, a hairline, a faint shadow)',
                    } as Record<string, string>
                )[String(options.nav)] ?? 'the page you are on on the grey wash'
            }; the foldouts that hold it stay plain, their guide line darkened to it`,
        ],
        [
            'Shadows',
            options.elevation && options.elevation !== 'flat'
                ? 'faint shadows on cards, table frames and the controls (fields, selects, secondary buttons, segmented controls, checkboxes)'
                : 'flat: only what floats casts a shadow',
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
                : options.accent || options.chartHarmony
                  ? `the primary leads; ${dataHarmonyInWords(options, harmony)}, in light and in dark`
                  : 'the primary leads, then orange, aqua and yellow, in an order that keeps neighbours apart for colour-blind readers',
        ],
    ];
};

/**
 * DESIGN.md: how the project is set up, what its theme is, and the rules in brief, for Claude.
 * The rules are the short form of the skill's references/foundations.md and pages.md, their full statement: change both together.
 */
export const designBrief = (theme: ThemeExport) => {
    const { label, options, mode } = theme;
    const font = fontPackages[fontOf(options)];
    const rows = themeRows(options).map(([row, value]) => `| ${row} | ${value} |`);
    const type = Number((options.type ?? drawnType).toFixed(1));
    const size = options.size ?? 1;
    const heights = [34, 38].map(height => Math.round(height * size));
    const unit = Math.round(options.unit ?? drawnUnit);
    // The scale's sizes as this theme draws them, so the rules below name the project's own pixels.
    const token = themeToken(options, 'light');
    const text = (name: string) => Number.parseFloat(token(`--text-${name}`) ?? '') || 0;
    // A spacing step in this theme's pixels, and a drawn corner at its scale (capped 8px above drawn, as the tokens do).
    const step = (units: number) => Math.round(units * unit);
    const radius = options.radius ?? 1;
    const corner = (drawn: number) => Math.round(Math.min(drawn * radius, drawn + 8));

    return `# Design

The UI is built with Continuum, a design system for tool UI, in the ${label === 'Continuum' ? 'default theme' : `${label} theme`}. The look is quiet, dense and precise: ${type}px type, hairline borders, one action colour, almost no shadow, and controls on two heights, ${heights[0]} and ${heights[1]}px, so anything beside anything lines up.

Use the \`continuum-taste\` skill for any UI work when it is installed: it holds the parts, the full values and page anatomy, and reference screens. This file holds what is particular to this project and the rules in brief, so they hold without it.

The values live in \`src/app.css\`; this file is how to use them. Write the utility (\`bg-neutral-50\`, \`rounded-card\`), never the value behind it.

## Setup

- \`src/app.css\` is the Tailwind entry and the whole theme, in Tailwind's own names: the colour ramps and roles, the font, the type scale, the radii, the shadows, the ${unit}px spacing grid, the content widths and the fixed widths of panels and popups. It puts these in place of Tailwind's palette, type, radii and shadows, so Tailwind's defaults (\`bg-gray-100\`, \`rounded-lg\`) do not exist here.
- The components live in \`src/components/continuum/\`, copied from the skill's \`assets/continuum/\` with its folders as they are. They read the names \`app.css\` sets, so leave out the copied \`styles/\` folder: \`app.css\` takes its place. Import components from its \`index.ts\` and charts from \`charts/index.ts\`. In a new project, scaffold Vite, React 19, TypeScript and Tailwind v4 first.
- The app sits inside \`<Theme mode="${mode}">\`. Dark mode is \`mode="dark"\`: the same theme with every ramp reversed, from the \`[data-mode="dark"]\` block in \`app.css\`. Everything styled sits inside the \`Theme\`; portalled parts open it again on their own.
- Dependencies: \`@base-ui/react class-variance-authority clsx tailwind-merge lucide-react react-day-picker\`${font ? `, and \`${font}\`, imported in the entry script` : ''}. The charts need nothing more.

## The theme

| | |
| --- | --- |
${rows.join('\n')}

To change the look, change the values in \`app.css\`, and their dark counterparts in the \`[data-mode="dark"]\` block with them, or build the theme again in the Continuum playground and export it. Components never name a theme: anything that should differ per product is a token, never a one-off class.

## Rules

The short form. The full statement, in units, is the skill's \`references/foundations.md\` (the values) and \`references/pages.md\` (the composition); \`components.md\` and \`patterns.md\` say which part does what.

### Colour

- Only roles: the \`neutral\`, \`primary\`, \`success\`, \`warning\` and \`error\` ramps, steps 50 to 950. Never hex values, \`bg-white\` or \`dark:\` variants: dark mode flips every ramp, so \`neutral-50\` is the surface in both.
- By step: \`neutral-50\` the surface (panels, cards, dialogs, inputs), \`neutral-100\` the canvas behind the panel and muted fills inside a bordered container, \`neutral-200\` every hairline, \`neutral-300\` an unchecked box's border, \`neutral-500\` quiet icons and the focus ring, \`neutral-600\` secondary text, placeholders, hints and icons, \`neutral-950\` primary text. Text that is read never sits on \`neutral-500\`: it misses 4.5:1.
- One action colour, \`bg-action text-on-action\`, for the primary button, checked controls, the active rail item and the selected dock item. One primary action per view, and nothing decorative.
- Selection is a wash, not a colour: \`bg-neutral-950/5\` on hover (a table row \`/3\`), \`bg-selected\` (7%) on what is current, selected or open, \`bg-tint text-tint-fg\` where it should be coloured.
- Status colours only in badges, deltas, dots, icon tiles and invalid states, as two colours from one ramp: \`bg-success-500/20 text-success-800\`, the 800 for every tone. A rising delta is \`text-success-800\`, a falling one \`text-error-600\`. Never a solid \`-100\` fill, never an outline, never a coloured row.
- Data takes \`chart-1\` to \`chart-5\` for steps in order, the \`chart-series-*\` set for independent series. Label what a colour marks: never colour alone.

### Type

- \`text-xs\` (${text('xs')}px) is the base, for body, controls, input values, labels and cells; \`text-xxs\` (${text('xxs')}) for badges, counts and meta; \`text-sm\` (${text('sm')}) for overlay titles and a page's description line; \`text-base\` (${text('base')}) section titles; \`text-lg\` (${text('lg')}) KPI values; \`text-2xl\` (${text('2xl')}) page titles. Line height ${(options.leading ?? 1.25).toFixed(2)} times the size and letter spacing ${((options.tracking ?? 0.025) * type).toFixed(2)}px come with the classes.
- Two weights, \`font-normal\` and \`font-medium\`. No semibold or bold, no all caps. Sentence case; buttons are verb + object.
- Hierarchy through colour and weight, not size: labels quiet in \`neutral-600\`, data loud in \`neutral-950\` at medium.
- Numbers \`tabular-nums\`, right-aligned in tables. Text that overflows truncates; it does not wrap or grow the control.

### Surfaces

- Hairlines over shadows: a card is \`border border-neutral-200\` on the page's own colour. \`shadow-float\` only on what floats (menus, popovers, the dock, toolbars), \`shadow-sheet\` on dialogs and sheets.
- Space, not dividers, between sections and groups. A divider only between the rows of a bordered list or table, and full width in dialogs, sheets and menus. No card inside a card (except a highlighted item inside a group), no card round a header.
- The radii nest, each smaller than what holds it: \`rounded-panel\` (${corner(20)}), \`rounded-card\` (${corner(16)}), \`rounded-control\` (${corner(12)}), \`rounded-item\` (${corner(10)}), \`rounded-chip\` (${corner(6)}); dock and pills round. Something inset in a rounded container takes its radius less the inset: \`rounded-[calc(var(--radius-item)-2px)]\` in a \`p-0.5\` track. Never \`rounded-md\` or \`rounded-lg\`, which do not exist here.

### Pages

- The shell: \`AppShell\` on the \`neutral-100\` canvas, the \`Sidebar\` (256) straight on it, an \`AppPanel\` inset 8px, a ${Math.round(54 * size)}px \`HeaderBar\` with the page's breadcrumb, then a centred \`PageContent\` column ${step(24)}px below it (${step(32)} on a large screen); never pass a smaller top padding. The sidebar holds places, not a create button; a product with several workspaces switches them with a \`SidebarSwitcher\` under the sidebar's header; every page has its breadcrumb.
- Width by kind: \`max-w-content-narrow\` (640) for making or editing one thing and for settings, \`max-w-content\` (896) for an overview, a detail or a document, \`max-w-content-wide\` (1080) for a table of several columns, \`max-w-content-dense\` (1280) for a very dense one. Never edge to edge unless asked.
- A panel, popup or fixed column takes its width token, in pixels whatever the spacing unit: \`w-sidebar\` (256), \`w-rail\` and \`w-rail-open\`, \`w-popover\` (288), \`min-w-menu\` (160), \`w-toast\` (360), \`max-w-tooltip\` (256), \`w-search\` (256), \`max-w-measure\` (480) for a quiet message. Never a numeric width such as \`w-64\` for these: it follows the spacing unit.
- The page head: a ${text('2xl')} medium title, a ${text('sm')} \`neutral-600\` line \`gap-1.5\` below it, the page's own actions at its right; \`gap-10\` (${step(10)}) to the first section. A section: a ${text('base')} medium title over a ${text('xs')} line, \`gap-5\` (${step(5)}) to its content; sections \`gap-10\` apart, never divided.
- **Overview**: the period in the head; the leading figure as a chart card; stat cards (label, ${text('lg')} value, delta pill) that never repeat it; then breakdowns in list cards. No create action.
- **Index**: a toolbar (search, segmented control, selects or a Filter button) that never moves; applied filters as removable chips in a row below it; a ruled \`Table\`; \`Pagination\`; the list's views and its one primary action in the floating \`Dock\` at the panel's foot, never as tabs above the table. A row opens the item's own page; never a pane beside the list.
- **Detail**: one column, never split. The title row (avatar, name, status badge, meta line, actions right), line \`Tabs\` for facets (pill tabs only in a tight spot inside a card or dialog), stat cards, facts as label-over-value pairs in a card grid, the rest; history in a \`Sheet\`.
- **Create or edit**: fields stacked one per row \`gap-5\` apart in sections \`gap-10\` apart, the primary at the end. While editing an existing object it moves up: into the \`Dock\` as its action when the editor has facets (its views), otherwise into the title row. Never wider than 640.
- **Settings**: one \`Card layout="list"\` per group under a quiet \`SettingGroup\` title, cards \`gap-6\` apart; \`SettingRow\`s with **one control per setting** (a \`Switch\` to turn on, a \`Select indicator="right"\` to pick, a \`Button\` to do); rows divided by a hairline at the card's content width (a \`Separator\` between rows), a dependent setting sharing its parent's space between hairlines (no rule between them, disabled while the parent is off; an eyebrow over several dependents), never closeness alone; the settings areas in the floating dock.
- **Assistant**: empty, a large \`ChatPrompt\` in a \`max-w-conversation\` (720) column with the recent chats under it as quiet rows (the title, its age at the right); once asked, a \`ChatThread\` in that column and the prompt (\`size="md"\`) docked at the panel's foot. The chat is the trail's last crumb, a \`BreadcrumbMenu\` with New chat and the recent ones.
- Controls sit on ${heights[0]}px (buttons, small inputs, nav items) or ${heights[1]}px (fields, large buttons, the dock), nothing between: \`h-control\` and \`h-control-lg\`, never a height in pixels.
- **Narrow**, measured on the shell, not the screen (\`@max-shell-sidebar/shell:\` under 1024, \`@max-shell-compact/shell:\` under 640); a part answers to its own container, only overlays to the screen. Under 1024 the sidebar becomes a drawer behind a toggle at the header bar's far left, and the bar's actions hide; under 640 the column ${step(4)}px in and ${step(10)}px down. Never a rail on a phone.
- A row of controls never wraps: it scrolls (tabs, the dock, a toolbar, a table), hides (header and secondary actions, the results line, counts, \`optional\` table columns) or stacks (the page head, stat cards two across, card pairs one column, facts two across); never a "⋯" menu. Fold only what cannot go: pagination to ‹ 3 of 25 ›, more than four segments to a \`Select\`, an index's selects into its Filter button. On touch (\`pointer-coarse:\`) a field that takes typing is 16px, targets reach 44px, nothing hides behind hover and keyboard hints go.

### Spacing

- The ${unit}px grid, and tight: \`gap-0.5\` between nav items, \`gap-1.5\` to \`gap-2\` inside controls, \`gap-4\` between rows and cards, \`gap-5\` from a section head to its content, \`gap-10\` between sections.
- A control's side padding is fixed by kind (\`px-4\` on a button, \`px-3\` on an input or a menu row, \`px-2.5\` on a nav row, \`px-2\` on a chip, \`px-1.5\` on a badge). Padding in boxes that hold content, and the gaps between texts, are derived, not picked: a box pads by its type size averaged over its lines (\`0.75 × size × (1 + 0.6·log₂ lines)\`), a box of boxes at least 1.5× its children, the gap between boxes 1.1× their padding, the gap between two texts by the text after it, 0.25× for a pair and 1.5× between blocks. Snap every result to a Tailwind step, never an arbitrary value. The \`continuum-fix-padding\` skill works it out and applies it.

### Icons and motion

- \`lucide-react\` at \`strokeWidth={2}\`: 16px, 12px in badges and chips, in the colour of the text.
- Colour changes take \`duration-150\` on the properties named, never \`transition-all\`. Entries take \`duration-200 ease-out-strong\` from \`opacity-0\` and a small move or scale. A control's response stays at or under 250ms; a large surface entering or changing size (the rail's width, a toast, a sheet) may take up to 400ms. Nothing bouncy, and \`motion-reduce:transition-none\`.

## Before finishing

Components first; only roles; hairlines, not shadows; space, not dividers; width by kind; one column on a detail, a form and settings; views in the dock; heights on ${heights[0]} or ${heights[1]}; two weights; one action colour and one primary action; a visible focus ring; everything inside the \`Theme\`. Look at every screen at 1440 and at 390, in light and in dark, before calling it done.
`;
};
