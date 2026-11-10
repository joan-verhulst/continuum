import { Button, ContinuumLogo, cn, focusRing } from 'continuum';
import { Menu, X } from 'lucide-react';
import {
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    useTransform,
    useVelocity,
} from 'motion/react';
import { type ComponentProps, type RefObject, useEffect, useId, useRef, useState } from 'react';

/*
 * The nav: a bar across the full page, held at the top as you scroll, a hairline under it and the
 * page showing faintly through. Its links are the page's sections; the one in view turns amber on a
 * pill that travels between them. Under a laptop's width the links fold into a menu under the bar.
 */

/** The width the pill pinches to mid-move, and on entering or leaving. */
const PINCH_WIDTH = 28;
/** The speed (px/s) at which the pill's stretch and blur are at their most. */
const STRETCH_VELOCITY = 2200;
const STRETCH = 1.5;
const BLUR_MAX = 4;
const MOVE_DURATION = 0.5;

const links = [
    { id: 'components', label: 'Components' },
    { id: 'mcp', label: 'MCP' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'before-after', label: 'Before and after' },
    { id: 'pricing', label: 'Pricing' },
] as const;

/** A Button drawn as an in-page link: the label is the Button's own children. */
const linkTo = (href: string) => (props: ComponentProps<'a'>) => <a href={href} {...props} />;

/** The curve the page scrolls on after a click, a strong ease-out. */
const SCROLL_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The section the reader is in: the last linked one whose top has passed the middle of the screen.
 * A section without a link of its own (the uses between MCP and How it works) keeps the one above
 * it current, so the pill always travels from link to link and never fades out between them; only
 * above the first section is nothing current. `go` scrolls to a section and holds the spy meanwhile,
 * so the pill goes straight to the link pressed instead of stopping at every section on the way.
 */
