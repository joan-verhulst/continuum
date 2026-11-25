import type { Faq } from '@/lib/seo';

/*
 * The comparison pages' words, kept as data so the HTML page and its .md twin (src/app/md) print the
 * same text. Every claim about another project is general and checkable on that project's own site:
 * what it is, how it is used, its licence. Nothing about its sizes, counts or prices, which change.
 */

export type CompareSection = {
    id: string;
    title: string;
    /** Markdown: paragraphs, lists and tables, as the docs' renderer draws them. */
    body: string;
};

export type Comparison = {
    /** /compare/<slug> */
    slug: string;
    /** The other project's name, as it writes it ('shadcn/ui'). */
    other: string;
    /** The page's title: 'Continuum vs shadcn/ui'. */
    title: string;
    /** The meta description, about 155 characters. */
    description: string;
    /** The one plain sentence the page opens with. */
    lead: string;
    sections: readonly CompareSection[];
    faqs: readonly Faq[];
};

/** Blocks are set a blank line apart, but a table's rows only a line apart. */
const blocks = (parts: readonly string[]) => parts.join('\n\n').replace(/\|\n\n\|/g, '|\n|');

const shadcn: Comparison = {
    slug: 'shadcn-ui',
    other: 'shadcn/ui',
    title: 'Continuum vs shadcn/ui',
    description:
        'Continuum and shadcn/ui compared: a finished look with composition rules and a theme builder, against open-source components you copy in and style yourself.',
    lead: 'Continuum is a finished design system for dense tool UI, with rules for how pages are composed; shadcn/ui is an open-source set of React components you copy into your project and style yourself. Choose Continuum for one consistent tool look out of the box, shadcn/ui for code you own and a large ecosystem.',
    sections: [
        {
            id: 'what-each-is',
            title: 'What each is',
            body: blocks([
                '**shadcn/ui** is a collection of React components you add to a project with its command-line tool: the source is copied into your repository, so you own it and change it freely. The components are built on accessible headless primitives and styled with Tailwind CSS, themed through CSS variables, and the project is open source under the MIT licence.',
                '**Continuum** is a design system for quiet, dense tool UI: 13px type in two weights, hairline borders, one action colour, controls at two heights, light and dark. It ships as a React component library on Base UI and Tailwind CSS v4, with a theme builder, Claude skills and an MCP server that carry its decisions to an agent.',
                '| | Continuum | shadcn/ui |',
                '| --- | --- | --- |',
                '| How you use it | A library you import and theme | Components copied into your code |',
                '| Primitives | Base UI | Headless primitives (Radix UI) |',
                '| Styling | Tailwind CSS v4 tokens | Tailwind CSS classes and CSS variables |',
                '| The look | One finished look, made for tool UI | A neutral starting point you restyle |',
                '| Composition | Written rules: page kinds, widths, one primary per view | Up to you |',
                '| Licence | Free to use in any product, no resale | MIT |',
            ]),
        },
        {
            id: 'where-continuum-differs',
            title: 'Where Continuum differs',
            body: [
                '- **A look and the rules for using it.** shadcn/ui gives you parts; how a page is laid out is your decision. Continuum writes those decisions down in units: seven page kinds with their column widths, how sections are set apart, one primary action per view, which list gets a container and which does not. An agent or a new team member builds a page the same way twice.',
                '- **Made for one kind of product.** Every value is tuned for dense tool UI (dashboards, tables, settings, editors). It is not a general-purpose kit for marketing sites.',
                '- **A theme builder.** Pick an accent, greys, a font, a type size, a spacing unit, control heights and corners; the builder makes oklch ramps for light and dark together, checks contrast, and exports an `app.css` for Tailwind v4 and a `DESIGN.md` brief for agents.',
                "- **Agent tooling that carries design decisions.** shadcn/ui also has agent tooling: its registry and MCP server let an agent find and add components. Continuum's skill and MCP server give an agent each part's spec in units, the anatomy of each page kind and recipes for common needs, and an audit that reads existing UI in any stack (React, Vue, Angular, plain CSS, a design canvas) and says what to fix.",
            ].join('\n'),
        },
        {
            id: 'where-shadcn-ui-is-stronger',
            title: 'Where shadcn/ui is stronger',
            body: [
                '- **Ecosystem.** shadcn/ui is widely used, with a large community, third-party registries, blocks and examples, and AI models already know it well. Continuum is a young project by one person.',
                '- **Maturity.** shadcn/ui runs in many production apps; Continuum is at version 0.1 and still changing.',
                '- **Licence.** shadcn/ui is MIT: free to use, change, ship and redistribute. Continuum is free to use in any product, commercial or not, but not to resell or redistribute as a library of your own.',
                "- **Ownership.** Because shadcn/ui's code sits in your repository, you can change anything in any component. Continuum is a dependency: you change it through its theme, not by editing its source.",
                '- **Range.** shadcn/ui suits any kind of React product, from a marketing page to an app. Continuum is deliberately narrower.',
            ].join('\n'),
        },
        {
            id: 'which-to-choose',
            title: 'Which to choose',
            body: [
                'Choose **shadcn/ui** when you want components to own and restyle, a design of your own, the reach of a large ecosystem, or an open-source licence.',
                "Choose **Continuum** when you are building tool UI and want one finished, consistent look, written rules for how pages are put together, a theme builder for your product's own accent and type, and an agent that follows those rules and audits what it built.",
            ].join('\n\n'),
        },
    ],
    faqs: [
        {
            question: 'Is Continuum built on shadcn/ui?',
            answer: 'No. Continuum has its own components, built on Base UI primitives and styled with Tailwind CSS v4 through its own tokens. It shares the stack, not the code.',
        },
        {
            question: 'Can I use Continuum and shadcn/ui in one project?',
            answer: 'Both are React with Tailwind CSS, so they can sit side by side, but the product then has two looks. Pick one for the interface and keep the other out of the screens people use.',
        },
        {
            question: 'Is Continuum free?',
            answer: 'Yes. Continuum is free to use in your own products and in client work, commercial or not; its licence only rules out reselling or redistributing it. The theme builder is free in the browser. shadcn/ui is open source under the MIT licence.',
        },
        {
            question: 'Which works better with AI coding agents?',
            answer: "Both have agent tooling. shadcn/ui's registry and MCP server help an agent find and add components. Continuum's skill and MCP server give an agent the system's design rules in units and an audit that says what to fix in existing UI, in any stack.",
        },
    ],
};

