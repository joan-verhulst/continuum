import { FaqSection } from '@/components/faq-section';
import type { Faq } from '@/lib/seo';
import { Container } from '../web';

/*
 * The questions after pricing: what someone about to buy Pro asks, answered with what the site
 * already says elsewhere (the Pro card, the tools, the comparisons), in the site's one FAQ section.
 */

const faqs: Faq[] = [
    {
        question: 'What do I get with Pro?',
        answer: 'A commercial licence for one developer, the React component library and chart kit for production use, the Claude Code skills for building and refining UI, and the MCP tools for looking up design rules and auditing existing screens.',
    },
    {
        question: 'Is Pro a subscription?',
        answer: 'No. Pro is a one-time payment at launch.',
    },
    {
        question: 'Can I try Continuum before I buy?',
        answer: 'Yes. The theme builder and colour tools are free in the browser, with no account: build a colour palette, check contrast in light and dark mode, preview colour blindness simulations, and try your theme on real screens.',
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
            description="About Pro, the price and what you need to use it."
            faqs={faqs}
            sectionClassName="py-16 md:py-32"
        />
    </Container>
);
