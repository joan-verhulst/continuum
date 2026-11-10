import { cn, focusRing } from 'continuum';
import { ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Fragment, useId, useState } from 'react';
import { ease, Reveal, Section } from '../web';

/*
 * The questions as one ruled list beside a header that stays in view: hairlines between the rows,
 * a chevron to open each. Any number may be open, so a reader can keep two answers side by side.
 * An answer that settles the question opens on "Yes." or "No." in the title's weight.
 */

type Question = { question: string; verdict?: 'Yes.' | 'No.' | 'Partly.'; answer: string };

const questions: Question[] = [
    {
        question: 'Does it work from a vague prompt?',
        verdict: 'No.',
        answer: 'Name the fields, columns and actions each page holds, and Claude decides the look and the layout. Continuum carries the design decisions; the content is still yours to give.',
    },
    {
        question: "Can't Claude do this already?",
        verdict: 'Yes.',
        answer: 'On its own it builds the average of what it has seen, a little differently on every screen. Continuum gives it one set of values to follow, so the tenth screen agrees with the first. The fair test on this page runs one prompt both ways.',
    },
    {
        question: "Isn't Anthropic's frontend-design skill free?",
        verdict: 'Yes.',
        answer: 'It gives Claude a direction. Continuum gives it numbers: 13px type, controls on 34 and 38px, one action colour, the structure of each kind of page, and components that follow them.',
    },
    {
        question: 'Will my app look like Continuum instead of shadcn?',
        verdict: 'Partly.',
        answer: "The structure and the density are Continuum's. The accent, greys, font and corners are yours: you set them in the theme builder, and Claude reads them from your `DESIGN.md`.",
    },
    {
        question: 'Do I need the React components?',
        verdict: 'No.',
        answer: 'The rules are written in units, so Claude applies them to your own parts in any stack. The components are for React 19, styled through Tailwind v4 or through the prebuilt stylesheet, which needs no Tailwind setup.',
    },
    {
        question: 'What does Claude receive?',
        answer: 'The skill: `SKILL.md` and its reference files, in markdown you can read. Your theme as `app.css` and `DESIGN.md`, in your repo. Through the MCP server, the rules and your theme when it asks, and a review of the screen it built.',
    },
    {
        question: 'Which agents and tools work with it?',
        answer: 'Claude Code gets the skill and the MCP server; `npx continuum init` adds both. Cursor, Claude Desktop and other MCP clients get the MCP server: the rules, your theme and screen review.',
    },
    {
        question: 'Will it change my existing styles?',
        verdict: 'No.',
        answer: 'The prebuilt stylesheet is scoped under `.continuum` and leaves the rest of your app as it is. Your `app.css` becomes your Tailwind theme only when you import it as one.',
    },
    {
        question: 'Is it accessible?',
        verdict: 'Partly.',
        answer: "Every colour pair in your theme is measured against WCAG 2.2 and APCA, in light and dark. The components sit on Base UI, but they haven't been audited yet.",
    },
    {
        question: 'Is it open source?',
        verdict: 'No.',
        answer: 'The code is public to read, and the licence says what you may use it for.',
    },
    {
        question: 'Can Claude review a screen I already built?',
        verdict: 'Yes.',
        answer: 'Ask for a review and the MCP server checks the screen against the rules: type sizes, heights, spacing, colour roles and the structure of the page. It answers with what to change, in units. Review is part of Pro.',
    },
];

/** Text between backticks is set as code. */
const Answer = ({ text }: { text: string }) =>
    text.split('`').map((part, index) =>
        index % 2 === 1 ? (
            <code
                className="rounded-chip bg-neutral-950/[0.06] px-1.5 py-0.5 font-mono text-[0.875em] text-neutral-800"
                // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one fixed sentence.
                key={index}
            >
                {part}
            </code>
        ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one fixed sentence.
            <Fragment key={index}>{part}</Fragment>
        ),
    );

const Row = ({ item, open, onToggle }: { item: Question; open: boolean; onToggle: () => void }) => {
    const id = useId();
    const reduce = useReducedMotion() ?? false;

    return (
        <li>
            <h3>
                <button
                    aria-controls={`${id}-answer`}
                    aria-expanded={open}
                    className={cn(
                        'group -mx-3 flex w-[calc(100%+1.5rem)] cursor-pointer items-center justify-between gap-6 rounded-item px-3 py-5 text-left font-medium text-base text-neutral-950 leading-[1.4] md:py-6',
                        focusRing,
                    )}
                    id={`${id}-question`}
                    onClick={onToggle}
                    type="button"
                >
                    {item.question}
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        aria-hidden
                        className="shrink-0 text-neutral-500 transition-[color] duration-150 group-hover:text-neutral-950"
                        initial={false}
                        transition={reduce ? { duration: 0 } : { duration: 0.25, ease }}
                    >
                        <ChevronDown className="size-5" strokeWidth={2} />
                    </motion.span>
                </button>
            </h3>
            <motion.div
                animate={open ? 'open' : 'closed'}
                aria-labelledby={`${id}-question`}
                className="overflow-hidden"
                id={`${id}-answer`}
                inert={!open}
                initial={false}
                role="region"
                transition={
                    reduce
                        ? { duration: 0 }
                        : {
                              height: { duration: 0.3, ease },
                              opacity: { duration: open ? 0.25 : 0.15, delay: open ? 0.05 : 0 },
                          }
                }
                variants={{
                    open: { height: 'auto', opacity: 1 },
                    closed: { height: 0, opacity: 0 },
                }}
            >
                <p className="max-w-[640px] pr-11 pb-6 text-base text-neutral-600 leading-[1.6] md:pb-7">
                    {item.verdict && (
                        <span className="font-medium text-neutral-950">{item.verdict} </span>
                    )}
                    <Answer text={item.answer} />
                </p>
            </motion.div>
        </li>
    );
};

/** Section 10: what Claude reads, what you still write and what stays yours. */
export const Faq = () => {
    const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]));
    const toggle = (index: number) =>
        setOpen(current => {
            const next = new Set(current);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });

    return (
        <Section aria-labelledby="faq-title" id="faq">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
                <Reveal className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
                    <h2
                        className="max-w-[512px] text-balance font-medium text-2xl text-neutral-950 leading-[1.15] tracking-[-0.02em] md:text-3xl"
                        id="faq-title"
                    >
                        Frequently asked questions.
                    </h2>
                    <p className="max-w-[576px] text-base text-neutral-600 leading-[1.6]">
                        What Claude reads, what you still write and what stays yours.
                    </p>
                    <p className="text-base text-neutral-600 leading-[1.6]">
                        Not answered here?{' '}
                        <a
                            className="rounded-chip text-neutral-950 underline decoration-neutral-300 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-neutral-950 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                            href="https://pixelperfect.agency"
                        >
                            Ask Pixel Perfect
                        </a>
                        .
                    </p>
                </Reveal>
                <Reveal delay={1}>
                    <ul className="divide-y divide-neutral-200 border-neutral-200 border-y">
                        {questions.map((item, index) => (
                            <Row
                                item={item}
                                key={item.question}
                                onToggle={() => toggle(index)}
                                open={open.has(index)}
                            />
                        ))}
                    </ul>
                </Reveal>
            </div>
        </Section>
    );
};
