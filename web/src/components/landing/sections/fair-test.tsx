'use client';

import { Overview } from '@screens/overview';
import { BottomBar, Dock, DockItem } from 'continuum';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { PlainOverview } from '../films/plain-overview';
import { ease, Shot } from '../web';

/*
 * Before and after, as a switch: one page shown as it is with Continuum (the playground's own
 * Overview screen, live in the page's theme), and at the press of the switch as an agent builds it
 * without the system (a hand-built stand-in: the default shadcn look, a purple primary, a gradient
 * header, cards on cards, mixed weights, loose 16px everything). One screen at a time, so the frame
 * never holds two busy pages at once.
 *
 * Both are drawn at the width they are laid out for and cropped by the frame, never scaled, so 13px
 * stays 13px. The switch is the system's floating bottom bar, over the screen at the frame's foot.
 */

type Side = 'continuum' | 'plain';

export const Comparison = () => {
    const [side, setSide] = useState<Side>('continuum');
    const reduce = useReducedMotion();
    // The screens are heavy and never change: made once, so switching only swaps which one shows.
    const screens = useMemo(
        () => ({
            continuum: (
                <Shot>
                    <Overview />
                </Shot>
            ),
            plain: <PlainOverview />,
        }),
        [],
    );

    return (
        <div className="relative h-152 overflow-hidden rounded-panel border border-neutral-200 bg-neutral-100 shadow-float md:aspect-video md:h-auto">
            {/* A picture of each page: nothing inside takes focus or a click. */}
            <AnimatePresence initial={false}>
                <motion.div
                    animate={{ opacity: 1 }}
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-full min-w-260 *:w-full max-sm:-translate-x-[264px]"
                    exit={{ opacity: 0 }}
                    inert
                    initial={{ opacity: 0 }}
                    key={side}
                    transition={{ duration: reduce ? 0 : 0.3, ease }}
                >
                    {screens[side]}
                </motion.div>
            </AnimatePresence>

            {/* The switch: the system's own floating bar at the frame's foot, a dock of two views. */}
            <BottomBar className="z-20" floating>
                <Dock
                    aria-label="Show the page"
                    onValueChange={value => setSide(value === 'plain' ? 'plain' : 'continuum')}
                    value={side}
                >
                    <DockItem value="continuum">With Continuum</DockItem>
                    <DockItem value="plain">Default AI output</DockItem>
                </Dock>
            </BottomBar>
        </div>
    );
};