const useCurrentSection = (ids: readonly string[]) => {
    const [current, setCurrent] = useState<string>();
    const locked = useRef(false);
    const spy = () => {
        const line = window.innerHeight / 2;
        setCurrent(
            ids.findLast(
                id => (document.getElementById(id)?.getBoundingClientRect().top ?? line) < line,
            ),
        );
    };
    const spyRef = useRef(spy);
    spyRef.current = spy;

    useEffect(() => {
        let frame = 0;
        const onScroll = () => {
            if (locked.current || frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                if (!locked.current) spyRef.current();
            });
        };
        spyRef.current();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    const go = (id: string) => {
        const section = document.getElementById(id);
        if (!section) return;
        locked.current = true;
        setCurrent(id);
        const margin = Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
        const y = Math.max(0, section.getBoundingClientRect().top + window.scrollY - margin);
        const release = () => {
            if (!locked.current) return;
            locked.current = false;
            window.removeEventListener('wheel', release);
            window.removeEventListener('touchstart', release);
            controls.stop();
            spyRef.current();
        };
        // Instant steps, or the page's own smooth scrolling would ease each one again.
        const step = (top: number) => window.scrollTo({ top, behavior: 'instant' });
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Timed by screens travelled, so a long leap doesn't fly and a short one doesn't drag.
        const screens = Math.abs(y - window.scrollY) / window.innerHeight;
        const controls = animate(window.scrollY, y, {
            duration: reduce ? 0 : Math.min(2.2, Math.max(0.7, screens * 0.6)),
            ease: SCROLL_EASE,
            onUpdate: step,
        });
        // A wheel or a touch takes the page back, and the spy with it.
        window.addEventListener('wheel', release, { passive: true });
        window.addEventListener('touchstart', release, { passive: true });
        controls.finished.then(release, release);
        history.replaceState(null, '', `#${id}`);
    };

    return { current, go };
};

const ids = links.map(link => link.id);

/**
 * The pill under the current link, as on the Eyes landing page: on a move it pinches narrow at the
 * edge it leaves from, glides over stretched and blurred by its speed, then springs open on the new
 * link. It fades in and out where it stands when no section is current.
 */
const ActivePill = ({
    index,
    list,
}: {
    index: number;
    list: RefObject<HTMLUListElement | null>;
}) => {
    // `anchor` is the trailing edge, the side the pill leaves from; `dir` is +1 right, -1 left.
    const anchor = useMotionValue(0);
    const width = useMotionValue(0);
    const opacity = useMotionValue(0);
    const dir = useRef(1);
    const prevIndex = useRef(-1);
    const activeRef = useRef(-1);

    // Both values are read in each branch, so the transforms follow a change to either.
    const x = useTransform(() => {
        const a = anchor.get();
        const w = width.get();
        return dir.current >= 0 ? a : a - w;
    });
    const center = useTransform(() => {
        const a = anchor.get();
        const w = width.get();
        return dir.current >= 0 ? a + w / 2 : a - w / 2;
    });
    const velocity = useVelocity(center);
    const scaleX = useTransform(
        velocity,
        [-STRETCH_VELOCITY, 0, STRETCH_VELOCITY],
        [STRETCH, 1, STRETCH],
    );
    const blur = useTransform(
        velocity,
        [-STRETCH_VELOCITY, 0, STRETCH_VELOCITY],
        [BLUR_MAX, 0, BLUR_MAX],
    );
    const filter = useMotionTemplate`blur(${blur}px)`;

    useEffect(() => {
        const prev = prevIndex.current;
        prevIndex.current = index;
        activeRef.current = index;

        if (index < 0) {
            if (prev < 0) return;
            const out = [
                animate(opacity, 0, { duration: 0.25, ease: 'easeIn' }),
                animate(width, PINCH_WIDTH, { duration: 0.25, ease: 'easeIn' }),
            ];
            return () => {
                for (const control of out) control.stop();
            };
        }

        const item = list.current?.querySelectorAll('li')[index];
        if (!item) return;
        const { offsetLeft: left, offsetWidth: w } = item;

        // Entering: it appears on the link and fades in.
        if (prev < 0) {
            dir.current = 1;
            anchor.set(left);
            width.set(w);
            const enter = animate(opacity, 1, { duration: 0.2, ease: 'easeOut' });
            return () => enter.stop();
        }

        opacity.set(1);
        const d = left + w / 2 >= center.get() ? 1 : -1;
        const curLeft = x.get();
        const curW = width.get();
        dir.current = d;
        // Relabelled to the trailing edge, so it doesn't jump.
        const startAnchor = d >= 0 ? curLeft : curLeft + curW;
        const targetAnchor = d >= 0 ? left : left + w;
        anchor.set(startAnchor);

        // The grow is a spring chained onto the pinch, handed off before the glide lands so the two overlap.
        let cancelled = false;
        let grow: ReturnType<typeof animate> | null = null;
        const glide = animate(anchor, [startAnchor, startAnchor, targetAnchor, targetAnchor], {
            duration: MOVE_DURATION,
            times: [0, 0.3, 0.75, 1],
            ease: ['linear', 'easeInOut', 'linear'],
        });
        const pinch = animate(width, [curW, PINCH_WIDTH, PINCH_WIDTH], {
            duration: MOVE_DURATION * 0.55,
            times: [0, 0.6, 1],
            ease: ['easeIn', 'linear'],
        });
        pinch
            .then(() => {
                if (!cancelled)
                    grow = animate(width, w, { type: 'spring', bounce: 0.35, duration: 0.45 });
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            glide.stop();
            pinch.stop();
            grow?.stop();
        };
    }, [index, list, anchor, width, opacity, x, center]);

    // The webfont swaps in after the first measure and a resize moves the row: the pill follows.
    useEffect(() => {
        const row = list.current;
        if (!row) return;
        let live = true;
        const remeasure = () => {
            const item = row.querySelectorAll('li')[activeRef.current];
            if (!live || !item) return;
            anchor.set(dir.current >= 0 ? item.offsetLeft : item.offsetLeft + item.offsetWidth);
            width.set(item.offsetWidth);
        };
        // The first delivery lands mid-move; only later ones mean the row really moved.
        let observed = false;
        const observer = new ResizeObserver(() => {
            if (observed) remeasure();
            observed = true;
        });
        observer.observe(row);
        document.fonts.ready.then(remeasure);
        return () => {
            live = false;
            observer.disconnect();
        };
    }, [list, anchor, width]);

    return (
        <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 rounded-control bg-primary-500/12"
            style={{ x, width, opacity, scaleX, filter }}
        />
    );
};

export const Nav = () => {
    const [open, setOpen] = useState(false);
    const { current, go } = useCurrentSection(ids);
    const menuId = useId();
    const nav = useRef<HTMLElement>(null);
    const row = useRef<HTMLUListElement>(null);

    // The menu closes on Escape, on a press outside the bar, and once the links fit the bar.
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
        const onPress = (event: PointerEvent) => {
            if (!nav.current?.contains(event.target as Node)) setOpen(false);
        };
        const wide = window.matchMedia('(min-width: 1024px)');
        const onWide = () => wide.matches && setOpen(false);
        window.addEventListener('keydown', onKey);
        window.addEventListener('pointerdown', onPress);
        wide.addEventListener('change', onWide);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('pointerdown', onPress);
            wide.removeEventListener('change', onWide);
        };
    }, [open]);

    return (
        <header className="sticky top-0 z-40 border-neutral-200 border-b bg-neutral-50/85 backdrop-blur-md">
            <nav aria-label="Main" className="w-full px-4 sm:px-6" ref={nav}>
                <div className="flex h-14 items-center gap-2 lg:gap-4">
                    {/* Both ends take the same share, so the links sit in the bar's middle. */}
                    <div className="flex flex-1">
                        <a
                            aria-label="Continuum, back to the top"
                            className={cn('flex items-center rounded-item', focusRing)}
                            href="#top"
                        >
                            <ContinuumLogo size={22} />
                        </a>
                    </div>
                    <ul className="relative hidden items-center gap-0.5 lg:flex" ref={row}>
                        <ActivePill
                            index={links.findIndex(link => link.id === current)}
                            list={row}
                        />
                        {links.map(link => (
                            <li className="relative" key={link.id}>
                                <a
                                    aria-current={current === link.id ? 'true' : undefined}
                                    className={cn(
                                        // 34 high, on the control corner.
                                        'flex h-control items-center gap-2 rounded-control px-3 text-neutral-600 text-sm transition-[background-color,color] duration-150',
                                        'hover:text-neutral-950 aria-[current]:text-primary-500',
                                        focusRing,
                                    )}
                                    href={`#${link.id}`}
                                    onClick={event => {
                                        event.preventDefault();
                                        go(link.id);
                                    }}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-1 items-center justify-end gap-1">
                        <Button
                            // On the narrowest phones the hero holds the same action right under the bar.
                            className="max-[359px]:hidden"
                            render={linkTo('#pricing')}
                        >
                            Get started
                        </Button>
                        <Button
                            aria-controls={menuId}
                            aria-expanded={open}
                            aria-label={open ? 'Close the menu' : 'Open the menu'}
                            className="lg:hidden"
                            onClick={() => setOpen(value => !value)}
                            size="icon"
                            variant="ghost"
                        >
                            {open ? <X strokeWidth={2} /> : <Menu strokeWidth={2} />}
                        </Button>
                    </div>
                </div>
                <ul
                    className={cn(
                        'flex flex-col gap-0.5 border-neutral-200 border-t py-2 lg:hidden',
                        !open && 'hidden',
                    )}
                    id={menuId}
                >
                    {links.map(link => (
                        <li key={link.id}>
                            <a
                                aria-current={current === link.id ? 'true' : undefined}
                                className={cn(
                                    'flex h-option items-center gap-2 rounded-control px-3 text-neutral-700 text-sm transition-[background-color,color] duration-150',
                                    'hover:bg-neutral-950/5 hover:text-neutral-950',
                                    'aria-[current]:bg-primary-500/12 aria-[current]:text-primary-500',
                                    'outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:-outline-offset-2',
                                )}
                                href={`#${link.id}`}
                                onClick={() => setOpen(false)}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
};
