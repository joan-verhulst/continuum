import type { NavItem } from '@/components/page-frame';
import type { Faq } from '@/lib/seo';

/*
 * The site's tools, the one list of them: Joan's four, under Joan's names. The index (/tools), each
 * tool's page, the related cards, the sitemap and the markdown twins all read it. Each entry carries
 * what search sees (the slug, the keyword, the title and description) and the words under the tool
 * (how to use it, what it is, the questions). A tool's page is its own folder,
 * /tools/<slug>/page.tsx, drawn by ./tool-page's ToolPage from this entry with the tool as its child.
 *
 * Keywords serve the tools, they do not make new ones: the keyword pages the site had before
 * (tailwind-theme-generator, shadcn-theme-generator, tailwind-color-palette-generator,
 * oklch-palette-generator) are folded into the tool they were a slice of, and their slugs redirect
 * there (next.config.ts). The keyword goes in the title, the description, the line under the h1 and
 * the questions; the h1 is the tool's own name. Titles, slugs and keywords spell "color" as searches
 * do; a title stays within 48 characters, so with the layout's " · Continuum" within 60, and a
 * description within 155. Prose is markdown (inline code and links), drawn by the docs' Markdown.
 */

export type ToolSlug =
    | 'theme-builder'
    | 'color-builder'
    | 'contrast-checker'
    | 'color-blindness-simulator';

export type Tool = {
    slug: ToolSlug;
    /** The tool's own name: the h1, the breadcrumb, the index's section, "Open the …". */
    name: string;
    /** The search phrase the page is written for. */
    keyword: string;
    /** Two or three phrases the page also answers. */
    secondary: readonly string[];
    /** The title search shows, keyword first, without the brand (the layout adds it). */
    title: string;
    /** The meta description: the keyword and what you get, at most 155 characters. */
    description: string;
    /** The one line under the h1, with the keyword in it. */
    lead: string;
    /** The hero's one action, which scrolls to the tool. */
    cta: string;
    /** One line on what the tool does: the index's section and the related cards. */
    summary: string;
    /** How to use it: three to five plain steps. */
    steps: readonly string[];
    /** What it is and why it matters, around the questions the keyword asks. */
    about: { title: string; line: string; body: readonly string[] };
    faqs: readonly Faq[];
};

