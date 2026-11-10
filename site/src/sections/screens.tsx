import { screens } from '@screens/index';
import { buttonVariants, cn, focusRing } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import {
    type FocusEvent,
    type KeyboardEvent,
    type RefObject,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { ease, Reveal, Section, Shot, Window } from '../web';

/** How long a screen stays before the next takes its place. The bar under its tab is this timer. */
const DWELL = 7000;

/**
 * A screen is drawn 720px tall and as wide as the window, but never narrower than the 1280px the
 * screens are laid out for; a narrower window crops it. Never scaled: 13px stays 13px.
 */
const DRAWN = { minWidth: 1280, height: 720 };

/**
 * The window runs past the page's 1104px column, as the web register lets a showcase do, so a
 * screen fits whole at 1440: its 1280px and the window's hairlines. Below that it keeps the page's
 * gutter (16px on phones, 24 from sm) and crops.
 */
const bleed = {
    marginInline: `calc((100% - min(${DRAWN.minWidth + 2}px, 100vw - 2 * var(--gutter))) / 2)`,
} as const;

/** Below this window width the crop starts at the app's panel rather than at its sidebar. */
const NARROW = 768;

/** The screens open in full in the docs' Patterns view, in the page's own dark mode. */
const docs = '/docs';
const screensHref = `${docs}#view=patterns&mode=dark`;

const pad = (n: number) => String(n).padStart(2, '0');

/** Whether the tab is in front: a timer that kept running behind it would skip screens. */
const usePageVisible = () => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const sync = () => setVisible(!document.hidden);
        sync();
        document.addEventListener('visibilitychange', sync);
        return () => document.removeEventListener('visibilitychange', sync);
    }, []);

    return visible;
};

/** The width of an element, as it changes. */
const useWidth = (ref: RefObject<HTMLElement | null>) => {
    const [width, setWidth] = useState<number | null>(null);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        setWidth(node.getBoundingClientRect().width);
        const observer = new ResizeObserver(
            ([entry]) => entry && setWidth(entry.contentRect.width),
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [ref]);

    return width;
};

/**
 * Six screens of one app, one at a time in a large window, live and at their real size. The tabs
 * move on by themselves, each tab's bar filling as its screen's time runs; they hold while the
 * pointer or the keyboard is on them, while the section is off screen, and always under reduced
 * motion.
 */
