'use client';

import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { useRef } from 'react';
import { GlassLight, type GlassRect, type Light } from '@/components/footer-shader';
import { lightGroups } from '@/components/footer-tuner';
import { Tuner, type TunerGroup } from '@/components/tuner';
import { tunable } from '@/lib/tunable';

/*
 * The Pro card's light: the hero's, rising from under the box's foot through glass that is never
 * drawn. It is dim while the card is low in the window and comes up as the card scrolls in, full
 * once the box's middle reaches the window's. Set by eye at `?tune` (the panel on the right).
 */

/** How far past the box's edges, in box sizes, the glass and the source may lie. */
const MARGIN = 0.75;

/** As the hero's light, with the glass: its centre in the box's 0–1 (y up), its size in box sizes. */
export const PRO_LIGHT = {
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

type ProLightValues = typeof PRO_LIGHT;

const proLightStore = tunable<ProLightValues>(PRO_LIGHT);

const glassRect = (light: ProLightValues): GlassRect => ({
    x: light.glassX,
    y: light.glassY,
    width: light.glassWidth,
    height: light.glassHeight,
});

const groups: TunerGroup<ProLightValues>[] = [
    ...(lightGroups as TunerGroup<Light>[] as TunerGroup<ProLightValues>[]),
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

/** How dim the light is before the card scrolls in, as a share of full. */
const DIM = 0.04;

/**
 * The light as the box's backdrop: fills the box (a stacking context of its own) under its
 * content, in the card's colour, which the shader reads as its surface.
 */
export const ProLight = () => {
    const layer = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: layer,
        offset: ['start end', 'center center'],
    });

    useMotionValueEvent(scrollYProgress, 'change', value => {
        const t = reduce ? 1 : Math.min(1, Math.max(0, value));
        const eased = t * t * (3 - 2 * t);
        proLightStore.set({ strength: PRO_LIGHT.strength * (DIM + (1 - DIM) * eased) });
    });

    return (
        <>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit] bg-neutral-50"
                data-light-scope=""
                ref={layer}
            >
                {/* Only without WebGL, the spectrum's blurred strip stands in for the light. */}
                <div className="absolute inset-x-[12%] -bottom-[28%] in-data-unlit:block hidden h-[45%] rounded-full bg-spectrum opacity-30 blur-[96px]" />
                <GlassLight
                    className="absolute inset-0"
                    glass={glassRect}
                    margin={MARGIN}
                    store={proLightStore}
                />
            </div>
            <Tuner
                groups={groups}
                name="PRO_LIGHT"
                point={{ x: 'x', y: 'y' }}
                side="right"
                store={proLightStore}
                title="Pro card light"
            />
        </>
    );
};
