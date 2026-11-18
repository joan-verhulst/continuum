'use client';

import { cn, focusRing } from 'continuum';
import { CornerDownRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useState } from 'react';
import { AUDIT_SECONDS, AuditFilm } from '../films/audit-film';
import { BUILD_SECONDS, BuildFilm } from '../films/build-film';
import { IMPROVE_SECONDS, ImproveFilm } from '../films/improve-film';
import { PADDING_SECONDS, PaddingFilm } from '../films/padding-film';
import { THEME_SECONDS, ThemeFilm } from '../films/theme-film';
import { ease, Reveal, Section } from '../web';

/*
 * In practice: what the system does and how each job runs. On the left the jobs, each with when
 * you reach for it; on the right one large card with the picked job run through: how you start
 * it, each step with the tool it calls and what that returns, and what you end up with. The list
 * moves on by itself, its progress drawn in the landing's spectrum, until the reader picks one.
 */

type Step = {
    /** The tool or prompt the step calls, or what the agent does itself. */
    tool: string;
    args?: string;
    result: string;
    /** The agent's own step, not a call to Continuum. */
    local?: boolean;
};

type Job = {
    id: string;
    title: string;
    /** When you reach for it. */
    when: string;
    /** How you start it: what you ask, or the command. */
    start: string;
    /** What runs it. */
    via: string;
    steps: Step[];
    outcome: string;
    /** What it does to your UI, filmed: in place of the steps once a job has one. */
    film?: () => ReactNode;
    /** The film's length in seconds, so the list waits for it to end. */
    length?: number;
};

const jobs: Job[] = [
    {
        id: 'build',
        title: 'Build a screen',
        when: 'Starting a page. Your agent composes it from the system, never from a blank file.',
        start: 'Build the members page under Settings.',
        via: 'build_screen prompt · continuum-taste skill',
        steps: [
            {
                tool: 'get_page_kind',
                args: 'settings',
                result: 'one column at 640, groups as list cards, one primary action',
            },
            {
                tool: 'find_pattern',
                args: '"list of members"',
                result: 'a Table in its own frame, search in its toolbar, a menu per row',
            },
            {
                tool: 'get_component',
                args: 'SettingRow',
                result: 'title and description left, one control right, controls 34 high',
            },
            { tool: 'get_spacing', args: 'the list card', result: 'p-5, and gap-6 between groups' },
            { tool: 'audit_source', args: 'members.tsx', result: 'clean' },
        ],
        outcome: 'members.tsx: six parts, theme tokens only, no arbitrary values.',
        film: () => <BuildFilm />,
        length: BUILD_SECONDS,
    },
    {
        id: 'improve',
        title: 'Improve a screen',
        when: 'Bringing an existing page in line, whatever it was built in.',
        start: 'Bring the customers page in line.',
        via: 'improve_ui prompt',
        steps: [
            {
                tool: 'audit_source',
                args: 'customers.tsx',
                result: 'against the index anatomy: views as tabs, search outside the table, the table in a card',
            },
            {
                tool: 'audit_ui',
                args: 'the rendered page',
                result: 'what only shows on screen: rows 52 high, the table 41',
            },
            {
                tool: 'apply',
                args: 'the sure fixes',
                result: 'views to the dock, search to the table bar, the card gone',
                local: true,
            },
            {
                tool: 'ask',
                args: 'two primary actions in the head',
                result: 'proposed to you, not changed: keep New customer, make Export secondary',
                local: true,
            },
            {
                tool: 'audit_source',
                args: 'customers.tsx',
                result: 'clean, then looked at in light and dark',
            },
        ],
        outcome: 'The customers page on the system, with every structural change agreed first.',
        film: () => <ImproveFilm />,
        length: IMPROVE_SECONDS,
    },
    {
        id: 'audit',
        title: 'Audit any stack',
        when: 'Checking UI in React, Vue, Angular, Svelte, HTML or CSS, or a page as it renders.',
        start: 'Audit the plan card in every app.',
        via: 'audit_source · audit_ui',
        steps: [
            {
                tool: 'audit_source',
                args: 'PlanCard.tsx, .vue, .component.ts, .svelte',
                result: 'each read as its own stack, against the values in your app.css',
            },
            {
                tool: 'finding',
                args: 'font-weight 600',
                result: '500: two weights, 400 and 500',
                local: true,
            },
            {
                tool: 'finding',
                args: 'colour #6b7280',
                result: 'a raw grey; its role is neutral-600',
                local: true,
            },
            {
                tool: 'fix',
                args: 'per stack',
                result: 'font-medium text-neutral-600 in the TSX; font-weight: 500 and var(--color-neutral-600) in the styles',
                local: true,
            },
        ],
        outcome:
            'Every finding says what is off in units, what Continuum wants, why, and the fix written for your stack.',
        film: () => <AuditFilm />,
        length: AUDIT_SECONDS,
    },
    {
        id: 'padding',
        title: 'Fix padding',
        when: 'A box feels cramped or loose. Its spacing is worked out from what it holds, not guessed.',
        start: '/continuum-fix-padding PlanCard.tsx',
        via: 'continuum-fix-padding skill · get_spacing',
        steps: [
            {
                tool: 'read',
                args: 'PlanCard',
                result: 'a 14 label, a 24 figure, a 13 note over two lines',
                local: true,
            },
            {
                tool: 'get_spacing',
                args: 'type averaged over 4 lines: 16px',
                result: '0.75 × 16 × (1 + 0.6 · log₂ 4) = 26.4px',
            },
            { tool: 'snap', args: '26.4px', result: 'p-7, the nearest Tailwind step', local: true },
            {
                tool: 'get_spacing',
                args: 'label → figure → note',
                result: 'pairs, so gap-1.5 each',
            },
        ],
        outcome: 'p-4 gap-3 becomes p-7 gap-1.5: classes on the scale, never an arbitrary value.',
        film: () => <PaddingFilm />,
        length: PADDING_SECONDS,
    },
    {
        id: 'theme',
        title: 'Theme a product',
        when: 'Giving a product its own look, before the first screen.',
        start: 'Our theme: accent #3939e5, tinted greys, Geist, rounder corners.',
        via: 'theme builder · create_theme · check_theme',
        steps: [
            {
                tool: 'create_theme',
                args: 'accent, greys, font, corners',
                result: "app.css: every colour, size and corner in Tailwind's names, light and dark",
            },
            {
                tool: 'create_theme',
                args: 'the same options',
                result: 'DESIGN.md: the brief your agent builds every screen from',
            },
            {
                tool: 'check_theme',
                args: 'app.css',
                result: 'contrast per mode, each miss with the step that passes',
            },
        ],
        outcome: 'One theme every part reads, the same in the builder, your code and your agent.',
        film: () => <ThemeFilm />,
        length: THEME_SECONDS,
    },
];

