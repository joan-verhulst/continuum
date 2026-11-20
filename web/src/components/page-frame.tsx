import {
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    cn,
} from 'continuum';
import { ArrowLeft, ArrowRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { inShell } from '@/lib/nav';
import { breadcrumbLd, type Crumb, JsonLd, MarkdownAlternate } from '@/lib/seo';
import { Container, Pill, Reveal, RuledFrame } from './landing/web';

/*
 * The frame every page of the site wears, the home page's own: under the header the board (the
 * hero's rounded panel with the layout grid faint inside it and a registration mark at each corner)
 * holding the page's breadcrumb, its pill, its title and the one sentence that says what it is,
 * centred as the home page's hero is; below the board, the page's content in the home page's column,
 * as sections (a title, a line, then what it shows) or as a grid of cards. No sidebar: a reader
 * moves by the header, the breadcrumb, an index page's cards and the links to the previous and next
 * page at the foot of a page.
 *
 *     <PageHero crumbs={[{ name: 'Components', path: '/components' }]} title="Components" lead="…" />
 *     <FrameSection title="Inputs" description="…">
 *         <CardGrid>{items.map(item => <LinkCard … />)}</CardGrid>
 *     </FrameSection>
 *
 * A long page reads in the Article column (its sections are article.tsx's ArticleSection), and
 * ends on PrevNext.
 */

/** A page of a section, in the section's order: its index lists them, PrevNext walks them. */
export type NavItem = {
    href: string;
    label: string;
};

/** A labelled run of a section's pages (a component family, "Recipes"). */
export type NavGroup = { label?: string; items: readonly NavItem[] };

/** A section's layout: the page's landmark, the hero and the content in it. */
export const SectionMain = ({ children }: { children: ReactNode }) => (
    <main className="flex min-w-0 flex-1 flex-col">{children}</main>
);

/** The breadcrumb, home first as the house, the page last and not a link; centred in the board. */
const Crumbs = ({ crumbs }: { crumbs: readonly Crumb[] }) => (
    <Breadcrumb>
        <BreadcrumbList className="justify-center">
            <BreadcrumbItem>
                <BreadcrumbLink aria-label="Home" render={<Link href="/" />}>
                    <BreadcrumbHome />
                </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((crumb, index) => (
                <Fragment key={crumb.path}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        {index === crumbs.length - 1 ? (
                            <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink render={<Link href={crumb.path} />}>
                                {crumb.name}
                            </BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                </Fragment>
            ))}
        </BreadcrumbList>
    </Breadcrumb>
);

/**
 * The top of every page, on the home page's board: the breadcrumb small at the top, then the pill,
 * the title at the hero's size (39, 48 from md) and the lead in the hero's grey 16 → 18, centred,
 * 24 apart; the actions 40 under them. The lead is the one plain sentence search and answer engines
 * quote. It also writes the trail as BreadcrumbList data and links the page's markdown twin (its
 * path plus .md). `children` lies on the board under the words: a figure that belongs to the hero.
 */
export const PageHero = ({
    crumbs,
    eyebrow,
    title,
    lead,
    actions,
    children,
}: {
    /** The trail after home, the page last. */
    crumbs: readonly Crumb[];
    /** A short label in the pill over the title: a component's family, a page's kind. */
    eyebrow?: ReactNode;
    title: ReactNode;
    lead: ReactNode;
    /** The page's one primary and at most a secondary. */
    actions?: ReactNode;
    children?: ReactNode;
}) => {
    // In the docs the trail sits in their top bar instead, and the board stands a little lower.
    const docs = inShell(crumbs[0]?.path ?? '/');
    return (
        <>
            <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, ...crumbs])} />
            {crumbs.length > 0 && (
                <MarkdownAlternate path={crumbs[crumbs.length - 1]?.path ?? '/'} />
            )}
            <RuledFrame outerClassName="pb-0 md:pb-0" top>
                <div
                    className={cn(
                        'flex flex-col items-center gap-10 px-4 pt-20 text-center sm:px-10',
                        docs ? 'md:pt-32' : 'md:pt-48',
                        children ? 'pb-12 md:pb-16' : docs ? 'pb-20 md:pb-32' : 'pb-20 md:pb-48',
                    )}
                >
                    {!docs && <Crumbs crumbs={crumbs} />}
                    <div className="flex max-w-[720px] flex-col items-center gap-6">
                        {eyebrow && <Pill>{eyebrow}</Pill>}
                        <h1 className="text-balance font-medium text-4xl text-neutral-950 leading-[1.05] tracking-[-0.02em] md:text-5xl">
                            {title}
                        </h1>
                        <p className="max-w-[620px] text-pretty text-base text-neutral-600 leading-[1.6] md:text-lg">
                            {lead}
                        </p>
                    </div>
                    {actions && (
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {actions}
                        </div>
                    )}
                </div>
                {children && <div className="px-4 pb-4 sm:px-10 sm:pb-10">{children}</div>}
            </RuledFrame>
        </>
    );
};

