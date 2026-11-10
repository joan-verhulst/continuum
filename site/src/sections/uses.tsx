import { cn } from 'continuum';
import { RefreshCw } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ease, Reveal, Section } from '../web';

/*
 * Uses: the three things the system is for, whoever does the work. Each card leads with a small
 * figure of the act itself, drawn in the page's own hairlines and accent: a page assembling from
 * its recipe, a drifted row measured and put back, the project's tokens kept in sync. Each figure
 * plays once when it comes into view; under reduced motion it shows its end state.
 */

/** Plays once in view: `true` from the moment the figure is half on screen, at once under reduced motion. */
const usePlay = (delay = 0) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    const reduce = useReducedMotion() ?? false;
    const [on, setOn] = useState(reduce);

    useEffect(() => {
        if (reduce) return setOn(true);
        if (!inView) return;
        const timer = setTimeout(() => setOn(true), delay);
        return () => clearTimeout(timer);
    }, [inView, reduce, delay]);

    return { ref, on, reduce };
};

/** A label on a part of the figure: the part's name in mono, on the accent. */
const Tag = ({ children, className }: { children: ReactNode; className?: string }) => (
    <span
        className={cn(
            'absolute whitespace-nowrap rounded-[4px] bg-primary-500 px-1.5 py-px font-mono text-[10px] text-on-action leading-4',
            className,
        )}
    >
        {children}
    </span>
);

/* ---------- Create: a page assembling from its recipe ---------- */

/** The page's blocks, in the order the recipe names them, each with where it sits. */
const blocks = [
    { key: 'nav', className: 'top-0 bottom-0 left-0 w-[22%] border-r' },
    { key: 'header', className: 'top-0 right-0 left-[22%] h-9 border-b' },
    {
        key: 'table',
        className: 'top-12 right-3 bottom-3 left-[calc(22%+12px)] rounded-[4px] border',
    },
] as const;

