'use client';

import {
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent,
    type RefObject,
    startTransition,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { type Gamut, hexToOklch, type Oklch, oklchToHex } from '../lib/color';
import { wcagContrast } from '../lib/contrast';
import { BlockSlider } from './block-slider';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { StatusDot } from './status-dot';

/*
 * A colour typed or pasted by hand, in the notation the person has it in: hex, rgb, hsl or oklch.
 * The theme keeps the colour as hex, so whatever is typed is read, brought inside sRGB and written
 * as hex; the field then shows that hex back in the notation picked, once the field is let go. A
 * value still being typed is left alone until it reads as a whole colour, and the text stays as
 * typed while it is being typed.
 */

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

const formats: { value: ColorFormat; label: string }[] = [
    { value: 'hex', label: 'Hex' },
    { value: 'rgb', label: 'RGB' },
    { value: 'hsl', label: 'HSL' },
    { value: 'oklch', label: 'OKLCH' },
];

type Rgb = [number, number, number];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toRgb = (hex: string): Rgb => {
    const n = Number.parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = ([r, g, b]: Rgb) =>
    `#${[r, g, b]
        .map(v =>
            Math.round(clamp(v, 0, 255))
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;

/** Whether two hexes are the same colour to within a step of rounding on each channel. */
const sameHex = (a: string, b: string) => {
    const x = toRgb(a);
    const y = toRgb(b);
    return x.every((v, i) => Math.abs(v - (y[i] ?? 0)) <= 1.5);
};

const rgbToHsl = ([r, g, b]: Rgb): Rgb => {
    const [rn, gn, bn] = [r / 255, g / 255, b / 255];
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return [0, 0, l * 100];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
    return [(h * 60 + 360) % 360, s * 100, l * 100];
};

const hslToRgb = ([h, s, l]: Rgb): Rgb => {
    const sn = clamp(s, 0, 100) / 100;
    const ln = clamp(l, 0, 100) / 100;
    const k = (n: number) => (n + (((h % 360) + 360) % 360) / 30) % 12;
    const a = sn * Math.min(ln, 1 - ln);
    const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
};

/** A hex in a notation, as CSS writes it. */
const formatColor = (hex: string, format: ColorFormat) => {
    if (format === 'hex') return hex;
    const rgb = toRgb(hex);
    if (format === 'rgb') return `rgb(${rgb.join(' ')})`;
    if (format === 'hsl') {
        const [h, s, l] = rgbToHsl(rgb);
        return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
    }
    const color = hexToOklch(hex) ?? { l: 0.5, c: 0, h: 0 };
    return `oklch(${(color.l * 100).toFixed(1)}% ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;
};

/** The numbers in a typed value, a percent sign kept as a flag: "70.5% 0.187 47.6" in any wrapping. */
const numbers = (text: string) =>
    [...text.matchAll(/(-?\d*\.?\d+)(%?)/g)].map(match => ({
        value: Number(match[1]),
        percent: match[2] === '%',
    }));

/** A typed value as hex, in the notation it is typed in; null until it reads as a whole colour. */
const parseColor = (text: string, format: ColorFormat): string | null => {
    const typed = text.trim().toLowerCase();
    // A hex is a hex wherever it is pasted.
    const hex = /^#?([0-9a-f]{6})$/.exec(typed);
    if (hex) return `#${hex[1]}`;
    const short = /^#?([0-9a-f]{3})$/.exec(typed);
    if (short && format === 'hex') return `#${[...(short[1] ?? '')].map(c => c + c).join('')}`;

    // A value that names its own notation is read as that, whatever the field is set to.
    const named = /^(rgb|hsl|oklch)a?\(/.exec(typed)?.[1] as ColorFormat | undefined;
    const kind = named ?? format;
    if (kind === 'hex') return null;
    // A notation opened and not closed is still being written: "rgb(120 30 2" is on its way to 200.
    if (typed.includes('(') && !typed.includes(')')) return null;
    // The body only, so the "3" of "p3" or a name's digits are never read as a channel.
    const body = typed.replace(/^[a-z]+\(/, '').replace(/\).*$/, '');
    const [a, b, c] = numbers(body);
    if (!a || !b || !c) return null;

    if (kind === 'rgb') {
        const channel = (n: { value: number; percent: boolean }) =>
            n.percent ? (n.value / 100) * 255 : n.value;
        const rgb: Rgb = [channel(a), channel(b), channel(c)];
        return rgb.every(v => v >= 0 && v <= 255) ? toHex(rgb) : null;
    }
    if (kind === 'hsl') {
        if (b.value > 100 || c.value > 100 || b.value < 0 || c.value < 0) return null;
        return toHex(hslToRgb([a.value, b.value, c.value]));
    }
    // oklch: lightness as a percentage or 0 to 1, chroma as a number or a share of 0.4.
    const l = a.percent || a.value > 1 ? a.value / 100 : a.value;
    const chroma = b.percent ? (b.value / 100) * 0.4 : b.value;
    if (l < 0 || l > 1 || chroma < 0 || chroma > 0.5) return null;
    return oklchToHex({ l, c: chroma, h: ((c.value % 360) + 360) % 360 });
};

// The notation last picked, shared by every field: the page's and the picker's start on the same one.
let lastFormat: ColorFormat = 'hex';

/** The notation last picked anywhere, for a field or a picker that opens. */
const sharedFormat = () => lastFormat;

/* ---------- The value by hand ---------- */

/** One number of a notation: what it is called, how far it runs, and how it is written out. */
type Channel = {
    label: string;
    min: number;
    max: number;
    /** What an arrow moves it by; Shift takes ten of them. */
    step: number;
    show: (value: number) => string;
};

const round = (value: number) => String(Math.round(value));

/**
 * The notations that are three numbers, each read off a hex and written back to one. The numbers
 * are read at full precision and only rounded for the box, so editing one leaves the others where
 * they were rather than nudging the colour by a step of rounding each time.
 */
const channelSets: Record<
    Exclude<ColorFormat, 'hex'>,
    { channels: Channel[]; read: (hex: string) => number[]; write: (values: number[]) => string }
> = {
    rgb: {
        channels: (['Red', 'Green', 'Blue'] as const).map(label => ({
            label,
            min: 0,
            max: 255,
            step: 1,
            show: round,
        })),
        read: hex => toRgb(hex),
        write: ([r = 0, g = 0, b = 0]) => toHex([r, g, b]),
    },
    hsl: {
        channels: [
            { label: 'Hue', min: 0, max: 360, step: 1, show: round },
            { label: 'Saturation', min: 0, max: 100, step: 1, show: round },
            { label: 'Lightness', min: 0, max: 100, step: 1, show: round },
        ],
        read: hex => rgbToHsl(toRgb(hex)),
        write: ([h = 0, s = 0, l = 0]) => toHex(hslToRgb([h, s, l])),
    },
    oklch: {
        channels: [
            { label: 'Lightness', min: 0, max: 100, step: 1, show: n => n.toFixed(1) },
            { label: 'Chroma', min: 0, max: 0.4, step: 0.005, show: n => n.toFixed(3) },
            { label: 'Hue', min: 0, max: 360, step: 1, show: n => n.toFixed(1) },
        ],
        read: hex => {
            const color = hexToOklch(hex) ?? { l: 0.5, c: 0, h: 0 };
            return [color.l * 100, color.c, color.h];
        },
        write: ([l = 0, c = 0, h = 0]) => oklchToHex({ l: l / 100, c, h }),
    },
};

/**
 * One channel's box: a number, taken as it is typed and kept inside the channel's range, with the
 * arrows moving it a step (Shift, ten). A whole colour pasted into it is taken as the colour, so a
 * paste lands wherever in the row it is dropped. As the field itself, the text stays as typed until
 * the box is let go.
 */
const ChannelInput = ({
    channel,
    label,
    value,
    format,
    onChange,
    onWhole,
}: {
    channel: Channel;
    /** What the colour is, so the box is named "Primary hue". */
    label: string;
    value: number;
    format: ColorFormat;
    onChange: (value: number) => void;
    onWhole: (hex: string) => void;
}) => {
    const shown = channel.show(value);
    const [draft, setDraft] = useState(shown);
    const typing = useRef(false);

    useEffect(() => {
        if (!typing.current) setDraft(shown);
    }, [shown]);

    const typed = (text: string) =>
        text.trim() !== '' && Number.isFinite(Number(text)) ? Number(text) : null;

    const step = (by: number) => {
        const from = typed(draft) ?? value;
        // Back off the floating point the step leaves behind, so 0.185 + 0.005 is 0.19 and not 0.19000000000000003.
        const next = clamp(Number((from + by).toFixed(4)), channel.min, channel.max);
        typing.current = false;
        setDraft(channel.show(next));
        onChange(next);
    };

    return (
        <Input
            aria-label={`${label} ${channel.label.toLowerCase()}`}
            className="min-w-0 flex-1 px-1.5"
            inputClassName="text-center tabular-nums"
            inputMode="decimal"
            onBlur={() => {
                typing.current = false;
                setDraft(shown);
            }}
            onChange={event => {
                const next = event.target.value;
                typing.current = true;
                setDraft(next);
                // A colour pasted over a number is the colour; a number is this channel's.
                const pasted = parseColor(next, format);
                if (pasted) return onWhole(pasted);
                const number = typed(next);
                if (number !== null) onChange(clamp(number, channel.min, channel.max));
            }}
            onKeyDown={event => {
                if (event.key === 'Enter') return event.currentTarget.blur();
                const way = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
                if (!way) return;
                event.preventDefault();
                step(way * channel.step * (event.shiftKey ? 10 : 1));
            }}
            size="sm"
            spellCheck={false}
            value={draft}
        />
    );
};

export type ColorFieldProps = {
    /** The colour as hex. */
    value: string;
    onChange: (hex: string) => void;
    label?: string;
    /** The notation, when what holds the field follows it (the picker's plane); the field's own otherwise. */
    format?: ColorFormat;
    onFormat?: (format: ColorFormat) => void;
};

/**
 * The notation and the value: a short select beside the value it sets the notation of. Hex is one
 * box, since it is one word; the notations that are three numbers get a box each, as a colour is
 * read and corrected a channel at a time.
 */
export const ColorField = ({
    value,
    onChange,
    label = 'Colour',
    format: given,
    onFormat,
}: ColorFieldProps) => {
    const [own, setOwn] = useState<ColorFormat>(lastFormat);
    const format = given ?? own;
    const set = format === 'hex' ? null : channelSets[format];
    const values = set?.read(value);
    const shown = formatColor(value, format);
    const [draft, setDraft] = useState(shown);
    // While the field has the hand, its text is its own: the colour it just wrote comes back
    // written out in full ("#abc" as "#aabbcc", "rgb(1 2 3)" with its spacing), and that must not
    // be dropped under the caret mid-word. It is shown on letting go.
    const typing = useRef(false);

    // A colour from elsewhere (the plane, another field) replaces whatever was being typed.
    useEffect(() => {
        if (!typing.current) setDraft(shown);
    }, [shown]);

    return (
        <div className="flex min-w-0 flex-1 items-center gap-2">
            <Select<ColorFormat>
                onValueChange={next => {
                    if (!next) return;
                    lastFormat = next;
                    setOwn(next);
                    onFormat?.(next);
                }}
                value={format}
            >
                <SelectTrigger aria-label={`${label} notation`} className="w-24 shrink-0" size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {formats.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {set && values ? (
                <div className="flex min-w-0 flex-1 items-center gap-1">
                    {set.channels.map((channel, i) => (
                        <ChannelInput
                            channel={channel}
                            format={format}
                            key={`${format}-${channel.label}`}
                            label={label}
                            onChange={next => {
                                const edited = [...values];
                                edited[i] = next;
                                const hex = set.write(edited);
                                if (hex !== value) onChange(hex);
                            }}
                            onWhole={hex => {
                                if (hex !== value) onChange(hex);
                            }}
                            value={values[i] ?? 0}
                        />
                    ))}
                </div>
            ) : (
                <Input
                    aria-label={`${label} as ${format}`}
                    className="min-w-0 flex-1 font-mono"
                    onBlur={() => {
                        typing.current = false;
                        setDraft(shown);
                    }}
                    onChange={event => {
                        const next = event.target.value;
                        typing.current = true;
                        setDraft(next);
                        const hex = parseColor(next, format);
                        if (hex && hex !== value) onChange(hex);
                    }}
                    onKeyDown={event => {
                        if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                    size="sm"
                    spellCheck={false}
                    value={draft}
                />
            )}
        </div>
    );
};

/* ---------- The hue's slider ---------- */

/**
 * The hue wheel at one lightness and chroma, left to right from 0° to 360°: clean enough to read as
 * the wheel on either surface, since it runs as a band beside the label rather than under it.
 */
const hueBand = `linear-gradient(90deg in oklab, ${Array.from(
    { length: 13 },
    (_, i) => `oklch(0.72 0.15 ${i * 30})`,
).join(', ')})`;

/** A hue as the band draws it, for the knob that sits on the band at that hue. */
const hueKnob = (hue: number) => `oklch(0.72 0.15 ${hue})`;

/**
 * A setting as a block slider, 48px, full width: its name inside on the left, its value on the right.
 *
 * A track (a gradient) shows what the value picks, a hue for instance: it runs as a 4px band along
 * the foot of the box, from the label's edge to the value's, with a knob on it at the value, always
 * shown. The label and the value move up to make room, and stay on the plain surface, so the band can
 * be drawn at full strength and the text still reads. The knob is filled with `knob` (the band's colour
 * at the value) inside a ring of the surface, the way the ramp graph draws its points.
 */
const BandSlider = ({
    label,
    value,
    display,
    track,
    knob,
    ...range
}: {
    label: string;
    value: number;
    display: string;
    track?: string;
    /** The knob's fill on a track; the surface unless given. */
    knob?: string;
    min: number;
    max: number;
    step: number;
    onValueChange: (value: number) => void;
}) => {
    const slider = (
        <BlockSlider
            className={cn(
                track && [
                    // No grey fill and no hover grip: the band and its knob say where the value is.
                    '**:data-[slot=block-slider-range]:bg-transparent **:data-[slot=block-slider-thumb]:after:hidden',
                    // A 20px grip, so its centre at either end lands on the band's end, level with the text.
                    '**:data-[slot=block-slider-thumb]:w-5',
                    // The label and the value sit in the upper part of the box, over the band.
                    '**:data-[slot=block-slider-info]:pb-3.5',
                ],
            )}
            format={() => display}
            label={label}
            max={range.max}
            min={range.min}
            onValueChange={([next = value]) => range.onValueChange(next)}
            size="lg"
            step={range.step}
            // Inset by half the grip, so the ends of the range are the ends of the band, not the box's edges.
            {...(track ? { thumbAlignment: 'edge' as const } : {})}
            value={[value]}
        />
    );
    if (!track) return slider;

    const at = Math.min(1, Math.max(0, (value - range.min) / (range.max - range.min)));
    // The band runs between the grip's centres at either end: the box's 1px border, its 2px padding,
    // then half the 20px grip.
    const inset = 'calc(1px + var(--spacing) * 3)';

    return (
        <div className="relative" data-slot="slider-row">
            {slider}
            <span
                aria-hidden
                className="pointer-events-none absolute bottom-3 h-1 rounded-full"
                style={{ left: inset, right: inset, background: track }}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute bottom-2 size-3 -translate-x-1/2 rounded-full border-2 border-neutral-50 shadow-float ring-1 ring-neutral-950/15"
                style={
                    {
                        left: `calc(${inset} + (100% - 2 * ${inset}) * ${at})`,
                        background: knob ?? 'var(--color-neutral-50)',
                    } as CSSProperties
                }
            />
        </div>
    );
};

/*
 * The colour picker: a plane at one hue, the hue under it, the value by hand, and how the
 * colour reads as a fill on the theme's light and dark surface. The notation the value is written
 * in is the model the plane is drawn in: hex and rgb pick on saturation over brightness (HSB),
 * hsl on saturation over lightness, oklch on its own chroma over lightness. Where a fill misses
 * 3:1 against a surface is dotted over, as a contrast checker marks it; the edge is found on the
 * plane shown, so it curves on HSB and lies level on oklch, whose rows share a lightness. The
 * value is a hex, so every plane is sRGB's.
 */

/** The most chroma any hue reaches in P3, with a little over: the arrows' limit. */
const _C_MAX = 0.37;

type Channels = [number, number, number];

/** Oklch to linear sRGB (Björn Ottosson's OKLab), unclamped: outside 0–1 is outside sRGB. */
const toLinearSrgb = ({ l, c, h }: Oklch): Channels => {
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);
    const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
        4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
        -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
        -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
    ];
};

/** Linear sRGB to linear Display P3 (both D65). */
const toP3 = ([r, g, b]: Channels): Channels => [
    0.8224621209 * r + 0.1775378791 * g,
    0.0331941989 * r + 0.9668058011 * g,
    0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b,
];

/**
 * The most chroma a lightness and hue carry inside a gamut. The engine's maxChroma allows a fixed
 * margin on every channel, which near black is larger than the channels themselves and lets the
 * edge swing out; drawn on a plane that shows as a hook at the bottom, so the edge here is exact.
 */
const edge = (l: number, h: number, gamut: Gamut = 'srgb') => {
    if (l <= 0 || l >= 1) return 0;
    let low = 0;
    let high = 0.45;
    for (let i = 0; i < 28; i++) {
        const mid = (low + high) / 2;
        const linear = toLinearSrgb({ l, c: mid, h });
        const channels = gamut === 'p3' ? toP3(linear) : linear;
        if (channels.every(v => v >= -1e-9 && v <= 1 + 1e-9)) low = mid;
        else high = mid;
    }
    return low;
};

/** The colour with its chroma brought inside sRGB at the same lightness and hue, as a hex holds it. */
const fit = (color: Oklch): Oklch => {
    const most = edge(color.l, color.h);
    // A hex read back sits on the edge to within rounding; it stays as it is, so its hex does too.
    return color.c > most + 1e-5 ? { ...color, c: most } : color;
};

/** A hex as oklch; a grey keeps the hue it was given, since its own means nothing. */
const fromHex = (hex: string, hue: number | undefined): Oklch => {
    const color = hexToOklch(hex) ?? { l: 0.5, c: 0, h: 0 };
    return color.c < 0.01 && hue !== undefined ? { ...color, h: hue } : color;
};

/* ---------- Painting the plane ---------- */

/** Whether the canvas can be drawn in Display P3, on a screen that shows it. */
let wideCanvas: boolean | undefined;
const supportsP3 = () => {
    if (wideCanvas === undefined) {
        try {
            const context = document
                .createElement('canvas')
                .getContext('2d', { colorSpace: 'display-p3' });
            wideCanvas =
                context?.getContextAttributes().colorSpace === 'display-p3' &&
                window.matchMedia('(color-gamut: p3)').matches;
        } catch {
            wideCanvas = false;
        }
    }
    return wideCanvas;
};

/** Linear channels to 8-bit through the sRGB curve (P3 shares it), looked up rather than raised. */
const LUT = 4096;
const encode = (() => {
    const table = new Uint8ClampedArray(LUT + 1);
    for (let i = 0; i <= LUT; i++) {
        const v = i / LUT;
        table[i] = Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055) * 255);
    }
    return table;
})();
const toByte = (linear: number) => encode[Math.round(clamp(linear, 0, 1) * LUT)] ?? 0;

/**
 * The plane at one hue, pixel by pixel: lightness up, and across each row the colour from grey to
 * the most vivid that lightness is in sRGB, which is as far as a hex goes. Every row runs the
 * plane's whole width, so it is colour from corner to corner, as a picker is expected to be.
 */
const paintPlane = (canvas: HTMLCanvasElement, hue: number) => {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const h = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const wide = supportsP3();
    const space: { colorSpace: PredefinedColorSpace } = {
        colorSpace: wide ? 'display-p3' : 'srgb',
    };
    const context = canvas.getContext('2d', space) as CanvasRenderingContext2D | null;
    if (!context) return;
    const image = context.createImageData(w, h, space);
    const { data } = image;
    const angle = (hue * Math.PI) / 180;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    // OKLab's a and b for one unit of chroma at this hue, carried into the LMS step once.
    const kl = 0.3963377774 * ca + 0.2158037573 * sa;
    const km = -0.1055613458 * ca - 0.0638541728 * sa;
    const ks = -0.0894841775 * ca - 1.291485548 * sa;

    for (let y = 0; y < h; y++) {
        const l = 1 - (y + 0.5) / h;
        const most = edge(l, hue);
        for (let x = 0; x < w; x++) {
            const c = ((x + 0.5) / w) * most;
            const lc = (l + kl * c) ** 3;
            const mc = (l + km * c) ** 3;
            const sc = (l + ks * c) ** 3;
            let r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
            let g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
            let b = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
            if (wide) {
                const pr = 0.8224621209 * r + 0.1775378791 * g;
                const pg = 0.0331941989 * r + 0.9668058011 * g;
                const pb = 0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b;
                r = pr;
                g = pg;
                b = pb;
            }
            const i = (y * w + x) * 4;
            data[i] = toByte(r);
            data[i + 1] = toByte(g);
            data[i + 2] = toByte(b);
            data[i + 3] = 255;
        }
    }
    context.putImageData(image, 0, 0);
};

/* ---------- The planes of sRGB's own models ---------- */

/** The plane a notation is picked on: oklch's own, or one of sRGB's two (HSB for hex and rgb). */
type Model = 'oklch' | 'hsl' | 'hsb';

const modelOf = (format: ColorFormat): Model =>
    format === 'oklch' ? 'oklch' : format === 'hsl' ? 'hsl' : 'hsb';

/** sRGB channels, 0 to 1, at a hue with a saturation and a lightness (HSL) or a brightness (HSB). */
const srgbAt = (model: 'hsl' | 'hsb', h: number, s: number, u: number): Channels => {
    const turn = ((h % 360) + 360) % 360;
    if (model === 'hsb') {
        const f = (n: number) => {
            const k = (n + turn / 60) % 6;
            return u - u * s * Math.max(0, Math.min(k, 4 - k, 1));
        };
        return [f(5), f(3), f(1)];
    }
    const a = s * Math.min(u, 1 - u);
    const f = (n: number) => {
        const k = (n + turn / 30) % 12;
        return u - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [f(0), f(8), f(4)];
};

/** The hue, saturation and lightness or brightness of sRGB channels; a grey has hue 0. */
const fromSrgb = (model: 'hsl' | 'hsb', [r, g, b]: Channels) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const sector =
        d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    const h = (sector * 60 + 360) % 360;
    if (model === 'hsb') return { h, s: max === 0 ? 0 : d / max, u: max };
    const u = (max + min) / 2;
    return { h, s: d === 0 ? 0 : d / (1 - Math.abs(2 * u - 1)), u };
};

const channelsOf = (hex: string): Channels => {
    const n = Number.parseInt(hex.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const hexOf = (channels: Channels) =>
    `#${channels
        .map(v =>
            Math.round(clamp(v, 0, 1) * 255)
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;

/** An sRGB channel out of its curve, to light. */
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** An sRGB plane at one hue, pixel by pixel: saturation across, lightness or brightness up. */
const paintSrgbPlane = (canvas: HTMLCanvasElement, model: 'hsl' | 'hsb', hue: number) => {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const h = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    // The canvas keeps the colour space it was first given, so sRGB is carried into it.
    const wide = supportsP3();
    const space: { colorSpace: PredefinedColorSpace } = {
        colorSpace: wide ? 'display-p3' : 'srgb',
    };
    const context = canvas.getContext('2d', space) as CanvasRenderingContext2D | null;
    if (!context) return;
    const image = context.createImageData(w, h, space);
    const { data } = image;
    for (let y = 0; y < h; y++) {
        const u = 1 - (y + 0.5) / h;
        for (let x = 0; x < w; x++) {
            const [sr, sg, sb] = srgbAt(model, hue, (x + 0.5) / w, u);
            const linear: Channels = [decode(sr), decode(sg), decode(sb)];
            const [r, g, b] = wide ? toP3(linear) : linear;
            const i = (y * w + x) * 4;
            data[i] = toByte(r);
            data[i + 1] = toByte(g);
            data[i + 2] = toByte(b);
            data[i + 3] = 255;
        }
    }
    context.putImageData(image, 0, 0);
};

/* ---------- Contrast across a plane ---------- */

/** The contrast a fill needs against what it sits on to be seen as a shape (WCAG 1.4.11). */
const FILL = 3;

/** Relative luminance of linear sRGB channels, as WCAG weighs them. */
const luminance = ([r, g, b]: Channels) =>
    0.2126 * clamp(r, 0, 1) + 0.7152 * clamp(g, 0, 1) + 0.0722 * clamp(b, 0, 1);

/** A plane's colour in light (linear sRGB) at a place: how far across, how far up, both 0 to 1. */
type LinearAt = (across: number, up: number) => Channels;

/**
 * Where a fill keeps exactly 3:1 against a surface, as a line across a plane, and the region past
 * it where a fill fails: over the line against a light surface, under it against a dark one. The
 * line is found on the plane's own colours, so it is level on a plane whose rows share a
 * lightness (oklch) and curves on one whose rows do not (HSB, HSL).
 */
const contrastPath = (linearAt: LinearAt, surface: Oklch, width: number, height: number) => {
    const columns = 48;
    const points: [number, number][] = [];
    const ground = luminance(toLinearSrgb(surface));
    // Lighter than mid grey, the surface is passed by going darker; darker, by going lighter.
    const light = surface.l > 0.5;
    for (let i = 0; i <= columns; i++) {
        const across = i / columns;
        let low = 0;
        let high = 1;
        for (let k = 0; k < 18; k++) {
            const mid = (low + high) / 2;
            const own = luminance(linearAt(across, mid));
            const passes = (Math.max(own, ground) + 0.05) / (Math.min(own, ground) + 0.05) >= FILL;
            // Towards the surface the contrast falls: keep the half the threshold is in.
            if (passes === light) low = mid;
            else high = mid;
        }
        points.push([across * width, (1 - (low + high) / 2) * height]);
    }
    const first = points[0];
    const last = points.at(-1);
    if (!first || !last) return { line: '', area: '' };
    const line = points
        .map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`)
        .join(' ');
    // The side that fails: towards the surface, so up from a light one's line, down from a dark one's.
    const side = light ? 0 : height;
    return {
        line,
        area: `${line} L ${last[0].toFixed(1)} ${side} L ${first[0].toFixed(1)} ${side} Z`,
    };
};

/** The two surfaces a fill is read against: the theme's own, light and dark. */
type Surfaces = { light: Oklch; dark: Oklch };

/** Which of the two a colour is being checked against; either can be left out. */
type Checked = { light: boolean; dark: boolean };

// Kept between openings, so a check turned off stays off while the theme is worked on.
let lastChecked: Checked = { light: true, dark: true };

/** The element's size, kept as it changes. */
const useSize = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return [ref, size] as const;
};

/* ---------- The plane ---------- */

/**
 * A plane of colour at one hue as a 2D slider, whichever model it is drawn in: how vivid across,
 * how light up. A press anywhere picks there and a drag follows; the arrows move a step (Shift,
 * five). With the theme's surfaces given, the colours that fail as a fill against either are
 * dotted over, up to the line where 3:1 is kept.
 */
const Plane = ({
    paint,
    paintKey,
    linearAt,
    at,
    fill,
    label,
    surfaces,
    onPickAt,
    onRelease,
    handleRef,
}: {
    /** Draws the plane on its canvas. */
    paint: (canvas: HTMLCanvasElement) => void;
    /** Changes when the plane has to be drawn again: its model and hue. */
    paintKey: string;
    linearAt: LinearAt;
    /** Where the colour sits: across and up, 0 to 1. */
    at: { across: number; up: number };
    /** The colour itself, for the handle. */
    fill: string;
    /** What the two axes are, for a screen reader. */
    label: string;
    surfaces?: Partial<Surfaces>;
    onPickAt: (across: number, up: number) => void;
    /** The hand has let go. */
    onRelease: () => void;
    handleRef: RefObject<HTMLDivElement | null>;
}) => {
    const [planeRef, size] = useSize<HTMLDivElement>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dragging, setDragging] = useState(false);
    const dots = useId();

    // Repainted for a new model or hue, or once the plane has a size.
    // biome-ignore lint/correctness/useExhaustiveDependencies: the painter is new each render; its key says when it draws something else
    useLayoutEffect(() => {
        if (canvasRef.current && size.width > 0) paint(canvasRef.current);
    }, [paintKey, size.width]);

    const light = surfaces?.light;
    const dark = surfaces?.dark;
    // biome-ignore lint/correctness/useExhaustiveDependencies: the plane's colours change with its key
    const lines = useMemo(
        () =>
            size.width > 0
                ? [light, dark].flatMap(surface =>
                      surface ? [contrastPath(linearAt, surface, size.width, size.height)] : [],
                  )
                : [],
        [paintKey, size.width, size.height, light, dark],
    );

    // Where on the handle it was taken, so taking it by its edge does not jump it to the pointer.
    const grip = useRef({ x: 0, y: 0 });

    const pickAt = (event: PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - grip.current.x - rect.left;
        const y = event.clientY - grip.current.y - rect.top;
        onPickAt(clamp(x / rect.width, 0, 1), clamp(1 - y / rect.height, 0, 1));
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const far = event.shiftKey ? 5 : 1;
        const move: Record<string, [number, number]> = {
            ArrowUp: [0, 0.01],
            ArrowDown: [0, -0.01],
            ArrowRight: [0.01, 0],
            ArrowLeft: [-0.01, 0],
        };
        const delta = move[event.key];
        if (!delta) return;
        event.preventDefault();
        onPickAt(clamp(at.across + delta[0] * far, 0, 1), clamp(at.up + delta[1] * far, 0, 1));
    };

    return (
        <div
            className="relative h-44 w-full cursor-crosshair touch-none select-none"
            onLostPointerCapture={() => {
                setDragging(false);
                onRelease();
            }}
            onPointerDown={event => {
                if (event.button !== 0) return;
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                const handle = handleRef.current;
                const box = handle?.getBoundingClientRect();
                grip.current =
                    box && event.target === handle
                        ? {
                              x: event.clientX - (box.left + box.width / 2),
                              y: event.clientY - (box.top + box.height / 2),
                          }
                        : { x: 0, y: 0 };
                handle?.focus({ preventScroll: true });
                setDragging(true);
                pickAt(event);
            }}
            onPointerMove={event => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) pickAt(event);
            }}
            ref={planeRef}
        >
            <div
                className={cn(
                    'absolute inset-0 overflow-hidden rounded-item bg-neutral-950/3',
                    // A faint inner edge, so the plane keeps its outline against the popup.
                    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-neutral-950/10 after:ring-inset after:content-['']",
                )}
            >
                <canvas aria-hidden className="absolute inset-0 size-full" ref={canvasRef} />
                {lines.length > 0 && (
                    <svg
                        aria-hidden="true"
                        className="absolute inset-0 size-full"
                        viewBox={`0 0 ${size.width} ${size.height}`}
                    >
                        {/* Where a fill fails is dotted over, and the threshold is the dots' edge. */}
                        <defs>
                            <pattern height="4" id={dots} patternUnits="userSpaceOnUse" width="4">
                                <circle cx="1" cy="1" fill="rgb(255 255 255 / 0.5)" r="0.7" />
                            </pattern>
                        </defs>
                        {lines.map(threshold => (
                            <g key={threshold.line}>
                                <path d={threshold.area} fill={`url(#${dots})`} />
                                <path
                                    d={threshold.line}
                                    fill="none"
                                    stroke="rgb(0 0 0 / 0.3)"
                                    strokeWidth={2.5}
                                />
                                <path
                                    d={threshold.line}
                                    fill="none"
                                    stroke="white"
                                    strokeWidth={1}
                                />
                            </g>
                        ))}
                    </svg>
                )}
            </div>
            <div
                aria-label={label}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(at.up * 100)}
                aria-valuetext={`${Math.round(at.up * 100)}% up, ${Math.round(at.across * 100)}% across`}
                className={cn(
                    '-translate-1/2 absolute size-3.5 rounded-full border-2 border-white ring-1 ring-black/25',
                    'outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2',
                    // It grows a touch while held, so the hand feels it take the colour.
                    'transition-[scale] duration-150 ease-out-strong motion-reduce:transition-none',
                    dragging ? 'scale-125 cursor-grabbing' : 'cursor-grab',
                )}
                onKeyDown={onKeyDown}
                ref={handleRef}
                role="slider"
                style={{
                    left: `${at.across * 100}%`,
                    top: `${(1 - at.up) * 100}%`,
                    background: fill,
                }}
                tabIndex={0}
            />
        </div>
    );
};

