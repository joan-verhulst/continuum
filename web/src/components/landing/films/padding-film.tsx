'use client';

import { cn, Theme } from '@contui/ui';
import { motion } from 'motion/react';
import { PRODUCT_THEME } from '../theme';
import {
    Count,
    FilmCamera,
    FilmFrame,
    Finding,
    Note,
    Prompt,
    SCREEN,
    type Shot,
    seconds,
    useAfter,
    useFilm,
} from './kit';
import { BUILT, FIXED, PaddingScreen } from './padding-screen';

/*
 * Fix padding, filmed on a real page: Northwind's billing overview as an agent built it, in an app
 * window at 16:9 and its real size, the camera panning across it. You run the skill on it. The camera
 * goes to the first stat card: its padding shaded (32), its two blocks outlined, the label and its
 * figure as one (15.5) and the pill (11). The working comes out as data: each block one line at its
 * own size, 13.25 over two lines, 15.9; then 15.9 on the scale, snapped to 16. The card settles to 16,
 * the label and figure 4 apart, 12 above the pill; then the rest follows: the other cards, the cards
 * 16 apart, the row 44 under the chart. It ends on the page in line. Every value is the formula's
 * (get_spacing, lib/spacing.ts) for this content.
 */

const BEATS = [
    1000, // 0 the page as built
    1700, // 1 the prompt
    1400, // 2 the first card: its padding shaded, its blocks outlined
    2000, // 3 the working
    1400, // 4 15.9 on the scale, snapped to 16
    1300, // 5 the card fixed
    1700, // 6 the rest: the other cards and the page's gaps
    1500, // 7 the page in line
] as const;

export const PADDING_SECONDS = seconds(BEATS);

/** The spacing scale's steps the ruler shows, in px, from its first to its last. */
const STEPS = [12, 16, 20, 24, 28, 32];
const LOW = 12;
const HIGH = 32;

/** The ruler: the spacing steps, a marker landing on the result, then snapping to the nearest step. */
const Ruler = () => {
    const snapped = useAfter(650);
    const at = (value: number) => `${((value - LOW) / (HIGH - LOW)) * 100}%`;
    return (
        <div className="relative mx-1 h-12 w-[216px]">
            <span className="absolute inset-x-0 top-4 h-px bg-neutral-300" />
            {STEPS.map(value => (
                <span
                    className="absolute top-2.5 flex -translate-x-1/2 flex-col items-center gap-1.5"
                    key={value}
                    style={{ left: at(value) }}
                >
                    <span
                        className={cn(
                            'h-3 w-px transition-colors duration-300',
                            snapped && value === 16 ? 'bg-primary-500' : 'bg-neutral-400',
                        )}
                    />
                    <span
                        className={cn(
                            'font-mono text-[11px] tabular-nums transition-colors duration-300',
                            snapped && value === 16 ? 'text-primary-500' : 'text-neutral-500',
                        )}
                    >
                        {value}
                    </span>
                </span>
            ))}
            <motion.span
                animate={{ left: at(snapped ? 16 : 15.9) }}
                className={cn(
                    'absolute top-0 size-2.5 -translate-x-1/2 rounded-full border-2 border-neutral-50 transition-colors duration-300',
                    snapped ? 'bg-primary-500' : 'bg-error-500',
                )}
                initial={{ left: at(15.9) }}
                transition={
                    snapped ? { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] } : { duration: 0 }
                }
            />
        </div>
    );
};

/** The working, as data: each block one line at its own size, then the formula, its result counting out. */
const Working = () => (
    <div className="flex flex-col gap-2 font-mono">
        <span className="flex flex-col text-[11px] text-neutral-500 tabular-nums">
            <span>(13 + 18) ÷ 2 = 15.5</span>
            <span>(15.5 + 11) ÷ 2 = 13.25</span>
        </span>
        <span className="text-[12px] text-neutral-950 tabular-nums">
            0.75 × 13.25 × (1 + 0.6·log₂2)
        </span>
        <span className="font-medium text-[22px] text-neutral-950 tabular-nums">
            = <Count delay={0.25} to={15.9} />
        </span>
    </div>
);

/**
 * What the camera frames at each beat, at real size: it only pans. The window's corner first, the
 * page's head; then the first stat card, framed low so the callout above leaves it clear; at the end
 * the chart and the row under it, from the column's left edge.
 */
const shotAt = (beat: number): Shot => {
    if (beat <= 1) return 'start';
    if (beat <= 6)
        return {
            region: 'first',
            cut: box => ({ ...box, y: box.y - 120, height: box.height + 120 }),
        };
    return {
        region: 'stats',
        // The column's left edge 24 in from the stage's; the row 60 above the stage's foot, the
        // chart over it.
        cut: box => ({ x: box.x - 24, y: box.y + box.height - 580, width: 720, height: 640 }),
    };
};

export const PaddingFilm = () => {
    const { beat, round } = useFilm(BEATS);
    const note = beat === 3 ? 'working' : beat === 4 ? 'scale' : beat === 6 ? 'gaps' : null;
    return (
        <FilmFrame round={round}>
            <FilmCamera at={beat} shot={shotAt(beat)} size={SCREEN}>
                <Theme className="size-full" mode="dark" theme={PRODUCT_THEME}>
                    <PaddingScreen
                        state={{
                            marks: beat >= 2 && beat <= 6,
                            groups: beat >= 2 && beat <= 4,
                            first: beat >= 5,
                            rest: beat >= 6,
                        }}
                    />
                </Theme>
            </FilmCamera>
            <Prompt on={beat === 1} text="/continuum-fix-padding billing.tsx" />
            <Note id={note}>
                {note === 'working' ? (
                    <Working />
                ) : note === 'scale' ? (
                    <Ruler />
                ) : (
                    note && (
                        <Finding
                            rows={[
                                ['across', String(BUILT.across), String(FIXED.across)],
                                ['down', String(BUILT.down), String(FIXED.down)],
                            ]}
                        />
                    )
                )}
            </Note>
        </FilmFrame>
    );
};
