import { FaqSection } from '@/components/faq-section';
import type { Faq } from '@/lib/seo';
import { Container } from '../web';

/*
 * The questions after pricing: what someone about to use Continuum asks, answered with what the
 * site already says elsewhere (the pricing card, the licence, the tools, the comparisons), in the
 * site's one FAQ section.
 */

const faqs: Faq[] = [
    {
        question: 'What do I get?',
        answer: 'The React component library and chart kit, the Claude Code skills for building and refining UI, and the MCP tools for looking up design rules and auditing existing screens, in one npm package, @contui/ui. npx contui init installs it and sets up the skills and the server.',
    },
    {
        question: 'Is it really free?',
        answer: 'Yes. You can use Continuum in your own products and in products you build for others, commercial or not, with no payment and no account. The licence only rules out reselling it: offering Continuum, or a copy of it, as a component library, design system, theme, skill or MCP server of your own.',
    },
    {
        question: 'Can I try it without installing anything?',
        answer: 'Yes. The theme builder and colour tools run in the browser, with no account: build a colour palette, check contrast in light and dark mode, preview colour blindness simulations, and try your theme on real screens.',
    },
    {
        question: 'Do I need Tailwind CSS?',
        answer: "Continuum's components are styled with Tailwind CSS v4 and read the theme's tokens by Tailwind's names, so a project's exported app.css drives every component. A prebuilt stylesheet is there for projects without Tailwind.",
    },
    {
        question: 'Does it work outside React?',
        answer: 'The components are React. The design rules are stated in units, so the skills and MCP tools apply them in Angular, Vue, plain CSS and Qt, and on a design canvas such as Figma or Paper.',
    },
];

export const Questions = () => (
    <Container>
        <FaqSection
            description="About the licence and what you need to use it."
            faqs={faqs}
            sectionClassName="py-16 md:py-32"
        />
    </Container>
);
