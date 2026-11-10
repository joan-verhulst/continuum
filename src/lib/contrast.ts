import { encodeSrgb, linearSrgbToOklch, type Oklch, oklchToLinearSrgb } from './color';

/*
 * How a theme's colours read: WCAG 2's contrast ratio, APCA's lightness contrast, how a colour looks
 * to someone with a colour-vision deficiency, and how far apart two colours look. Colours are oklch
 * throughout, so a P3 colour's luminance is measured as it is shown on a P3 screen; APCA and the
 * simulations work on sRGB channels, so they take a colour outside sRGB clipped to it, as an sRGB
 * screen shows it.
 */

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const linear = (color: Oklch) => oklchToLinearSrgb(color);

const clipped = (color: Oklch) => linear(color).map(clamp01) as [number, number, number];

/** WCAG 2's relative luminance, 0 (black) to 1 (white). */
export const luminance = (color: Oklch) => {
    const [r, g, b] = linear(color);
    return clamp01(0.2126 * r + 0.7152 * g + 0.0722 * b);
};

/** WCAG 2's contrast ratio, 1 to 21: 4.5 for text, 3 for large text and the parts of controls. */
export const wcagContrast = (a: Oklch, b: Oklch) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (high + 0.05) / (low + 0.05);
};

/*
 * APCA, the lightness contrast proposed for WCAG 3: APCA-W3 0.0.98G-4g, after Myndex's apca-w3 and
 * Color.js. It tells text from background (dark on light reads differently from light on dark) and
 * gives Lc, about 0 to 106 for dark text on light and 0 to -108 for light on dark.
 */
const apcaY = (color: Oklch) => {
    const [r, g, b] = clipped(color).map(channel => encodeSrgb(channel) ** 2.4) as [
        number,
        number,
        number,
    ];
    const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    // Near black, the screen's flare lifts what the eye sees. 1.414 is APCA's clamp exponent, not √2.
    // biome-ignore lint/suspicious/noApproximativeNumericConstant: APCA's own constant, kept to its spec.
    return y >= 0.022 ? y : y + (0.022 - y) ** 1.414;
};

/** APCA's Lc for text on a background; negative when the text is the lighter. Compare its size. */
export const apcaContrast = (text: Oklch, background: Oklch) => {
    const t = apcaY(text);
    const b = apcaY(background);
    if (Math.abs(b - t) < 0.0005) return 0;
    const c = b > t ? (b ** 0.56 - t ** 0.57) * 1.14 : (b ** 0.65 - t ** 0.62) * 1.14;
    if (Math.abs(c) < 0.1) return 0;
    return (c > 0 ? c - 0.027 : c + 0.027) * 100;
};

/* ---------- Colour vision ---------- */

/** How a colour is seen: with full colour vision, or with no red, green or blue cones. */
export type Vision = 'normal' | 'protan' | 'deutan' | 'tritan';

/** Machado, Oliveira and Fernandes (2009) at full severity, on linear sRGB. */
const machado: Record<Exclude<Vision, 'normal'>, readonly (readonly number[])[]> = {
    protan: [
        [0.152286, 1.052583, -0.204868],
        [0.114503, 0.786281, 0.099216],
        [-0.003882, -0.048116, 1.051998],
    ],
    deutan: [
        [0.367322, 0.860646, -0.227968],
        [0.280085, 0.672501, 0.047413],
        [-0.01182, 0.04294, 0.968881],
    ],
    tritan: [
        [1.255528, -0.076749, -0.178779],
        [-0.078411, 0.930809, 0.147602],
        [0.004733, 0.691367, 0.3039],
    ],
};

/** A colour as someone with the given colour vision sees it. */
export const simulateVision = (color: Oklch, vision: Vision): Oklch => {
    if (vision === 'normal') return color;
    const [r, g, b] = clipped(color);
    const m = machado[vision];
    const row = (i: number) =>
        clamp01((m[i]?.[0] ?? 0) * r + (m[i]?.[1] ?? 0) * g + (m[i]?.[2] ?? 0) * b);
    return linearSrgbToOklch([row(0), row(1), row(2)]);
};

const lab = ({ l, c, h }: Oklch) => {
    const angle = (h * Math.PI) / 180;
    return [l, c * Math.cos(angle), c * Math.sin(angle)] as const;
};