/* ---------- The picker ---------- */

/** A page that follows a write within this (two frames and a little) keeps up live. */
const LIVE_MS = 50;
/** Otherwise a write waits for the hand to rest this long, or to let go. */
const REST_MS = 120;

/**
 * Writes the accent out at the pace the page can take. Every write re-themes the page and its
 * preview; where that is quick, each frame writes, and where it is slow (a long frame would stall the
 * handle) a drag writes when the hand rests or lets go, while the picker itself stays live. The
 * hexes sent and not yet seen back are kept in order: a value that is none of them came from outside.
 */
const useWriter = (
    value: string,
    onChange: (hex: string) => void,
    onOutside: (hex: string) => void,
) => {
    const change = useRef(onChange);
    change.current = onChange;
    const outside = useRef(onOutside);
    outside.current = onOutside;
    // The page's cost is unknown until a first write comes back, so a first drag waits for a rest.
    const state = useRef({
        pending: null as string | null,
        frame: 0,
        timer: 0,
        cost: Number.POSITIVE_INFINITY,
        at: 0,
    });
    const sent = useRef<string[]>([]);
    const seen = useRef(value);

    const send = () => {
        const w = state.current;
        w.frame = 0;
        const out = w.pending;
        w.pending = null;
        if (!out || out === seen.current) return;
        sent.current.push(out);
        w.at = performance.now();
        startTransition(() => change.current(out));
    };

    const soon = () => {
        const w = state.current;
        clearTimeout(w.timer);
        w.timer = 0;
        if (!w.frame) w.frame = requestAnimationFrame(send);
    };

    /** Queues a hex; `now` for a single step (a family, a release), not one frame of a drag. */
    const write = (hex: string, now = false) => {
        const w = state.current;
        w.pending = hex;
        if (now || w.cost < LIVE_MS) return soon();
        clearTimeout(w.timer);
        w.timer = window.setTimeout(soon, REST_MS);
    };

    /** Sends what is waiting at once: the hand has let go. */
    const flush = () => {
        if (state.current.pending) soon();
    };

    // Closing sends whatever is still waiting, so the last colour is never lost.
    useEffect(
        () => () => {
            const w = state.current;
            cancelAnimationFrame(w.frame);
            clearTimeout(w.timer);
            const last = w.pending;
            w.pending = null;
            if (last && last !== seen.current) change.current(last);
        },
        [],
    );

    // A value back from the picker says how long the page took; one from outside moves the picker.
    useEffect(() => {
        if (value === seen.current) return;
        seen.current = value;
        const at = sent.current.indexOf(value);
        if (at < 0) {
            sent.current = [];
            outside.current(value);
            return;
        }
        sent.current.splice(0, at + 1);
        // The first frame after the commit tells how long the page took to follow.
        const started = state.current.at;
        requestAnimationFrame(time => {
            state.current.cost = time - started;
        });
    }, [value]);

    return { write, flush };
};

