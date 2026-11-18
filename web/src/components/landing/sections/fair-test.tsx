'use client';

import { Overview } from '@screens/overview';
import { Button, cn, focusRing } from 'continuum';
import { ArrowRight, ChevronsLeftRight } from 'lucide-react';
import {
    animate,
    motion,
    useInView,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useTransform,
} from 'motion/react';
import {
    type KeyboardEvent,
    type PointerEvent,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { PlainOverview } from '../films/plain-overview';
import { ease, Reveal, Section, Shot, Window } from '../web';

/*
 * Before and after: one page as an agent built it, and the same page once Continuum brought it in
 * line (improve_ui with the project's app.css), under one drag divider at their real size. It is the
 * page the In practice "Improve a screen" film fixes, so the film shows how it got from one side to
 * the other. Both are drawn at the width the screens are laid out for and cropped by the window,
 * never scaled, so 13px stays 13px.
 *
 * The right is the playground's own Overview screen, live in the page's theme. The left is a
 * hand-built stand-in for a page an agent builds without the system (the default shadcn look: a
 * purple primary, a gradient header, cards on cards, mixed weights, loose 16px everything).
 */

/* ---------- The comparison ---------- */

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// Where the divider rests until it is measured: a little left of the Continuum page's title, so that
// side shows its whole column and the plain side its sidebar. The hint then swings it this far over
// the plain page and back.
const start = 26;
const swing = 32;

/**
 * The two outputs stacked at 1:1, the right one cut away left of the divider. Drag anywhere on it,
 * or focus the handle and use the arrow keys. On a phone both shift left past the sidebar, by the
 * same amount, so the crop lands on the page rather than on two sidebars.
 */
const Comparison = () => {
    const frame = useRef<HTMLDivElement>(null);
    const handle = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const position = useMotionValue(start);
    const [value, setValue] = useState(start);
    const screen = useRef<HTMLDivElement>(null);
    const rest = useRef(start);
    const touched = useRef(false);
    const inView = useInView(frame, { once: true, amount: 0.5 });

    useMotionValueEvent(position, 'change', next => setValue(Math.round(next)));
    const clip = useTransform(position, next => `inset(0 0 0 ${next}%)`);
    const left = useTransform(position, next => `${next}%`);
    // The handle stays whole at either end, while the line runs to the edge.
    const knob = useTransform(position, next => `clamp(24px, ${next}%, calc(100% - 24px))`);

    // Until it is moved, the divider rests 24px left of the Continuum page's title, wherever the
    // crop puts it at this width.
    useLayoutEffect(() => {
        const element = frame.current;
        if (!element) return;
        const place = () => {
            const bounds = element.getBoundingClientRect();
            const title = screen.current?.querySelector('h1')?.getBoundingClientRect();
            if (touched.current || !title || bounds.width === 0) return;
            rest.current = clamp(((title.left - bounds.left - 24) / bounds.width) * 100);
            if (!position.isAnimating()) position.set(rest.current);
        };
        place();
        const observer = new ResizeObserver(place);
        observer.observe(element);
        return () => observer.disconnect();
    }, [position]);

    // Once, as it comes into view: the divider swings over the plain page and back, so it reads as
    // something to drag.
    useEffect(() => {
        if (!inView || reduce || touched.current) return;
        const from = rest.current;
        const hint = animate(position, [from, Math.min(from + swing, 90), from], {
            duration: 1.8,
            ease,
            delay: 0.4,
        });
        return () => hint.stop();
    }, [inView, reduce, position]);

    // The screens are heavy and never change; made once, so a drag only moves the clip.
    const plain = useMemo(() => <PlainOverview />, []);
    const continuum = useMemo(
        () => (
            <Shot>
                <Overview />
            </Shot>
        ),
        [],
    );

    const take = () => {
        touched.current = true;
        position.stop();
    };

    const fromPointer = (clientX: number) => {
        const rect = frame.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        position.set(clamp(((clientX - rect.left) / rect.width) * 100));
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        take();
        event.currentTarget.setPointerCapture(event.pointerId);
        fromPointer(event.clientX);
        handle.current?.focus({ preventScroll: true });
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientX);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = event.shiftKey ? 10 : 5;
        const keys: Record<string, number> = {
            ArrowLeft: value - step,
            ArrowRight: value + step,
            PageDown: value - 20,
            PageUp: value + 20,
            Home: 0,
            End: 100,
        };
        const next = keys[event.key];
        if (next === undefined) return;
        event.preventDefault();
        take();
        position.set(clamp(next));
    };

    const layer = 'absolute inset-y-0 left-0 max-sm:-translate-x-[264px]';

    return (
        <Window
            bar={
                <div className="flex w-full items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-baseline gap-2">
                        <span className="font-medium text-neutral-950">Before</span>
                        <span className="truncate text-neutral-500 max-sm:hidden">
                            as your agent built it
                        </span>
                    </span>
                    <span className="text-neutral-500 max-md:hidden">Drag to compare</span>
                    <span className="flex min-w-0 items-baseline justify-end gap-2">
                        <span className="truncate text-neutral-500 max-sm:hidden">
                            improve_ui and your app.css
                        </span>
                        <span className="font-medium text-neutral-950">After</span>
                    </span>
                </div>
            }
            className="h-152 md:h-192"
        >
            <div
                className="absolute inset-0 cursor-ew-resize touch-pan-y select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                ref={frame}
            >
                {/* Both are pictures here: nothing inside them takes focus or a click. */}
                <div aria-hidden className="absolute inset-0" inert>
                    <div className={layer}>{plain}</div>
                </div>
                <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    inert
                    style={{ clipPath: clip }}
                >
                    <div className={cn(layer, 'w-7xl')} ref={screen}>
                        {continuum}
                    </div>
                </motion.div>

                <motion.div
                    className="pointer-events-none absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-neutral-950/60"
                    style={{ left }}
                />
                <motion.div
                    aria-label="Divider between the page before and after Continuum"
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={value}
                    aria-valuetext={`Before ${value}%, after ${100 - value}%`}
                    className={cn(
                        '-translate-1/2 absolute top-1/2 z-20 grid size-10 cursor-ew-resize place-items-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 shadow-float',
                        focusRing,
                    )}
                    onKeyDown={onKeyDown}
                    ref={handle}
                    role="slider"
                    style={{ left: knob }}
                    tabIndex={0}
                >
                    <ChevronsLeftRight className="size-4" strokeWidth={2} />
                </motion.div>
            </div>
        </Window>
    );
};

/** The proof in place of logos: one page before and after Continuum, one divider between them. */
export const FairTest = () => (
    <Section
        aside={
            // The write-up of the run comes with the real test; until then this goes to the comparison.
            // biome-ignore lint/a11y/useAnchorContent: the button renders its label into the link
            <Button render={<a href="/compare/shadcn-ui" />} size="lg" variant="secondary">
                Compare with shadcn/ui
                <ArrowRight strokeWidth={2} />
            </Button>
        }
        description="Continuum helps bring those decisions together, making it easier to maintain consistency across components, layouts and entire applications. Here is one page as an agent built it, and the same page after Continuum brought it in line. Drag to compare."
        eyebrow="Before and after"
        id="before-after"
        title="Good interfaces are the result of hundreds of considered decisions."
    >
        <Reveal>
            <Comparison />
        </Reveal>
    </Section>
);
