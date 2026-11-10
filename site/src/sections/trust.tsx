import { measurePairs, pairName } from '@playground/theme-editor/checks';
import { designBrief, exportTheme, tailwindEntry } from '@playground/theme-export';
import {
    Badge,
    Button,
    cn,
    createThemeCss,
    SegmentedControl,
    SegmentedControlItem,
    Theme,
    type ThemeMode,
} from 'continuum';
import { Check, Shuffle, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useMemo, useState } from 'react';
import { ease, Reveal, Section } from '../web';
import { accentStore, accentTheme, swatches, useAccent } from './theme-builder';

/*
 * Why it is safe to adopt: three short facts, each proved by the real file or the real check on
 * the accent the visitor picked in the builder above. The app.css lines are tailwindEntry's own,
 * the DESIGN.md lines designBrief's, the ratio the builder's measure.
 */

const icon = { strokeWidth: 2 } as const;

/** The scope the proofs paint in: the visitor's accent, as the builder above makes it. */
const PROOF_THEME = 'trust-proof';

/** The lines of a file that start with one of the given beginnings, in the order asked. */
const pick = (text: string, starts: string[]) => {
    const lines = text.split('\n').map(line => line.trim());
    return starts.flatMap(start => {
        const found = lines.find(line => line.startsWith(start));
        return found ? [found] : [];
    });
};

/* ---------- The proofs ---------- */

/** Lines of code as an editor shows them: one per row, cut at the edge rather than wrapped. */
const Code = ({
    lines,
}: {
    lines: { text: ReactNode; tone?: 'quiet' | 'loud'; key: string }[];
}) => {
    const reduce = useReducedMotion();
    return (
        <div className="flex min-w-0 flex-col font-mono text-[11px] leading-[1.7]">
            {lines.map((line, i) => (
                <motion.p
                    className={cn(
                        'min-h-[1.7em] truncate',
                        line.tone === 'quiet'
                            ? 'text-neutral-500'
                            : line.tone === 'loud'
                              ? 'text-neutral-950'
                              : 'text-neutral-600',
                    )}
                    initial={reduce ? false : { opacity: 0, y: 4 }}
                    key={line.key}
                    transition={{ duration: 0.6, ease, delay: 0.2 + i * 0.07 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, y: 0 }}
                >
                    {line.text}
                </motion.p>
            ))}
        </div>
    );
};

/** app.css as the builder writes it, the class that reads it, and the button it paints. */
const TailwindProof = () => {
    const accent = useAccent();
    const lines = useMemo(() => {
        const entry = tailwindEntry(exportTheme(accentTheme(accent), 'Your product', 'light'));
        return pick(entry, ['--color-action:', '--color-on-action:']).map(line => {
            const [name = '', value = ''] = line.split(/:\s(.+)/);
            return {
                key: name,
                text: (
                    <>
                        {name}: <span className="text-neutral-950">{value}</span>
                    </>
                ),
            };
        });
    }, [accent]);

    const next = () => {
        const at = swatches.findIndex(swatch => swatch.id === accent.id);
        const swatch = swatches[(at + 1) % swatches.length];
        if (swatch) accentStore.set({ id: swatch.id, hex: swatch.hex, step: '500' });
    };

    return (
        <div className="flex h-full flex-col justify-between gap-4">
            <Code
                lines={[
                    { key: 'file', text: '/* app.css */', tone: 'quiet' },
                    ...lines,
                    { key: 'gap', text: '' },
                    { key: 'use', text: '/* your button */', tone: 'quiet' },
                    { key: 'class', text: 'className="bg-action text-on-action"' },
                ]}
            />
            <div className="flex items-center justify-between gap-3">
                <Theme className="bg-transparent" theme={PROOF_THEME}>
                    <Button tabIndex={-1}>Save changes</Button>
                </Theme>
                <Button
                    aria-label="Try another accent"
                    onClick={next}
                    size="icon-sm"
                    title="Try another accent"
                    variant="ghost"
                >
                    <Shuffle {...icon} />
                </Button>
            </div>
        </div>
    );
};

/** DESIGN.md as Claude reads it: the theme's accent and action, then two of the rules. */
const MarkdownProof = () => {
    const accent = useAccent();
    const lines = useMemo(() => {
        const brief = designBrief(exportTheme(accentTheme(accent), 'Your product', 'light'));
        const found = pick(brief, [
            '## The theme',
            '| Accent |',
            '| Action |',
            '## Rules',
            '- Two weights',
            '- Hairlines over shadows',
        ]);
        return [
            { key: 'file', text: 'DESIGN.md', tone: 'quiet' as const },
            ...found.flatMap((line, i) => [
                // A blank line before each heading but the first, as the file has it.
                ...(line.startsWith('##') && i > 0 ? [{ key: `gap-${i}`, text: '' }] : []),
                {
                    key: line.startsWith('| Accent') ? 'accent' : line,
                    text: line,
                    tone: line.startsWith('#') ? ('loud' as const) : undefined,
                },
            ]),
        ];
    }, [accent]);

    return <Code lines={lines} />;
};