type PickerProps = {
    value: string;
    onChange: (hex: string) => void;
    /** The colour as it moves, before the page has taken it. */
    onLive: (hex: string) => void;
    /** What the colour is, for the labels of its controls. */
    label: string;
    hue: RefObject<number | undefined>;
    handleRef: RefObject<HTMLDivElement | null>;
    /** The theme's light and dark surface: with them the picker says how the colour reads as a fill. */
    surfaces?: Surfaces;
};

/**
 * One surface's reading, and the switch for its check: the ratio, cut not rounded, and whether a
 * fill passes on it. Off, the ratio still shows, quietly, and the plane stops marking that surface.
 */
const Reading = ({
    label,
    ratio,
    on,
    onToggle,
}: {
    label: string;
    ratio: number;
    on: boolean;
    onToggle: () => void;
}) => (
    <button
        aria-pressed={on}
        className={cn(
            '-mx-1.5 flex h-7 cursor-pointer items-center gap-1.5 rounded-chip px-1.5 transition-[background-color,opacity] duration-150 hover:bg-neutral-950/5',
            'focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid',
            !on && 'opacity-50',
        )}
        onClick={onToggle}
        title={on ? `Stop checking ${label.toLowerCase()}` : `Check ${label.toLowerCase()}`}
        type="button"
    >
        <StatusDot tone={!on ? 'neutral' : ratio >= FILL ? 'success' : 'error'} />
        <span className={cn('text-neutral-600', !on && 'line-through')}>{label}</span>
        <span className="font-medium text-neutral-950 tabular-nums">
            {(Math.trunc(ratio * 100) / 100).toFixed(2)}:1
        </span>
    </button>
);

