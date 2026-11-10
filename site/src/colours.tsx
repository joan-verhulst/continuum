import {
    Badge,
    Button,
    Checkbox,
    createThemeCss,
    createThemeVariables,
    Field,
    FieldLabel,
    SegmentedControl,
    SegmentedControlItem,
    Switch,
    Theme,
    type ThemeOptions,
    themeAccentCurves,
    toCss,
    wcagContrast,
} from 'continuum';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';

/*
 * The accent, chosen on the site's own terms: dark mode, the lit action, the web register. Each
 * candidate is a band in its own theme scope, so they compare as the site would look in each.
 */

type Candidate = { id: string; name: string; hex: string; note: string };

const candidates: Candidate[] = [
    {
        id: 'ember',
        name: 'Ember',
        hex: '#ff5c1a',
        note: 'A red-leaning orange: hot, loud, unmistakable.',
    },
    {
        id: 'tangerine',
        name: 'Tangerine',
        hex: '#ff7a1a',
        note: 'The middle orange: warm without alarm.',
    },
    {
        id: 'amber',
        name: 'Amber',
        hex: '#ffa31a',
        note: 'Orange towards gold: bright, friendly, near the warning hue.',
    },
    {
        id: 'burnt',
        name: 'Burnt',
        hex: '#e8560f',
        note: 'A deeper orange: more crafted, less signal.',
    },
    {
        id: 'emerald',
        name: 'Emerald',
        hex: '#10b981',
        note: 'A clean green: calm, technical, close to Supabase.',
    },
    {
        id: 'jade',
        name: 'Jade',
        hex: '#00b386',
        note: 'Green towards teal: quieter, cooler, more grown-up.',
    },
    { id: 'mint', name: 'Mint', hex: '#3ddc97', note: 'A light green: fresh, glows on black.' },
    { id: 'lime', name: 'Lime', hex: '#a3e635', note: 'Yellow-green: energetic, devtool-ish.' },
    {
        id: 'acid',
        name: 'Acid',
        hex: '#c6f432',
        note: 'Almost yellow: the loudest, very of-the-moment.',
    },
];

const themeOf = (hex: string): ThemeOptions => ({
    accent: hex,
    action: 'accent',
    actionStyle: 'lit',
    tint: 'accent',
    neutral: { hue: 0, tint: 0 },
});

/** What a candidate measures as the site's action: the label it takes and how both read. */
const facts = (hex: string) => {
    const options = themeOf(hex);
    const ramp = themeAccentCurves(options) ?? [];
    const fill = ramp[5];
    const darkLabel = createThemeVariables(options).light['--color-on-action']?.includes('950');
    const label = darkLabel ? ramp[10] : ramp[0];
    const surface = { l: 0.17, c: 0, h: 0 };
    return {
        ramp,
        darkLabel,
        labelContrast: fill && label ? wcagContrast(label, fill) : 0,
        fillContrast: fill ? wcagContrast(fill, surface) : 0,
    };
};

const bars = [
    [34, 22, 14, 8],
    [38, 24, 16, 9],
    [41, 27, 15, 11],
    [44, 28, 19, 12],
    [47, 31, 20, 12],
    [52, 33, 22, 14],
];

/** A small stacked chart in the theme's own series colours. */
const MiniChart = () => {
    const max = Math.max(...bars.map(row => row.reduce((a, b) => a + b, 0)));
    return (
        <svg
            aria-hidden="true"
            className="h-20 w-full"
            preserveAspectRatio="none"
            viewBox="0 0 240 80"
        >
            {bars.map((row, i) => {
                let y = 80;
                return (
                    <g key={`month-${i * 1}`}>
                        {row.map((value, s) => {
                            const h = (value / max) * 76;
                            y -= h;
                            return (
                                <rect
                                    fill={`var(--color-chart-series-${s + 1})`}
                                    height={Math.max(0, h - 2)}
                                    key={`series-${s * 1}`}
                                    rx={s === row.length - 1 ? 3 : 0}
                                    width={26}
                                    x={8 + i * 39}
                                    y={y + 2}
                                />
                            );
                        })}
                    </g>
                );
            })}
        </svg>
    );
};

