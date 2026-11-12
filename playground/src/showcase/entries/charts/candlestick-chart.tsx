import { SegmentedControl, SegmentedControlItem } from 'continuum';
import { CandlestickChart, ChartFrame } from 'continuum/charts';
import { CandlestickChart as CandlesIcon } from 'lucide-react';
import { useState } from 'react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

type Candle = {
    time: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type Interval = '1h' | '4h' | '1d';

const HOUR = 3_600_000;
const intervals: Record<Interval, { ms: number; swing: number; perDay: number }> = {
    '1h': { ms: HOUR, swing: 0.0007, perDay: 24 },
    '4h': { ms: 4 * HOUR, swing: 0.0016, perDay: 6 },
    '1d': { ms: 24 * HOUR, swing: 0.0042, perDay: 1 },
};

/** A small seeded generator, so the same candles are drawn on every render and every visit. */
const seeded = (seed: number) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

/** The latest close every series ends on, so the card's figure is the same at any interval. */
const LAST = 1.0866;
/** The latest candle opened at 12:00 UTC on 12 November 2026. */
const END = Date.UTC(2026, 10, 12, 12);

/**
 * EUR/USD as candles: a steady climb, a sharp sell-off about three fifths of the way in, and
 * a recovery after it, with the volume heaviest in the sell-off. Weekends are left out, as
 * the market is shut.
 */
const pricesOf = (interval: Interval, count: number): Candle[] => {
    const { ms, swing } = intervals[interval];
    const random = seeded(count * 7 + ms / HOUR);
    const normal = () => (random() + random() + random() - 1.5) * 1.4;

    // The times, walked back from the latest and skipping Saturday and Sunday.
    const times: number[] = [];
    for (let t = END; times.length < count; t -= ms) {
        const day = new Date(t).getUTCDay();
        if (day !== 0 && day !== 6) times.unshift(t);
    }

    const candles: Candle[] = [];
    let close = 1;
    times.forEach((time, i) => {
        const at = i / count;
        const phase = at < 0.58 ? 'climb' : at < 0.7 ? 'selloff' : 'recovery';
        const drift =
            phase === 'climb' ? swing * 0.22 : phase === 'selloff' ? -swing * 1.1 : swing * 0.38;
        const shake = swing * (phase === 'selloff' ? 1.7 : 1);
        const open = close + normal() * swing * 0.08;
        close = open + drift + normal() * shake;
        const high = Math.max(open, close) + Math.abs(normal()) * shake * 0.55;
        const low = Math.min(open, close) - Math.abs(normal()) * shake * 0.55;
        const busy = phase === 'selloff' ? 2.2 : 1;
        const volume = Math.round(
            (1 + random() * 0.8) * busy * (1 + Math.abs(close - open) / swing) * 1800,
        );
        candles.push({ time: new Date(time), open, high, low, close, volume });
    });

    // Moved as a whole so the latest close lands on the figure the card leads with.
    const shift = LAST - close;
    return candles.map(candle => ({
        ...candle,
        open: candle.open + shift,
        high: candle.high + shift,
        low: candle.low + shift,
        close: candle.close + shift,
    }));
};

/** The change over the last day, against the close a day before. */
const dayChange = (candles: readonly Candle[], interval: Interval) => {
    const last = candles.at(-1);
    const before = candles.at(-1 - intervals[interval].perDay);
    if (!last || !before) return '';
    const share = ((last.close - before.close) / before.close) * 100;
    return `${share >= 0 ? '+' : '−'}${Math.abs(share).toFixed(2)}%`;
};

const four = (value: number) => value.toFixed(4);

/** The stretches the bar under the plot offers, in trading days; weekends are shut. */
const spansFor = (interval: Interval) => {
    const { perDay } = intervals[interval];
    return [
        { label: '1W', periods: 5 * perDay },
        { label: '1M', periods: 22 * perDay },
        { label: '3M', periods: 65 * perDay },
        { label: 'All', periods: null },
    ];
};

const candleKnobs: Knob[] = [
    {
        id: 'type',
        label: 'Drawn as',
        options: [o('line', 'Line'), o('candles', 'Candles')],
        default: 'line',
    },
    {
        id: 'count',
        label: 'Periods',
        options: [o('40', '40'), o('160', '160'), o('400', '400')],
        default: '400',
    },
    { id: 'average', label: 'Moving average', switch: true, default: true },
    { id: 'volume', label: 'Volume', switch: true, default: true },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('empty', 'No data')],
        default: 'ready',
    },
];