/** The hue wheel as sRGB's models turn it, for the band under an HSB or HSL plane. */
const srgbHueBand =
    'linear-gradient(90deg, #f00, #ff0 16.67%, #0f0 33.33%, #0ff 50%, #00f 66.67%, #f0f 83.33%, #f00)';

const PickerBody = ({ value, onChange, onLive, label, hue, handleRef, surfaces }: PickerProps) => {
    // The colour as picked: its chroma may run past the edge after a turn of hue, and comes back
    // when the hue does. What is shown and written is the colour fitted inside sRGB.
    const [picked, setPicked] = useState(() => fromHex(value, hue.current));
    const color = fit(picked);
    const hex = oklchToHex(color);
    const { write, flush } = useWriter(value, onChange, next =>
        setPicked(previous => fromHex(next, previous.h)),
    );

    // The notation the value is written in is the model the plane is drawn in.
    const [format, setFormat] = useState<ColorFormat>(sharedFormat);
    const model = modelOf(format);

    const [checked, setChecked] = useState<Checked>(lastChecked);
    const toggle = (mode: keyof Checked) =>
        setChecked(now => {
            lastChecked = { ...now, [mode]: !now[mode] };
            return lastChecked;
        });

    const pick = (next: Oklch, now = false) => {
        setPicked(next);
        hue.current = next.h;
        const out = oklchToHex(fit(next));
        onLive(out);
        write(out, now);
    };

    // On an sRGB plane the place picked is kept as picked: a hex forgets its hue at grey and its
    // saturation at black, and the handle would jump there if it were read back from the hex.
    const kept = useRef<{ hex: string; model: Model; h: number; s: number; u: number } | null>(
        null,
    );
    const place = (() => {
        if (model === 'oklch') return null;
        const last = kept.current;
        if (last && last.model === model && sameHex(last.hex, hex)) return last;
        const read = fromSrgb(model, channelsOf(hex));
        const flat = model === 'hsb' ? read.u < 0.004 : read.u < 0.004 || read.u > 0.996;
        return {
            hex,
            model,
            h: read.s < 0.004 || flat ? (last?.h ?? read.h) : read.h,
            s: flat && last?.model === model ? last.s : read.s,
            u: read.u,
        };
    })();
    const pickSrgb = (h: number, s: number, u: number, now = false) => {
        if (model === 'oklch') return;
        const out = hexOf(srgbAt(model, h, s, u));
        kept.current = { hex: out, model, h, s, u };
        pick(fromHex(out, picked.h), now);
    };

    // The plane in the model picked: what paints it, what its colours are, where the colour sits.
    const most = edge(color.l, color.h);
    const plane =
        model === 'oklch' || !place
            ? {
                  key: `oklch-${picked.h}`,
                  label: 'Lightness and chroma',
                  paint: (canvas: HTMLCanvasElement) => paintPlane(canvas, picked.h),
                  linearAt: (across: number, up: number) =>
                      toLinearSrgb({ l: up, c: across * edge(up, picked.h), h: picked.h }),
                  at: { across: most > 1e-4 ? clamp(color.c / most, 0, 1) : 0, up: color.l },
                  onPickAt: (across: number, up: number) =>
                      pick({ l: up, c: across * edge(up, picked.h), h: picked.h }),
              }
            : {
                  key: `${model}-${place.h}`,
                  label: model === 'hsb' ? 'Brightness and saturation' : 'Lightness and saturation',
                  paint: (canvas: HTMLCanvasElement) => paintSrgbPlane(canvas, model, place.h),
                  linearAt: (across: number, up: number) =>
                      srgbAt(model, place.h, across, up).map(decode) as Channels,
                  at: { across: place.s, up: place.u },
                  onPickAt: (across: number, up: number) => pickSrgb(place.h, across, up),
              };

    return (
        <>
            {/* How the colour reads as a fill leads, as the ratio leads a contrast checker. */}
            {surfaces && (
                <div
                    className="flex items-center justify-between gap-3 whitespace-nowrap"
                    title="As a fill (a checked box, a switch) on the theme's light and dark surface. A fill needs 3:1; the dotted colours miss it. Click one to stop checking it."
                >
                    <Reading
                        label="On light"
                        on={checked.light}
                        onToggle={() => toggle('light')}
                        ratio={wcagContrast(color, surfaces.light)}
                    />
                    <Reading
                        label="On dark"
                        on={checked.dark}
                        onToggle={() => toggle('dark')}
                        ratio={wcagContrast(color, surfaces.dark)}
                    />
                </div>
            )}
            <Plane
                at={plane.at}
                fill={hex}
                handleRef={handleRef}
                label={plane.label}
                linearAt={plane.linearAt}
                onPickAt={plane.onPickAt}
                onRelease={flush}
                paint={plane.paint}
                paintKey={plane.key}
                surfaces={
                    surfaces && {
                        light: checked.light ? surfaces.light : undefined,
                        dark: checked.dark ? surfaces.dark : undefined,
                    }
                }
            />
            {/* A drag on the hue lets go here as well; the pointer's release bubbles up from the slider. */}
            <div onPointerUp={flush}>
                {model === 'oklch' || !place ? (
                    <BandSlider
                        display={`${Math.round(picked.h)}°`}
                        knob={hueKnob(picked.h)}
                        label="Hue"
                        max={360}
                        min={0}
                        onValueChange={h => pick({ ...picked, h })}
                        step={1}
                        track={hueBand}
                        value={picked.h}
                    />
                ) : (
                    <BandSlider
                        display={`${Math.round(place.h)}°`}
                        knob={`hsl(${place.h} 100% 50%)`}
                        label="Hue"
                        max={360}
                        min={0}
                        onValueChange={h => pickSrgb(h, place.s, place.u)}
                        step={1}
                        track={srgbHueBand}
                        value={place.h}
                    />
                )}
            </div>
            {/* The value by hand; its notation is also the plane's model. */}
            <ColorField
                format={format}
                label={label}
                onChange={next => pick(fromHex(next, picked.h), true)}
                onFormat={setFormat}
                value={hex}
            />
        </>
    );
};