/** The sections of a long index, as quiet capsules under the hero's lead: one jump to each. */
export const JumpLinks = ({ links }: { links: readonly NavItem[] }) => (
    <nav aria-label="On this page" className="max-w-[760px]">
        <ul className="flex flex-wrap items-center justify-center gap-2">
            {links.map(link => (
                <li key={link.href}>
                    <a
                        className="inline-flex h-7 items-center rounded-full border border-neutral-200 px-3 text-neutral-600 text-xs outline-none transition-[border-color,color] duration-150 hover:border-neutral-300 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2"
                        href={link.href}
                    >
                        {link.label}
                    </a>
                </li>
            ))}
        </ul>
    </nav>
);

/**
 * A section of a page under the board, in the home page's column: its title (24 → 31) with an
 * optional count in grey, one line under it, then what it shows, 32 → 40 below. Sections stand
 * 64 → 96 apart.
 */
export const FrameSection = ({
    id,
    title,
    count,
    description,
    aside,
    children,
    className,
}: {
    id?: string;
    title?: ReactNode;
    /** How many it holds, quiet after the title. */
    count?: number;
    description?: ReactNode;
    /** A link for the section, at the header's end on wide screens. */
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
}) => (
    <section className={cn('scroll-mt-20 pt-16 md:pt-24', className)} id={id}>
        <Container className="flex flex-col gap-8 md:gap-10">
            {title && (
                <Reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                    <div className="flex max-w-[640px] flex-col gap-3">
                        <h2 className="text-balance font-medium text-2xl text-neutral-950 leading-[1.15] tracking-[-0.02em] md:text-3xl">
                            {title}
                            {count !== undefined && (
                                <span className="text-neutral-500"> {count}</span>
                            )}
                        </h2>
                        {description && (
                            <p className="text-pretty text-base text-neutral-600 leading-[1.6]">
                                {description}
                            </p>
                        )}
                    </div>
                    {aside}
                </Reveal>
            )}
            {children}
        </Container>
    </section>
);

/**
 * A long page's column under the board: 896 wide, its words in the 608 reading column inside it
 * (article.tsx), its figures, code and tables across the 896.
 */
export const Article = ({ children, className }: { children: ReactNode; className?: string }) => (
    <Container className={cn('max-w-[944px] pt-4 md:pt-8', className)}>{children}</Container>
);

const GRID = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
} as const;

/** Cards in an even grid, every one as tall as the tallest in its row. */
export const CardGrid = ({
    columns = 3,
    className,
    children,
}: {
    columns?: keyof typeof GRID;
    className?: string;
    children: ReactNode;
}) => (
    <ul className={cn('grid grid-cols-1 gap-4 *:flex *:min-w-0', GRID[columns], className)}>
        {children}
    </ul>
);

type CardIcon = LucideIcon | ReactElement;

const renderIcon = (icon: CardIcon) => {
    if (isValidElement(icon)) return icon;
    const Icon = icon as LucideIcon;
    return <Icon className="size-4.5" strokeWidth={2} />;
};

const arrowClass =
    'size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/card:translate-x-0.5 group-hover/card:text-neutral-950';

/**
 * A page as a card, the home page's tile: a panel on a hairline that lifts its border on hover.
 * With a `visual`, a picture inset at the top on the canvas, then the name and its line; without
 * one, an icon tile with the arrow beside it, then the name and its line. The whole card is the link.
 */
