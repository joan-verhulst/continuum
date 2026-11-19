'use client';

import { type Light, lightStore } from './footer-shader';
import { Tuner, type TunerGroup } from './tuner';

/** The footer's light at `?tune` (FooterTuner, off for now: put it back in SiteFooter's light box to tune the footer again). */

/** The light's controls, for any glass light's tuner. */
export const lightGroups: TunerGroup<Light>[] = [
    {
        title: 'Source',
        rows: [
            { key: 'x', label: 'Across', min: 0, max: 1, step: 0.01 },
            { key: 'y', label: 'Height', min: -2, max: 2, step: 0.01 },
            { key: 'sway', label: 'Sway', min: 0, max: 0.15, step: 0.005 },
        ],
    },
    {
        title: 'Shafts',
        rows: [
            { key: 'near', label: 'Reach, red', min: 0, max: 1.5, step: 0.01 },
            { key: 'far', label: 'Reach, violet', min: 0, max: 3, step: 0.01 },
            { key: 'falloff', label: 'Falloff', min: 0.6, max: 0.99, step: 0.01 },
            { key: 'blur', label: 'Softness', min: 0, max: 120, step: 1 },
            { key: 'spread', label: 'Run past the ends', min: 0, max: 600, step: 10 },
        ],
    },
    {
        title: 'Haze',
        rows: [
            { key: 'haze', label: 'Strength', min: 0, max: 2, step: 0.01 },
            { key: 'hazeReach', label: 'Reach', min: 0.5, max: 4, step: 0.05 },
            { key: 'hazeBlur', label: 'Softness', min: 20, max: 300, step: 5 },
            { key: 'hazeSpread', label: 'Run past the ends', min: 0, max: 1000, step: 10 },
        ],
    },
    {
        title: 'Colour',
        rows: [
            { key: 'exposure', label: 'Exposure', min: 0.2, max: 4, step: 0.05 },
            { key: 'colour', label: 'Saturation', min: 1, max: 6, step: 0.1 },
            { key: 'strength', label: 'Strength', min: 0, max: 1, step: 0.01 },
        ],
    },
];

export const FooterTuner = () => (
    <Tuner
        dragAnywhere
        groups={lightGroups}
        name="LIGHT"
        point={{ x: 'x', y: 'y' }}
        store={lightStore}
        title="Footer light"
    />
);