const tailwindUi: Comparison = {
    slug: 'tailwind-ui',
    other: 'Tailwind UI',
    title: 'Continuum vs Tailwind UI',
    description:
        'Continuum and Tailwind UI (now Tailwind Plus) compared: a themed component library for tool UI with agent tooling, against paid snippets and templates.',
    lead: "Continuum is a component library and design system for dense tool UI, themed through tokens; Tailwind UI, now sold as Tailwind Plus, is the Tailwind CSS team's paid collection of UI snippets, templates and a React kit, written in Tailwind classes you copy in. Choose Continuum for a themed system with composition rules, Tailwind UI for polished blocks across marketing and app pages.",
    sections: [
        {
            id: 'what-each-is',
            title: 'What each is',
            body: blocks([
                '**Tailwind UI**, now sold as **Tailwind Plus**, is made by the team behind Tailwind CSS. It is a library of UI blocks (marketing sections, application screens, e-commerce pages) written as markup with Tailwind classes, in HTML, React and Vue, together with site templates and Catalyst, a React UI kit. You copy what you need into your project; it is sold under a paid licence.',
                '**Continuum** is a design system for quiet, dense tool UI: 13px type in two weights, hairline borders, one action colour, controls at two heights, light and dark. It ships as a React component library on Base UI and Tailwind CSS v4, with a theme builder, Claude skills and an MCP server that carry its decisions to an agent.',
                '| | Continuum | Tailwind UI |',
                '| --- | --- | --- |',
                '| How you use it | A library you import and theme | Snippets and templates copied into your code |',
                '| Frameworks | React | HTML, React and Vue |',
                '| What it covers | Tool UI: apps, dashboards, settings | Marketing sites, app screens, e-commerce |',
                '| Theming | Tokens, set by a theme builder | Tailwind classes in each snippet |',
                '| Composition | Written rules: page kinds, widths, one primary per view | Examples to adapt |',
                '| Licence | Free to use in any product, no resale | Paid commercial licence |',
            ]),
        },
        {
            id: 'where-continuum-differs',
            title: 'Where Continuum differs',
            body: [
                "- **Components, not snippets.** A Tailwind UI block is markup with its classes written out; changing the look across a product means changing those classes wherever they were pasted. Continuum's parts read named tokens, so a theme changes every one of them at once.",
                '- **A theme builder.** Pick an accent, greys, a font, a type size, a spacing unit, control heights and corners; the builder makes oklch ramps for light and dark together, checks contrast, and exports an `app.css` for Tailwind v4 and a `DESIGN.md` brief for agents.',
                '- **Rules as well as parts.** Continuum writes down how pages are composed, in units: seven page kinds with their widths, how sections are set apart, one primary action per view. Tailwind UI shows finished examples; the rules behind them are for you to infer.',
                "- **Agent tooling.** Continuum's skill and MCP server give an agent each part's spec, each page kind's anatomy and recipes for common needs, and an audit that reads existing UI in any stack and says what to fix.",
                '- **Licence.** Tailwind UI is bought, and the licence covers your projects. Continuum is free to use in any product, commercial or not; neither may be resold as a kit of your own.',
            ].join('\n'),
        },
        {
            id: 'where-tailwind-ui-is-stronger',
            title: 'Where Tailwind UI is stronger',
            body: [
                '- **Range.** Marketing pages, landing pages, stores and app screens: Tailwind UI covers far more kinds of page than Continuum, which is made for tool UI alone.',
                "- **Frameworks.** Its blocks come in HTML, React and Vue; Continuum's library is React only (its rules, through the skill and the MCP server, apply in any stack).",
                '- **Maturity and polish.** It is made by the Tailwind CSS team and has been used in production for years. Continuum is at version 0.1, by one person, and still changing.',
                '- **Ownership.** As with any copied code, every line of a Tailwind UI block is yours to change. Continuum is a dependency you change through its theme.',
            ].join('\n'),
        },
        {
            id: 'which-to-choose',
            title: 'Which to choose',
            body: [
                'Choose **Tailwind UI** when you need polished pages of many kinds, marketing as well as app, in HTML, React or Vue.',
                "Choose **Continuum** when you are building tool UI in React and want one look held in tokens, a theme builder for your product's own accent and type, written rules for how pages are put together, and an agent that follows them.",
            ].join('\n\n'),
        },
    ],
    faqs: [
        {
            question: 'Is Tailwind UI the same as Tailwind Plus?',
            answer: 'Yes. Tailwind UI is now sold under the name Tailwind Plus, by the team behind Tailwind CSS, with its UI blocks, templates and the Catalyst UI kit.',
        },
        {
            question: 'Does Continuum use Tailwind CSS?',
            answer: "Yes. Continuum's components are styled with Tailwind CSS v4 and read the theme's tokens by Tailwind's names, so a project's exported app.css drives every component. A prebuilt stylesheet is there for projects without Tailwind.",
        },
        {
            question: 'Can I build a marketing site with Continuum?',
            answer: 'Continuum is made for tool UI: apps, dashboards, tables and settings. A marketing site is better served by a kit made for one, such as Tailwind UI.',
        },
        {
            question: 'Is Continuum free?',
            answer: 'Yes. Continuum is free to use in your own products and in client work, commercial or not; its licence only rules out reselling or redistributing it. The theme builder is free in the browser. Tailwind UI is sold under a paid licence.',
        },
    ],
};

/** The comparisons, in the order the section lists them. */
export const comparisons: readonly Comparison[] = [shadcn, tailwindUi];

/** One comparison by its slug. */
export const comparison = (slug: string) => comparisons.find(c => c.slug === slug);

/** The section's index: its title, description and opening sentence. */
export const compareIndex = {
    title: 'Compare',
    description:
        'How Continuum compares with shadcn/ui and Tailwind UI: what each is, where Continuum differs, and where the others are stronger.',
    lead: 'These pages compare Continuum with the component kits people weigh it against, plainly: what each is, where Continuum differs, and where the other is the better choice.',
} as const;

/** A comparison as one markdown document, for its .md twin. */
export const comparisonMarkdown = (c: Comparison) =>
    [
        `# ${c.title}`,
        c.lead,
        ...c.sections.map(section => `## ${section.title}\n\n${section.body}`),
        `## Questions\n\n${c.faqs.map(faq => `### ${faq.question}\n\n${faq.answer}`).join('\n\n')}`,
    ].join('\n\n');
