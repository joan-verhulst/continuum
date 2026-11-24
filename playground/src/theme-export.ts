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
        [
            'Cards',
            (options.cards ?? defaultThemeOptions.cards) === 'framed'
                ? 'framed: a card with a head (a chart, a stat card, a titled card, a checklist, a settings group) is a frame a step off the page (`neutral-100`, panel corners, the spacing unit of padding) holding its head and foot, its content on a stage inside it (the surface with a hairline, the panel corner less that padding). Build them with the `card-frame`, `card-head`, `card-stage` and `card-foot` utilities, or the library parts that use them; a card with no head stays plain, and so does a table (its toolbar is part of its content)'
                : 'plain: one surface, a hairline round it',
        ],
        [
            'Fields',
            (options.controls ?? defaultThemeOptions.controls) === 'filled'
                ? 'filled: inputs, selects, secondary buttons and the segmented track hold a faint ink wash inside their hairline (`bg-control`, `bg-control-hover` on hover); ghost buttons, plain inputs and the primary button do not'
                : 'outline: a hairline and no fill',
        ],
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
                        tinted: "the page you are on on the primary's 100 with its 700 as text (in dark the 500 at 30% with the 100)",
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

Before any UI work, load the \`continuum-taste\` skill when it is installed (and use the Continuum MCP server when it is connected): it holds the parts, the full values and page anatomy, and reference screens. This file holds what is particular to this project and the rules in brief, so they hold without it.

The values live in \`src/app.css\`; this file is how to use them. Write the utility (\`bg-neutral-50\`, \`rounded-card\`), never the value behind it.

## Setup

- \`src/app.css\` is the Tailwind entry and the whole theme, in Tailwind's own names: the colour ramps and roles, the font, the type scale, the radii, the shadows, the ${unit}px spacing grid, the content widths and the fixed widths of panels and popups. It puts these in place of Tailwind's palette, type, radii and shadows, so Tailwind's defaults (\`bg-gray-100\`, \`rounded-lg\`) do not exist here.
- The components live in \`src/components/continuum/\`. When that folder is not there yet, copy the skill's \`assets/continuum/\` into it before building anything, with its folders as they are, and never draw a part by hand that the library has. They read the names \`app.css\` sets, so leave out the copied \`styles/\` folder and \`styles.css\`: \`app.css\` takes their place. Import components from its \`index.ts\` and charts from \`charts/index.ts\`. In a new project, scaffold Vite, React 19, TypeScript and Tailwind v4 first.
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
- Status colours only in badges, deltas, dots, icon tiles and invalid states, as two colours from one ramp: \`bg-success-500/20 text-success-800\`, the 800 for every tone. A delta is \`text-success-800\` when it is good news and \`text-error-600\` when it is bad, by what it means, not its direction (churn falling is good). Never a solid \`-100\` fill, never an outline, never a coloured row.
- Data takes \`chart-1\` to \`chart-5\` for steps in order, the \`chart-series-*\` set for independent series. Label what a colour marks: never colour alone.

### Type

- \`text-xs\` (${text('xs')}px) is the base, for body, controls, input values, labels and cells; \`text-xxs\` (${text('xxs')}) for badges, counts and meta; \`text-sm\` (${text('sm')}) for overlay titles and a page's description line; \`text-base\` (${text('base')}) section titles; \`text-lg\` (${text('lg')}) KPI values; \`text-2xl\` (${text('2xl')}) page titles. Line height ${(options.leading ?? 1.25).toFixed(2)} times the size and letter spacing ${((options.tracking ?? 0.025) * type).toFixed(2)}px come with the classes.
- Two weights, \`font-normal\` and \`font-medium\`. No semibold or bold, no all caps. Sentence case; buttons are verb + object.
- Hierarchy through colour and weight, not size: labels quiet in \`neutral-600\`, data loud in \`neutral-950\` at medium.
- Numbers \`tabular-nums\`, right-aligned in tables. Text that overflows truncates; it does not wrap or grow the control.

### Surfaces

- Hairlines over shadows: a card is \`border border-neutral-200\` on the page's own colour. \`shadow-float\` only on what floats (menus, popovers, the dock, toolbars), \`shadow-sheet\` on dialogs and sheets.
- Space, not dividers, between sections and groups. A divider only between the rows of a bordered list or table, and full width in dialogs, sheets and menus. No card inside a card (except an item in a list card that must read as one unit, in a box of its own), no card round a header.
- The radii nest, each smaller than what holds it: \`rounded-panel\` (${corner(20)}), \`rounded-card\` (${corner(16)}), \`rounded-control\` (${corner(12)}), \`rounded-item\` (${corner(10)}), \`rounded-chip\` (${corner(6)}); dock and pills round. Something inset in a rounded container takes its radius less the inset: \`rounded-[calc(var(--radius-item)-2px)]\` in a \`p-0.5\` track. Never \`rounded-md\` or \`rounded-lg\`, which do not exist here.

### Pages

- The shell: \`AppShell\` on the \`neutral-100\` canvas, the \`Sidebar\` (256) straight on it, an \`AppPanel\` inset 8px, a ${Math.round(54 * size)}px \`HeaderBar\` with the page's breadcrumb, then a centred \`PageContent\` column ${step(16)}px below it. The sidebar holds places, not a create button; a product with several workspaces switches them with a \`SidebarSwitcher\` under the sidebar's header; every page has its breadcrumb.
- Width by kind: \`max-w-content-narrow\` (640) for making or editing one thing and for settings, \`max-w-content\` (896) for an overview, a detail or a document, \`max-w-content-wide\` (1080) for a table of several columns, \`max-w-content-dense\` (1280) for a very dense one. Never edge to edge unless asked.
- A panel, popup or fixed column takes its width token, in pixels whatever the spacing unit: \`w-sidebar\` (256), \`w-rail\` and \`w-rail-open\`, \`w-popover\` (288), \`min-w-menu\` (160), \`w-toast\` (360), \`max-w-tooltip\` (256), \`w-search\` (256), \`max-w-measure\` (480) for a quiet message. Never a numeric width such as \`w-64\` for these: it follows the spacing unit.
- The page head: a ${text('2xl')} medium title, a ${text('sm')} \`neutral-600\` line \`gap-1.5\` below it, the page's own actions at its right; the block gap (below) to what follows. A section: a ${text('base')} medium title over a ${text('xs')} line, \`gap-5\` (${step(5)}) to its content; sections the block gap apart, never divided.
- Group the content before choosing parts: which items belong together (a setting and its dependents, a label and its value, filters and their chips), as a tree. Each level gets one mark (a container, a hairline around it, a title or eyebrow over it), its title reads above what it holds, and there is never more room inside a group than between groups. A single object shown with its facts or state is a group too, and standing on the page it takes a card, never a bare row floating between blocks.
- Then place the groups, in this order. **Many at once or one at a time**: scanning, finding or comparing many is a table or a grid; working through items one by one to decide each (reviewing, approving, judging, correcting) opens on the first item still to decide, never on a grid of them all with this behind a toggle: the item in play in the main region, large, the one before and after as context, its decision actions in a bar pinned at the foot of the main region, the set as a narrow list of small previews with their states at the left; two versions compared (a source and its translation, a before and after) side by side at equal width inside the main region. **Regions**: what must stay in view together, one main region holding what the reader works on most, and a second at its right only for what stays in view while the main one changes, at the side panel's 360, never wider and never an equal half; regions share the panel's surface and meet on a hairline, never filled. **Size**: each thing as big as its content and the task need (a document its page, a grid its columns; what is judged closely large, what is picked from small; among peers the one in play, live or current, leads with more room and its state named), a region taking the room left and never stretching what it holds; what has no size of its own (a room, a map, a canvas) fills its region. The item in play is set at the size it is judged at: text read closely at 16 (18 for one short item), an image large; the 13 base is the interface around it. **Frames**: one mark per unit; a region gets no frame of its own, never a frame in a frame, but a unit inside a region (a pair compared, a receipt, a document) keeps its one mark. **Controls where they act**: an item's on the item and the way to add one where it would go, a selection's beside it or anchored to it, the view's over what it views, the whole screen's in its head or the dock; one primary per view.
- A page kind's parts are what the page may hold, not a list to fill: each earns its place by what the reader does with it here, and is left out otherwise.
- **Overview**: a period picker in the head only when the reader can change the period; stat cards first (label, ${text('lg')} value, delta pill, the same lines in each so the row ends level), only for figures the reader comes for besides the leading one; then the leading figure as a chart card, always; breakdowns in list cards when the next question is where it comes from. No create action.
- **Index**: a ruled \`Table\`, always; a row opens the item's own page, never a pane beside the list. A toolbar that never moves, inside the table's frame (\`TableToolbar\`), only when the list is too long to read whole: search always (unless the items have nothing to type), and a filter only per attribute the reader narrows by (a segmented control for one of a few, a select for the one or two always at hand, a Filter button for several groups), the applied ones as removable chips in a row below it. \`Pagination\` only past one page; a row menu only when a row has actions, a checkbox column only when rows are acted on together. The list's views, when it has any, and its one primary action in the floating \`Dock\` at the panel's foot, never as tabs above the table; with no views there is no dock and the primary sits in the page head.
- **Detail**: one column, in the order the reader asks for it. The title row (avatar, name, status badge, meta line, actions right), facets only when the object has several views of itself: line \`Tabs\` on a short page, the floating \`Dock\` (with the primary as its action) on a long one or an editor; stat cards only when its figures are what the reader opens it for, with the chart of one read over time under them; facts as label and value rows (a \`DescriptionList\`), several groups of them titled groups of that one list, in the side panel when the details are wanted whichever facet is open; the rest; history in a \`Sheet\`.
- **The side panel**, only for what stays in view while the main column is worked or changes (the settings of what is selected in an editor, the summary and steps of a flow that hold through each step, a record's details while its tabs change, a queue waiting on the reader): a static panel at the right edge, 360 wide, full height under the header bar, behind a full-height hairline, scrolling on its own; its sections split by full-width hairlines, no cards. Below 1280 its sections come under the main column. What is read once, in order, stays in the column; most pages have no side panel. A section listing items that can run to dozens (deals, tasks) shows the latest ~10 with its count and a ghost "View all" to the object's own facet or a sheet, never the whole list down the page. Every section on a page puts its title the same way: all over their content, or all inside their cards.
- **Create or edit**: fields stacked one per row \`gap-5\` apart, the primary at the end, always; sections, the block gap apart, only when the fields fall into more than one group; a \`Stepper\` only when the form is long; two or three fields are a \`Dialog\`, not a page. While editing an existing object it moves up: into the \`Dock\` as its action when the editor has facets (its views), otherwise into the title row. Never wider than 640.
- **Settings**: one \`Card layout="list"\` per group under a quiet \`SettingGroup\` title, cards \`gap-6\` apart; \`SettingRow\`s with **one control per setting**, by what the setting is (a \`Switch\` when it turns a thing on, a \`Select indicator="right"\` when it sets a value, a \`Button\` when it does a thing); two layouts by what the group holds: ruled, the default, settings 24, a hairline and 24 apart with a dependent 12 under its parent behind a 1px guide line; \`layout="boxed"\` when settings carry dependents that must hold together, each setting with its dependents a bordered box, boxes 8 apart, the dependents plain rows 20 under it and 12 apart (dependents disabled while the parent is off; an eyebrow over several); a group that falls into kinds puts each under a 14 medium title; a group too long for one card splits into a section (16 medium title) with a card per kind, sections 48 apart; the settings areas in the floating dock when there is more than one; a plan card, a usage \`Meter\` and a row for buying more only when the product has plans, an allowance and more to buy.
- **Assistant**: empty, a large \`AssistantPrompt\` in a \`max-w-conversation\` (720) column with the recent chats under it, when there are any, as quiet rows (the title, its age at the right); once asked, a \`ChatThread\` in that column and the prompt (\`size="md"\`) docked at the panel's foot. The chat is the trail's last crumb, a \`BreadcrumbMenu\` with New chat and the recent ones.
- **When the screen is the work** (an editor, a canvas, a player): no page kind and no page head, it sits in the shell and the breadcrumb names what is open; the order above lays it out from what it holds.
- Controls sit on ${heights[0]}px (buttons, small inputs, sidebar items) or ${heights[1]}px (fields, large buttons, the dock), nothing between: \`h-control\` and \`h-control-lg\`, never a height in pixels.
- **Narrow**, measured on the shell, not the screen (\`@max-shell-sidebar/shell:\` under 1024, \`@max-shell-compact/shell:\` under 640); a part answers to its own container, only overlays to the screen. Under 1024 the sidebar becomes a drawer behind a toggle at the header bar's far left, and the bar's actions hide; under 640 the column ${step(4)}px in and ${step(10)}px down. Never a rail on a phone.
- A row of controls never wraps: it scrolls (tabs, the dock, a toolbar, a table), hides (header and secondary actions, the results line, counts, \`optional\` table columns) or stacks (the page head, stat cards two across, card pairs one column); never a "⋯" menu. Fold only what cannot go: pagination to ‹ 3 of 25 ›, more than four segments to a \`Select\`, an index's selects into its Filter button. On touch (\`pointer-coarse:\`) a field that takes typing is 16px, targets reach 44px, nothing hides behind hover and keyboard hints go.

### Spacing

- The ${unit}px grid. **A spacing no part draws and no rule here fixes comes from the formula below, never a guess.** Drawn and fixed: \`gap-0.5\` between sidebar items, \`gap-1.5\` to \`gap-2\` inside controls, \`gap-4\` between rows and cards, \`gap-5\` from a section head to its content.
- A control's side padding is fixed by kind (\`px-4\` on a button, \`px-3\` on an input or a menu row, \`px-2.5\` on a sidebar item, \`px-2\` on a chip, \`px-1.5\` on a badge). Padding in boxes that hold content, and the gaps between texts, are derived, not picked: a box pads by its type size averaged over its lines (\`0.75 × size × (1 + 0.6·log₂ lines)\`), a box of boxes at least 1.5× its children, the gap between alike boxes (cards in a row, a list) 1.1× their padding, the **block gap** between unlike blocks (the page head and a table, a chart and a section) the sum of the room each claims by what it holds (\`0.375 × size × (1 + 1.85·log₂ lines)\`, each row counted: about 32 under a bare title over a short card, 48 under a head and its line over a settings card, 64 under a head over a dense table), and inside a card (a title over its list, a figure over its badge) the same with 0.6× the room and at most three lines counted (a badge 12 under its figure, a list about 14 under its title), the gap between two texts by the text after it, 0.25× for a pair and 1.5× between blocks. Snap every result to a Tailwind step, never an arbitrary value. The \`continuum-fix-padding\` skill works it out and applies it.

### Icons and motion

- \`lucide-react\` at \`strokeWidth={2}\`: 14px in a 34 control (\`size-icon\`), 16px in a 38 one and anything larger (\`size-icon-lg\`), 12px in badges and chips, in the colour of the text.
- Colour changes take \`duration-150\` on the properties named, never \`transition-all\`. Entries take \`duration-200 ease-out-strong\` from \`opacity-0\` and a small move or scale. A control's response stays at or under 250ms; a large surface entering or changing size (the rail's width, a toast, a sheet) may take up to 400ms. Nothing bouncy, and \`motion-reduce:transition-none\`.

## Before finishing

Every part earning its place; components first; only roles; hairlines, not shadows; space, not dividers; width by kind; one column on a form and settings; views in the dock; heights on ${heights[0]} or ${heights[1]}; two weights; one action colour and one primary action; a visible focus ring; everything inside the \`Theme\`. Design at 1920 × 1080 and look at every screen there, at 1440 × 900 and at 390, in light and in dark, before calling it done.

## Reviewing or improving

A finding is a departure from a rule above, and names it; what follows the rules is not a finding, and "nothing to fix" is a valid answer. Behaviour and copy go apart, as questions. Each fix is the value the rule gives by role (a page title is \`text-2xl\`, settings cards \`gap-6\`), never the nearest step and never two options. Improving keeps the content and the behaviour: a part the page could have but does not is a proposal, never an addition.
`;
};