/**
 * The pair in its card: the latest price leads, and how it is drawn is the card's one control.
 * Moving through time belongs to the chart, on the bar under its plot.
 */
const PairCard = ({
    data,
    interval,
    type: asked = 'line',
    average = true,
    volume = true,
    height = 360,
    opensOn,
    className,
}: {
    data: readonly Candle[];
    interval: Interval;
    type?: 'line' | 'candles';
    average?: boolean;
    volume?: boolean;
    height?: number;
    /** The latest periods in view at first; all of them unless given. */
    opensOn?: number;
    className?: string;
}) => {
    const last = data.at(-1);
    const [type, setType] = useState(asked);
    return (
        <ChartFrame
            actions={
                data.length > 0 ? (
                    <SegmentedControl
                        aria-label="Drawn as"
                        onValueChange={value => setType(value as 'line' | 'candles')}
                        value={type}
                    >
                        <SegmentedControlItem value="line">Line</SegmentedControlItem>
                        <SegmentedControlItem value="candles">Candles</SegmentedControlItem>
                    </SegmentedControl>
                ) : undefined
            }
            className={className}
            comparison="today"
            delta={last ? dayChange(data, interval) : undefined}
            icon={<CandlesIcon />}
            table={{
                columns: ['Opened (UTC)', 'Open', 'High', 'Low', 'Close', 'Volume'],
                rows: data.map(candle => [
                    candle.time.toISOString().slice(0, 16).replace('T', ' '),
                    four(candle.open),
                    four(candle.high),
                    four(candle.low),
                    four(candle.close),
                    candle.volume,
                ]),
            }}
            title={`EUR/USD, ${interval === '1h' ? '1 hour' : interval === '4h' ? '4 hours' : '1 day'}`}
            value={last ? four(last.close) : '—'}
        >
            <CandlestickChart
                aria-label="EUR/USD prices, with the volume traded"
                average={average ? 20 : undefined}
                data={data}
                defaultRange={
                    opensOn && opensOn < data.length
                        ? { start: data.length - opensOn, end: data.length }
                        : null
                }
                digits={4}
                height={height}
                spans={spansFor(interval)}
                type={type}
                volume={volume}
            />
        </ChartFrame>
    );
};

const CandlestickPreview = ({ knobs }: PreviewProps) => (
    <PairCard
        average={Boolean(knobs.average)}
        className="w-full max-w-3xl"
        data={knobs.state === 'empty' ? [] : pricesOf('4h', Number(knobs.count))}
        interval="4h"
        key={`${knobs.count}-${knobs.state}-${knobs.type}`}
        type={knobs.type as 'line' | 'candles'}
        volume={Boolean(knobs.volume)}
    />
);

export const entry: Entry = {
    id: 'candlestick-chart',
    name: 'Candlestick chart',
    category: 'charts',
    description:
        'A price over time as a line or as candles, with its volume; dragged, zoomed and read as on a trading screen.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs: candleKnobs,
    Preview: CandlestickPreview,
};

const quarter = pricesOf('4h', 400);

const TreasuryPage = () => (
    <AppWindow
        description="The euro against the dollar, for the hedges booked this quarter."
        place="reports"
        title="Treasury"
        trail={['Reports', 'Treasury']}
    >
        <PairCard data={quarter} height={300} interval="4h" opensOn={22 * 6} type="candles" />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Treasury',
    note: 'A quarter of EUR/USD on a treasury report, opened on its last month as candles.',
    app: true,
    render: () => <TreasuryPage />,
};
