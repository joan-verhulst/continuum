'use client';

import { useRef } from 'react';
import { GlassLight, type GlassRect, type Light } from '@/components/footer-shader';
import { lightGroups } from '@/components/footer-tuner';
import { Tuner, type TunerGroup } from '@/components/tuner';
import { tunable } from '@/lib/tunable';

/*
 * The hero board's light: the footer's own, shining through glass that is never drawn. The glass is a
 * large rectangle that may lie outside the board (below its foot, say), the source further out
 * behind it, so only the light it lets through reaches the board. Set by eye at `?tune` (the panel on
 * the left, the dot to drag the source).
 */

/** How far past the board's edges, in board sizes, the glass and the source may lie. */
const MARGIN = 0.75;

/**
 * As the footer's LIGHT, with the glass: its centre in the board's 0–1 (y up, below 0 is under the
 * foot), its size in board widths and heights.
 */
export const HERO_LIGHT = {
    x: 0.5,
    y: -2,
    sway: 0,
    near: 0,
    far: 0.55,
    falloff: 0.99,
    exposure: 1,
    colour: 2.5,
    blur: 59,
    spread: 600,
    haze: 0.9,
    hazeReach: 0.5,
    hazeBlur: 300,
    hazeSpread: 330,
    strength: 1,
    glassX: 0.5,
    glassY: 0.06,
    glassWidth: 0.52,
    glassHeight: 0.15,
};

/**
 * The same light through the headline instead (glass `#hero-title`), as tuned on 19 November 2026:
 * kept to go back to.
 */
export const HERO_TEXT_LIGHT = {
    x: 0.49,
    y: 1,
    sway: 0,
    near: 0.04,
    far: 0.54,
    falloff: 0.97,
    exposure: 1.3,
    colour: 3,
    blur: 24,
    spread: 250,
    haze: 2,
    hazeReach: 1.85,
    hazeBlur: 75,
    hazeSpread: 620,
};

type HeroLightValues = typeof HERO_LIGHT;

export const heroLightStore = tunable<HeroLightValues>(HERO_LIGHT);

const glassRect = (light: HeroLightValues): GlassRect => ({
    x: light.glassX,
    y: light.glassY,
    width: light.glassWidth,
    height: light.glassHeight,
});

const groups: TunerGroup<HeroLightValues>[] = [
    ...(lightGroups as TunerGroup<Light>[] as TunerGroup<HeroLightValues>[]),
    {
        title: 'Glass',
        rows: [
            { key: 'glassX', label: 'Across', min: -MARGIN, max: 1 + MARGIN, step: 0.01 },
            { key: 'glassY', label: 'Height', min: -MARGIN, max: 1 + MARGIN, step: 0.01 },
            { key: 'glassWidth', label: 'Width', min: 0, max: 1 + 2 * MARGIN, step: 0.01 },
            {
                key: 'glassHeight',
                label: 'Height of the glass',
                min: 0,
                max: 1 + 2 * MARGIN,
                step: 0.01,
            },
        ],
    },
];

export const HeroLight = () => {
    // Save image in the tuner: the light as drawn now, baked to an image for where a shader would be too much.
    const bake = useRef<(() => string) | null>(null);
    return (
        <>
            <GlassLight
                bake={bake}
                className="absolute inset-0"
                glass={glassRect}
                margin={MARGIN}
                store={heroLightStore}
            />
            <Tuner
                groups={groups}
                name="HERO_LIGHT"
                onBake={() => bake.current?.() ?? null}
                point={{ x: 'x', y: 'y' }}
                side="left"
                store={heroLightStore}
                title="Hero light"
            />
        </>
    );
};
