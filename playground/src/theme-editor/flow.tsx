import {
    Badge,
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
import { ArrowRight, Check } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { PageFooter } from '../layout';
import { sizesLine } from '../presets';
import { type Balance, balanceCurves, measurePairs, measureSeries } from './checks';
import { DataEditor, GreysEditor, PrimaryEditor } from './colour';
import { ControlsTab, SizeTab } from './controls';
import { Choice, Row } from './parts';

/*
 * A project's theme as a short flow, one step at a time: the primary, the neutral, the chart colours,
 * the controls, the sizes, then a review. Steps already reached can be returned to from the stepper. At the end the theme is measured in light and dark, and any pair that misses its
 * contrast is put to the person before the theme is used: they may fix it, look again, or go on.
 * Using it makes it the theme the whole playground wears.
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
    /** Opens the export of app.css and DESIGN.md. */
    onExport: () => void;
    /** The theme has changes the project has not saved. */
    dirty: boolean;
    /** Saves the theme as it is now to the project. */
    onSave: () => void;
};

/** The save shortcut as the reader's keyboard writes it. */
const saveKey = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘S' : 'Ctrl+S';

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

const fontName = (theme: ThemeOptions) =>
    theme.font && theme.font in themeFontFamilies
        ? themeFontFamilies[theme.font as keyof typeof themeFontFamilies].family
        : (theme.font ?? 'Geist');

/** What each step was answered with, in a line. */
const summaries: Record<string, (theme: ThemeOptions) => string> = {
    accent: theme =>
        `${theme.accent ?? defaultAccentSeed} · ${theme.accentStep ?? defaultThemeOptions.accentStep} · ${(theme.gamut ?? 'p3') === 'p3' ? 'P3' : 'sRGB'}`,
    greys: theme => {
        const neutral = theme.neutral ?? defaultThemeOptions.neutral;
        return neutral.tint === 0
            ? 'Pure grey'
            : `Hue ${Math.round(neutral.hue)}° · tint ${neutral.tint.toFixed(3)}`;
    },
    data: theme =>
        theme.charts
            ? "The theme's own set"
            : (chartHarmonies.find(item => item.id === (theme.chartHarmony ?? 'auto'))?.label ??
              'Custom'),
    controls: theme =>
        `${fontName(theme)} · ${(theme.action ?? 'neutral') === 'accent' ? 'primary' : 'neutral'} action, ${theme.actionStyle ?? 'flat'} · corners ${Math.round((theme.radius ?? 1) * 100)}%`,
    density: theme => sizesLine(theme),
};

type Step = {
    id: string;
    /** In the stepper. */
    label: string;
    /** The page's title while the step is open. */
    title: string;
    /** What the step asks, under the title. */
    ask: string;
    render: (props: FlowProps) => ReactNode;
};

const form = 'grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-3 gap-y-2';

const steps: Step[] = [
    {
        id: 'accent',
        label: 'Primary',
        title: 'Choose your primary colour',
        ask: "The theme's own colour: its badges, notices and status dots, and the first of its chart colours. The main button takes it too if the Controls step fills it with the primary. Pick it, and say which step of its ramp it is; the rest of the ramp is built from it.",
        render: ({ theme, set }) => (
            <div className="flex flex-col gap-2">
                <div className={form}>
                    <Row
                        hint="P3 is the wider gamut Tailwind's palette is drawn in; sRGB keeps every colour to what every screen shows."
                        label="Gamut"
                    >
                        <Choice
                            label="Gamut"
                            onChange={gamut => set({ gamut: gamut === 'p3' ? undefined : gamut })}
                            options={[
                                { value: 'p3', label: 'P3' },
                                { value: 'srgb', label: 'sRGB' },
                            ]}
                            value={theme.gamut ?? 'p3'}
                        />
                    </Row>
                </div>
                <PrimaryEditor gamut={theme.gamut ?? 'p3'} set={set} theme={theme} />
            </div>
        ),
    },
    {
        id: 'greys',
        label: 'Neutral',
        title: 'Choose your neutral colour',
        ask: 'The greys of text, borders and surfaces. Most products keep them pure grey; a little tint makes them warmer or cooler.',
        render: ({ theme, set }) => (
            <GreysEditor gamut={theme.gamut ?? 'p3'} set={set} theme={theme} />
        ),
    },
    {
        id: 'data',
        label: 'Charts',
        title: 'Choose your chart colours',
        ask: 'The colours charts tell series apart by. Pick a harmony, then drag on the wheel to adjust it.',
        render: ({ theme, set }) => (
            <DataEditor gamut={theme.gamut ?? 'p3'} set={set} theme={theme} />
        ),
    },
    {
        id: 'controls',
        label: 'Controls',
        title: 'Choose your font and controls',
        ask: 'The font, what the main button is filled with, and how round the corners are.',
        render: ({ theme, set }) => <ControlsTab set={set} theme={theme} />,
    },
    {
        id: 'density',
        label: 'Sizes',
        title: 'Choose your sizes',
        ask: 'The type size, the spacing, and the height of controls.',
        render: ({ theme, set }) => <SizeTab set={set} theme={theme} />,
    },
];

const REVIEW = steps.length;