const Band = ({ candidate }: { candidate: Candidate }) => {
    const [view, setView] = useState('screens');
    const measured = useMemo(() => facts(candidate.hex), [candidate.hex]);

    return (
        <Theme
            className="flex flex-col gap-10 border-neutral-200 border-t px-6 py-16 text-neutral-950 sm:px-12"
            mode="dark"
            theme={`site-${candidate.id}`}
        >
            <div className="flex flex-col gap-2">
                <p className="font-mono text-neutral-500 text-xs">
                    {candidate.hex} · label {measured.darkLabel ? 'dark' : 'light'}{' '}
                    {measured.labelContrast.toFixed(1)}:1 · fill on surface{' '}
                    {measured.fillContrast.toFixed(1)}:1
                </p>
                <h2 className="font-medium text-2xl tracking-[-0.01em]">{candidate.name}</h2>
                <p className="text-neutral-600 text-sm">{candidate.note}</p>
            </div>

            <div className="flex max-w-170 flex-col items-start gap-6">
                <Badge tone="primary">For Claude Code</Badge>
                <h3 className="font-medium text-5xl leading-[1.05] tracking-[-0.02em]">
                    Make your agent's UI look designed, not generated.
                </h3>
                <p className="max-w-xl text-lg text-neutral-600 leading-[1.6]">
                    Continuum gives Claude a designer's decisions in units. You give it the content;
                    it decides the layout, in your accent.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <Button size="lg">
                        Theme your product
                        <ArrowRight strokeWidth={2} />
                    </Button>
                    <Button size="lg" variant="secondary">
                        Read the test
                    </Button>
                    <code className="rounded-control border border-neutral-200 px-3 py-2 font-mono text-neutral-700 text-xs">
                        claude mcp add continuum
                    </code>
                </div>
            </div>

            <div className="flex max-w-170 flex-col gap-5 rounded-card border border-neutral-200 bg-neutral-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <SegmentedControl aria-label="View" onValueChange={setView} value={view}>
                        <SegmentedControlItem value="screens">Screens</SegmentedControlItem>
                        <SegmentedControlItem value="builder">Builder</SegmentedControlItem>
                        <SegmentedControlItem value="test">Test</SegmentedControlItem>
                    </SegmentedControl>
                    <div className="flex items-center gap-4">
                        <Field className="flex-row items-center gap-2">
                            <Switch defaultChecked />
                            <FieldLabel>Live</FieldLabel>
                        </Field>
                        <Field className="flex-row items-center gap-2">
                            <Checkbox defaultChecked />
                            <FieldLabel>Dark</FieldLabel>
                        </Field>
                        <Badge tone="primary">New</Badge>
                    </div>
                </div>
                <MiniChart />
                <div className="grid grid-cols-11 gap-1">
                    {measured.ramp.map((color, i) => (
                        <span
                            className="h-6 rounded-[calc(var(--radius-chip)-2px)]"
                            key={`step-${i * 1}`}
                            style={{ background: toCss(color, 'p3') }}
                        />
                    ))}
                </div>
            </div>
        </Theme>
    );
};

export const Colours = () => {
    const css = useMemo(
        () =>
            candidates
                .map(candidate =>
                    createThemeCss({ ...themeOf(candidate.hex), name: `site-${candidate.id}` }),
                )
                .join('\n'),
        [],
    );

    return (
        <Theme className="min-h-dvh bg-neutral-50 text-neutral-950" mode="dark">
            <style>{css}</style>
            <header className="flex flex-col gap-3 px-6 pt-20 pb-12 sm:px-12">
                <p className="font-mono text-neutral-500 text-xs">continuum / site / accent</p>
                <h1 className="font-medium text-4xl tracking-[-0.02em]">Pick the site's accent.</h1>
                <p className="max-w-xl text-base text-neutral-600">
                    Nine candidates, each in dark mode with the lit action, as the site would wear
                    them. The label on the button is picked by contrast: a dark label on the bright
                    ones.
                </p>
            </header>
            {candidates.map(candidate => (
                <Band candidate={candidate} key={candidate.id} />
            ))}
        </Theme>
    );
};
