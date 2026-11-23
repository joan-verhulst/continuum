'use client';

import { ContinuumLogo } from '@playground/brand';
import { Button, cn, focusRing } from 'continuum';
import {
    ArrowRight,
    ChartArea,
    Contrast,
    Eye,
    FileText,
    Layers,
    LogIn,
    type LucideIcon,
    Menu,
    MousePointerClick,
    Paintbrush,
    Palette,
    Pipette,
    Ruler,
    ScanSearch,
    Server,
    Shapes,
    Sparkles,
    Table2,
    TextCursorInput,
    Type,
    X,
} from 'lucide-react';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    useTransform,
    useVelocity,
} from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    type ComponentProps,
    type KeyboardEvent as ReactKeyboardEvent,
    type RefObject,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import type { HeaderMenu } from '@/lib/header-menus';
import { inSection, inShell, sections } from '@/lib/nav';
import { appLink } from '@/lib/site';
import { ModeSwitch } from './mode';
import { GetStartedPro } from './pro-button';

/*
 * The site's one header, on every page: a bar across the full page, held at the top as you scroll,
 * a hairline under it and the page showing faintly through, its content on the page's 1152 column.
 * The logo left, the site's sections in the middle held in one rounded group, the current one on a
 * grey pill that travels between them, and at the right the mode switch, Sign in (an icon, straight
 * to the app) and the one action, Buy for €299 (GetStartedPro), leading to Pro's checkout. On the landing the pill follows the section in view (see `landing`); on every other page it
 * marks the page's section. Under a laptop's width the links fold into a menu under the bar.
 */

/** The width the pill pinches to mid-move, and on entering or leaving. */
const PINCH_WIDTH = 28;
/** The speed (px/s) at which the pill's stretch and blur are at their most. */
const STRETCH_VELOCITY = 2200;
const STRETCH = 1.5;
const BLUR_MAX = 4;
const MOVE_DURATION = 0.5;

/** The site's sections, each its own page; `id` is its section's id on the landing. */
const links = [
    ...sections.map(section => ({
        id: section.href.slice(1),
        label: section.label,
        href: section.href,
        section,
    })),
];

/**
 * The landing's sections, top to bottom, and the link each one lights: Components over the gallery,
 * AI over the MCP server and the jobs it runs. A section with no link lights none.
 */
const landing: readonly [section: string, link?: string][] = [
    ['components', 'components'],
    ['mcp', 'ai'],
    ['before-after'],
    ['uses', 'ai'],
    ['how-it-works'],
    ['built-with'],
    ['pricing'],
    ['get-started'],
];

/** A Button drawn as a link: the label is the Button's own children. */
const linkTo = (href: string) => (props: ComponentProps<'a'>) => <a href={href} {...props} />;

/**
 * On the landing, the link of the section the reader is in: the last section whose top has passed the
 * middle of the screen, and the link it lights, if any. Above the first section, and over one with no
 * link, nothing is current. Off on every other page, where the same ids may name a page's own sections.
 */
const useSectionInView = (enabled: boolean) => {
    const [current, setCurrent] = useState<string>();
    const spy = () => {
        const line = window.innerHeight / 2;
        const passed = landing.findLast(
            ([id]) => (document.getElementById(id)?.getBoundingClientRect().top ?? line) < line,
        );
        setCurrent(passed?.[1]);
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
            className="pointer-events-none absolute inset-y-0 left-0 rounded-control bg-selected"
            style={{ x, width, opacity, scaleX, filter }}
        />
    );
};

/**
 * Every foldout is this size, whichever section: a well at 16:10-ish for the light or a pick's
 * preview, and beside it the picks and the section's link, rows as high as the island's links.
 */
const FOLDOUT_WIDTH = 600;
const FOLDOUT_HEIGHT = 226;
const WELL_WIDTH = 336;

/** A row of the foldout: the island's link, 34 high on the control corner, the pill's grey on hover. */
const rowClass = cn(
    'group/row flex h-control items-center gap-2.5 rounded-control px-3 text-sm transition-[background-color,color] duration-150',
    'hover:bg-selected hover:text-neutral-950',
    focusRing,
);