/** A pair or a data-colour check that misses, in a line, for the prompt and the review. */
type Fault = { key: string; mode: ThemeMode; label: string; detail: string; soft: boolean };

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
                mode,
                label: result.check.label,
                detail: `${result.ratio.toFixed(2)}:1, needs ${result.check.min}:1`,
                soft: false,
            })),
        ...measureSeries(theme, mode)
            .checks.filter(check => check.state !== 'pass')
            .map(check => ({
                key: `${mode}-series-${check.id}`,
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

const review = {
    label: 'Review',
    title: 'Review your theme',
    ask: 'How your theme reads in light and dark. Use it when it reads; anything that misses is shown to you first.',
};

/**
 * The project's theme, one step at a time: the step's title and what it asks, the stepper under it, its
 * asks, its settings, and Back and Continue in a bar at the foot of the panel, where they never move.
 */
export const ProjectFlow = (props: FlowProps & { name: string }) => {
    const { theme, set, progress, onProgress, onUse, inUse, onExport, name, dirty, onSave } = props;
    const [current, setCurrent] = useState(() => Math.min(progress, REVIEW));
    const [prompting, setPrompting] = useState(false);
    const [balancing, setBalancing] = useState<Balancing>({ state: 'idle' });
    const signature = JSON.stringify(theme);
    const isReview = current === REVIEW;
    // biome-ignore lint/correctness/useExhaustiveDependencies: measured again when the theme changes, by its signature
    const faults = useMemo(() => (isReview ? findFaults(theme) : []), [signature, isReview]);
    const hard = faults.filter(fault => !fault.soft);
    const top = useRef<HTMLDivElement>(null);

    // Once a balance clears every miss there is nothing left to ask, so the prompt goes.
    useEffect(() => {
        if (prompting && faults.length === 0) setPrompting(false);
    }, [prompting, faults.length]);

    // A new step starts at its top: the panel's scroll only resets on a change of page.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on a change of step only
    useEffect(() => {
        top.current?.closest('[data-slot=sheet-area]')?.scrollTo({ top: 0 });
    }, [current]);

    const go = (step: number) => {
        const next = Math.max(0, Math.min(REVIEW, step));
        setCurrent(next);
        if (next > progress) onProgress(next);
    };

    const balance = () => {
        setBalancing({ state: 'busy' });
        runBalance(theme, result => setBalancing({ state: 'done', balance: result }));
    };

    const finish = () => {
        if (findFaults(theme).length) setPrompting(true);
        else onUse();
    };

    const open = isReview ? review : steps[current];
    const all = [...steps, review];

    return (
        <>
            <div className="flex flex-col gap-10" ref={top}>
                {/* The step's own header: what this step is and what it asks. */}
                <header className="flex flex-col gap-3">
                    <p className="text-neutral-600 text-xs tabular-nums">{name}</p>
                    <h1 className="font-medium text-3xl text-neutral-950 tracking-[-0.02em]">
                        {open?.title}
                    </h1>
                    <p className="max-w-xl text-base text-neutral-600">{open?.ask}</p>
                    {/* The preview panel is hidden below the large breakpoint, so a narrow window says where it went. */}
                    <p className="text-neutral-600 text-xs lg:hidden">
                        The preview shows beside the steps in a wider window.
                    </p>
                </header>

                <Stepper aria-label="Theme steps" marker="line" value={current + 1}>
                    {all.map((step, i) => (
                        <StepperItem
                            invalid={i === REVIEW && isReview && hard.length > 0}
                            key={step.label}
                            label={step.label}
                            onSelect={i <= progress && i !== current ? () => go(i) : undefined}
                            status={i === current ? 'current' : i <= progress ? 'done' : 'upcoming'}
                            step={i + 1}
                        />
                    ))}
                </Stepper>
            </div>

            <div key={current}>
                {isReview ? (
                    <div className="flex flex-col gap-8">
                        <dl className="flex flex-col divide-y divide-neutral-200 rounded-item border border-neutral-200">
                            {steps.map((step, i) => (
                                <div
                                    className="flex items-center gap-4 py-1.5 pr-1.5 pl-3 text-xs"
                                    key={step.id}
                                >
                                    <dt className="w-24 shrink-0 text-neutral-600">{step.label}</dt>
                                    <dd className="min-w-0 flex-1 truncate text-neutral-950">
                                        {summaries[step.id]?.(theme)}
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
                                    <Button
                                        onClick={() => {
                                            setPrompting(true);
                                            balance();
                                        }}
                                        variant="secondary"
                                    >
                                        Balance light and dark
                                    </Button>
                                )}
                            </div>
                            {faults.length > 0 && <FaultList faults={faults} />}
                        </div>
                    </div>
                ) : (
                    steps[current]?.render(props)
                )}
            </div>

            {/* Back and the step's action in the bar at the foot of the panel, at its right: they never move. */}
            <PageFooter>
                <div className="mr-auto flex min-w-0 items-center gap-4 text-neutral-600 text-xs">
                    <span className="shrink-0 tabular-nums">
                        Step {current + 1} of {all.length}
                    </span>
                    {dirty && (
                        <span className="flex min-w-0 items-center gap-2">
                            <StatusDot tone="warning" />
                            <span className="truncate">Unsaved changes</span>
                        </span>
                    )}
                </div>
                {/* Once the theme is in use, what is left to do with it is take it to the project. */}
                {isReview && inUse && (
                    <Badge tone="primary">
                        <Check strokeWidth={2} />
                        In use
                    </Badge>
                )}
                <Button
                    aria-keyshortcuts="Meta+S Control+S"
                    disabled={!dirty}
                    onClick={onSave}
                    title={`Save (${saveKey})`}
                    variant="secondary"
                >
                    Save
                </Button>
                <Button
                    disabled={current === 0}
                    onClick={() => go(current - 1)}
                    variant="secondary"
                >
                    Back
                </Button>
                <Button onClick={isReview ? (inUse ? onExport : finish) : () => go(current + 1)}>
                    {isReview ? (
                        inUse ? (
                            'Export'
                        ) : (
                            'Use this theme'
                        )
                    ) : (
                        <>
                            Continue
                            <ArrowRight strokeWidth={2} />
                        </>
                    )}
                </Button>
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
