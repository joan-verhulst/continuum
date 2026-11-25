'use client';

import { cn } from '@contui/ui';
import { type ReactNode, useEffect, useRef } from 'react';
import { LIGHT, lightStore } from './footer-shader';

interface Props {
    children: ReactNode;
    footer: ReactNode;
}

/** How dim the footer's light is while the page still covers it, as a share of full. */
const DIM = 0.04;

/** How far below the screen's bottom (px) the page's edge may be and the footer already shows. */
const AHEAD = 160;

/**
 * The page peels up off the footer: the page is an opaque sheet above it, rounded where it leaves
 * the footer, and the footer waits underneath, sticky with a bottom offset of `min(0, screen -
 * header - its height)`. A footer that fits under the header is held at the screen's bottom while
 * the page slides off it; a taller one is held just under the header and scrolls on like any
 * content once the page has passed. CSS does the moving; this tells it the footer's height. Until
 * that is measured the offset never engages, so without JavaScript the footer is in plain flow.
 *
 * Two things follow the page's bottom edge. The footer is hidden until that edge is near the
 * screen: under a page the browser has not yet painted (a fast scroll), it would flicker through.
 * And the footer's light comes up as the page lifts off it, from dim to full over the first
 * screen of the peel.
 */
export const FooterPeel = ({ children, footer }: Props) => {
    const pageRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const page = pageRef.current;
        const node = footerRef.current;
        if (!page || !node) return;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let frame = 0;

        const check = () => {
            frame = 0;
            const edge = page.getBoundingClientRect().bottom;
            const screen = window.innerHeight;
            node.style.visibility = edge < screen + AHEAD ? 'visible' : 'hidden';
            // How much of a screen the page has lifted off the footer, eased.
            const t = still ? 1 : Math.min(1, Math.max(0, (screen - edge) / (screen * 0.8)));
            const eased = t * t * (3 - 2 * t);
            lightStore.set({ strength: LIGHT.strength * (DIM + (1 - DIM) * eased) });
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(check);
        };
        const measure = () => {
            node.style.setProperty('--footer-height', `${node.offsetHeight}px`);
            schedule();
        };

        const observer = new ResizeObserver(measure);
        observer.observe(node);
        observer.observe(page);
        measure();
        check();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            cancelAnimationFrame(frame);
            node.style.removeProperty('--footer-height');
            node.style.removeProperty('visibility');
            lightStore.set({ strength: LIGHT.strength });
        };
    }, []);

    return (
        <>
            <div
                className={cn(
                    // Above the footer and opaque, so it hides what it covers. `overflow-clip` rounds
                    // whatever reaches the corners too, and unlike `hidden` leaves sticky alone.
                    'relative z-10 overflow-clip rounded-b-[2.5rem] border-neutral-200 border-b bg-neutral-50',
                    // The room the footer used to keep above itself; on the landing the rails run to the edge.
                    'pb-16 has-data-rails:pb-0 md:pb-32',
                )}
                ref={pageRef}
            >
                {children}
            </div>
            <div
                className={cn(
                    // Starts 40px under the page, so its rounded corners show the footer's ground, not
                    // the canvas behind it.
                    'sticky z-0 -mt-10 bg-neutral-100 pt-10',
                    // A tall footer is held just under the sticky header (64 and its hairline), not under it.
                    'bottom-[min(0px,calc(100svh-65px-var(--footer-height,9999px)))]',
                )}
                data-footer-peel
                ref={footerRef}
            >
                {footer}
            </div>
        </>
    );
};