export type ColorPickerProps = {
    /** The colour as hex. */
    value: string;
    onChange: (hex: string) => void;
    /** What the colour is, for the labels of its controls: "Primary", "Label colour". */
    label?: string;
    /**
     * The light and the dark surface the colour sits on as a fill, as hex. With them the picker
     * leads with the contrast on each, and dots over the colours that miss 3:1 against either.
     */
    contrast?: { light: string; dark: string };
    /** On the well, for one that is not the 34px square: a swatch in a strip, a dot in a row. */
    className?: string;
};

/**
 * A colour's well, opening its picker: a plane at one hue, the hue, and the value by hand in hex,
 * rgb, hsl or oklch. The notation picked is also the model the plane is drawn in.
 */
export const ColorPicker = ({
    value,
    onChange,
    label = 'Colour',
    contrast,
    className,
}: ColorPickerProps) => {
    // The hue last picked, so a grey (whose own hue means nothing) reopens where it was left.
    const hue = useRef<number | undefined>(undefined);
    // The plane's handle takes the focus on opening, so the arrows move the colour at once.
    const handleRef = useRef<HTMLDivElement>(null);
    // The well shows the colour as it moves; once the page has a value of its own again, that.
    const [live, setLive] = useState<string>();
    const [shownFor, setShownFor] = useState(value);
    if (shownFor !== value) {
        setShownFor(value);
        setLive(undefined);
    }

    const onLight = contrast?.light;
    const onDark = contrast?.dark;
    const surfaces = useMemo(
        () =>
            onLight && onDark
                ? {
                      light: hexToOklch(onLight) ?? { l: 1, c: 0, h: 0 },
                      dark: hexToOklch(onDark) ?? { l: 0, c: 0, h: 0 },
                  }
                : undefined,
        [onLight, onDark],
    );

    return (
        <Popover>
            <PopoverTrigger
                aria-label={`Pick the ${label.toLowerCase()}`}
                className={cn(
                    // The box is Input's: the same border, shadow and corners, so it sits in a row
                    // of controls as one of them rather than as a slab of colour.
                    'size-control shrink-0 cursor-pointer rounded-control border border-neutral-200 p-[3px] shadow-control transition-[border-color] duration-150 hover:border-neutral-300',
                    'outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2',
                    'data-popup-open:outline-2 data-popup-open:outline-neutral-300 data-popup-open:outline-solid data-popup-open:outline-offset-2',
                    className,
                )}
                data-slot="color-picker"
            >
                {/* The colour inset in the box, as the segmented control insets its segment: a fixed
                    3px at every size, with its corner the box's less that inset. No edge of its own:
                    the box's border is the one that holds it. */}
                <span
                    aria-hidden
                    className="block size-full rounded-[calc(var(--radius-control)-3px)]"
                    data-slot="color-picker-swatch"
                    style={{ background: live ?? value }}
                />
            </PopoverTrigger>
            <PopoverContent align="start" aria-label={label} initialFocus={handleRef}>
                <PickerBody
                    handleRef={handleRef}
                    hue={hue}
                    label={label}
                    onChange={onChange}
                    onLive={setLive}
                    surfaces={surfaces}
                    value={value}
                />
            </PopoverContent>
        </Popover>
    );
};