export const Screens = () => {
    const reduce = useReducedMotion() ?? false;
    const [active, setActive] = useState(0);
    // Bumped on a pick, so the bar starts again even when the same tab is picked twice.
    const [lap, setLap] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const region = useRef<HTMLDivElement>(null);
    const body = useRef<HTMLDivElement>(null);
    const shot = useRef<HTMLDivElement>(null);
    const tabs = useRef<(HTMLButtonElement | null)[]>([]);
    const inView = useInView(region, { amount: 0.4 });
    const visible = usePageVisible();
    const width = useWidth(body);
    const [shift, setShift] = useState(0);
    const id = useId();

    const screen = screens[active] ?? screens[0];
    const running = !reduce && inView && visible && !hovered && !focused;

    const select = (index: number) => {
        setActive(index);
        setLap(value => value + 1);
    };

    const drawn = Math.max(width ?? DRAWN.minWidth, DRAWN.minWidth);

    // Where the crop starts: at the sidebar when the window is wide, at the app's panel on a phone
    // (the canvas's 8px left of it), and in the middle for a screen without the shell (sign-in).
    // biome-ignore lint/correctness/useExhaustiveDependencies: measured again for each screen.
    useLayoutEffect(() => {
        const root = shot.current;
        if (!root || width === null) return;
        const spare = Math.max(0, drawn - width);
        const panel = root.querySelector('[data-slot="app-panel"]');
        if (!root.querySelector('[data-slot="app-shell"]')) setShift(spare / 2);
        else if (width < NARROW && panel) {
            // Both move with the shift, so the difference is the panel's place in the screen.
            const left = panel.getBoundingClientRect().left - root.getBoundingClientRect().left;
            setShift(Math.min(spare, Math.max(0, left - 8)));
        } else setShift(0);
    }, [active, width]);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const last = screens.length - 1;
        const next =
            event.key === 'ArrowRight'
                ? active === last
                    ? 0
                    : active + 1
                : event.key === 'ArrowLeft'
                  ? active === 0
                      ? last
                      : active - 1
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? last
                      : null;
        if (next === null) return;
        event.preventDefault();
        select(next);
        tabs.current[next]?.focus();
    };

    const onBlur = (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    };

    if (!screen) return null;

    return (
        <Section
            aside={
                <Reveal delay={1}>
                    <a
                        className={buttonVariants({ variant: 'secondary', size: 'lg' })}
                        href={screensHref}
                    >
                        Open the screens
                        <ArrowRight strokeWidth={2} />
                    </a>
                </Reveal>
            }
            description="Dashboard, list, detail, form, settings and sign-in: six screens of one product, built from those parts and nothing else. They run live here at their real size."
            eyebrow="The app"
            id="screens"
            title="Put together, they make the whole app."
        >
            <style>
                {
                    '@keyframes site-screens-dwell { from { transform: scaleX(0) } to { transform: scaleX(1) } }'
                }
            </style>
            <Reveal>
                <div
                    className="flex flex-col gap-6"
                    onBlur={onBlur}
                    // The keyboard holds the screens; a click only picks one, and they move on
                    // again once the pointer leaves.
                    onFocus={event => {
                        if (event.target.matches(':focus-visible')) setFocused(true);
                    }}
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                    ref={region}
                >
                    <div
                        aria-label="Screens"
                        className="grid grid-cols-3 gap-x-4 gap-y-5 lg:grid-cols-6"
                        onKeyDown={onKeyDown}
                        role="tablist"
                    >
                        {screens.map((item, index) => {
                            const selected = index === active;
                            return (
                                <button
                                    aria-controls={`${id}-panel`}
                                    aria-selected={selected}
                                    className={cn(
                                        'group flex cursor-pointer flex-col gap-3 rounded-chip pb-1 text-left',
                                        focusRing,
                                    )}
                                    id={`${id}-tab-${item.id}`}
                                    key={item.id}
                                    onClick={() => select(index)}
                                    ref={node => {
                                        tabs.current[index] = node;
                                    }}
                                    role="tab"
                                    tabIndex={selected ? 0 : -1}
                                    type="button"
                                >
                                    <span className="relative h-0.5 overflow-hidden rounded-full bg-neutral-200">
                                        {selected && (
                                            <span
                                                className="absolute inset-0 origin-left bg-action"
                                                key={lap}
                                                onAnimationEnd={() =>
                                                    select((index + 1) % screens.length)
                                                }
                                                style={
                                                    reduce
                                                        ? undefined
                                                        : {
                                                              animation: `site-screens-dwell ${DWELL}ms linear forwards`,
                                                              animationPlayState: running
                                                                  ? 'running'
                                                                  : 'paused',
                                                          }
                                                }
                                            />
                                        )}
                                    </span>
                                    <span className="flex items-baseline gap-2">
                                        <span className="font-mono text-neutral-500 text-xxs tabular-nums">
                                            {pad(index + 1)}
                                        </span>
                                        <span
                                            className={cn(
                                                'font-medium text-base transition-colors duration-150',
                                                selected
                                                    ? 'text-neutral-950'
                                                    : 'text-neutral-500 group-hover:text-neutral-800',
                                            )}
                                        >
                                            {item.title}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div
                        aria-labelledby={`${id}-tab-${screen.id}`}
                        className="[--gutter:16px] sm:[--gutter:24px]"
                        id={`${id}-panel`}
                        role="tabpanel"
                        style={bleed}
                    >
                        <Window
                            bar={
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2 text-xs sm:flex-row sm:items-center sm:gap-3">
                                    <span className="shrink-0 font-medium text-neutral-950">
                                        {screen.title}
                                    </span>
                                    <span className="min-w-0 text-neutral-600 sm:truncate">
                                        {screen.description}
                                    </span>
                                    <span className="ml-auto hidden shrink-0 pl-4 font-mono text-neutral-500 text-xxs sm:inline">
                                        1:1
                                    </span>
                                </div>
                            }
                            bodyClassName="h-130 flex-none md:h-180"
                        >
                            <div className="absolute inset-0" ref={body}>
                                {/*
                                 * Inert: a picture of the app, not a second app on the page. Its
                                 * headings and its forty controls stay out of the page's outline and
                                 * tab order; "Open the screens" is where they are used.
                                 */}
                                <div
                                    className="absolute top-0 left-0"
                                    inert
                                    ref={shot}
                                    style={{
                                        width: drawn,
                                        height: DRAWN.height,
                                        transform: `translateX(${-shift}px)`,
                                    }}
                                >
                                    <motion.div
                                        animate={{ opacity: 1 }}
                                        className="size-full"
                                        initial={reduce ? false : { opacity: 0 }}
                                        key={screen.id}
                                        transition={{ duration: 0.2, ease }}
                                    >
                                        <Shot>{screen.render()}</Shot>
                                    </motion.div>
                                </div>
                            </div>
                        </Window>
                    </div>
                </div>
            </Reveal>
        </Section>
    );
};
