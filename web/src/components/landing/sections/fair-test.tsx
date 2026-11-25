'use client';

import { BottomBar, Dock, DockItem, Theme } from '@contui/ui';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { ContinuumScreen } from '../compare/continuum-screen';
import { PlainScreen } from '../compare/plain-screen';
import { COMPARE_THEME, compareThemeCss } from '../theme';
import { ease, Shot } from '../web';

/*
 * Before and after, as a switch: one workspace overview with the same frozen content
 * (compare/data.ts) built two ways. With Continuum (compare/continuum-screen.tsx): the library's
 * parts composed by the skill, in the product theme set small as a dense work app would be: the
 * shell in full, the figures with their trends, the revenue chart, and a side panel of what waits on
 * the reader. As a default AI build (compare/plain-screen.tsx, a hand-built stand-in): a purple
 * primary, a gradient banner, icon tiles, a zoomed axis, a card grid. One screen at a time, so the
 * frame never holds two busy pages at once.
 *
 * Both are drawn at the width they are laid out for and cropped by the frame, never scaled: 1040 from
 * md up, and under it the frame's own width, so a phone sees each page as it is on a phone. The
 * switch is the system's floating bottom bar, over the screen at the frame's foot.
 */

type Side = 'continuum' | 'plain';

export const Comparison = () => {
    const [side, setSide] = useState<Side>('continuum');
    const reduce = useReducedMotion();
    // The screens are heavy and never change: made once, so switching only swaps which one shows.
    const screens = useMemo(
        () => ({
            // The Continuum side wears the product theme set small, as a dense work app would.
            continuum: (
                <Theme className="size-full" theme={COMPARE_THEME}>
                    <Shot className="size-full">
                        <ContinuumScreen />
                    </Shot>
                </Theme>
            ),
            plain: <PlainScreen />,
        }),
        [],
    );

    return (
        <div className="relative h-152 overflow-hidden rounded-panel border border-neutral-200 bg-neutral-100 shadow-float md:aspect-video md:h-auto">
            <style>{compareThemeCss}</style>
            {/* A picture of each page: nothing inside takes focus or a click. */}
            <AnimatePresence initial={false}>
                <motion.div
                    animate={{ opacity: 1 }}
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-full *:w-full md:min-w-260"
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
