import type { Faq } from '@/lib/seo';

/*
 * The tools still on the old landing (./landing), until phase 2 moves each onto the tool page
 * template (./tool-page) and deletes its entry here; with the last one gone, this file, ./landing and
 * ../[slug] go too. Their search words are in ./catalogue already.
 */

export type LegacyKind = 'contrast' | 'vision';

export type LegacyPage = {
    slug: string;
    /** The page's h1. */
    name: string;
    /** The one plain sentence the page opens with. */
    lead: string;
    tool: LegacyKind;
    /** The tool's section: its title and the line under it. */
    toolTitle: string;
    toolDescription: string;
    /** The sections after the tool, each a title and its markdown. */
    sections: readonly { id: string; title: string; body: string }[];
    faqs: readonly Faq[];
};

export const legacyPages: readonly LegacyPage[] = [
    {
        slug: 'contrast-checker',
        name: 'Contrast checker',
        lead: 'A colour contrast checker: every pair of your colours in one grid with its WCAG 2 ratio, any pair you click checked for AA and AAA as body and large text, and the nearest shade that passes when it does not.',
        tool: 'contrast',
        toolTitle: 'Is this text easy to read on this background?',
        toolDescription:
            'Pick a text colour and a background colour to see whether the text is easy to read.',
        sections: [
            {
                id: 'nearest-that-passes',
                title: 'The nearest shade that passes',
                body: 'When a pair misses a level, **Use nearest passing shade** moves the text to the closest colour that reaches it: the same hue and chroma, made darker or lighter by as little as it takes. Only where no shade of the text can reach the level does the background move instead. Lightness is what contrast is made of, so the colour keeps its character.',
            },
            {
                id: 'four-levels',
                title: 'Four levels, by what the colour does',
                body: [
                    'A single pass or fail hides what the colour is for. Continuum holds a pair to one of four levels:',
                    '- **Text**, anything read: 4.5:1, WCAG’s AA for body text.',
                    '- **Label**, short and placed (a hint, a badge, a delta): 3:1, WCAG’s level for large text.',
                    '- **Focus ring**, the one mark a keyboard needs: 3:1.',
                    '- **Shape**, a control’s outline, track or fill: about 1.5:1, enough to be seen as a shape. A hairline is meant to be faint and is held to nothing.',
                ].join('\n'),
            },
            {
                id: 'wcag-and-apca',
                title: 'WCAG 2 and APCA',
                body: [
                    'WCAG 2’s ratio runs from 1 to 21 and treats both colours alike. APCA, proposed for WCAG 3, gives Lc from about 0 to 106 for dark text on light and 0 to −108 for light on dark, because light text on dark reads differently from the reverse.',
                    'APCA’s levels go by use: Lc 90 for body text, 75 for secondary text and labels that are still read, 45 for a fine outline such as a ring, 30 for a solid shape, 15 for a line that only has to be seen. At 13px, the size Continuum sets body text in, APCA asks more than WCAG’s 4.5:1 does. This checker reports WCAG 2, the measure audits and accessibility law ask for.',
                ].join('\n\n'),
            },
            {
                id: 'advice-not-verdict',
                title: 'Advice, not a verdict',
                body: 'These numbers advise; your eye decides. A pair that misses a level can still be right where WCAG does not require it, and a pair that passes can still be hard to read at small sizes. The theme builder runs the same checks on every pair a theme draws, in light and dark, and marks what WCAG does not require as advice rather than an error.',
            },
        ],
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
                question: 'How do I check a whole palette?',
                answer: 'Open More options under the pair. Add your colours there, or paste them, a whole app.css too, and the grid shows every colour as text on every other as a background, with its contrast ratio and whether it passes.',
            },
        ],
    },
    {
        slug: 'color-blindness-simulator',
        name: 'Colour-blindness simulator',
        lead: 'A colour-blindness simulator for palettes: edit a set of colours and see them under five kinds of colour vision side by side, with which of them become hard to tell apart and for whom, for when chart colours or status colours must be told apart by everyone.',
        tool: 'vision',
        toolTitle: 'Can everyone tell these colours apart?',
        toolDescription:
            'Change or add colours to see them as five kinds of colour vision do, and which become hard to tell apart.',
        sections: [
            {
                id: 'how-it-is-simulated',
                title: 'How it is simulated',
                body: [
                    'Protanopia, deuteranopia and tritanopia are simulated with the model of Machado, Oliveira and Fernandes (2009) at full severity: each colour is moved to what a reader with no red, no green or no blue cones sees. Achromatopsia keeps only the luminance, which is also how a greyscale print reads.',
                    'Full severity is the hardest case. Most colour-blind readers are anomalous trichromats, who see a milder version of the same confusion, so a palette that holds up here holds up for them.',
                ].join('\n\n'),
            },
            {
                id: 'delta-e',
                title: 'How far apart is far enough',
                body: 'Distance is measured as ΔE in OKLab, times 100, after the simulation. Continuum’s theme builder holds chart colours to **15** with full colour vision and **8** without; between 6 and 8 the colours are told apart only with labels, a legend or a texture beside them. Under 6 they read as one colour. The simulator says this in words, look the same or hard to tell apart, and keeps the number on each line’s tooltip.',
            },
            {
                id: 'what-to-change',
                title: 'What to change when two colours collide',
                body: 'Change lightness, not only hue. Red and green differ in hue, which protanopia and deuteranopia take away, but a light green beside a dark red still differs in lightness, which every reader sees. Order chart colours so that neighbours differ most, label the series directly rather than by a legend alone, and never let colour be the only way a status is told.',
            },
        ],
        faqs: [
            {
                question: 'Which kind of colour blindness is most common?',
                answer: 'Red–green colour blindness: about 8% of men and 0.5% of women of northern European descent, most of them deuteranomalous. Tritan colour blindness and achromatopsia are rare.',
            },
            {
                question: 'What does ΔE mean here?',
                answer: 'How different two colours look, as the distance between them in OKLab times 100. Around 2 is the smallest difference most people notice side by side; chart colours need far more to be told apart at a glance.',
            },
            {
                question: 'Can the theme builder make colours that pass?',
                answer: 'Yes. Its chart colours are found from your primary by a harmony and checked under the same five visions, and the Colour section shows the preview as each reader sees it.',
            },
        ],
    },
];

export const legacyPage = (slug: string) => legacyPages.find(page => page.slug === slug);
