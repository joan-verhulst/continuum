import { ContinuumMark } from 'continuum';
import Link from 'next/link';
import { githubUrl } from '@/lib/site';

type FooterLink = { label: string; href: string; external?: boolean };

/** The few links at the foot: only ones that lead somewhere. */
const links: FooterLink[] = [
    { label: 'Docs', href: '/docs/install' },
    { label: 'GitHub', href: githubUrl, external: true },
    { label: 'Back to top', href: '#top' },
];

const linkClass =
    'rounded-chip transition-[color] duration-150 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2';

/**
 * The site's one footer, the landing's, on every page: one box the window's width, 12 in from its
 * edges, on the page's surface. The mark and the name fill it, sized to the box rather than the
 * window; the maker and a few links sit at its foot.
 */
export const SiteFooter = () => (
    <footer className="mt-16 px-3 pb-3 md:mt-32">
        <div className="@container relative flex aspect-[4/5] flex-col items-center justify-center rounded-panel border border-neutral-200 bg-neutral-50 px-6 text-center sm:aspect-video lg:aspect-[21/9]">
            <p
                aria-hidden
                className="flex select-none items-center gap-[0.12em] font-medium text-[18cqw] text-neutral-950 leading-none tracking-[-0.045em] sm:text-[11cqw]"
            >
                <ContinuumMark className="h-[0.62em] w-auto shrink-0" />
                Continuum
            </p>
            <div className="absolute inset-x-6 bottom-6 flex flex-col items-center gap-x-6 gap-y-2 font-mono text-neutral-500 text-xxs leading-[1.7] md:inset-x-10 md:bottom-10 md:flex-row md:justify-between md:text-xs">
                <p>
                    © 2026 Continuum, a trade name of{' '}
                    <a className={linkClass} href="https://pixelperfect.agency" rel="noopener">
                        Pixel Perfect
                    </a>
                    . All rights reserved.
                </p>
                <nav aria-label="Footer">
                    <ul className="flex gap-4">
                        {links.map(link => (
                            <li key={link.label}>
                                {link.href.startsWith('/') ? (
                                    <Link className={linkClass} href={link.href}>
                                        {link.label}
                                    </Link>
                                ) : (
                                    <a
                                        className={linkClass}
                                        href={link.href}
                                        rel={link.external ? 'noopener' : undefined}
                                        target={link.external ? '_blank' : undefined}
                                    >
                                        {link.label}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    </footer>
);
