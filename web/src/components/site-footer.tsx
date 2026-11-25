import { cn } from '@contui/ui';
import { ContinuumMark } from '@playground/brand';
import Link from 'next/link';
import { type FooterColumn, footerMap } from '@/lib/footer-links';
import { githubUrl } from '@/lib/site';
import { FooterShader } from './footer-shader';

const linkClass =
    'rounded-chip transition-[color] duration-150 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2';

/** One section of the map: its name, leading to its index, over a link to each of its pages. */
const MapColumn = ({ column, wide }: { column: FooterColumn; wide?: boolean }) => (
    <div className="flex min-w-0 flex-col gap-4">
        <Link
            className={cn(linkClass, 'w-fit font-medium text-neutral-950 text-sm')}
            href={column.href}
        >
            {column.title}
        </Link>
        <ul
            className={cn(
                'text-neutral-600 text-sm leading-[1.5]',
                // The components are many: they flow down and across the full width.
                wide
                    ? 'columns-2 gap-x-6 sm:columns-3 md:columns-4 lg:columns-6 [&>li]:mb-2 [&>li]:break-inside-avoid'
                    : 'flex flex-col gap-2',
            )}
        >
            {column.links.map(link => (
                <li key={link.href}>
                    <Link className={cn(linkClass, 'break-words')} href={link.href}>
                        {link.label}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);

/**
 * The site's one footer, on every page: one box the window's width, 12 in from its edges. At its
 * top, in a box of its own on the landing's dots, the name with a light behind it shining out through
 * its letters, leaning after the pointer (FooterShader); under it the map of the site, every page by its section, from the same loaders as
 * the pages (footerMap); at its foot the maker and GitHub.
 */
export const SiteFooter = () => {
    const { components, columns } = footerMap();
    // It waits under the page, which peels up off it (FooterPeel), 12 in from the page's edge as from
    // the window's.
    return (
        <footer className="p-3">
            <div className="overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
                {/* The light in its own box, inset from the footer's edge, its corner the panel's less the
                    inset. The shader reads this box's surface colour, so it needs its own fill; the dots,
                    the landing's canvas, sit under the light and show through it. */}
                <div className="@container group relative m-2 aspect-[4/3] overflow-hidden rounded-[calc(var(--radius-panel)-8px)] border border-neutral-200 bg-neutral-50 sm:aspect-[2/1] lg:aspect-[3/1]">
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-neutral-200)_1px,transparent_1.4px)] bg-size-[16px_16px]"
                    />
                    <FooterShader className="absolute inset-0" />
                    {/* The shader draws the name in its light; this one sets where, and stands in without WebGL. */}
                    <p
                        aria-hidden
                        className="absolute inset-0 flex select-none items-center justify-center gap-[0.26em] font-medium text-[12.5cqw] text-neutral-950 leading-none tracking-[-0.045em] group-data-lit:text-transparent sm:text-[8.5cqw]"
                        data-footer-name
                    >
                        {/* Near the header logo's proportions (the mark 1.53 times the type): a touch smaller, closer and lighter, as it is drawn far larger. */}
                        <ContinuumMark className="h-[1.35em] w-auto shrink-0" strokeWidth={2.75} />
                        Continuum
                    </p>
                </div>
                <nav aria-label="Site map">
                    <div className="mx-auto flex max-w-[1152px] flex-col gap-12 px-6 py-16 md:px-10">
                        <MapColumn column={components} wide />
                        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-6">
                            {columns.map(column => (
                                <MapColumn column={column} key={column.title} />
                            ))}
                        </div>
                    </div>
                </nav>
                <div className="flex flex-col items-center gap-x-6 gap-y-2 border-neutral-200 border-t px-6 py-6 font-mono text-neutral-500 text-xxs leading-[1.7] md:flex-row md:justify-between md:px-10 md:text-xs">
                    <p>
                        © 2026 Continuum, a trade name of{' '}
                        <a className={linkClass} href="https://pixelperfect.agency" rel="noopener">
                            Pixel Perfect
                        </a>
                        . All rights reserved.
                    </p>
                    <ul className="flex gap-4">
                        <li>
                            <a
                                className={linkClass}
                                href={githubUrl}
                                rel="noopener"
                                target="_blank"
                            >
                                GitHub
                            </a>
                        </li>
                        <li>
                            <a className={linkClass} href="#top">
                                Back to top
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>
    );
};