const CreateFigure = () => {
    const { ref, on, reduce } = usePlay(200);

    return (
        <div className="absolute inset-0 flex items-center justify-center p-6" ref={ref}>
            <div className="relative h-full w-full max-w-[280px] overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                {/* The blueprint the page is laid on, dashed until the parts fill it. */}
                <div className="absolute inset-2 rounded-[4px] border border-neutral-300 border-dashed" />
                {blocks.map((block, index) => (
                    <motion.div
                        animate={on ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
                        className={cn('absolute border-neutral-200 bg-neutral-50', block.className)}
                        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                        key={block.key}
                        transition={{ duration: 0.4, ease, delay: index * 0.22 }}
                    >
                        {block.key === 'nav' && (
                            <div className="flex flex-col gap-2 p-2.5 pt-3">
                                <span className="h-1.5 w-3/4 rounded-full bg-neutral-300" />
                                {[0, 1, 2, 3].map(item => (
                                    <span
                                        className={cn(
                                            'h-1.5 rounded-full',
                                            item === 1
                                                ? 'w-full bg-primary-500/70'
                                                : 'w-2/3 bg-neutral-200',
                                        )}
                                        key={item}
                                    />
                                ))}
                            </div>
                        )}
                        {block.key === 'header' && (
                            <div className="flex h-full items-center justify-between px-3">
                                <span className="h-1.5 w-16 rounded-full bg-neutral-400" />
                                <span className="h-4 w-10 rounded-[3px] bg-primary-500" />
                            </div>
                        )}
                        {block.key === 'table' && (
                            <div className="flex flex-col">
                                {[0, 1, 2, 3, 4].map(row => (
                                    <div
                                        className={cn(
                                            'flex h-6 items-center gap-2 px-2',
                                            row > 0 && 'border-neutral-200 border-t',
                                        )}
                                        key={row}
                                    >
                                        <span
                                            className={cn(
                                                'size-2.5 shrink-0 rounded-full',
                                                row === 0 ? 'bg-transparent' : 'bg-neutral-200',
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'h-1.5 rounded-full',
                                                row === 0
                                                    ? 'w-10 bg-neutral-300'
                                                    : 'w-14 bg-neutral-200',
                                            )}
                                        />
                                        <span className="ml-auto h-1.5 w-6 rounded-full bg-neutral-200" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
                <motion.div
                    animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 3 }}
                    initial={reduce ? false : { opacity: 0, y: 3 }}
                    transition={{ duration: 0.3, ease, delay: 0.75 }}
                >
                    <Tag className="top-11 right-3">Table</Tag>
                </motion.div>
            </div>
        </div>
    );
};

/* ---------- Refine: a drifted row measured and put back ---------- */

const RefineFigure = () => {
    const { ref, on, reduce } = usePlay(700);

    return (
        <div className="absolute inset-0 flex items-center justify-center p-6" ref={ref}>
            <div className="flex w-full max-w-[280px] flex-col rounded-md border border-neutral-200 bg-neutral-50">
                {['Ana Ruiz', 'Sam Okoro', 'Lea Brandt'].map((name, index) => {
                    const drifted = index === 1;
                    return (
                        <div
                            className={cn(
                                'relative flex h-10 items-center',
                                index > 0 && 'border-neutral-200 border-t',
                                drifted && 'bg-neutral-100',
                            )}
                            key={name}
                        >
                            {/* The redline: the drifted inset, measured against the rows above and below. */}
                            {drifted && (
                                <motion.span
                                    animate={{ width: on ? 12 : 19 }}
                                    aria-hidden
                                    className={cn(
                                        'absolute inset-y-1.5 left-0 border-y border-r border-dashed transition-colors duration-300',
                                        on
                                            ? 'border-primary-500 bg-primary-500/15'
                                            : 'border-error-500 bg-error-500/15',
                                    )}
                                    initial={reduce ? false : { width: 19 }}
                                    transition={{ duration: 0.45, ease }}
                                />
                            )}
                            <motion.div
                                animate={{ paddingLeft: drifted && !on ? 19 : 12 }}
                                className="flex min-w-0 flex-1 items-center gap-2.5 pr-3"
                                initial={reduce ? false : { paddingLeft: drifted ? 19 : 12 }}
                                transition={{ duration: 0.45, ease }}
                            >
                                <span className="size-5 shrink-0 rounded-full bg-neutral-200" />
                                <span className="truncate text-[12px] text-neutral-800">
                                    {name}
                                </span>
                                <motion.span
                                    animate={{ height: drifted && !on ? 24 : 20 }}
                                    className="ml-auto w-12 shrink-0 rounded-[4px] border border-neutral-200 bg-neutral-50"
                                    initial={reduce ? false : { height: drifted ? 24 : 20 }}
                                    transition={{ duration: 0.45, ease }}
                                />
                            </motion.div>
                            {drifted && (
                                <span
                                    className={cn(
                                        'absolute -top-2.5 left-1 rounded-[4px] px-1.5 py-px font-mono text-[10px] text-on-action leading-4 transition-colors duration-300',
                                        on ? 'bg-primary-500' : 'bg-error-500',
                                    )}
                                >
                                    {on ? '12px' : '19px → 12px'}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ---------- Standards: the project's tokens, kept in sync ---------- */

const tokens: { name: string; value: string; swatch: ReactNode }[] = [
    {
        name: 'accent',
        value: '#ffa31a',
        swatch: <span className="size-4 rounded-[4px] bg-primary-500" />,
    },
    {
        name: 'font',
        value: 'Geist',
        swatch: (
            <span className="w-4 text-center font-medium text-[12px] text-neutral-950">Aa</span>
        ),
    },
    {
        name: 'corners',
        value: '6px',
        swatch: (
            <span className="size-4 rounded-tl-[6px] border-neutral-500 border-t-[1.5px] border-l-[1.5px]" />
        ),
    },
    {
        name: 'components',
        value: 'MemberRow, PlanCard',
        swatch: (
            <span className="grid size-4 grid-cols-2 gap-0.5">
                {[0, 1, 2, 3].map(cell => (
                    <span className="rounded-[1.5px] bg-neutral-400" key={cell} />
                ))}
            </span>
        ),
    },
];

const StandardsFigure = () => {
    const { ref, on, reduce } = usePlay(300);

    return (
        <div className="absolute inset-0 flex items-center justify-center p-6" ref={ref}>
            <div className="flex w-full max-w-[280px] flex-col rounded-md border border-neutral-200 bg-neutral-50">
                <div className="flex h-8 items-center gap-2 border-neutral-200 border-b px-3">
                    <span className="font-mono text-[11px] text-neutral-600">acme-ops</span>
                    <span className="ml-auto flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <motion.span
                            animate={on ? { rotate: 360 } : { rotate: 0 }}
                            className="flex"
                            initial={reduce ? false : { rotate: 0 }}
                            transition={{ duration: 0.8, ease }}
                        >
                            <RefreshCw aria-hidden className="size-3" strokeWidth={2} />
                        </motion.span>
                        synced
                    </span>
                </div>
                {tokens.map((token, index) => (
                    <motion.div
                        animate={on ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
                        className={cn(
                            'flex h-8 items-center gap-2.5 px-3',
                            index > 0 && 'border-neutral-200 border-t',
                        )}
                        initial={reduce ? false : { opacity: 0, x: -4 }}
                        key={token.name}
                        transition={{ duration: 0.35, ease, delay: 0.3 + index * 0.1 }}
                    >
                        <span className="flex size-4 shrink-0 items-center justify-center">
                            {token.swatch}
                        </span>
                        <span className="text-[12px] text-neutral-500">{token.name}</span>
                        <span className="ml-auto truncate font-mono text-[11px] text-neutral-800">
                            {token.value}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/* ---------- The section ---------- */

const uses = [
    {
        figure: CreateFigure,
        title: 'Create new interfaces',
        body: 'Every page starts from a recipe and the parts it names, never a blank file.',
    },
    {
        figure: RefineFigure,
        title: 'Refine existing ones',
        body: 'A screen is read against the patterns, and what drifted is put back in place.',
    },
    {
        figure: StandardsFigure,
        title: 'Keep standards in reach',
        body: "Your theme and your own components, synced, so every screen builds on the project's truth.",
    },
];

export const Uses = () => (
    <Section
        description="The same rules and parts hold whether you start a page, tidy one up or hand it to an agent."
        eyebrow="In practice"
        id="uses"
        title="One system, from the first screen to the last fix."
    >
        <Reveal>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {uses.map(use => (
                    <li
                        className="flex min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50"
                        key={use.title}
                    >
                        <div
                            aria-hidden
                            className="relative m-2 mb-0 h-52 overflow-hidden rounded-[calc(var(--radius-panel)-8px)] border border-neutral-200 bg-neutral-100"
                        >
                            <use.figure />
                        </div>
                        <div className="flex flex-col gap-1.5 p-6 pt-5">
                            <h3 className="font-medium text-base text-neutral-950">{use.title}</h3>
                            <p className="text-[15px] text-neutral-600 leading-[1.6]">{use.body}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </Reveal>
    </Section>
);