/** One pair, the accent's badge text, in either mode, with how it measures there. */
const ContrastProof = () => {
    const accent = useAccent();
    const [mode, setMode] = useState<ThemeMode>('light');
    const result = useMemo(
        () =>
            measurePairs(accentTheme(accent), mode).find(pair => pair.check.id === 'badge-primary'),
        [accent, mode],
    );
    const ok = Boolean(result && result.ratio >= result.check.min);

    return (
        <div className="flex h-full flex-col gap-3">
            <SegmentedControl
                aria-label="Mode"
                className="self-start"
                onValueChange={value => setMode(value as ThemeMode)}
                value={mode}
            >
                <SegmentedControlItem value="light">Light</SegmentedControlItem>
                <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
            </SegmentedControl>
            <Theme
                className="flex items-center gap-2.5 rounded-card border border-neutral-200 bg-neutral-50 p-4 text-xs transition-[background-color,border-color] duration-150 motion-reduce:transition-none"
                mode={mode}
                theme={PROOF_THEME}
            >
                <Badge tone="primary">Scheduled</Badge>
                <span className="truncate text-neutral-600">Sends on Monday at 09:00</span>
            </Theme>
            <div aria-live="polite" className="mt-auto flex flex-col gap-1">
                <p className="truncate font-mono text-[11px] text-neutral-500">
                    {result ? pairName(result.check) : ''}
                </p>
                <p className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-lg text-neutral-950 tabular-nums">
                        {result ? `${(Math.trunc(result.ratio * 10) / 10).toFixed(1)}:1` : '—'}
                    </span>
                    {ok ? (
                        <Check aria-hidden className="size-4 text-success-600" {...icon} />
                    ) : (
                        <X aria-hidden className="size-4 text-error-600" {...icon} />
                    )}
                    <span className="text-neutral-600">
                        {ok ? 'WCAG AA' : 'Misses WCAG AA'} in {mode}
                    </span>
                    <span className="ml-auto text-neutral-500 tabular-nums">
                        APCA Lc {result ? Math.trunc(Math.abs(result.lc)) : '—'}
                    </span>
                </p>
            </div>
        </div>
    );
};

/* ---------- The cards ---------- */

const Fact = ({
    title,
    children,
    proof,
}: {
    title: string;
    children: ReactNode;
    proof: ReactNode;
}) => (
    <article className="flex h-full flex-col rounded-panel border border-neutral-200 bg-neutral-50">
        {/* The proof sits in a well inset 8px, its corner the panel's less the inset. */}
        <div className="m-2 h-56 rounded-[calc(var(--radius-panel)-8px)] bg-neutral-100 p-4">
            {proof}
        </div>
        <div className="flex flex-col gap-2 px-6 pt-3 pb-6">
            <h3 className="font-medium text-neutral-950 text-xl tracking-[-0.01em]">{title}</h3>
            <p className="text-[15px] text-neutral-600 leading-[1.6]">{children}</p>
        </div>
    </article>
);

export const Trust = () => {
    const accent = useAccent();
    const css = useMemo(
        () => createThemeCss({ ...accentTheme(accent), name: PROOF_THEME }),
        [accent],
    );

    return (
        <Section
            description="The builder exports files you can read, in formats you already use: your theme as a Tailwind v4 entry, a markdown brief for Claude, and the React components to own."
            eyebrow="Your code"
            id="trust"
            title="What you take home is plain code."
        >
            <style>{css}</style>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Reveal className="h-full min-w-0">
                    <Fact proof={<TailwindProof />} title="Plain Tailwind v4.">
                        Your theme is one app.css in Tailwind's own names. Change a variable and
                        every button follows.
                    </Fact>
                </Reveal>
                <Reveal className="h-full min-w-0" delay={1}>
                    <Fact proof={<MarkdownProof />} title="Markdown you can read.">
                        DESIGN.md gives Claude your theme and the rules in sentences. Edit a line
                        and the next screen follows it.
                    </Fact>
                </Reveal>
                <Reveal className="h-full min-w-0 md:col-span-2 xl:col-span-1" delay={2}>
                    <Fact proof={<ContrastProof />} title="Contrast checked in both modes.">
                        Every colour pair your theme paints is measured with WCAG 2.2 and APCA, in
                        light and in dark.
                    </Fact>
                </Reveal>
            </div>
        </Section>
    );
};