/** The live previews, loaded apart from the header (they bring the playground's entries). */
const HeaderPreview = dynamic(
    () => import('./header-preview').then(module => module.HeaderPreview),
    {
        ssr: false,
    },
);
/** The least room the foldout keeps from the window's edges. */
const FOLDOUT_GUTTER = 16;
/** A pointer passing over the links on its way elsewhere opens nothing; once open, a move is instant. */
const OPEN_DELAY = 90;
/** Time to cross from a link to the foldout, or back, without it closing. */
const CLOSE_DELAY = 140;

/** The picks' icons, by the key the menu gives (an icon can't cross from the server). */
const menuIcons: Record<string, LucideIcon> = {
    actions: MousePointerClick,
    inputs: TextCursorInput,
    tables: Table2,
    charts: ChartArea,
    colour: Palette,
    type: Type,
    spacing: Ruler,
    'surfaces-and-depth': Layers,
    '/ai/skills': Sparkles,
    '/ai/mcp-server': Server,
    '/ai/audit': ScanSearch,
    '/ai/design-md': FileText,
    'theme-builder': Paintbrush,
    'color-builder': Pipette,
    'contrast-checker': Contrast,
    'color-blindness-simulator': Eye,
};

/** The cross-fade of the contents when the pointer moves to another section. */
const swap = {
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    initial: { opacity: 0 },
    transition: { duration: 0.14 },
} as const;

/**
 * The menu a section folds out under its link on hover, one size for every section: at its left a
 * tile in the site's light naming the section and leading to all of it, beside it four of its pages
 * to start from, each an icon and its name. It stands centred under the links' island whichever
 * section is open: moving to another link cross-fades the contents, and the light stays lit.
 */
