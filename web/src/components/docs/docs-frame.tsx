'use client';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    cn,
    SidebarBack,
    SidebarGroup,
    SidebarItem,
    SidebarLevel,
    SidebarLevelHead,
} from 'continuum';
import {
    BookOpen,
    ChartLine,
    ChevronRight,
    Contrast,
    Download,
    Eye,
    LayoutGrid,
    LayoutTemplate,
    Paintbrush,
    Palette,
    PanelLeft,
    Pipette,
    Sparkles,
    Wrench,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Fragment,
    type ReactNode,
    type RefObject,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import type { DocsLink, DocsNav, DocsSection } from '@/lib/docs-nav';
import { SearchField } from '../site-search';

/*
 * The docs' frame, round every page of the docs sections: the sidebar on the left, held under the
 * header as the page scrolls, and over the page a top bar with the trail to it and the search.
 * Under a laptop's width the sidebar leaves for a drawer, opened from the top bar. The page itself
 * (its board, its sections) is drawn by the page, as before.
 *
 * The sidebar drills down as the app's does, in the library's own sidebar parts: the top level holds
 * a flat section's pages (Getting started; the tools' shell is one flat section) and the sections,
 * each with its icon and a chevron; a section opens its own index under a back row, its families
 * under their labels. A page in a section opens with that section's index; Back shows the top level
 * again, the page staying where it is.
 */

const within = (pathname: string, href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

/** The trail to a page: its section, the page that holds it if any, then the page. */
const trailTo = (nav: DocsNav, pathname: string): DocsLink[] => {
    const section = nav.sections.find(item => within(pathname, item.href));
    if (!section) return [];
    const head = { href: section.href, label: section.crumb ?? section.label };
    if (pathname === section.href) return [head];
    const links = section.groups.flatMap(group => group.items);
    const page = links.find(link => link.href === pathname);
    if (page) return [head, page];
    const extra = nav.extras[pathname];
    const parent = extra && links.find(link => link.href === extra.parent);
    if (extra && parent) return [head, parent, extra];
    return [head];
};

const icon = { strokeWidth: 2 } as const;

/** Each section's icon, the app's own where it has the same section. */
const sectionIcons: Record<string, ReactNode> = {
    '/foundations': <Palette {...icon} />,
    '/components': <LayoutGrid {...icon} />,
    '/charts': <ChartLine {...icon} />,
    '/examples': <LayoutTemplate {...icon} />,
    '/ai': <Sparkles {...icon} />,
};

/** The pages of the flat sections (Getting started, and the tools in their own shell), which sit on the top level itself. */
const pageIcons: Record<string, ReactNode> = {
    '/docs': <BookOpen {...icon} />,
    '/docs/install': <Download {...icon} />,
    '/tools': <Wrench {...icon} />,
    '/tools/theme-builder': <Paintbrush {...icon} />,
    '/tools/color-builder': <Pipette {...icon} />,
    '/tools/contrast-checker': <Contrast {...icon} />,
    '/tools/color-blindness-simulator': <Eye {...icon} />,
};

/** A section with an index of its own; a flat one's few pages sit on the top level instead. */
const drills = (section: DocsSection) => !section.flat;

const linkTo = (href: string) => <Link href={href} />;

/**
 * The sidebar's two levels. `current` is the page the sidebar marks (an MCP tool's page marks the
 * MCP server's).
 */
const NavLevels = ({
    sections,
    current,
    headClassName,
}: {
    sections: DocsSection[];
    current: string;
    /** The back row's band takes the sidebar's own surface. */
    headClassName?: string;
}) => {
    const open = sections.find(section => drills(section) && within(current, section.href));
    // The section the reader went back from; a new page forgets it, and opens its own section.
    const [backFrom, setBackFrom] = useState<string>();
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new page
    useEffect(() => setBackFrom(undefined), [current]);
    const drilled = open && backFrom !== open.href ? open : undefined;

    if (drilled) {
        return (
            <SidebarLevel key={`index-${drilled.href}`}>
                <SidebarLevelHead className={headClassName}>
                    <SidebarBack
                        backLabel="Back to the menu"
                        onClick={() => setBackFrom(drilled.href)}
                    >
                        {drilled.label}
                    </SidebarBack>
                </SidebarLevelHead>
                {drilled.groups.map((group, index) => (
                    <SidebarGroup
                        aria-label={group.label ?? drilled.label}
                        key={group.label ?? index}
                        label={group.label}
                    >
                        {group.items.map(item => (
                            <SidebarItem
                                active={item.href === current}
                                key={item.href}
                                render={linkTo(item.href)}
                            >
                                {item.label}
                            </SidebarItem>
                        ))}
                    </SidebarGroup>
                ))}
            </SidebarLevel>
        );
    }

    // In the sections' order: a flat section is a group of its own, the run of sections that
    // drill is held together as the Library.
    const blocks: (DocsSection | DocsSection[])[] = [];
    for (const section of sections) {
        const last = blocks.at(-1);
        if (!drills(section)) blocks.push(section);
        else if (Array.isArray(last)) last.push(section);
        else blocks.push([section]);
    }
    return (
        <SidebarLevel className="pt-1" from="start" key="top">
            {blocks.map(block =>
                Array.isArray(block) ? (
                    // Each opens its index page and its own level; the chevron says so.
                    <SidebarGroup aria-label="Library" key="library" label="Library">
                        {block.map(section => (
                            <SidebarItem
                                active={within(current, section.href)}
                                icon={sectionIcons[section.href]}
                                key={section.href}
                                onClick={() => setBackFrom(undefined)}
                                render={linkTo(section.href)}
                                trailing={<ChevronRight className="text-neutral-500" {...icon} />}
                            >
                                {section.label}
                            </SidebarItem>
                        ))}
                    </SidebarGroup>
                ) : (
                    <SidebarGroup aria-label={block.label} key={block.href} label={block.label}>
                        {block.groups
                            .flatMap(group => group.items)
                            .map(item => (
                                <SidebarItem
                                    active={item.href === current}
                                    icon={pageIcons[item.href]}
                                    key={item.href}
                                    render={linkTo(item.href)}
                                >
                                    {item.label}
                                </SidebarItem>
                            ))}
                    </SidebarGroup>
                ),
            )}
        </SidebarLevel>
    );
};

/** Brings the current page's link into the middle of a scrolling list, if it is out of view. */
const useCurrentInView = (box: RefObject<HTMLElement | null>, pathname: string) => {
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new page
    useLayoutEffect(() => {
        const list = box.current;
        const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
        if (!list || !current) return;
        const top = current.offsetTop;
        if (top < list.scrollTop || top + current.offsetHeight > list.scrollTop + list.clientHeight)
            list.scrollTop = top - list.clientHeight / 2;
    }, [pathname]);
};

const Sidebar = ({ nav, pathname }: { nav: DocsNav; pathname: string }) => {
    const box = useRef<HTMLElement>(null);
    useCurrentInView(box, pathname);
    return (
        <nav
            aria-label={nav.name}
            className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 self-start overflow-y-auto overscroll-contain border-neutral-200 border-r px-1 pb-16 lg:block"
            ref={box}
        >
            {/* The head the bar's height (48 and its hairline), so their lines meet across the page. */}
            <NavLevels
                current={pathname}
                headClassName="bg-neutral-50 py-1.75"
                sections={nav.sections}
            />
        </nav>
    );
};

/**
 * The sidebar on a narrow screen: a drawer from the left over a scrim. It opens under the header,
 * as the page's layer sits below the header's.
 */
const Drawer = ({
    open,
    onClose,
    nav,
    pathname,
}: {
    open: boolean;
    onClose: () => void;
    nav: DocsNav;
    pathname: string;
}) => {
    const box = useRef<HTMLDivElement>(null);
    useCurrentInView(box, open ? pathname : '');

    useEffect(() => {
        if (!open) return;
        box.current?.focus();
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <div className={cn('fixed inset-x-0 top-16 bottom-0 z-50 lg:hidden', !open && 'hidden')}>
            <button
                aria-label={`Close the ${nav.name.toLowerCase()} menu`}
                className="absolute inset-0 bg-neutral-950/40"
                onClick={onClose}
                tabIndex={-1}
                type="button"
            />
            {/* The close button stays put; only the links scroll under it. */}
            <nav
                aria-label={nav.name}
                className="absolute inset-y-0 left-0 flex w-72 max-w-[calc(100%-48px)] flex-col bg-neutral-100 shadow-sheet"
            >
                <div className="flex shrink-0 justify-end px-3 pt-3">
                    <Button
                        aria-label={`Close the ${nav.name.toLowerCase()} menu`}
                        onClick={onClose}
                        size="icon"
                        variant="ghost"
                    >
                        <X strokeWidth={2} />
                    </Button>
                </div>
                <div
                    className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-16 outline-none"
                    ref={box}
                    tabIndex={-1}
                >
                    <NavLevels current={pathname} sections={nav.sections} />
                </div>
            </nav>
        </div>
    );
};

/** Over the page: the drawer's toggle on a narrow screen, the trail, the search. */
const TopBar = ({
    nav,
    trail,
    onMenu,
}: {
    nav: DocsNav;
    trail: DocsLink[];
    onMenu: () => void;
}) => (
    <div className="sticky top-16 z-30 border-neutral-200 border-b bg-neutral-50/85 backdrop-blur-md">
        <div className="flex h-12 items-center gap-2 px-4 sm:gap-4 sm:px-6">
            <Button
                aria-label={`Open the ${nav.name.toLowerCase()} menu`}
                className="-ml-1.5 lg:hidden"
                onClick={onMenu}
                size="icon"
                variant="ghost"
            >
                <PanelLeft strokeWidth={2} />
            </Button>
            <Breadcrumb className="min-w-0 flex-1">
                <BreadcrumbList className="flex-nowrap">
                    {trail.map((crumb, index) => (
                        <Fragment key={crumb.href}>
                            {index > 0 && <BreadcrumbSeparator />}
                            <BreadcrumbItem className="min-w-0">
                                {index === trail.length - 1 ? (
                                    <BreadcrumbPage className="truncate">
                                        {crumb.label}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink
                                        className="truncate"
                                        render={<Link href={crumb.href} />}
                                    >
                                        {crumb.label}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
            <SearchField className="w-60 shrink-0 max-sm:w-auto" label={nav.search} />
        </div>
    </div>
);

export const DocsFrame = ({ nav, children }: { nav: DocsNav; children: ReactNode }) => {
    const pathname = usePathname() ?? '/';
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    // The link the sidebar marks: the page's own, or for an MCP tool's page, the MCP server's.
    const current = nav.extras[pathname]?.parent ?? pathname;

    // A new page closes the drawer.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new path
    useEffect(() => setOpen(false), [pathname]);

    return (
        <div className="flex w-full min-w-0">
            <Sidebar nav={nav} pathname={current} />
            <Drawer nav={nav} onClose={close} open={open} pathname={current} />
            <main className="flex min-w-0 flex-1 flex-col">
                <TopBar nav={nav} onMenu={() => setOpen(true)} trail={trailTo(nav, pathname)} />
                {children}
            </main>
        </div>
    );
};
