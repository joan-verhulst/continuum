'use client';

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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ComponentProps, type RefObject, useEffect, useId, useRef, useState } from 'react';
import { inSection, sections } from '@/lib/nav';
import { appLink, githubUrl } from '@/lib/site';
import { GithubMark } from './github-mark';
import { ModeSwitch } from './mode';

/*
 * The site's one header, on every page: a bar across the full page, held at the top as you scroll,
 * a hairline under it and the page showing faintly through. The logo left, the site's sections in
 * the middle, the current one amber on a pill that travels between them, and at the right GitHub and
 * the mode switch, small ghost icons, beside the one action, Get started. On the landing the pill
 * follows the section in view (Components is also a section there); on every other page it marks the
 * page's section. Under a laptop's width the links fold into a menu under the bar.
 */

/** The width the pill pinches to mid-move, and on entering or leaving. */
const PINCH_WIDTH = 28;
/** The speed (px/s) at which the pill's stretch and blur are at their most. */
const STRETCH_VELOCITY = 2200;
const STRETCH = 1.5;
const BLUR_MAX = 4;
const MOVE_DURATION = 0.5;

/** The site's sections, each its own page; `id` is its section's id on the landing. */
const links = sections.map(section => ({
    id: section.href.slice(1),
    label: section.label,
    href: section.href,
    section,
}));

const ids = links.map(link => link.id);

/** A Button drawn as a link: the label is the Button's own children. */
const linkTo = (href: string) => (props: ComponentProps<'a'>) => <a href={href} {...props} />;

/**
 * On the landing, the section the reader is in: the last linked one whose top has passed the middle
 * of the screen. A section without a link of its own keeps the one above it current, so the pill
 * always travels from link to link; only above the first section is nothing current. Off on every
 * other page, where the same ids may name a page's own sections.
 */
const useSectionInView = (enabled: boolean) => {
    const [current, setCurrent] = useState<string>();
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
        if (!enabled) {
            setCurrent(undefined);
            return;
        }
        let frame = 0;
        const onScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                spyRef.current();
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
    }, [enabled]);

    return current;
};

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

/** The quiet icons beside the action: GitHub, and light or dark where the page can switch. */
const IconLinks = ({ mode }: { mode: boolean }) => (
    <>
        <Button
            aria-label="Continuum on GitHub"
            // biome-ignore lint/a11y/useAnchorContent: the button names the link with its aria-label
            render={<a href={githubUrl} rel="noreferrer" target="_blank" />}
            size="icon"
            title="GitHub"
            variant="ghost"
        >
            <GithubMark className="size-4" />
        </Button>
        {/* The landing is dark whatever the choice, so the switch would do nothing there. */}
        {mode && <ModeSwitch />}
    </>
);

const linkClass = cn(
    // 34 high, on the control corner.
    'flex h-control items-center gap-2 rounded-control px-3 text-neutral-600 text-sm transition-[background-color,color] duration-150',
    'hover:text-neutral-950 aria-[current]:text-primary-500 light:aria-[current]:text-primary-700',
    focusRing,
);

const menuLinkClass = cn(
    'flex h-option items-center gap-2 rounded-control px-3 text-neutral-700 text-sm transition-[background-color,color] duration-150',
    'hover:bg-neutral-950/5 hover:text-neutral-950',
    'aria-[current]:bg-primary-500/12 aria-[current]:text-primary-500 light:aria-[current]:text-primary-700',
    'outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:-outline-offset-2',
);

export const SiteHeader = () => {
    const pathname = usePathname() ?? '/';
    const home = pathname === '/';
    const [open, setOpen] = useState(false);
    const inView = useSectionInView(home);
    const current = home ? inView : links.find(link => inSection(pathname, link.section))?.id;
    const menuId = useId();
    const nav = useRef<HTMLElement>(null);
    const row = useRef<HTMLUListElement>(null);

    // A new page closes the menu.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new path
    useEffect(() => setOpen(false), [pathname]);

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
                        {home ? (
                            <a
                                aria-label="Continuum, back to the top"
                                className={cn('flex items-center rounded-item', focusRing)}
                                href="#top"
                            >
                                <ContinuumLogo size={22} />
                            </a>
                        ) : (
                            <Link
                                aria-label="Continuum, home"
                                className={cn('flex items-center rounded-item', focusRing)}
                                href="/"
                            >
                                <ContinuumLogo size={22} />
                            </Link>
                        )}
                    </div>
                    <ul className="relative hidden items-center gap-0.5 lg:flex" ref={row}>
                        <ActivePill
                            index={links.findIndex(link => link.id === current)}
                            list={row}
                        />
                        {links.map(link => (
                            <li className="relative" key={link.id}>
                                <Link
                                    aria-current={current === link.id ? 'true' : undefined}
                                    className={linkClass}
                                    href={link.href}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-1 items-center justify-end gap-1">
                        <div className="flex items-center gap-0.5 max-sm:hidden">
                            <IconLinks mode={!home} />
                        </div>
                        <Button
                            // On the narrowest phones the hero holds the same action right under the bar.
                            className="ml-1 max-[359px]:hidden"
                            render={linkTo(appLink())}
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
                <div
                    className={cn(
                        'flex flex-col gap-2 border-neutral-200 border-t py-2 lg:hidden',
                        !open && 'hidden',
                    )}
                    id={menuId}
                >
                    <ul className="flex flex-col gap-0.5">
                        {links.map(link => (
                            <li key={link.id}>
                                <Link
                                    aria-current={current === link.id ? 'true' : undefined}
                                    className={menuLinkClass}
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {/* On phones the bar keeps only the action; GitHub and the mode wait here. */}
                    <div className="flex items-center gap-0.5 border-neutral-200 border-t pt-2 sm:hidden">
                        <IconLinks mode={!home} />
                    </div>
                </div>
            </nav>
        </header>
    );
};
