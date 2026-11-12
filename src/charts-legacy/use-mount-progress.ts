'use client';

import { animate, type Transition, useMotionValue, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { DEFAULT_CHART_ENTER_TRANSITION } from './animation';

/**
 * Drives 0→1 enter progress using the studio motion transition (spring or tween).
 * Under reduced motion it starts and stays at 1, so the shape is drawn whole at once.
 */
export function useMountProgress(
    enterTransition: Transition | undefined,
    delaySeconds: number,
    replayKey: number | string,
) {
    const reduceMotion = useReducedMotion() === true;
    const progress = useMotionValue(reduceMotion ? 1 : 0);
    const transitionRef = useRef(enterTransition);
    transitionRef.current = enterTransition;

    // replayKey intentionally retriggers enter when motion settings change
    // biome-ignore lint/correctness/useExhaustiveDependencies: replayKey
    useEffect(() => {
        if (reduceMotion) {
            progress.set(1);
            return;
        }
        progress.set(0);
        const controls = animate(progress, 1, {
            ...(transitionRef.current ?? DEFAULT_CHART_ENTER_TRANSITION),
            delay: delaySeconds,
        });
        return () => controls.stop();
    }, [delaySeconds, replayKey, progress, reduceMotion]);

    return progress;
}