/** How long a job shows before the list moves on, while nobody has picked one. */
const HOLD = 7;

/** A job in the list: its name and when you reach for it, the current one washed and timed. */
const JobTab = ({
    job,
    on,
    playing,
    onPick,
    onDone,
}: {
    job: Job;
    on: boolean;
    playing: boolean;
    onPick: () => void;
    onDone: () => void;
}) => (
    <button
        aria-selected={on}
        className={cn(
            'relative flex w-full flex-col gap-1.5 overflow-hidden rounded-card p-5 text-left transition-colors duration-150',
            on ? 'bg-selected' : 'hover:bg-neutral-950/5',
            focusRing,
        )}
        onClick={onPick}
        role="tab"
        type="button"
    >
        <span
            className={cn(
                'font-medium text-base transition-colors duration-150',
                on ? 'text-neutral-950' : 'text-neutral-700',
            )}
        >
            {job.title}
        </span>
        <span className="text-neutral-600 text-sm leading-[1.5]">{job.when}</span>
        {on && playing && (
            <motion.span
                animate={{ scaleX: 1 }}
                aria-hidden
                className="absolute inset-x-5 bottom-0 h-px origin-left bg-spectrum"
                initial={{ scaleX: 0 }}
                key={job.id}
                onAnimationComplete={onDone}
                transition={{ duration: job.length ?? HOLD, ease: 'linear' }}
            />
        )}
    </button>
);