export const tools: readonly Tool[] = [
    {
        slug: 'theme-builder',
        name: 'Theme builder',
        keyword: 'theme generator',
        secondary: [
            'Tailwind v4 theme generator',
            'shadcn theme generator',
            'dark mode theme',
            'design tokens generator',
        ],
        title: 'Free theme generator for CSS and Tailwind',
        description:
            'A free theme generator: colors, type, corners and sizes in five steps, previewed in light and dark, exported as CSS variables ready for any stack and Tailwind v4.',
        lead: 'A free theme generator: colour, type, controls and sizes in five steps, on a real page in light and dark as you choose, exported as CSS variables for any stack.',
        cta: 'Build your theme',
        summary:
            'Five steps from one primary colour to a whole theme, previewed in light and dark, exported as app.css and DESIGN.md.',
        steps: [
            'Pick a primary colour. The greys and the chart colours start filled in from it: keep them or change them.',
            'Walk the steps: the type, then the controls (the main button, the corners, the sidebar, the shadows), then the sizes.',
            'Watch the preview beside the steps. Switch it to dark, see it as a colour-blind reader does, or press Check to mark every pair that misses its contrast.',
            'On Review, export `app.css` and `DESIGN.md`, or open the theme in the app to keep working on it as a project.',
        ],
        about: {
            title: 'What the theme holds',
            line: 'A theme is more than a palette: it is every value your utilities and components read.',
            body: [
                'Tailwind v4 moved its configuration into CSS: a theme is an `@theme` block, and every utility reads from it. The builder exports one file, `app.css`, that replaces `@import "tailwindcss"` in your entry. Under Tailwind’s own names it sets five colour ramps of 11 steps each (neutral, primary, success, warning, error), the type scale from a 13px base with two weights, five corner sizes that nest (chip 6, item 10, control 12, card 16, panel 20), the shadows, the spacing unit and the content widths.',
                'Light and dark come from one set of choices. Light is the theme as written; dark applies wherever `data-mode="dark"` is set, with the same token names and each ramp read back to front, so `text-neutral-950` is near-black in light and near-white in dark. The export also points Tailwind’s `dark:` variant at that attribute.',
                'A theme a project already has comes in on the first step: Import a Tailwind theme reads a shadcn/ui `globals.css` or a Tailwind v4 `@theme` block, and takes its primary, the tint of its greys, its font and its radius. Every pair the theme draws is checked against WCAG as you choose; to test one pair on its own, use the [contrast checker](/tools/contrast-checker).',
            ],
        },
        faqs: [
            {
                question: 'Is this theme generator free?',
                answer: 'Yes. It runs in your browser and needs no account. Your theme is kept in this browser’s storage as you make it, so it is there when you come back.',
            },
            {
                question: 'What does the theme builder export?',
                answer: 'Two files. app.css is the whole theme as a Tailwind v4 entry: colours, type, corners, shadows, spacing and widths under Tailwind’s names, light and dark. DESIGN.md is a short brief that tells Claude and other AI agents how to build screens in that theme.',
            },
            {
                question: 'How does dark mode work in a Tailwind v4 theme?',
                answer: 'Light is the theme as written. Dark applies wherever data-mode="dark" is set, with the same token names and each ramp read back to front. The export also points Tailwind’s dark: variant at that attribute.',
            },
            {
                question: 'Is it Tailwind v4 or v3?',
                answer: 'Tailwind v4. The theme is written as an @theme block in CSS, which is how v4 configures a theme; there is no tailwind.config.js. The colour values work anywhere.',
            },
            {
                question: 'Can I start from my shadcn/ui theme?',
                answer: 'Yes. Paste its globals.css, or a Tailwind v4 @theme block, into Import a Tailwind theme. Its primary, the tint of its greys, its font and its radius carry over; the rest starts from Continuum’s defaults. The bare HSL of older shadcn themes, oklch(), hex, rgb() and hsl() are all read.',
            },
            {
                question: 'Do I need Continuum’s components to use the theme?',
                answer: 'No. app.css is a Tailwind v4 theme, so any Tailwind v4 project can use its utilities. Continuum’s React components read the same names, so they follow it without further setup.',
            },
        ],
    },
    {
        slug: 'color-builder',
        name: 'Colour builder',
        keyword: 'color palette generator',
        secondary: [
            'OKLCH palette generator',
            'Tailwind color palette generator',
            'chart color palette',
        ],
        title: 'Color palette generator: 50–950 scales in oklch',
        description:
            'A color palette generator: a primary scale from 50 to 950 in oklch, greys tinted to match and chart colors by harmony, in light and dark, for CSS or Tailwind.',
        lead: 'A colour palette generator in oklch: your primary as eleven steps, greys to match it and chart colours found by a harmony, as CSS variables for any stack.',
        cta: 'Build your colours',
        summary:
            'The primary as an eleven-step oklch ramp, the greys and the chart colours, with their curves and the harmony wheel.',
        steps: [
            'Enter your primary colour and the step it sits at: the 500 for most colours, a lighter step for a pale one, a darker step for a deep one.',
            'Shape the ramp on its lightness and chroma curves, or keep Tailwind’s.',
            'Choose the greys: pure, or tinted towards a hue by as much as you like.',
            'Pick the chart colours’ harmony on the wheel, and watch every colour on the preview in light and dark.',
        ],
        about: {
            title: 'How the scale is built',
            line: 'Even steps to the eye, not even numbers.',
            body: [
                'A Tailwind colour is eleven steps, 50 to 950. Spacing them evenly in hex or HSL gives muddy middles and washed-out ends, because the eye does not see those numbers evenly. In oklch a colour is three numbers: L, lightness as the eye sees it; C, chroma, how colourful it is; and H, the hue angle. Two colours with the same L look equally light whatever their hue.',
                'The ramp follows Tailwind’s own palette for the nearest hue: each step takes the lightness Tailwind gives it, the chroma peaks in the middle and eases off at both ends, and the hue drifts where Tailwind’s does, so a yellow warms as it darkens instead of turning olive. Your colour is kept exactly at its step, and the other ten are built around it.',
                'The ramps go into your CSS as `--color-primary-500` and the rest, so every step is a utility at once: `bg-primary-500`, `text-primary-700`, `ring-primary-400/50`. Display P3 lets the middle steps reach the extra chroma most phones and laptops now show; sRGB keeps every step to what every screen shows. To check them for every reader, use the [colour-blindness simulator](/tools/color-blindness-simulator).',
            ],
        },
        faqs: [
            {
                question: 'How do I add a custom color in Tailwind v4?',
                answer: 'Add it to an @theme block in the CSS file that imports Tailwind, as --color-brand-500 and the other steps. Every step becomes a utility at once: bg-brand-500, text-brand-700, border-brand-200.',
            },
            {
                question: 'Which step should my brand colour be?',
                answer: 'The 500 for most colours. A light colour such as a yellow or a mint reads better as the 300 or the 400, a deep navy as the 700, so its neighbours keep usable lightness on both sides.',
            },
            {
                question: 'Why build the palette in oklch?',
                answer: 'Because its lightness is measured as the eye sees it, so a scale built on it is even to the eye, and Tailwind v4 writes its own palette in oklch. Every current browser supports oklch().',
            },
            {
                question: 'What is a good chroma for a brand colour?',
                answer: 'Between about 0.12 and 0.22 at the 500. Below that the colour reads as tinted grey; above it, it only shows on P3 screens and may look different elsewhere.',
            },
            {
                question: 'Why does the hue change between steps?',
                answer: 'Following Tailwind’s palette, a hue drifts a few degrees across a scale so each step looks like the same colour: a yellow turns warmer as it darkens, a blue a little more violet.',
            },
        ],
    },
    {
        slug: 'contrast-checker',
        name: 'Contrast checker',
        keyword: 'color contrast checker',
        secondary: [
            'WCAG contrast checker',
            'contrast ratio checker',
            'accessible color combinations',
        ],
        title: 'Color contrast checker for WCAG AA and AAA',
        description:
            'Check the contrast ratio of text on a background against WCAG AA and AAA, see every pair of a palette in one grid, and get the nearest shade that passes.',
        lead: 'A colour contrast checker for WCAG: the ratio of any text on any background, AA and AAA, and the nearest shade that passes.',
        cta: 'Check a pair',
        summary:
            'Whether text is easy to read on its background: the WCAG ratio, AA and AAA, every pair of your colours in one grid.',
        steps: [
            'Pick a text colour and a background colour, as hex or any CSS colour.',
            'Read the contrast ratio and whether it passes AA and AAA, for body text and for large text.',
            'If it misses, use the nearest passing shade: the same hue, only as much lighter or darker as it needs.',
            'To check a whole palette, add or paste your colours, a whole `app.css` too, and read the grid of every pair.',
        ],
        about: {
            title: 'What a contrast ratio measures',
            line: 'How far apart two colours are in lightness, from 1:1 to 21:1.',
            body: [
                'WCAG 2 compares the relative luminance of the text and its background. The same colour on itself is 1:1; black on white is 21:1. AA, the level audits and accessibility laws ask for, needs 4.5:1 for body text and 3:1 for large text and for the parts of a control needed to see it. AAA needs 7:1 and 4.5:1.',
                'A single pass or fail hides what the colour is for. Continuum holds a pair to one of four levels: text, anything read, at 4.5:1; a label, short and placed, at 3:1; a focus ring at 3:1; and a shape, a control’s outline or fill, at about 1.5:1, enough to be seen. A hairline is meant to be faint and is held to nothing.',
                'These numbers advise; your eye decides. APCA, proposed for WCAG 3, asks more of small text than 4.5:1 does. The [theme builder](/tools/theme-builder) runs the same checks on every pair a theme draws, in light and dark.',
            ],
        },
        faqs: [
            {
                question: 'What contrast does body text need?',
                answer: 'WCAG 2 AA asks 4.5:1 for normal text and 3:1 for large text (18.66px bold or 24px and up). AAA asks 7:1 and 4.5:1. APCA suggests Lc 90 for body text at small sizes.',
            },
            {
                question: 'Does it matter which colour is the text?',
                answer: 'Not for the WCAG 2 ratio, which is the same either way round. It matters for how the pair reads, so the sample sets the text colour on the background as given, and the swap button turns them round.',
            },
            {
                question: 'Do borders and icons need 4.5:1?',
                answer: 'No. WCAG asks 3:1 for the parts of a control that are needed to see it and for icons that alone carry a meaning. A decorative hairline has no requirement.',
            },
            {
                question: 'Is 4.49:1 a pass?',
                answer: 'No. WCAG compares the exact ratio with the threshold and does not round, so 4.49:1 misses the 4.5:1 of AA.',
            },
            {
                question: 'How do I check a whole palette?',
                answer: 'Add your colours, or paste them, a whole app.css too, and the grid shows every colour as text on every other as a background, with its contrast ratio and whether it passes.',
            },
        ],
    },
    {
        slug: 'color-blindness-simulator',
        name: 'Colour-blindness simulator',
        keyword: 'color blindness simulator',
        secondary: [
            'color blind palette checker',
            'deuteranopia simulator',
            'colorblind safe palette',
        ],
        title: 'Color blindness simulator for color palettes',
        description:
            'See a palette as people with protanopia, deuteranopia, tritanopia and achromatopsia see it, side by side, and which colors become hard to tell apart.',
        lead: 'A colour blindness simulator for palettes: your colours as five kinds of colour vision see them, and which become hard to tell apart.',
        cta: 'Check a palette',
        summary:
            'Your colours under five kinds of colour vision, side by side, with the ones that become hard to tell apart named, and for whom.',
        steps: [
            'Change or add colours, or paste a list of them, a whole `app.css` too.',
            'Read the same colours as protanopia, deuteranopia, tritanopia and achromatopsia see them.',
            'Look for the pairs it names as hard to tell apart, and for which readers.',
            'Change lightness, not only hue, until every pair holds.',
        ],
        about: {
            title: 'How it is simulated',
            line: 'About 1 in 12 men and 1 in 200 women see red and green as nearly the same.',
            body: [
                'Protanopia, deuteranopia and tritanopia are simulated with the model of Machado, Oliveira and Fernandes (2009) at full severity: each colour is moved to what a reader with no red, no green or no blue cones sees. Achromatopsia keeps only the luminance, which is also how a greyscale print reads. Full severity is the hardest case, so a palette that holds up here holds up for milder colour vision too.',
                'Distance is measured as ΔE in OKLab, times 100, after the simulation. Continuum’s theme builder holds chart colours to 15 with full colour vision and 8 without; between 6 and 8 the colours are told apart only with labels or a legend beside them, and under 6 they read as one colour.',
                'When two colours collide, change lightness, not only hue. Red and green differ in hue, which red–green readers lose, but a light green beside a dark red still differs in lightness, which every reader sees. Order chart colours so that neighbours differ most, and never let colour be the only way a status is told. The [colour builder](/tools/color-builder) finds chart colours by a harmony and checks them under the same five visions.',
            ],
        },
        faqs: [
            {
                question: 'Which kind of colour blindness is most common?',
                answer: 'Red–green colour blindness: about 8% of men and 0.5% of women of northern European descent, most of them deuteranomalous. Tritan colour blindness and achromatopsia are rare.',
            },
            {
                question: 'Which colours are hard to tell apart for colour-blind people?',
                answer: 'Red and green above all, and with them orange, brown and olive of similar lightness. For tritan readers, blue and green, and yellow and pink. Colours that differ in lightness stay apart for everyone.',
            },
            {
                question: 'How do I make a colorblind-safe palette?',
                answer: 'Give neighbouring colours different lightness, not only different hues; avoid red beside green at the same lightness; label series directly rather than by a legend alone; and check the palette here under each kind of colour vision.',
            },
            {
                question: 'What does ΔE mean here?',
                answer: 'How different two colours look, as the distance between them in OKLab times 100. Around 2 is the smallest difference most people notice side by side; chart colours need far more to be told apart at a glance.',
            },
        ],
    },
];

