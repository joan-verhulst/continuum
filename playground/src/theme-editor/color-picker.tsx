import {
    cn,
    formatOklch,
    type Gamut,
    hexToOklch,
    type Oklch,
    oklchToHex,
    Popover,
    PopoverContent,
    PopoverTrigger,
    type RampStep,
    rampSteps,
} from 'continuum';
import {
    type KeyboardEvent,
    type PointerEvent,
    type RefObject,
    startTransition,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { tailwindHues } from '../../../src/lib/tailwind-palette';
import { hueBand, hueKnob, SliderRow } from './parts';

/*
 * The accent's colour picker: a plane of lightness over chroma at one hue, the hue under it, the
 * value as oklch and hex, and Tailwind's families to start from. The theme keeps the accent as hex,
 * so a pick stops at the sRGB edge whatever the gamut; the P3 band past it is drawn washed out,
 * as what the ramp's other steps can still reach in a P3 theme. The picked oklch is kept here while
 * it moves, so the handle never jumps through the hex's rounding.
 */

/** The plane's chroma axis: a little past the most any hue reaches in P3. */
const C_MAX = 0.37;

/** How strongly the band between the sRGB and P3 edges is drawn: a P3 theme reaches it, sRGB does not. */
const band: Record<Gamut, number> = { p3: 0.42, srgb: 0.2 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

/** Oklch as Tailwind writes it, at a fixed width so the line holds still while the colour moves. */
const asOklch = ({ l, c, h }: Oklch) =>
    `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})`;

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
 * The plane at one hue, pixel by pixel: oklch to linear sRGB (to P3 on a wide canvas), full inside
 * sRGB, washed between the sRGB and P3 edges, nothing past P3. The edges are anti-aliased by how much
 * of each pixel they cover.
 */
const paintPlane = (canvas: HTMLCanvasElement, hue: number, gamut: Gamut) => {
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
    const step = C_MAX / w;
    const wash = band[gamut];

    for (let y = 0; y < h; y++) {
        const l = 1 - (y + 0.5) / h;
        const srgbEdge = edge(l, hue, 'srgb');
        const p3Edge = edge(l, hue, 'p3');
        const end = Math.min(w, Math.ceil(p3Edge / step) + 1);
        for (let x = 0; x < end; x++) {
            const chroma = (x + 0.5) * step;
            const inSrgb = clamp((srgbEdge - chroma) / step + 0.5, 0, 1);
            const inP3 = clamp((p3Edge - chroma) / step + 0.5, 0, 1);
            const alpha = inSrgb + (inP3 - inSrgb) * wash;
            if (alpha <= 0) continue;
            const c = Math.min(chroma, p3Edge);
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
            data[i + 3] = Math.round(alpha * 255);
        }
    }
    context.putImageData(image, 0, 0);
};

/** A gamut's edge across the plane as an SVG path, in the plane's own pixels. */
const edgePath = (hue: number, gamut: Gamut, width: number, height: number) => {
    const rows = 96;
    return Array.from({ length: rows + 1 }, (_, i) => {
        const l = 1 - i / rows;
        const x = (edge(l, hue, gamut) / C_MAX) * width;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${((i / rows) * height).toFixed(1)}`;
    }).join(' ');
};

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

const percent = (l: number) => `${Math.round(l * 100)}%`;

/**
 * Lightness (up) over chroma (right) at the colour's hue: a 2D slider. A press anywhere picks there,
 * a drag follows, and a pick past the sRGB edge stops on it at the same lightness. The arrows move
 * lightness (up, down) and chroma (left, right); Shift moves five times as far.
 */
const Plane = ({
    color,
    gamut,
    onPick,
    onRelease,
    handleRef,
}: {
    color: Oklch;
    gamut: Gamut;
    onPick: (color: Oklch) => void;
    /** The hand has let go. */
    onRelease: () => void;
    handleRef: RefObject<HTMLDivElement | null>;
}) => {
    const [planeRef, size] = useSize<HTMLDivElement>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dragging, setDragging] = useState(false);

    // Repainted for a new hue or gamut, or once the plane has a size.
    useLayoutEffect(() => {
        if (canvasRef.current && size.width > 0) paintPlane(canvasRef.current, color.h, gamut);
    }, [color.h, gamut, size.width]);

    const edges = useMemo(
        () =>
            size.width > 0
                ? {
                      srgb: edgePath(color.h, 'srgb', size.width, size.height),
                      p3: edgePath(color.h, 'p3', size.width, size.height),
                  }
                : null,
        [color.h, size.width, size.height],
    );

    // Where on the handle it was taken, so taking it by its edge does not jump it to the pointer.
    const grip = useRef({ x: 0, y: 0 });

    const pickAt = (event: PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - grip.current.x - rect.left;
        const y = event.clientY - grip.current.y - rect.top;
        const l = clamp(1 - y / rect.height, 0, 1);
        const c = clamp((x / rect.width) * C_MAX, 0, C_MAX);
        onPick(fit({ l, c, h: color.h }));
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const far = event.shiftKey ? 5 : 1;
        const move: Record<string, [number, number]> = {
            ArrowUp: [0.01, 0],
            ArrowDown: [-0.01, 0],
            ArrowRight: [0, 0.004],
            ArrowLeft: [0, -0.004],
        };
        const delta = move[event.key];
        if (!delta) return;
        event.preventDefault();
        const l = clamp(color.l + delta[0] * far, 0, 1);
        const c = clamp(color.c + delta[1] * far, 0, C_MAX);
        onPick(fit({ l, c, h: color.h }));
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
                    // A faint inner edge, so the plane keeps its outline where the colour runs out.
                    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-neutral-950/10 after:ring-inset after:content-['']",
                )}
            >
                <canvas aria-hidden className="absolute inset-0 size-full" ref={canvasRef} />
                {edges && (
                    <svg
                        aria-hidden="true"
                        className="absolute inset-0 size-full"
                        viewBox={`0 0 ${size.width} ${size.height}`}
                    >
                        <path
                            className="stroke-neutral-950/25"
                            d={edges.p3}
                            fill="none"
                            strokeDasharray="2 3"
                            strokeWidth={1}
                        />
                        <path
                            className="stroke-neutral-950/40"
                            d={edges.srgb}
                            fill="none"
                            strokeWidth={1}
                        />
                    </svg>
                )}
                {/* The two lines named where no hue ever reaches: low lightness, high chroma. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute right-2.5 bottom-2 flex items-center gap-3 text-neutral-600 text-xxs"
                >
                    <span className="flex items-center gap-1.5">
                        <svg aria-hidden="true" className="h-px w-3" viewBox="0 0 12 1">
                            <path className="stroke-neutral-950/40" d="M0 0.5 H12" />
                        </svg>
                        sRGB
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg aria-hidden="true" className="h-px w-3" viewBox="0 0 12 1">
                            <path
                                className="stroke-neutral-950/25"
                                d="M0 0.5 H12"
                                strokeDasharray="2 3"
                            />
                        </svg>
                        P3
                    </span>
                </div>
            </div>
            <div
                aria-label="Lightness and chroma"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(color.l * 100)}
                aria-valuetext={`L ${percent(color.l)} C ${color.c.toFixed(2)}`}
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
                    left: `${(color.c / C_MAX) * 100}%`,
                    top: `${(1 - color.l) * 100}%`,
                    background: formatOklch(color),
                }}
                tabIndex={0}
            />
        </div>
    );
};

/* ---------- Tailwind's families ---------- */

type Family = { name: string; label: string; hex: string; color: Oklch };

const families = (step: RampStep): Family[] => {
    const index = rampSteps.indexOf(step);
    return Object.entries(tailwindHues).map(([name, ramp]) => {
        const [l = 0.6, c = 0, h = 0] = ramp[index] ?? [];
        const color = fit({ l, c, h });
        return {
            name,
            label: `${name[0]?.toUpperCase()}${name.slice(1)} ${step}`,
            hex: oklchToHex(color),
            color,
        };
    });
};

/**
 * The seventeen families at the accent's step, as one strip. The family whose hue the colour sits
 * nearest is marked and named on the right (a grey belongs to none), or the one under the pointer.
 * One stop in the tab order; the arrows walk the strip.
 */
const Families = ({
    color,
    hex,
    step,
    onPick,
}: {
    color: Oklch;
    hex: string;
    step: RampStep;
    onPick: (family: Family) => void;
}) => {
    const list = useMemo(() => families(step), [step]);
    // Which family by hue: lightness and chroma say which step of it, not which family.
    const nearest = useMemo(() => {
        let best = 0;
        let distance = Number.POSITIVE_INFINITY;
        list.forEach((family, i) => {
            const d = Math.abs(((family.color.h - color.h + 540) % 360) - 180);
            if (d < distance) {
                distance = d;
                best = i;
            }
        });
        return best;
    }, [list, color.h]);
    const grey = color.c < 0.02;
    const [hovered, setHovered] = useState<number | null>(null);
    const [focused, setFocused] = useState<number | null>(null);
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const stop = focused ?? nearest;
    const shown = hovered ?? focused;
    const exact = list[nearest]?.hex === hex;
    const marked = grey ? -1 : nearest;

    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, i: number) => {
        const to =
            event.key === 'ArrowRight'
                ? Math.min(list.length - 1, i + 1)
                : event.key === 'ArrowLeft'
                  ? Math.max(0, i - 1)
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? list.length - 1
                      : null;
        if (to === null) return;
        event.preventDefault();
        buttons.current[to]?.focus();
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
                <p className="text-neutral-600">Tailwind</p>
                <p className="truncate text-neutral-600">
                    {shown !== null ? (
                        <span className="text-neutral-950">{list[shown]?.label}</span>
                    ) : exact ? (
                        <span className="text-neutral-950">{list[nearest]?.label}</span>
                    ) : grey ? null : (
                        <>Near {list[nearest]?.label.toLowerCase()}</>
                    )}
                </p>
            </div>
            <div
                aria-label={`Tailwind's families at ${step}`}
                className={cn(
                    'relative flex h-6 overflow-hidden rounded-chip',
                    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-neutral-950/10 after:ring-inset after:content-['']",
                )}
                role="toolbar"
            >
                {list.map((family, i) => (
                    <button
                        aria-label={family.label}
                        aria-pressed={i === nearest && exact}
                        className={cn(
                            'relative flex-1 cursor-pointer outline-none',
                            'focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:-outline-offset-2',
                            i === marked && 'ring-2 ring-white/85 ring-inset',
                        )}
                        key={family.name}
                        onBlur={() => setFocused(null)}
                        onClick={() => onPick(family)}
                        onFocus={() => setFocused(i)}
                        onKeyDown={event => onKeyDown(event, i)}
                        onPointerEnter={() => setHovered(i)}
                        onPointerLeave={() => setHovered(null)}
                        ref={element => {
                            buttons.current[i] = element;
                        }}
                        style={{ background: family.hex }}
                        tabIndex={i === stop ? 0 : -1}
                        type="button"
                    />
                ))}
            </div>
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
    gamut: Gamut;
    step: RampStep;
    onChange: (hex: string) => void;
    /** The colour as it moves, before the page has taken it. */
    onLive: (hex: string) => void;
    hue: RefObject<number | undefined>;
    handleRef: RefObject<HTMLDivElement | null>;
};

const PickerBody = ({ value, gamut, step, onChange, onLive, hue, handleRef }: PickerProps) => {
    // The colour as picked: its chroma may run past the edge after a turn of hue, and comes back
    // when the hue does. What is shown and written is the colour fitted inside sRGB.
    const [picked, setPicked] = useState(() => fromHex(value, hue.current));
    const color = fit(picked);
    const hex = oklchToHex(color);
    const { write, flush } = useWriter(value, onChange, next =>
        setPicked(previous => fromHex(next, previous.h)),
    );

    const pick = (next: Oklch, now = false) => {
        setPicked(next);
        hue.current = next.h;
        const out = oklchToHex(fit(next));
        onLive(out);
        write(out, now);
    };

    return (
        <>
            <Plane
                color={color}
                gamut={gamut}
                handleRef={handleRef}
                onPick={pick}
                onRelease={flush}
            />
            {/* A drag on the hue lets go here as well; the pointer's release bubbles up from the slider. */}
            <div onPointerUp={flush}>
                <SliderRow
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
            </div>
            <div className="flex items-center justify-between gap-3 tabular-nums">
                <span className="truncate text-neutral-600">{asOklch(color)}</span>
                <span className="font-mono text-neutral-950">{hex}</span>
            </div>
            <Families
                color={color}
                hex={hex}
                onPick={family => pick(family.color, true)}
                step={step}
            />
        </>
    );
};

export type AccentPickerProps = {
    /** The accent as hex. */
    value: string;
    /** The theme's gamut: how far past sRGB the plane is drawn in full. */
    gamut: Gamut;
    onChange: (hex: string) => void;
    /** The step the accent is, which Tailwind's families are offered at; the 500 unless given. */
    step?: RampStep;
};

/** The accent's colour well, opening the picker: an oklch plane, the hue, the value and Tailwind's families. */
export const AccentPicker = ({ value, gamut, onChange, step = '500' }: AccentPickerProps) => {
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

    return (
        <Popover>
            <PopoverTrigger
                aria-label="Pick an accent"
                className={cn(
                    'size-control shrink-0 cursor-pointer rounded-control ring-1 ring-neutral-950/10 ring-inset',
                    'outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2',
                    'data-popup-open:outline-2 data-popup-open:outline-neutral-300 data-popup-open:outline-solid data-popup-open:outline-offset-2',
                )}
                style={{ background: live ?? value }}
            />
            <PopoverContent align="start" aria-label="Primary colour" initialFocus={handleRef}>
                <PickerBody
                    gamut={gamut}
                    handleRef={handleRef}
                    hue={hue}
                    onChange={onChange}
                    onLive={setLive}
                    step={step}
                    value={value}
                />
            </PopoverContent>
        </Popover>
    );
};
