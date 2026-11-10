/*
 * Colour maths for the theme builder: sRGB hex to and from oklch, the sRGB and Display P3 gamuts,
 * and ramps built the way Tailwind's palette is built.
 *
 * Read off Tailwind's own values (tailwind-palette.ts), its palette follows four rules:
 * - The ends are fixed and the middle follows the hue. Every hue starts near the same white and ends
 *   near the same black, but its middle sits where the hue can be most vivid: yellow high, indigo low.
 * - Chroma is a share of what the gamut allows at each step, not one bell: about four fifths at the
 *   ends and nine tenths in the middle, so the most vivid step moves with the hue (400 for yellow, 600
 *   for blue). The palette is drawn in Display P3; most of its 500s lie outside sRGB.
 * - The hue drifts at the ends, warm hues most: lighter towards yellow, darker towards red, so a dark
 *   yellow turns brown rather than olive.
 * - Greys are a curve of their own, darker below 300, with a faint chroma that peaks in the middle.
 * The engine interpolates those per-step curves between the two Tailwind families nearest in hue.
 */

import { tailwindGreys, tailwindHues } from './tailwind-palette';

export type Oklch = { l: number; c: number; h: number };

/** The colours a ramp may use: Display P3, as Tailwind's palette, or sRGB, which every screen shows. */
export type Gamut = 'p3' | 'srgb';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** "#abc", "#aabbcc" or "aabbcc" to 0–1 channels; null when it is not a hex colour. */
export const parseHex = (hex: string): [number, number, number] | null => {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (!match?.[1]) return null;
    const digits = match[1].length === 3 ? [...match[1]].map(d => d + d).join('') : match[1];
    const value = Number.parseInt(digits, 16);
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

export const toHex = ([r, g, b]: [number, number, number]) =>
    `#${[r, g, b]
        .map(channel =>
            Math.round(clamp01(channel) * 255)
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;

const toLinear = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const fromLinear = (channel: number) =>
    channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

/** Linear sRGB to oklch (Björn Ottosson's OKLab); channels outside 0–1 are colours outside sRGB. */
export const linearSrgbToOklch = ([lr, lg, lb]: readonly [number, number, number]): Oklch => {
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const c = Math.hypot(a, bb);
    const h = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
    return { l: L, c, h };
};

/** sRGB channels to oklch. */
const rgbToOklch = ([r, g, b]: [number, number, number]): Oklch =>
    linearSrgbToOklch([toLinear(r), toLinear(g), toLinear(b)]);

/** Linear sRGB channels to gamma-encoded ones, as a screen is sent them. */
export const encodeSrgb = (channel: number) => fromLinear(channel);

/** oklch to linear sRGB, unclamped: a channel outside 0–1 means the colour is outside sRGB. */
export const oklchToLinearSrgb = ({ l: L, c, h }: Oklch): [number, number, number] => {
    const a = c * Math.cos((h * Math.PI) / 180);
    const bb = c * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
};

/** Linear sRGB to linear Display P3 (both D65). */
const linearSrgbToP3 = ([r, g, b]: [number, number, number]): [number, number, number] => [
    0.8224621209 * r + 0.1775378791 * g,
    0.0331941989 * r + 0.9668058011 * g,
    0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b,
];

const inside = (channels: [number, number, number]) =>
    channels.every(channel => channel >= -0.0001 && channel <= 1.0001);

/** Whether a colour lies inside a gamut. */
export const inGamut = (color: Oklch, gamut: Gamut) => {
    const linear = oklchToLinearSrgb(color);
    return inside(gamut === 'p3' ? linearSrgbToP3(linear) : linear);
};

/** The most chroma a lightness and hue can carry inside a gamut. */
export const maxChroma = (l: number, h: number, gamut: Gamut) => {
    if (l <= 0 || l >= 1) return 0;
    let low = 0;
    let high = 0.45;
    for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2;
        if (inGamut({ l, c: mid, h }, gamut)) low = mid;
        else high = mid;
    }
    return low;
};

/** The colour as sRGB hex; outside sRGB its chroma is reduced at the same lightness and hue until it fits. */
export const oklchToHex = (color: Oklch) =>
    toHex(
        oklchToLinearSrgb({
            ...color,
            c: Math.min(color.c, maxChroma(color.l, color.h, 'srgb')),
        }).map(fromLinear) as [number, number, number],
    );

export const hexToOklch = (hex: string): Oklch | null => {
    const rgb = parseHex(hex);
    return rgb ? rgbToOklch(rgb) : null;
};

const round = (value: number, digits: number) => Number(value.toFixed(digits));

/** The colour as CSS, `oklch(62.3% 0.214 259.8)`, as Tailwind writes its palette. */
export const formatOklch = ({ l, c, h }: Oklch) =>
    `oklch(${round(l * 100, 1)}% ${round(c, 3)} ${round(c < 0.0005 ? 0 : h, 1)})`;

/** A colour for a stylesheet: oklch inside P3, or hex when the ramp keeps to sRGB. */
export const toCss = (color: Oklch, gamut: Gamut) =>
    gamut === 'srgb' ? oklchToHex(color) : formatOklch(color);

/** The eleven steps of a ramp, 50 to 950. */
export type RampSteps = [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
];

/** The step names, by index. */
export const rampSteps = [
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    '950',
] as const;

export type RampStep = (typeof rampSteps)[number];

/** One channel of a ramp: lightness, chroma or hue. */
export type RampChannel = 'l' | 'c' | 'h';

/**
 * One step of a ramp set by hand, in absolute oklch: lightness 0–1, chroma, hue in degrees. A channel
 * left out follows the curve; a chroma left out keeps the step's share of the gamut, so a step made
 * lighter or turned stays as vivid as its neighbours.
 */
export type RampStepOverride = { l?: number; c?: number; h?: number };

/**
 * How a ramp is shaped, whole curves at a time; every value left out is Tailwind's. Each moves a
 * curve as a whole, never one step, so the ramp stays even. `steps` is the exception: single steps
 * set by hand, laid over the curves once they are built.
 */
export type RampShape = {
    /** Lightness of the 50, 0–1. */
    lightest?: number;
    /** Lightness of the 950, 0–1. */
    darkest?: number;
    /** Bends the steps between the ends and the seed: -1 darker midtones, 0 Tailwind's, 1 lighter. */
    midtones?: number;
    /** Chroma of every step but the seed, times this: 0 grey, 1 Tailwind's, up to the gamut. */
    saturation?: number;
    /** How much the ends fade against the middle: 0 not at all, 1 Tailwind's, 2 twice as much. */
    taper?: number;
    /** Tailwind's hue drift along the ramp, times this: 0 one hue throughout, 1 Tailwind's. */
    drift?: number;
    /** Degrees the hue turns at the 50, growing from the seed. */
    lightHue?: number;
    /** Degrees the hue turns at the 950, growing from the seed. */
    darkHue?: number;
    /**
     * Steps set by hand, absolute, over the curves: the curves' controls move every other step and
     * leave these where they were put. A primary's seed is the accent itself and ignores its entry.
     */
    steps?: Partial<Record<RampStep, RampStepOverride>>;
};

/** The shape controls that move a whole curve: every key but `steps`. */
export type RampCurveKey = Exclude<keyof RampShape, 'steps'>;

/** What every shape control is when left alone. */
export const neutralShape: Required<Omit<RampShape, 'lightest' | 'darkest' | 'steps'>> = {
    midtones: 0,
    saturation: 1,
    taper: 1,
    drift: 1,
    lightHue: 0,
    darkHue: 0,
};

/** The signed difference between two hues, -180 to 180. */
const hueDelta = (a: number, b: number) => ((a - b + 540) % 360) - 180;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- Tailwind's curves, by hue ---------- */

type Profile = {
    /** The family's hue at 500, what it is placed by. */
    hue: number;
    /** Lightness per step. */
    l: number[];
    /** Chroma per step as a share of what the gamut allows there. */
    share: Record<Gamut, number[]>;
    /** The hue per step, relative to the 500. */
    drift: number[];
};

const profiles: Profile[] = Object.values(tailwindHues)
    .map(ramp => {
        const hue = ramp[5]?.[2] ?? 0;
        const share = (gamut: Gamut) =>
            ramp.map(([l, c, h]) => Math.min(1, c / Math.max(1e-6, maxChroma(l, h, gamut))));
        return {
            hue,
            l: ramp.map(([l]) => l),
            share: { p3: share('p3'), srgb: share('srgb') },
            drift: ramp.map(([, , h]) => hueDelta(h, hue)),
        };
    })
    .sort((a, b) => a.hue - b.hue);

/**
 * Tailwind's curves for a hue: the two families on either side of it on the colour wheel, mixed by
 * how near each is. `without` leaves families out, for testing the engine against one it has not seen.
 */
export const paletteProfile = (hue: number, without: readonly number[] = []) => {
    const pool = profiles.filter(profile => !without.includes(profile.hue));
    const h = ((hue % 360) + 360) % 360;
    let after = pool.findIndex(profile => profile.hue >= h);
    if (after < 0) after = 0;
    const next = pool[after] as Profile;
    const previous = pool[(after - 1 + pool.length) % pool.length] as Profile;
    const span = (next.hue - previous.hue + 360) % 360 || 360;
    const t = ((h - previous.hue + 360) % 360) / span;
    const mix = (a: readonly number[], b: readonly number[]) =>
        a.map((x, i) => lerp(x, b[i] ?? x, t));
    return {
        l: mix(previous.l, next.l),
        share: {
            p3: mix(previous.share.p3, next.share.p3),
            srgb: mix(previous.share.srgb, next.share.srgb),
        },
        drift: mix(previous.drift, next.drift),
    };
};

/** The tinted greys' chroma per step, relative to their own peak: slate, gray, zinc, stone and the rest. */
const greyShape = (() => {
    const tinted = Object.values(tailwindGreys).filter(ramp => ramp.some(([, c]) => c > 0.001));
    const shapes = tinted.map(ramp => {
        const peak = Math.max(...ramp.map(([, c]) => c));
        return ramp.map(([, c]) => c / peak);
    });
    return rampSteps.map(
        (_, i) => shapes.reduce((sum, shape) => sum + (shape[i] ?? 0), 0) / shapes.length,
    );
})();

/* ---------- Ramps ---------- */

export type RampOptions = {
    /** Which step the seed is: 0 for 50 … 10 for 950; 5, the 500, unless given. */
    step?: number;
    gamut?: Gamut;
    shape?: RampShape;
};

const finite = (value: number | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** A step's place between an end (0) and the seed (1), bent: midtones above 0 lift it towards the light end. */
const bend = (t: number, midtones: number) => Math.min(1, Math.max(0, t)) ** (2 ** midtones);

/** How far the light or dark end's extra turn reaches a step: 0 at the seed, 1 at the end. */
const reach = (i: number, s: number) =>
    i < s ? (s - i) / Math.max(1, s) : i > s ? (i - s) / Math.max(1, 10 - s) : 0;

/** A step's chroma within what its lightness and hue allow in the gamut. */
const fit = (color: Oklch, gamut: Gamut): Oklch => ({
    ...color,
    c: Math.max(0, Math.min(color.c, maxChroma(color.l, color.h, gamut))),
});

const isSet = (value: number | undefined): value is number =>
    typeof value === 'number' && Number.isFinite(value);

/** True when a shape sets any step by hand. */
export const hasRampSteps = (shape?: RampShape) =>
    Boolean(
        shape?.steps &&
            Object.values(shape.steps).some(
                step => step && (isSet(step.l) || isSet(step.c) || isSet(step.h)),
            ),
    );

/**
 * The steps set by hand laid over a built ramp, each channel clamped: lightness 0–1, hue round the
 * wheel, chroma within the gamut. A chroma not set keeps the step's share of what the gamut allows,
 * so moving a step's lightness or hue never pushes it out of the gamut or greys it. `skip` is a step
 * the overrides never touch: a primary's seed.
 */
export const applyRampSteps = (
    ramp: readonly Oklch[],
    steps: RampShape['steps'],
    gamut: Gamut,
    skip?: number,
): Oklch[] =>
    ramp.map((color, i) => {
        const override = steps?.[rampSteps[i] as RampStep];
        if (i === skip || !override) return color;
        const l = isSet(override.l) ? Math.min(1, Math.max(0, override.l)) : color.l;
        const h = isSet(override.h) ? ((override.h % 360) + 360) % 360 : color.h;
        let c = color.c;
        if (isSet(override.c)) c = Math.max(0, override.c);
        else if (l !== color.l || h !== color.h) {
            const room = maxChroma(color.l, color.h, gamut);
            c = room > 1e-6 ? (color.c / room) * maxChroma(l, h, gamut) : color.c;
        }
        return fit({ l, c, h }, gamut);
    });

/**
 * A ramp of one hue around a seed, as Tailwind would draw it: the seed exactly at its step, the ends
 * fixed, the middle placed by the hue, the chroma a share of the gamut, the hue drifting as Tailwind's
 * does at the ends. Steps set by hand in the shape's `steps` replace the generated values; a chroma
 * left alone follows a lightness or hue set by hand, so the step keeps its share of the gamut.
 */
export const buildRamp = (seed: Oklch, { step = 5, gamut = 'p3', shape }: RampOptions = {}) =>
    buildRampFrom(seed, paletteProfile(seed.h), { step, gamut, shape });

/** The ramp from a given profile; `buildRamp` takes it from the seed's hue. */
export const buildRampFrom = (
    seed: Oklch,
    profile: ReturnType<typeof paletteProfile>,
    { step = 5, gamut = 'p3', shape = {} }: RampOptions = {},
): Oklch[] => {
    const s = Math.min(10, Math.max(0, Math.round(step)));
    const share = profile.share[gamut];
    const peakShare = Math.max(...share);
    const taper = finite(shape.taper, neutralShape.taper);
    // The ends fade from the middle's share by Tailwind's own amount, times the taper.
    const shareAt = (i: number) => peakShare - (peakShare - (share[i] ?? peakShare)) * taper;
    const top = finite(shape.lightest, profile.l[0] ?? 0.977);
    const bottom = finite(shape.darkest, profile.l[10] ?? 0.278);
    const midtones = finite(shape.midtones, neutralShape.midtones);
    const saturation = finite(shape.saturation, neutralShape.saturation);
    const drift = finite(shape.drift, neutralShape.drift);
    const lightHue = finite(shape.lightHue, neutralShape.lightHue);
    const darkHue = finite(shape.darkHue, neutralShape.darkHue);
    const profileTop = profile.l[0] ?? 0.977;
    const profileBottom = profile.l[10] ?? 0.278;
    const at = profile.l[s] ?? seed.l;
    // A seed beyond an end leaves no room for the steps on that side; it moves the end instead.
    const first = Math.max(top, seed.l + 0.01);
    const last = Math.min(bottom, seed.l - 0.01);
    const seedColor = fit(seed, gamut);
    // How much of its gamut the seed uses, against how much Tailwind's would at that step.
    const strength =
        seedColor.c / Math.max(1e-6, maxChroma(seed.l, seed.h, gamut)) / Math.max(1e-6, shareAt(s));

    const curves = rampSteps.map((_, i) => {
        if (i === s) return seedColor;
        const base = profile.l[i] ?? at;
        // Tailwind's own spacing on each side of the seed, stretched from the end to the seed and bent.
        const l =
            i < s
                ? first -
                  (first - seed.l) *
                      bend((profileTop - base) / Math.max(1e-6, profileTop - at), midtones)
                : seed.l -
                  (seed.l - last) *
                      (1 - bend(1 - (at - base) / Math.max(1e-6, at - profileBottom), -midtones));
        const h =
            (seed.h +
                ((profile.drift[i] ?? 0) - (profile.drift[s] ?? 0)) * drift +
                (i < s ? lightHue : darkHue) * reach(i, s) +
                360) %
            360;
        const c = strength * saturation * shareAt(i) * maxChroma(l, h, gamut);
        return fit({ l, c, h }, gamut);
    });
    return shape.steps ? applyRampSteps(curves, shape.steps, gamut, s) : curves;
};

/**
 * A grey ramp: the given lightness at every step, stretched to the shape's ends and bent by its
 * midtones; one hue, turned at the ends by the shape; and a faint chroma that follows Tailwind's tinted
 * greys, `tint` at its peak, faded at the ends by the taper.
 */
export const buildGreyRamp = (
    hue: number,
    tint: number,
    lightness: readonly number[],
    { gamut = 'p3', shape = {} }: Omit<RampOptions, 'step'> = {},
): Oklch[] => {
    const baseTop = lightness[0] ?? 0.98;
    const baseBottom = lightness[10] ?? 0.15;
    const top = finite(shape.lightest, baseTop);
    const bottom = finite(shape.darkest, baseBottom);
    const midtones = finite(shape.midtones, neutralShape.midtones);
    const taper = finite(shape.taper, neutralShape.taper);
    const saturation = finite(shape.saturation, neutralShape.saturation);
    const lightHue = finite(shape.lightHue, neutralShape.lightHue);
    const darkHue = finite(shape.darkHue, neutralShape.darkHue);
    const curves = rampSteps.map((_, i) => {
        // Where the step sits between the lightest and the darkest, bent as the midtones ask.
        const t = (baseTop - (lightness[i] ?? 0.5)) / Math.max(1e-6, baseTop - baseBottom);
        const l = top - (top - bottom) * bend(t, midtones);
        const h = (hue + (i < 5 ? lightHue : darkHue) * reach(i, 5) + 360) % 360;
        const c = tint * saturation * (1 - (1 - (greyShape[i] ?? 0)) * taper);
        return fit({ l, c, h }, gamut);
    });
    return shape.steps ? applyRampSteps(curves, shape.steps, gamut) : curves;
};

/** A ramp as stylesheet values, 50 to 950. */
export const rampToCss = (ramp: readonly Oklch[], gamut: Gamut) =>
    ramp.map(color => toCss(color, gamut)) as RampSteps;

/** The lightness of every step of a ramp written as hex, for shaping greys on. */
export const rampLightness = (reference: readonly string[]) =>
    reference.map(hex => hexToOklch(hex)?.l ?? 0.5);