/** The index's own words: the page that took the old theme builder page's place. */
export const toolsIndex = {
    keyword: 'free theme and color tools',
    secondary: [
        'Tailwind v4 theme generator',
        'Tailwind color palette generator',
        'color contrast checker',
    ],
    title: 'Free theme and color tools for any stack',
    description:
        'Free theme and color tools in the browser: a theme builder, a color builder for oklch palettes, a WCAG contrast checker and a color-blindness simulator.',
    h1: 'Free theme and colour tools',
    lead: 'Build a whole theme or just its colours, then check their contrast and how everyone sees them. CSS variables for any stack, Tailwind v4 ready. In the browser, no account.',
    faqs: [
        {
            question: 'Are these tools free?',
            answer: 'Yes. Every tool runs in your browser, needs no account and sends nothing to a server.',
        },
        {
            question: 'Which tool should I start with?',
            answer: 'The theme builder, when a product needs its own look: it holds the colour builder as its first step. The colour builder alone for a palette, the contrast checker for one pair or a whole palette, the simulator for chart and status colours.',
        },
        {
            question: 'Do the tools share my theme?',
            answer: 'Yes. The theme builder keeps your theme in this browser, and the contrast checker and the colour-blindness simulator can start from its colours.',
        },
        {
            question: 'Do they work with Tailwind v3?',
            answer: 'The values do: colours and contrast ratios are the same in any version. What the builders export is written for Tailwind v4, which configures a theme in CSS with @theme.',
        },
    ],
} as const;

export const toolOf = (slug: ToolSlug): Tool => {
    const tool = tools.find(entry => entry.slug === slug);
    if (!tool) throw new Error(`No tool ${slug}`);
    return tool;
};

export const toolPath = (slug: ToolSlug) => `/tools/${slug}`;

/** The tools in their order, as links. */
export const toolLinks: readonly NavItem[] = tools.map(tool => ({
    href: toolPath(tool.slug),
    label: tool.name,
}));