/** The picked job, run through: how it starts, each step with its call and its answer, the result. */
const Run = ({ job }: { job: Job }) => {
    const reduce = useReducedMotion() ?? false;
    const item = (index: number) => ({
        initial: reduce ? false : { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease, delay: reduce ? 0 : 0.08 + index * 0.09 },
    });
    if (job.film) {
        return (
            <motion.div
                animate={{ opacity: 1 }}
                // Fills the panel, which is sized by its min-height, not a height a child could read.
                className="absolute inset-0"
                exit={{ opacity: 0 }}
                initial={reduce ? false : { opacity: 0 }}
                key={job.id}
                transition={{ duration: 0.15 }}
            >
                {job.film()}
            </motion.div>
        );
    }
    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="flex h-full flex-col"
            exit={{ opacity: 0 }}
            initial={reduce ? false : { opacity: 0 }}
            key={job.id}
            transition={{ duration: 0.15 }}
        >
            <div className="flex flex-col gap-2 border-neutral-200 border-b p-6">
                <span className="text-neutral-500 text-xs">You start it</span>
                <span className="font-mono text-neutral-950 text-sm">
                    <span aria-hidden className="mr-2 select-none text-neutral-500">
                        &gt;
                    </span>
                    {job.start}
                </span>
                <span className="font-mono text-neutral-500 text-xs">{job.via}</span>
            </div>
            <ol className="flex flex-1 flex-col gap-4 p-6 font-mono text-xs leading-5">
                {job.steps.map((step, index) => (
                    <motion.li
                        className="flex flex-col gap-1"
                        key={`${step.tool}-${index}`}
                        {...item(index)}
                    >
                        <span className="flex min-w-0 items-baseline gap-2.5">
                            <span
                                aria-hidden
                                className={cn(
                                    'size-1.5 shrink-0 -translate-y-px self-center rounded-full',
                                    step.local ? 'bg-neutral-500' : 'bg-spectrum-round',
                                )}
                            />
                            <span className="text-neutral-950">{step.tool}</span>
                            {step.args && (
                                <span className="truncate text-neutral-600">{step.args}</span>
                            )}
                        </span>
                        <span className="flex min-w-0 gap-2 pl-4 text-neutral-500">
                            <CornerDownRight
                                aria-hidden
                                className="mt-[3px] size-3.5 shrink-0 text-neutral-400"
                                strokeWidth={2}
                            />
                            <span className="min-w-0">{step.result}</span>
                        </span>
                    </motion.li>
                ))}
            </ol>
            <motion.div
                className="flex flex-col gap-1 border-neutral-200 border-t p-6"
                {...item(job.steps.length)}
            >
                <span className="text-neutral-500 text-xs">You end up with</span>
                <span className="text-neutral-950 text-sm leading-[1.5]">{job.outcome}</span>
            </motion.div>
        </motion.div>
    );
};

export const Uses = () => {
    const [current, setCurrent] = useState(0);
    const [picked, setPicked] = useState(false);
    const reduce = useReducedMotion() ?? false;
    const job = jobs[current] ?? jobs[0];
    if (!job) return null;
    const playing = !picked && !reduce;

    return (
        <Section
            description="Two skills for your agent and an MCP server for any client, on the same rules. Pick a job to see the steps it takes and what each one returns."
            eyebrow="In practice"
            id="uses"
            title="What it does, and how it runs."
        >
            <Reveal className="grid gap-8 lg:grid-cols-[336px_minmax(0,1fr)] lg:gap-12">
                <div aria-label="Jobs" className="flex flex-col gap-2" role="tablist">
                    {jobs.map((item, index) => (
                        <JobTab
                            job={item}
                            key={item.id}
                            on={index === current}
                            onDone={() => setCurrent(value => (value + 1) % jobs.length)}
                            onPick={() => {
                                setPicked(true);
                                setCurrent(index);
                            }}
                            playing={playing}
                        />
                    ))}
                </div>
                <div
                    // The desktop stage is 720 × 640; a narrower one keeps that shape, so a film keeps its framing.
                    className="relative aspect-[9/8] overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 lg:aspect-auto lg:min-h-[640px]"
                    role="tabpanel"
                >
                    <AnimatePresence initial={false} mode="wait">
                        <Run job={job} key={job.id} />
                    </AnimatePresence>
                </div>
            </Reveal>
        </Section>
    );
};
