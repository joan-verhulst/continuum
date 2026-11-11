import {
    Button,
    chartHarmonies,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    defaultAccentSeed,
    defaultThemeOptions,
    StatusDot,
    Stepper,
    StepperItem,
    type ThemeMode,
    type ThemeOptions,
    themeFontFamilies,
} from 'continuum';
import { ArrowRight } from 'lucide-react';
import { type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { PageFooter } from '../layout';
import { sizesLine } from '../presets';
import { type Balance, balanceCurves, measurePairs, measureSeries } from './checks';
import { DataEditor, GreysEditor, PrimaryEditor } from './colour';
import {
    ButtonsEditor,
    CornersEditor,
    DensityEditor,
    ElevationEditor,
    FontEditor,
    NavEditor,
    TypeSizeEditor,
    TypeSpacingEditor,
} from './controls';
import { Choice } from './parts';

/*
 * A project's theme as a short flow, one step at a time: the primary, the neutral, the chart
 * colours, the controls, the sizes, then a review. Steps already reached can be returned to from
 * the stepper. Each part of a step sits in a container of its own, and a choice is made by picking
 * a drawing of what it changes. How the theme reads is checked where it is decided: a step that
 * sets colour says under it whether its pairs keep their contrast, and offers the fix. At the end
 * the theme is measured again in light and dark, and any pair that still misses is put to the
 * person before the theme is used: they may fix it, look again, or go on. Using it makes it the
 * theme the whole playground wears.
 */

export type FlowProps = {
    theme: ThemeOptions;
    set: (patch: Partial<ThemeOptions>) => void;
    /** The furthest step reached, so a project picks up where it was left. */
    progress: number;
    onProgress: (step: number) => void;
    /** Uses the theme: the project keeps it and the playground wears it. */
    onUse: () => void;
    /** The playground wears this theme as it is now, so there is nothing to use. */
    inUse: boolean;
    /** The theme has been used before, so using it again is an update. */
    used: boolean;
    /** Opens the export of app.css and DESIGN.md. */
    onExport: () => void;
    /** The theme has changes the project has not saved. */
    dirty: boolean;
    /** Saves the theme as it is now to the project; Continue calls it on leaving a step. */
    onSave: () => void;
};

type Balancing = { state: 'idle' } | { state: 'busy' } | { state: 'done'; balance: Balance };

/** Runs the balance search a slice at a time, about 8ms of work between frames. */
const runBalance = (theme: ThemeOptions, done: (balance: Balance) => void) => {
    const search = balanceCurves(theme);
    const slice = () => {
        const start = performance.now();
        let next = search.next();
        while (!next.done && performance.now() - start < 8) next = search.next();
        if (next.done) done(next.value);
        else setTimeout(slice, 0);
    };
    setTimeout(slice, 0);
};

const changeLine = (balance: Balance) =>
    balance.changes
        .map(
            change =>
                `${change.ramp === 'neutral' ? 'Neutral' : 'Primary'} ${change.key} ${change.from.toFixed(2)} → ${change.to.toFixed(2)}`,
        )
        .join(' · ');

/** A pair or a data-colour check that misses, in a line, for the prompt and the review. */
type Fault = {
    key: string;
    id: string;
    mode: ThemeMode;
    label: string;
    detail: string;
    soft: boolean;
};

const seriesNames: Record<string, string> = {
    band: 'Chart colours in their lightness band',
    chroma: 'Chart colours clear of grey',
    cvd: 'Chart colours apart for colour-blind readers',
    normal: 'Chart colours apart for everyone',
    contrast: 'Chart colours against the chart surface',
};

/** Every required miss in both modes; the chart colours' soft misses (a warn) are marked so. */
const findFaults = (theme: ThemeOptions): Fault[] =>
    (['light', 'dark'] as const).flatMap(mode => [
        ...measurePairs(theme, mode)
            .filter(result => result.state === 'fail')
            .map(result => ({
                key: `${mode}-${result.check.id}`,
                id: result.check.id,
                mode,
                label: result.check.label,
                detail: `${result.ratio.toFixed(2)}:1, needs ${result.check.min}:1`,
                soft: false,
            })),
        ...measureSeries(theme, mode)
            .checks.filter(check => check.state !== 'pass')
            .map(check => ({
                key: `${mode}-series-${check.id}`,
                id: `series-${check.id}`,
                mode,
                label: seriesNames[check.id] ?? check.id,
                detail: check.state === 'warn' ? 'only with labels beside it' : 'misses',
                soft: check.state === 'warn',
            })),
    ]);

const FaultList = ({ faults }: { faults: Fault[] }) => (
    <ul className="flex flex-col divide-y divide-neutral-200 rounded-item border border-neutral-200">
        {faults.map(fault => (
            <li className="flex items-center gap-3 px-3 py-2.5 text-xs" key={fault.key}>
                <StatusDot tone={fault.soft ? 'warning' : 'error'} />
                <span className="min-w-0 flex-1 text-neutral-950">{fault.label}</span>
                <span className="shrink-0 text-neutral-600 tabular-nums">
                    {fault.mode === 'light' ? 'Light' : 'Dark'} · {fault.detail}
                </span>
            </li>
        ))}
    </ul>
);

/** The question at the end: what misses, and what to do about it. Going on is always allowed. */
const FaultPrompt = ({
    faults,
    open,
    onOpenChange,
    onContinue,
    balancing,
    onBalance,
    onApply,
}: {
    faults: Fault[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onContinue: () => void;
    balancing: Balancing;
    onBalance: () => void;
    onApply: (balance: Balance) => void;
}) => {
    const hard = faults.filter(fault => !fault.soft).length;
    const proposal = balancing.state === 'done' ? balancing.balance : null;
    const use = () => {
        onOpenChange(false);
        onContinue();
    };
    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent className="w-[min(520px,calc(100vw-32px))]">
                <DialogHeader>
                    <DialogTitle>
                        {hard > 0
                            ? `${hard} ${hard === 1 ? 'pair misses its' : 'pairs miss their'} contrast`
                            : 'The chart colours need labels beside them'}
                    </DialogTitle>
                </DialogHeader>
                <DialogBody>
                    {/* The balance moves the neutral and primary curves only, so it is offered for the pairs alone. */}
                    <DialogDescription>
                        {hard > 0
                            ? 'People will find these hard to read in the product. Balance the curves to fix what the theme can, or go on as it is.'
                            : 'Every pair reads. The chart colours are told apart once each series has a label beside it, so give them labels in the product, or look again at the chart colours.'}
                    </DialogDescription>
                    <FaultList faults={faults} />
                    {proposal && (
                        <div className="flex flex-col gap-2 rounded-item bg-neutral-950/3 p-3 text-xs">
                            <p className="text-neutral-950 tabular-nums">
                                Balanced: light {proposal.before.light} → {proposal.after.light},
                                dark {proposal.before.dark} → {proposal.after.dark}
                                {proposal.patch ? '' : '. No curve does better than these.'}
                            </p>
                            {proposal.changes.length > 0 && (
                                <p className="text-neutral-600 tabular-nums">
                                    {changeLine(proposal)}
                                </p>
                            )}
                            {proposal.unfixed.map(group => (
                                <p className="text-neutral-600" key={group.reason}>
                                    {group.pairs.map(pair => pair.label).join(', ')}: {group.reason}
                                </p>
                            ))}
                        </div>
                    )}
                </DialogBody>
                {hard === 0 ? (
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>
                            Look again
                        </DialogClose>
                        <Button onClick={use}>Use this theme</Button>
                    </DialogFooter>
                ) : (
                    <DialogFooter>
                        <DialogClose render={<Button variant="ghost" />}>Look again</DialogClose>
                        <Button onClick={use} variant="secondary">
                            Use it anyway
                        </Button>
                        {proposal?.patch ? (
                            <Button onClick={() => onApply(proposal)}>Apply the balance</Button>
                        ) : (
                            <Button
                                disabled={balancing.state === 'busy' || Boolean(proposal)}
                                onClick={onBalance}
                            >
                                {balancing.state === 'busy'
                                    ? 'Balancing…'
                                    : 'Balance light and dark'}
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

/* ---------- The steps ---------- */

/** A part of the Colour step: a section with its own builder and its own contrast line. */
type ColourPart = {
    id: string;
    label: string;
    ask: string;
    panel: ReactNode;
    summary: string;
    checks?: (id: string) => boolean;
};

type Step = {
    id: string;
    /** In the stepper and the review. */
    label: string;
    /** The page's title while the step is open. */
    title: string;
    /** What the step asks, under the title. */
    ask: string;
    /** Its builder. */
    panel: ReactNode;
    /** What it was answered with, in a line, for the review. */
    summary: string;
    /** The checks decided here, by id; none where nothing about contrast is decided. */
    checks?: (id: string) => boolean;
    /** Whether the curves can fix a miss here, so the balance is offered. */
    balances?: boolean;
};

/**
 * How what this step decides reads, under its builder: one quiet line while every pair keeps its
 * contrast, the pairs that miss and the fix once one does not.
 */
const StepCheck = ({
    faults,
    balances,
    onBalance,
}: {
    faults: Fault[];
    balances: boolean;
    onBalance: () => void;
}) => {
    const hard = faults.filter(fault => !fault.soft);

    if (faults.length === 0) {
        return (
            <p className="flex items-center gap-2 text-neutral-600 text-xs">
                <StatusDot tone="success" />
                Reads in light and in dark
            </p>
        );
    }
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-neutral-950 text-xs">
                    <StatusDot tone={hard.length ? 'error' : 'warning'} />
                    {hard.length
                        ? `${hard.length} ${hard.length === 1 ? 'pair is' : 'pairs are'} hard to read`
                        : 'Told apart once each series has a label beside it'}
                </p>
                {balances && hard.length > 0 && (
                    <Button className="shrink-0" onClick={onBalance} variant="secondary">
                        Balance light and dark
                    </Button>
                )}
            </div>
            <FaultList faults={faults} />
        </div>
    );
};

const fontName = (theme: ThemeOptions) =>
    theme.font && theme.font in themeFontFamilies
        ? themeFontFamilies[theme.font as keyof typeof themeFontFamilies].family
        : (theme.font ?? 'Geist');

const textPairs = [
    'text',
    'text-canvas',
    'cell',
    'quiet',
    'secondary',
    'secondary-canvas',
    'muted',
];
const actionPairs = ['action', 'on-action'];

const review = {
    label: 'Review',
    title: 'Review your theme',
    ask: 'How your theme reads in light and dark.',
};

/**
 * The project's theme, one step at a time: the step's title and what it asks, the stepper under
 * it, its builder, and Back and Continue in a bar at the foot of the panel, where they never move.
 */
export const ProjectFlow = (props: FlowProps & { name: string }) => {
    const { theme, set, progress, onProgress, onUse, inUse, used, onExport, name, dirty, onSave } =
        props;
    const REVIEW = 4;
    const [current, setCurrent] = useState(() => Math.min(progress, REVIEW));
    // The Colour step shows one of its parts at a time, and Continue walks them before leaving it,
    // so the greys and the chart colours are seen rather than scrolled past.
    const COLOUR = 0;
    const [part, setPart] = useState(0);
    const [prompting, setPrompting] = useState(false);
    const [balancing, setBalancing] = useState<Balancing>({ state: 'idle' });
    const isReview = current === REVIEW;
    // Every step has been opened once: from here they are places to go back to, not a path to walk
    // again, so one thing can be changed and the theme used from wherever that was.
    const complete = progress >= REVIEW;
    const top = useRef<HTMLDivElement>(null);

    // Measured when React has time, so a drag on a curve is never held up by it.
    const signature = JSON.stringify(useDeferredValue(theme));
    const faults = useMemo(() => findFaults(JSON.parse(signature) as ThemeOptions), [signature]);
    const hard = faults.filter(fault => !fault.soft);

    // Once a balance clears every miss there is nothing left to ask, so the prompt goes.
    useEffect(() => {
        if (prompting && faults.length === 0) setPrompting(false);
    }, [prompting, faults.length]);

    // A new step starts at its top: the panel's scroll only resets on a change of page.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on a change of step only
    useEffect(() => {
        top.current?.closest('[data-slot=sheet-area]')?.scrollTo({ top: 0 });
    }, [current, part]);

    const go = (step: number) => {
        const next = Math.max(0, Math.min(REVIEW, step));
        setCurrent(next);
        if (next > progress) onProgress(next);
    };

    const balance = () => {
        setPrompting(true);
        setBalancing({ state: 'busy' });
        runBalance(theme, result => setBalancing({ state: 'done', balance: result }));
    };

    const finish = () => {
        // A set of chart colours that only wants labels beside it is said in its step, not asked again here.
        if (findFaults(theme).some(fault => !fault.soft)) setPrompting(true);
        else onUse();
    };

    const gamut = theme.gamut ?? defaultThemeOptions.gamut;
    const editor = { theme, set, gamut };
    const neutral = theme.neutral ?? defaultThemeOptions.neutral;
    const accentAction = (theme.action ?? defaultThemeOptions.action) === 'accent';
    const accentTint = (theme.tint ?? defaultThemeOptions.tint) === 'accent';

    // The three parts of the Colour step: each a section, with its own contrast line under it.
    const colourParts: ColourPart[] = [
        {
            id: 'accent',
            label: 'Primary',
            ask: 'Badges, notices, status dots and the first chart colour.',
            panel: <PrimaryEditor {...editor} />,
            summary: `${theme.accent ?? defaultAccentSeed} · ${theme.accentStep ?? defaultThemeOptions.accentStep}`,
            // The ring and the primary badge always; the button and the wash once they take the colour.
            checks: id =>
                ['focus', 'focus-canvas', 'badge-primary'].includes(id) ||
                (accentAction && actionPairs.includes(id)) ||
                (accentTint && id === 'tint'),
        },
        {
            id: 'greys',
            label: 'Neutral',
            ask: 'The greys of text, borders and surfaces.',
            panel: <GreysEditor {...editor} />,
            summary:
                neutral.tint === 0
                    ? 'pure grey'
                    : `hue ${Math.round(neutral.hue)}° · tint ${neutral.tint.toFixed(3)}`,
            checks: id =>
                textPairs.includes(id) ||
                id === 'checkbox' ||
                (!accentAction && actionPairs.includes(id)) ||
                (!accentTint && id === 'tint'),
        },
        {
            id: 'data',
            label: 'Charts',
            ask: 'The colours charts tell series apart by.',
            panel: <DataEditor {...editor} />,
            summary: theme.charts
                ? 'own chart set'
                : `${(
                      chartHarmonies.find(item => item.id === (theme.chartHarmony ?? 'auto'))
                          ?.label ?? 'Custom'
                  ).toLowerCase()} charts`,
            // The chart colours are not judged: the wheel says how the set reads, where it is changed.
        },
    ];

    const lastPart = colourParts.length - 1;
    const shown = colourParts[Math.min(part, lastPart)] as ColourPart;

    // Back and Continue step through the Colour step's parts as through steps.
    const back = () => {
        if (current === COLOUR && part > 0) return setPart(part - 1);
        if (current - 1 === COLOUR) setPart(lastPart);
        go(current - 1);
    };
    const next = () => {
        onSave();
        if (current === COLOUR && part < lastPart) return setPart(part + 1);
        go(current + 1);
    };

    const steps: Step[] = [
        {
            id: 'colour',
            label: 'Colour',
            title: 'Choose your colours',
            ask: 'The primary colour, the greys and the chart colours. All three start filled in: keep them or change them.',
            panel: (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <Choice
                            label="Colour"
                            onChange={id =>
                                setPart(
                                    Math.max(
                                        0,
                                        colourParts.findIndex(item => item.id === id),
                                    ),
                                )
                            }
                            options={colourParts.map(item => ({
                                value: item.id,
                                label: item.label,
                            }))}
                            value={shown.id}
                        />
                        <p className="text-neutral-600 text-xs">{shown.ask}</p>
                    </div>
                    <div className="flex flex-col gap-3" key={shown.id}>
                        {shown.panel}
                        {/* How what this part decides reads, said under it. */}
                        {shown.checks && (
                            <div className="pt-2">
                                <StepCheck
                                    balances
                                    faults={faults.filter(fault => shown.checks?.(fault.id))}
                                    onBalance={balance}
                                />
                            </div>
                        )}
                    </div>
                </div>
            ),
            summary: colourParts.map(part => part.summary).join(' · '),
            // Each part says its own checks under it, so the step adds no line of its own.
        },
        {
            id: 'type',
            label: 'Type',
            title: 'Choose your type',
            ask: 'The font, and the space between letters and lines.',
            panel: (
                <div className="flex flex-col gap-8">
                    <FontEditor set={set} theme={theme} />
                    <TypeSpacingEditor set={set} theme={theme} />
                </div>
            ),
            summary: `${fontName(theme)} · spacing ${((theme.tracking ?? 0.025) * (theme.type ?? 13)).toFixed(2)}px · lines ${(theme.leading ?? 1.25).toFixed(2)}`,
        },
        {
            id: 'controls',
            label: 'Controls',
            title: 'Choose your controls',
            ask: 'The main button, the corners, the sidebar and the shadows.',
            panel: (
                <div className="flex flex-col gap-8">
                    <ButtonsEditor set={set} theme={theme} />
                    <CornersEditor set={set} theme={theme} />
                    <NavEditor set={set} theme={theme} />
                    <ElevationEditor set={set} theme={theme} />
                </div>
            ),
            summary: `${accentAction ? 'primary' : 'neutral'} action, ${theme.actionStyle ?? 'flat'} · corners ${Math.round((theme.radius ?? 1) * 100)}% · ${theme.nav ?? 'neutral'} active item · ${theme.elevation ?? 'flat'} shadows`,
            checks: id => actionPairs.includes(id) || id === 'tint',
            balances: true,
        },
        {
            id: 'density',
            label: 'Sizes',
            title: 'Choose your sizes',
            ask: 'The type size, the room around things, and the height of controls.',
            panel: (
                <div className="flex flex-col gap-8">
                    <TypeSizeEditor set={set} theme={theme} />
                    <DensityEditor set={set} theme={theme} />
                </div>
            ),
            summary: sizesLine(theme),
        },
    ];

    const faultsOf = (step: Step) =>
        step.checks ? faults.filter(fault => step.checks?.(fault.id)) : [];
    const step = isReview ? undefined : steps[current];
    const open = step ?? review;
    const all = [...steps, review];

    return (
        <>
            <div className="flex flex-col gap-10" ref={top}>
                {/* The step's own header: what this step is and what it asks. */}
                <header className="flex flex-col gap-3">
                    <p className="text-neutral-600 text-xs tabular-nums">{name}</p>
                    <h1 className="font-medium text-3xl text-neutral-950 tracking-[-0.02em]">
                        {open.title}
                    </h1>
                    <p className="max-w-xl text-base text-neutral-600">{open.ask}</p>
                    {/* The preview panel is hidden below the large breakpoint, so a narrow window says where it went. */}
                    <p className="text-neutral-600 text-xs lg:hidden">
                        The preview shows beside the steps in a wider window.
                    </p>
                </header>

                <Stepper aria-label="Theme steps" marker="line" value={current + 1}>
                    {all.map((item, i) => (
                        <StepperItem
                            invalid={i === REVIEW && isReview && hard.length > 0}
                            key={item.label}
                            label={item.label}
                            // Any step can be opened at any time: the order is a suggestion, not a lock.
                            onSelect={i !== current ? () => go(i) : undefined}
                            status={i === current ? 'current' : i <= progress ? 'done' : 'upcoming'}
                            step={i + 1}
                        />
                    ))}
                </Stepper>
            </div>

            <div key={current}>
                {step ? (
                    <div className="flex flex-col gap-3">
                        {step.panel}
                        {/* How what this step decides reads, said where it is decided. */}
                        {step.checks && (
                            <div className="pt-2">
                                <StepCheck
                                    balances={Boolean(step.balances)}
                                    faults={faultsOf(step)}
                                    onBalance={balance}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        <dl className="flex flex-col divide-y divide-neutral-200 rounded-item border border-neutral-200">
                            {steps.map((item, i) => (
                                <div
                                    className="flex items-center gap-4 py-1.5 pr-1.5 pl-3 text-xs"
                                    key={item.id}
                                >
                                    <dt className="w-24 shrink-0 text-neutral-600">{item.label}</dt>
                                    <dd className="min-w-0 flex-1 truncate text-neutral-950">
                                        {item.summary}
                                    </dd>
                                    <Button onClick={() => go(i)} variant="ghost">
                                        Change
                                    </Button>
                                </div>
                            ))}
                            <div className="flex items-center gap-4 py-1.5 pr-1.5 pl-3 text-xs">
                                <dt className="w-24 shrink-0 text-neutral-600">Files</dt>
                                <dd className="min-w-0 flex-1 truncate text-neutral-950">
                                    app.css and DESIGN.md
                                </dd>
                                <Button onClick={onExport} variant="ghost">
                                    Export
                                </Button>
                            </div>
                        </dl>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="flex items-center gap-2 text-neutral-950 text-xs">
                                    <StatusDot
                                        tone={
                                            hard.length
                                                ? 'error'
                                                : faults.length
                                                  ? 'warning'
                                                  : 'success'
                                        }
                                    />
                                    {hard.length
                                        ? `${hard.length} ${hard.length === 1 ? 'pair misses its' : 'pairs miss their'} contrast`
                                        : faults.length
                                          ? 'Every pair reads; the chart colours need labels beside them'
                                          : 'Every pair reads, in light and in dark'}
                                </p>
                                {hard.length > 0 && (
                                    <Button onClick={balance} variant="secondary">
                                        Balance light and dark
                                    </Button>
                                )}
                            </div>
                            {faults.length > 0 && <FaultList faults={faults} />}
                        </div>
                    </div>
                )}
            </div>

            {/*
             * The foot of the panel. The first time through, it walks the steps: the count and the
             * theme's state at the left, Back and Continue at the right, where they never move, and
             * Continue saves the step it leaves. Once every step has been opened it holds the one
             * action instead, on every step: Use this theme, or Update theme for one used before.
             * Both save the whole; ⌘S saves without using. With the theme in use as it is, there
             * is nothing left to do and the action goes.
             */}
            <PageFooter>
                <div className="mr-auto flex min-w-0 items-center gap-4 text-neutral-600 text-xs">
                    {!complete && (
                        <span className="shrink-0 tabular-nums">
                            Step {current + 1} of {all.length}
                        </span>
                    )}
                    {dirty && (
                        <span className="flex min-w-0 items-center gap-2">
                            <StatusDot tone="warning" />
                            <span className="truncate">Unsaved changes</span>
                        </span>
                    )}
                    {inUse && (
                        <span className="flex min-w-0 items-center gap-2">
                            <StatusDot tone="primary" />
                            <span className="truncate">In use</span>
                        </span>
                    )}
                </div>
                {complete ? (
                    !inUse && (
                        <Button onClick={finish}>{used ? 'Update theme' : 'Use this theme'}</Button>
                    )
                ) : (
                    <>
                        <Button
                            disabled={current === 0 && part === 0}
                            onClick={back}
                            variant="secondary"
                        >
                            Back
                        </Button>
                        <Button onClick={next}>
                            Continue
                            <ArrowRight strokeWidth={2} />
                        </Button>
                    </>
                )}
            </PageFooter>

            <FaultPrompt
                balancing={balancing}
                faults={faults}
                onApply={result => {
                    if (result.patch) set(result.patch);
                    setBalancing({ state: 'idle' });
                }}
                onBalance={balance}
                onContinue={onUse}
                onOpenChange={next => {
                    setPrompting(next);
                    if (!next) setBalancing({ state: 'idle' });
                }}
                open={prompting}
            />
        </>
    );
};