/** How far apart two colours look: the OKLab distance times 100, as seen with the given vision. */
export const deltaE = (a: Oklch, b: Oklch, vision: Vision = 'normal') => {
    const [l1, a1, b1] = lab(simulateVision(a, vision));
    const [l2, a2, b2] = lab(simulateVision(b, vision));
    return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};

/* ---------- Data colours ---------- */

/**
 * What a set of series colours must clear to tell series apart, in every reader's eyes: a lightness
 * band per mode, so none sinks into the surface or glares off it; a chroma floor, below which a
 * hue reads as grey; a distance between neighbours under protan and deutan vision (8 wanted, 6
 * only with labels or texture beside it) and with full colour vision (15); 3:1 against the surface.
 */
export const seriesThresholds = {
    band: { light: [0.43, 0.77], dark: [0.48, 0.67] },
    chroma: 0.1,
    cvd: { target: 8, floor: 6 },
    normal: 15,
    contrast: 3,
} as const;

export type SeriesCheckId = 'band' | 'chroma' | 'cvd' | 'normal' | 'contrast';

export type SeriesCheck = {
    id: SeriesCheckId;
    /** `warn` holds only with labels, a table or texture beside the colours. */
    state: 'pass' | 'warn' | 'fail';
    /** The measure: the worst value found. */
    value: number;
    /** The series it is about, by position: the pair for a distance, the ones that miss otherwise. */
    series: number[];
    /** For a distance, the vision it was worst under. */
    vision?: Vision;
};

/**
 * The measurable checks on a set of series colours against the chart's surface: neighbours only
 * (stacks, bars, lines), or every pair (scatter, maps, small multiples).
 */
export const checkSeries = (
    colors: readonly Oklch[],
    {
        mode,
        surface,
        pairs = 'adjacent',
    }: { mode: 'light' | 'dark'; surface: Oklch; pairs?: 'adjacent' | 'all' },
): SeriesCheck[] => {
    const [low, high] = seriesThresholds.band[mode];
    const index = colors.map((_, i) => i);
    const list =
        pairs === 'all'
            ? index.flatMap(i => index.filter(j => j > i).map(j => [i, j] as const))
            : index.slice(1).map(i => [i - 1, i] as const);

    const off = index.filter(i => {
        const l = colors[i]?.l ?? 0;
        return l < low || l > high;
    });
    const bandValue = Math.max(
        0,
        ...colors.map(color => Math.max(low - color.l, color.l - high, 0)),
    );

    const grey = index.filter(i => (colors[i]?.c ?? 0) < seriesThresholds.chroma);

    const worstPair = (visions: Vision[]) => {
        let worst = {
            value: Number.POSITIVE_INFINITY,
            pair: [] as number[],
            vision: 'normal' as Vision,
        };
        for (const vision of visions) {
            for (const [i, j] of list) {
                const a = colors[i];
                const b = colors[j];
                if (!a || !b) continue;
                const value = deltaE(a, b, vision);
                if (value < worst.value) worst = { value, pair: [i, j], vision };
            }
        }
        return worst;
    };
    const cvd = worstPair(['protan', 'deutan']);
    const normal = worstPair(['normal']);

    const ratios = colors.map(color => wcagContrast(color, surface));
    const faint = index.filter(i => (ratios[i] ?? 0) < seriesThresholds.contrast);

    const hasPairs = list.length > 0;
    return [
        { id: 'band', state: off.length ? 'fail' : 'pass', value: bandValue, series: off },
        {
            id: 'chroma',
            state: grey.length ? 'fail' : 'pass',
            value: Math.min(...colors.map(color => color.c)),
            series: grey,
        },
        {
            id: 'cvd',
            state:
                !hasPairs || cvd.value >= seriesThresholds.cvd.target
                    ? 'pass'
                    : cvd.value >= seriesThresholds.cvd.floor
                      ? 'warn'
                      : 'fail',
            value: hasPairs ? cvd.value : 0,
            series: cvd.pair,
            vision: cvd.vision,
        },
        {
            id: 'normal',
            state: !hasPairs || normal.value >= seriesThresholds.normal ? 'pass' : 'fail',
            value: hasPairs ? normal.value : 0,
            series: normal.pair,
            vision: 'normal',
        },
        {
            id: 'contrast',
            state: faint.length ? 'warn' : 'pass',
            value: Math.min(...ratios),
            series: faint,
        },
    ];
};
