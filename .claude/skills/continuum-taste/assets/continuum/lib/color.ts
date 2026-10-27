/*
 * Colour maths for the theme builder: sRGB hex to and from oklch, and ramps
 * built the way Tailwind's palette is, so every step keeps one hue and lands
 * inside the sRGB gamut.
 */

export type Oklch = { l: number; c: number; h: number };

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

/** sRGB channels to oklch (Björn Ottosson's OKLab). */
const rgbToOklch = ([r, g, b]: [number, number, number]): Oklch => {
    const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
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

/** oklch to sRGB channels, unclamped: a channel outside 0–1 means the colour is out of gamut. */
const oklchToRgbRaw = ({ l: L, c, h }: Oklch): [number, number, number] => {
    const a = c * Math.cos((h * Math.PI) / 180);
    const bb = c * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
    return [
        fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ];
};

const inGamut = (rgb: [number, number, number]) =>
    rgb.every(channel => channel >= -0.0005 && channel <= 1.0005);

/** The colour at this lightness and hue, with its chroma reduced until sRGB can show it. */
export const oklchToHex = (color: Oklch) => {
    let rgb = oklchToRgbRaw(color);
    if (inGamut(rgb)) return toHex(rgb);
    let low = 0;
    let high = color.c;
    for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        rgb = oklchToRgbRaw({ ...color, c: mid });
        if (inGamut(rgb)) low = mid;
        else high = mid;
    }
    return toHex(oklchToRgbRaw({ ...color, c: low }));
};

export const hexToOklch = (hex: string): Oklch | null => {
    const rgb = parseHex(hex);
    return rgb ? rgbToOklch(rgb) : null;
};

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

/*
 * Tailwind's palette, as a shape. Its hues share one lightness curve, within a
 * few percent: near-white at 50, the steepest drop between 300 and 400, and
 * near-black at 950. Chroma is a bell that peaks at 600 and fades to almost
 * nothing at both ends, and the hue barely moves. The curves below are the
 * mean of its red, green, blue and indigo.
 */

/** Lightness at 50 … 950. */
export const scaleLightness = [
    0.97, 0.94, 0.89, 0.82, 0.72, 0.64, 0.565, 0.495, 0.43, 0.38, 0.265,
] as const;

/** Chroma at 50 … 950, relative to the peak. */
export const scaleChroma = [0.06, 0.14, 0.27, 0.48, 0.75, 0.93, 1, 0.9, 0.72, 0.55, 0.35] as const;

/** A grey's faint chroma follows a softer bell, peaking at 500, as Tailwind's stone and zinc do. */
export const greyChroma = [0.1, 0.15, 0.3, 0.45, 0.75, 1, 0.9, 0.8, 0.6, 0.5, 0.35] as const;

/** The lightness of every step of a reference ramp, for shaping greys on. */
export const rampLightness = (reference: RampSteps) =>
    reference.map(hex => hexToOklch(hex)?.l ?? 0.5);

/** The step a seed becomes: 500, the colour a palette is named after. */
const SEED_STEP = 5;

/**
 * A ramp of one hue on Tailwind's curve, with the seed as its 500, exactly.
 * Each side keeps the curve's shape, stretched between the fixed end (50 near
 * white, 950 near black) and the seed, so the steps stay in order whatever the
 * seed's lightness. Chroma follows the bell, scaled so the seed's own chroma
 * sits at 500.
 */
export const rampFromSeed = (seed: Oklch): RampSteps => {
    const top = scaleLightness[0];
    const mid = scaleLightness[SEED_STEP];
    const bottom = scaleLightness[scaleLightness.length - 1] ?? 0.265;
    // A seed next to white or black leaves no room for a ramp; it is pulled in just enough.
    const l = Math.min(top - 0.04, Math.max(bottom + 0.04, seed.l));
    const anchor = scaleChroma[SEED_STEP];

    return scaleLightness.map((base, i) => {
        if (i === SEED_STEP) return oklchToHex({ ...seed, l });
        const lightness =
            i < SEED_STEP
                ? top - (top - l) * ((top - base) / (top - mid))
                : l - (l - bottom) * ((mid - base) / (mid - bottom));
        return oklchToHex({
            l: lightness,
            c: (seed.c * (scaleChroma[i] ?? 0)) / anchor,
            h: seed.h,
        });
    }) as RampSteps;
};

/** A grey ramp: the given lightness at every step, one hue, and a faint chroma peaking in the middle. */
export const neutralRamp = (hue: number, tint: number, lightness: readonly number[]): RampSteps =>
    lightness.map((l, i) => oklchToHex({ l, c: tint * (greyChroma[i] ?? 0), h: hue })) as RampSteps;