const Foldout = ({
    id,
    menu,
    x,
    onNavigate,
    panel,
}: {
    id: string;
    menu: HeaderMenu;
    x: number;
    onNavigate: () => void;
    panel: RefObject<HTMLDivElement | null>;
}) => {
    // The visual of the pick under the pointer; none shows the section's light.
    const [visual, setVisual] = useState<string>();
    // biome-ignore lint/correctness/useExhaustiveDependencies: a new section starts on its light
    useEffect(() => setVisual(undefined), [id]);
    // The previews' module starts loading as the foldout opens, so a pick shows at once.
    useEffect(() => {
        void import('./header-preview');
    }, []);

    return (
        <motion.div
            animate={{ opacity: 1, y: 0, scale: 1, x }}
            className="absolute top-full left-0 pt-[18px]"
            exit={{
                opacity: 0,
                y: -4,
                scale: 0.98,
                transition: { duration: 0.12, ease: 'easeIn' },
            }}
            initial={{ opacity: 0, y: -4, scale: 0.98, x }}
            style={{ width: FOLDOUT_WIDTH, transformOrigin: 'top center' }}
            transition={{
                default: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
                x: { type: 'spring', bounce: 0.15, duration: 0.35 },
            }}
        >
            {/* The island's own wash, hairline, padding and corner, so the two read as one thing. */}
            <div
                className="flex gap-1 overflow-hidden rounded-[calc(var(--radius-control)+4px)] border border-neutral-200 bg-neutral-100 p-1 shadow-float"
                ref={panel}
                style={{ height: FOLDOUT_HEIGHT }}
            >
                {/* The well: the light under the section's name, or the pick under the pointer, live. */}
                <Link
                    className={cn(
                        'group relative isolate flex shrink-0 overflow-hidden rounded-control border border-neutral-200',
                        focusRing,
                    )}
                    href={menu.feature.href}
                    onClick={onNavigate}
                    style={{ width: WELL_WIDTH }}
                >
                    {/* The light, baked: one image for each mode, as the html's mode picks. */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 bg-neutral-50"
                    >
                        <img
                            alt=""
                            className="absolute inset-0 size-full object-cover [html[data-mode=dark]_&]:hidden"
                            src="/header/menu-light-light.jpg"
                        />
                        <img
                            alt=""
                            className="absolute inset-0 hidden size-full object-cover [html[data-mode=dark]_&]:block"
                            src="/header/menu-light-dark.jpg"
                        />
                    </div>
                    <AnimatePresence initial={false} mode="popLayout">
                        <motion.div
                            className="flex w-full flex-col justify-between p-5"
                            key={id}
                            {...swap}
                        >
                            <div className="flex flex-col gap-1">
                                <span className="font-medium text-base text-neutral-950">
                                    {menu.feature.title}
                                </span>
                                <span className="text-pretty text-neutral-600 text-sm">
                                    {menu.feature.text}
                                </span>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                    {/* The pick under the pointer, over the light: a picture, not a control. */}
                    <AnimatePresence initial={false}>
                        {visual && (
                            <motion.div
                                aria-hidden
                                className="absolute inset-0 bg-neutral-100"
                                key={visual}
                                {...swap}
                            >
                                <HeaderPreview visual={visual} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
                {/* The picks, as the island's links: a row each, then the whole section at the foot. */}
                <div className="relative min-w-0 flex-1">
                    <AnimatePresence initial={false} mode="popLayout">
                        <motion.div
                            className="flex h-full flex-col gap-0.5"
                            key={id}
                            onPointerLeave={() => setVisual(undefined)}
                            {...swap}
                        >
                            <ul className="flex flex-col gap-0.5">
                                {menu.items.map(item => {
                                    const Icon = menuIcons[item.icon] ?? Shapes;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                className={cn(rowClass, 'text-neutral-700')}
                                                href={item.href}
                                                onClick={onNavigate}
                                                onFocus={() => setVisual(item.visual)}
                                                onPointerEnter={() => setVisual(item.visual)}
                                            >
                                                <Icon
                                                    className="size-4 shrink-0 text-neutral-500 transition-colors duration-150 group-hover/row:text-neutral-950"
                                                    strokeWidth={2}
                                                />
                                                <span className="truncate">{item.label}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                            <Link
                                className={cn(rowClass, 'mt-auto justify-between text-neutral-950')}
                                href={menu.feature.href}
                                onClick={onNavigate}
                                onPointerEnter={() => setVisual(undefined)}
                            >
                                {menu.feature.action}
                                <ArrowRight
                                    className="size-4 shrink-0 text-neutral-500 transition-[color,translate] duration-150 group-hover/row:translate-x-0.5 group-hover/row:text-neutral-950"
                                    strokeWidth={2}
                                />
                            </Link>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

/** Beside the action: light or dark, where the page can switch (the landing is dark whatever the choice). */
const IconLinks = ({ mode }: { mode: boolean }) => (mode ? <ModeSwitch /> : null);

const linkClass = cn(
    // 34 high, on the control corner.
    'flex h-control items-center gap-2 rounded-control px-3 text-neutral-600 text-sm transition-[background-color,color] duration-150',
    'hover:text-neutral-950 aria-[current]:text-neutral-950 data-[open]:text-neutral-950',
    focusRing,
);

const menuLinkClass = cn(
    'flex h-option items-center gap-2 rounded-control px-3 text-neutral-700 text-sm transition-[background-color,color] duration-150',
    'hover:bg-neutral-950/5 hover:text-neutral-950',
    'aria-[current]:bg-selected aria-[current]:text-neutral-950',
    'outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:-outline-offset-2',
);

/**
 * Which section's foldout is open, and where its card stands: centred under the link, kept inside the
 * window. A link opens after a short pause, and at once while another is open; leaving the links and
 * the card closes it after a pause, so the pointer can cross between them.
 */
const useFoldout = (group: RefObject<HTMLDivElement | null>) => {
    const [open, setOpen] = useState<{ id: string; x: number }>();
    const openRef = useRef(open);
    openRef.current = open;
    const timer = useRef<number>(undefined);

    // One place for every section: centred under the links' island, kept inside the window.
    const place = (id: string) => {
        const box = group.current;
        if (!box) return undefined;
        const rect = box.getBoundingClientRect();
        const centred = rect.left + rect.width / 2 - FOLDOUT_WIDTH / 2;
        const max = window.innerWidth - FOLDOUT_GUTTER - FOLDOUT_WIDTH;
        return { id, x: Math.max(FOLDOUT_GUTTER, Math.min(centred, max)) - rect.left };
    };

    const show = (id: string, now = false) => {
        window.clearTimeout(timer.current);
        if (openRef.current || now) setOpen(place(id));
        else timer.current = window.setTimeout(() => setOpen(place(id)), OPEN_DELAY);
    };
    const hide = () => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOpen(undefined), CLOSE_DELAY);
    };
    const keep = () => window.clearTimeout(timer.current);
    const close = () => {
        window.clearTimeout(timer.current);
        setOpen(undefined);
    };

    useEffect(() => () => window.clearTimeout(timer.current), []);

    // Escape closes it; a resize would leave it off its link, so it closes then too.
    // biome-ignore lint/correctness/useExhaustiveDependencies: close only clears state
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            const trigger = group.current?.querySelector<HTMLElement>(
                `[data-foldout="${open.id}"] a`,
            );
            if (group.current?.contains(document.activeElement)) trigger?.focus();
            close();
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', close);
        };
    }, [open, group]);

    return { open, show, hide, keep, close };
};

export const SiteHeader = ({ menus = {} }: { menus?: Record<string, HeaderMenu> }) => {
    const pathname = usePathname() ?? '/';
    const home = pathname === '/';
    const docs = inShell(pathname);
    const [open, setOpen] = useState(false);
    const inView = useSectionInView(home);
    const current = home ? inView : links.find(link => inSection(pathname, link.section))?.id;
    const menuId = useId();
    const nav = useRef<HTMLElement>(null);
    const row = useRef<HTMLUListElement>(null);
    const group = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const foldout = useFoldout(group);
    const foldoutMenu = foldout.open && menus[foldout.open.id];

    // A new page closes the menu and the foldout.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new path
    useEffect(() => {
        setOpen(false);
        foldout.close();
    }, [pathname]);

    /** ArrowDown on a link opens its foldout and moves into it. */
    const onLinkKey = (id: string) => (event: ReactKeyboardEvent) => {
        if (event.key !== 'ArrowDown' || !menus[id]) return;
        event.preventDefault();
        foldout.show(id, true);
        requestAnimationFrame(() =>
            requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('a')?.focus()),
        );
    };

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
            {/* The docs run the full width, their sidebar at the left edge: the bar runs with them. */}
            <nav
                aria-label="Main"
                className={cn('mx-auto w-full px-4 sm:px-6', !docs && 'max-w-[1152px]')}
                ref={nav}
            >
                <div className="flex h-16 items-center gap-2 lg:gap-4">
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
                    {/* The links and their foldout are one hover area, so the pointer can cross between them. */}
                    <div
                        className="relative hidden lg:block"
                        onBlur={event => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                                foldout.close();
                        }}
                        onPointerEnter={foldout.keep}
                        onPointerLeave={foldout.hide}
                        ref={group}
                    >
                        {/* The links held together in one rounded group, its corner the control's plus its padding. */}
                        <div className="flex rounded-[calc(var(--radius-control)+4px)] border border-neutral-200 bg-neutral-100 p-1">
                            <ul className="relative flex items-center gap-0.5" ref={row}>
                                <ActivePill
                                    index={links.findIndex(link => link.id === current)}
                                    list={row}
                                />
                                {links.map(link => (
                                    <li
                                        className="relative"
                                        data-foldout={link.id}
                                        key={link.id}
                                        onPointerEnter={event => {
                                            if (event.pointerType !== 'mouse') return;
                                            if (menus[link.id]) foldout.show(link.id);
                                            else foldout.hide();
                                        }}
                                    >
                                        <Link
                                            aria-current={current === link.id ? 'true' : undefined}
                                            className={linkClass}
                                            data-open={
                                                foldout.open?.id === link.id ? '' : undefined
                                            }
                                            href={link.href}
                                            onClick={foldout.close}
                                            onKeyDown={onLinkKey(link.id)}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <AnimatePresence>
                            {foldout.open && foldoutMenu && (
                                <Foldout
                                    id={foldout.open.id}
                                    key="foldout"
                                    menu={foldoutMenu}
                                    onNavigate={foldout.close}
                                    panel={panel}
                                    x={foldout.open.x}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-1">
                        {/* No search button here for now: ⌘K still opens it, and the docs keep their field. */}
                        <div className="flex items-center gap-1 max-sm:hidden">
                            <IconLinks mode={!home} />
                        </div>
                        {/* Sign in: straight to the app, for those who have it. */}
                        <Button
                            aria-label="Sign in"
                            className="ml-1"
                            render={linkTo(appLink())}
                            size="icon"
                            title="Sign in"
                            variant="secondary"
                        >
                            <LogIn strokeWidth={2} />
                        </Button>
                        {/* The page's one action, on every width: the hero holds none of its own. */}
                        <GetStartedPro className="ml-1" />
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
                    {/* On phones the bar keeps only the action; the mode switch waits here. */}
                    {!home && (
                        <div className="flex items-center gap-1 border-neutral-200 border-t pt-2 sm:hidden">
                            <IconLinks mode />
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};
