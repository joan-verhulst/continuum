'use client';

/*
 * The rim light from Eyes (apps/frontend/src/components/motion/rim-light.tsx), with a spectrum for
 * its stops: a bright arc of colour travelling round a shape's edge, with a soft halo behind it.
 * The landing's own light, so it reads apart from the product, whose action is plain white.
 */

import { cn } from '@contui/ui';
import {
    type PropsWithChildren,
    type Ref,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

interface LayerSpec {
    /** `0` means "fill the shape and carve a 1px band out of it": the coloured border itself. */
    stroke: number;
    blur: number;
    alpha: number;
}

interface Geometry {
    width: number;
    height: number;
    radius: number;
}

interface RimLightHandle {
    /** Fire one pulse. A no-op while offscreen, on a hidden tab, or under reduced motion. */
    play: () => void;
}

/** Matches the stage morphs that resize around a rim-lit shape (`EASE_DRAWER` over a second). */
const MORPH = 'border-radius 1s cubic-bezier(0.32, 0.72, 0, 1)';

interface Props extends PropsWithChildren {
    ref?: Ref<RimLightHandle>;
    /** The body: owns the shape. Its computed border-radius is what every mask is drawn from. */
    className?: string;
    /** The face: the visible surface, inset 1px so the carved band has somewhere to sit. */
    faceClassName?: string;
    /** Blur of the softest layer, reaching `blur * 3` past the box; the default 32 puts light
     *  116px out. Trim it to the container, or the halo clips square against its edge. */
    haloBlur?: number;
    /** Scales the soft layers' alpha. `0` leaves the carved 1px band alone: the travelling edge
     *  with no halo, and no blurred canvas drawn at all. */
    glow?: number;
    /** A corner in px for a shape that morphs: both layers ease to it together instead of the face
     *  snapping to a re-measured class radius once the box settles. */
    radius?: number;
    /** Five 6-digit hex colours, head → tail. */
    stops?: string[];
    /** Pulse forever instead of waiting for `play()`. Still pauses offscreen and on a hidden tab. */
    loop?: boolean;
    /** Light the whole ring at once: the stops all the way round. Held still, or with `loop` the
     *  colours flow round the edge, a lap every `lap` seconds. */
    ring?: boolean;
    /** Seconds per lap when looping; defaults to the stylesheet's 2.4s. */
    lap?: number;
    /** `play()` runs one full lap of the looping light instead of the short pulse, fading in and
     *  out at its ends. */
    lapOnPlay?: boolean;
    /**
     * A wide glow behind the shape, spilling onto what is round it: the same travelling arc, blurred
     * far out, so it moves (and pauses) with the rim. `inset` as CSS `inset` against the body, in
     * negative values to reach past it.
     */
    ambient?: { inset: string; blur: number; opacity: number };
}

/** The falloff, from a tight bright band to a wide soft one. The last entry has no width and
 *  becomes the 1px coloured edge. */
const LAYERS: LayerSpec[] = [
    { stroke: 4, blur: 4, alpha: 0.3 },
    { stroke: 8, blur: 8, alpha: 0.2 },
    { stroke: 16, blur: 12, alpha: 0.1 },
    { stroke: 20, blur: 32, alpha: 0.32 },
    { stroke: 0, blur: 0, alpha: 1 },
];

const HALO_LAYER = 3;

/** Head → tail, a spectrum: rose, amber, lime, cyan, violet. A dark stop lands as a smudge however much contrast it has, so every stop is bright. */
const DEFAULT_STOPS = ['#ff4d8d', '#ffb03a', '#c6f04a', '#3ad8f0', '#8b7bff'];

/** A short bright arc with a long transparent tail; colour the ring evenly and it becomes a
 *  glowing border instead. Alpha is appended as hex, so stops must be 6-digit. */
const gradientOf = (stops: string[]) => {
    const [head, early, core, late, tail] = stops;

    return `conic-gradient(from var(--rim-from),
        ${head} 0deg,
        ${early} var(--rim-a),
        ${core} var(--rim-b),
        ${late} var(--rim-c),
        ${tail} var(--rim-d),
        ${tail}cc var(--rim-e),
        transparent var(--rim-f),
        transparent 324deg,
        ${head}a1 349deg,
        ${head} 360deg)`;
};

/** The stops spread evenly all the way round and back to the head: a ring lit everywhere. It turns
 *  with `--rim-from`, so a loop flows the colours round the edge. */
const ringOf = (stops: string[]) =>
    `conic-gradient(from var(--rim-from), ${stops.join(', ')}, ${stops[0]})`;

/** How far a layer must sit outside the body, or its blurred stroke is clipped square. */
const padOf = (layer: LayerSpec) => layer.stroke + layer.blur * 3;

const ANGLES: [string, string][] = [
    ['--rim-from', '180deg'],
    ['--rim-a', '16deg'],
    ['--rim-b', '30deg'],
    ['--rim-c', '43deg'],
    ['--rim-d', '59deg'],
    ['--rim-e', '72deg'],
    ['--rim-f', '84deg'],
];

const STYLE_TEXT = `
@keyframes rim-pulse {
    0% {
        opacity: 0;
        --rim-from: 180deg;
        --rim-a: 16deg; --rim-b: 30deg; --rim-c: 43deg;
        --rim-d: 59deg; --rim-e: 72deg; --rim-f: 84deg;
    }
    10% { opacity: 1; }
    30% { opacity: 1; }
    100% {
        opacity: 0;
        --rim-from: 30deg;
        --rim-a: 6deg; --rim-b: 11deg; --rim-c: 17deg;
        --rim-d: 40deg; --rim-e: 90deg; --rim-f: 120deg;
    }
}
/* A full lap, linear, stops held still; the wedge must arrive back where it started at the same
   speed it left, or the seam between iterations reads as a stutter. */
@keyframes rim-travel {
    from { opacity: 1; --rim-from: 360deg; }
    to { opacity: 1; --rim-from: 0deg; }
}
/* One lap of the loop, faded in and out so a single run has ends. */
@keyframes rim-lap {
    0% { opacity: 0; --rim-from: 360deg; }
    10% { opacity: 1; }
    85% { opacity: 1; }
    100% { opacity: 0; --rim-from: 0deg; }
}
.rim-glow { opacity: 0; }
.rim-glow[data-playing='once'] { animation: rim-pulse 1.6s cubic-bezier(0.26, 0.94, 0.6, 1); }
.rim-glow[data-playing='loop'] { animation: rim-travel 2.4s linear infinite; }
.rim-glow[data-playing='lap'] { animation: rim-lap 2.4s linear; }
/* A lit ring shows whether or not it moves, so it holds under reduced motion too. */
.rim-glow[data-ring] { opacity: 1; }
.rim-glow[data-paused='true'] { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
    .rim-glow[data-playing] { animation: none; }
}`;

let injected = false;

/** Registering the angles is not optional: an unregistered custom property is just a token, so the
 *  browser cannot interpolate it and the wedge jumps between keyframes instead of sweeping. */
const ensureStyles = () => {
    if (injected) return;
    injected = true;

    if (typeof CSS !== 'undefined' && 'registerProperty' in CSS) {
        for (const [name, initialValue] of ANGLES) {
            try {
                CSS.registerProperty({ name, syntax: '<angle>', inherits: true, initialValue });
            } catch {
                // Already registered: a second mount, or a hot reload.
            }
        }
    }

    // One tag, rewritten rather than skipped when it exists: after a hot reload the page keeps the
    // old tag, and its rules would go stale.
    let style = document.querySelector<HTMLStyleElement>('style[data-rim-light]');
    if (!style) {
        style = document.createElement('style');
        style.dataset.rimLight = '';
        document.head.append(style);
    }
    style.textContent = STYLE_TEXT;
};

/** Same box, same mask, forever; after the first draw every rebuild is a lookup. */
const maskCache = new Map<string, string>();

/** A conic gradient of OPACITY stroked onto a rounded rect and blurred on a canvas; CSS cannot
 *  express this. Set `--rim-strength` (0-1) on any ancestor to scale the whole ring from outside;
 *  it defaults to 1 and multiplies every layer's alpha.
 **/
const drawMask = (geometry: Geometry, layer: LayerSpec, even: boolean): string => {
    const key = `${geometry.width}|${geometry.height}|${geometry.radius}|${layer.stroke}|${layer.blur}|${even}`;
    const cached = maskCache.get(key);
    if (cached) return cached;

    const pad = padOf(layer);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.ceil((geometry.width + pad * 2) * dpr);
    const height = Math.ceil((geometry.height + pad * 2) * dpr);

    // The sharp shape gets its own canvas so the blur below is a plain blit: a mirrored
    // `scale(-1, 1)` and an untransformed shadow offset do not share a coordinate space.
    const sharp = document.createElement('canvas');
    sharp.width = width;
    sharp.height = height;

    const source = sharp.getContext('2d');
    if (!source) return '';

    // Even, the ring exists all the way round and the colour wedge alone says where the light is,
    // required for a looping pulse to make a full lap. The partial conic leaves the top ~154deg
    // permanently transparent, which only suits a one-shot that never travels that far.
    const paint = (): string | CanvasGradient => {
        if (even) return '#000';

        const gradient = source.createConicGradient(0, width / 2, height / 2);
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(54 / 360, '#000');
        gradient.addColorStop(126 / 360, 'transparent');
        gradient.addColorStop(333 / 360, 'transparent');
        gradient.addColorStop(347 / 360, 'rgba(0, 0, 0, 0.1)');
        gradient.addColorStop(1, '#000');

        return gradient;
    };

    const gradient = paint();

    const shape = (inset: number) => {
        source.beginPath();
        source.roundRect(
            (pad + inset) * dpr,
            (pad + inset) * dpr,
            (geometry.width - inset * 2) * dpr,
            (geometry.height - inset * 2) * dpr,
            Math.max(0, geometry.radius - inset) * dpr,
        );
    };

    // The lit arc sits on the right, so one copy alone leaves the left edge dark; an even mask is
    // symmetric already.
    for (const mirrored of even ? [false] : [false, true]) {
        source.save();
        if (mirrored) {
            source.translate(width, 0);
            source.scale(-1, 1);
        }
        shape(0);
        if (layer.stroke === 0) {
            source.fillStyle = gradient;
            source.fill();
        }
        if (layer.stroke > 0) {
            source.strokeStyle = gradient;
            source.lineWidth = layer.stroke * dpr;
            source.stroke();
        }
        source.restore();
    }

    // Carve the band out of a fill rather than stroking at width 1: a 1px stroke straddles the
    // path and lands half a pixel outside the shape.
    if (layer.stroke === 0) {
        source.globalCompositeOperation = 'destination-out';
        source.fillStyle = '#000';
        shape(1);
        source.fill();
        source.globalCompositeOperation = 'source-over';
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (layer.blur > 0) {
        // The sharp copy is blitted in from far enough left that only its shadow lands on the
        // canvas. `shadowBlur` is twice the Gaussian's standard deviation where `filter: blur()`
        // is one, hence the doubling.
        const offscreen = width + height;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = layer.blur * 2 * dpr;
        ctx.shadowOffsetX = offscreen;
        ctx.drawImage(sharp, -offscreen, 0);
    } else {
        ctx.drawImage(sharp, 0, 0);
    }

    const url = canvas.toDataURL('image/png');
    maskCache.set(key, url);

    return url;
};

const RimLight = ({
    ref,
    className,
    faceClassName,
    haloBlur,
    glow,
    radius,
    stops,
    loop,
    ring,
    lap,
    lapOnPlay,
    ambient,
    children,
}: Props) => {
    const bodyRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const liveRef = useRef({ onScreen: false, hidden: false, reduced: false });
    const [geometry, setGeometry] = useState<Geometry | null>(null);

    const layers = LAYERS.map((layer, index) => {
        const tuned =
            index === HALO_LAYER && haloBlur !== undefined ? { ...layer, blur: haloBlur } : layer;

        // The carved band is the shape's own edge, not glow; it stays at full strength.
        return glow === undefined || tuned.stroke === 0
            ? tuned
            : { ...tuned, alpha: tuned.alpha * glow };
    });

    useImperativeHandle(ref, () => ({
        play: () => {
            const glow = glowRef.current;
            const live = liveRef.current;
            if (!glow || loop || ring || !live.onScreen || live.hidden || live.reduced) return;

            // Two frames apart, or both writes coalesce and the animation never restarts.
            glow.dataset.playing = 'none';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (glowRef.current)
                        glowRef.current.dataset.playing = lapOnPlay ? 'lap' : 'once';
                });
            });
        },
    }));

    useEffect(() => {
        const body = bodyRef.current;
        if (!body) return;

        ensureStyles();

        const live = liveRef.current;
        live.hidden = document.hidden;
        live.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let settle = 0;

        const measure = () => {
            // The *padding* box, which is what `inset` on the layers below resolves against, and a
            // layout size rather than a rect, which would report a scaled ancestor's scaling twice.
            const width = body.clientWidth;
            const height = body.clientHeight;
            const radius = Number.parseFloat(getComputedStyle(body).borderTopLeftRadius) || 0;

            setGeometry(current => {
                const next = {
                    width,
                    height,
                    // A pill's 9999px radius resolves to half the short side; clamp so does a circle.
                    radius: Math.min(radius, Math.min(width, height) / 2),
                };

                if (
                    current &&
                    current.width === next.width &&
                    current.height === next.height &&
                    current.radius === next.radius
                ) {
                    return current;
                }

                return next;
            });
        };

        measure();

        // Debounced until the box settles; the stale mask stretches to fit in the meantime.
        const resizeObserver = new ResizeObserver(() => {
            window.clearTimeout(settle);
            settle = window.setTimeout(measure, 120);
        });
        resizeObserver.observe(body);

        const syncPaused = () => {
            if (glowRef.current) {
                glowRef.current.dataset.paused = String(!live.onScreen || live.hidden);
            }
        };

        const intersection = new IntersectionObserver(entries => {
            live.onScreen = entries.some(entry => entry.isIntersecting);
            syncPaused();
        });
        intersection.observe(body);

        const onVisibility = () => {
            live.hidden = document.hidden;
            syncPaused();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.clearTimeout(settle);
            resizeObserver.disconnect();
            intersection.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    // A dimmed-out layer is skipped rather than drawn and hidden: the blurred draws are the cost.
    // A lap travels the whole ring, so it needs the loop's even mask; so does a ring lit all round.
    const even = loop === true || lapOnPlay === true || ring === true;
    const background = ring ? ringOf(stops ?? DEFAULT_STOPS) : gradientOf(stops ?? DEFAULT_STOPS);
    const masks = geometry
        ? layers.map(layer => (layer.alpha > 0 ? drawMask(geometry, layer, even) : ''))
        : null;

    return (
        <div
            ref={bodyRef}
            className={cn('relative isolate p-px', className)}
            style={radius === undefined ? undefined : { borderRadius: radius, transition: MORPH }}
        >
            {/* Under the content, always; above it the ring's soft inner edge washes the face out. */}
            <div
                ref={glowRef}
                aria-hidden
                data-playing={loop ? 'loop' : 'none'}
                data-ring={ring || undefined}
                data-paused="true"
                className="rim-glow pointer-events-none absolute inset-0 -z-10"
                style={even && lap ? { animationDuration: `${lap}s` } : undefined}
            >
                {/* Inside the animated layer, so it reads the same `--rim-from` as the rim. */}
                {ambient && (
                    <span
                        className="absolute block rounded-full"
                        style={{
                            inset: ambient.inset,
                            background,
                            filter: `blur(${ambient.blur}px)`,
                            opacity: ambient.opacity,
                        }}
                    />
                )}
                {masks?.map((mask, index) => {
                    const layer = layers[index];
                    return mask && layer ? (
                        <span
                            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed falloff, one span per LAYERS entry
                            key={index}
                            className="absolute block"
                            style={{
                                inset: -padOf(layer),
                                // Not the keyframes' own `opacity`, which they own on the layer
                                // above and would overwrite.
                                opacity: `calc(var(--rim-strength, 1) * ${layer.alpha})`,
                                background,
                                maskImage: `url(${mask})`,
                                maskSize: '100% 100%',
                                WebkitMaskImage: `url(${mask})`,
                                WebkitMaskSize: '100% 100%',
                            }}
                        />
                    ) : null;
                })}
            </div>

            <div
                className={cn('h-full w-full', faceClassName)}
                style={
                    radius === undefined
                        ? geometry
                            ? { borderRadius: `${Math.max(0, geometry.radius - 1)}px` }
                            : undefined
                        : { borderRadius: Math.max(0, radius - 1), transition: MORPH }
                }
            >
                {children}
            </div>
        </div>
    );
};

export type { RimLightHandle };
export { RimLight };