export const LinkCard = ({
    href,
    title,
    description,
    icon,
    meta,
    visual,
    mono = false,
    delay = 0,
}: {
    href: string;
    title: ReactNode;
    description?: ReactNode;
    icon?: CardIcon;
    /** A quiet label over the title: a family, a width, a kind. */
    meta?: ReactNode;
    /** A picture for the top of the card, drawn by the caller to fill a 16:10 box. */
    visual?: ReactNode;
    /** The title in mono, for what is typed (a tool's name). */
    mono?: boolean;
    /** Its place in its row, for the fade-in. */
    delay?: number;
}) => {
    const arrow = <ArrowRight aria-hidden className={arrowClass} strokeWidth={2} />;
    return (
        <li>
            <Reveal className="flex w-full" delay={delay}>
                {/* The title is the link, stretched over the whole card; a visual stays outside it,
                    as a screen it shows may hold links of its own. */}
                <div className="group/card relative flex w-full min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50 transition-[border-color] duration-150 hover:border-neutral-300 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-focus has-[a:focus-visible]:outline-solid has-[a:focus-visible]:outline-offset-2">
                    {visual && (
                        <div className="m-2 mb-0 aspect-[16/10] overflow-hidden rounded-[calc(var(--radius-panel)-8px)] bg-neutral-100">
                            {visual}
                        </div>
                    )}
                    <div className={cn('flex flex-1 flex-col gap-4', visual ? 'p-4 pt-3' : 'p-5')}>
                        {icon && !visual && (
                            <div className="flex items-start justify-between gap-4">
                                <span
                                    aria-hidden
                                    className="flex size-10 shrink-0 items-center justify-center rounded-item border border-neutral-200 bg-neutral-100 text-neutral-950"
                                >
                                    {renderIcon(icon)}
                                </span>
                                {arrow}
                            </div>
                        )}
                        <div className="flex min-w-0 flex-col gap-1.5">
                            {meta && <span className="text-neutral-500 text-xs">{meta}</span>}
                            <div className="flex items-start justify-between gap-3">
                                <Link
                                    className={cn(
                                        'min-w-0 text-balance font-medium text-base text-neutral-950 leading-snug outline-none after:absolute after:inset-0 after:rounded-panel after:content-[""]',
                                        mono && 'font-mono text-sm',
                                    )}
                                    href={href}
                                >
                                    {title}
                                </Link>
                                {(visual || !icon) && <span className="mt-1">{arrow}</span>}
                            </div>
                            {description && (
                                <span className="line-clamp-3 text-pretty text-neutral-600 text-sm leading-[1.55]">
                                    {description}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Reveal>
        </li>
    );
};

/** The pages either side of `path` in a section's order, flattened from its groups. */
export const neighbours = (groups: readonly NavGroup[] | readonly NavItem[], path: string) => {
    const items: NavItem[] = (groups as readonly (NavGroup | NavItem)[]).flatMap(entry =>
        'items' in entry ? [...entry.items] : [entry],
    );
    const index = items.findIndex(item => item.href === path);
    if (index < 0) return { previous: undefined, next: undefined };
    return { previous: items[index - 1], next: items[index + 1] };
};

const Neighbour = ({ item, side }: { item: NavItem; side: 'previous' | 'next' }) => (
    <Link
        className={cn(
            'group/card flex min-w-0 items-center gap-4 rounded-panel border border-neutral-200 bg-neutral-50 px-5 py-4 outline-none transition-[border-color] duration-150 hover:border-neutral-300 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2',
            side === 'next' && 'flex-row-reverse text-right sm:col-start-2',
        )}
        href={item.href}
        rel={side === 'previous' ? 'prev' : 'next'}
    >
        {side === 'previous' ? (
            <ArrowLeft
                aria-hidden
                className="size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/card:-translate-x-0.5 group-hover/card:text-neutral-950"
                strokeWidth={2}
            />
        ) : (
            <ArrowRight aria-hidden className={arrowClass} strokeWidth={2} />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-neutral-500 text-xs">
                {side === 'previous' ? 'Previous' : 'Next'}
            </span>
            <span className="truncate font-medium text-base text-neutral-950">{item.label}</span>
        </span>
    </Link>
);

/** The previous and next page of the section, at the foot of a page, in the section's order. */
export const PrevNext = ({
    groups,
    path,
    label,
}: {
    groups: readonly NavGroup[] | readonly NavItem[];
    path: string;
    /** What the section's pages are, for the landmark ("Components"). */
    label: string;
}) => {
    const { previous, next } = neighbours(groups, path);
    if (!previous && !next) return null;
    return (
        // The reading column (608, the article's), so the pair shares the text's edges.
        <Container className="max-w-[656px] pt-8 md:pt-12">
            <nav aria-label={`${label}: previous and next`} className="grid gap-4 sm:grid-cols-2">
                {previous && <Neighbour item={previous} side="previous" />}
                {next && <Neighbour item={next} side="next" />}
            </nav>
        </Container>
    );
};
