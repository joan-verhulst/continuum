'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { type ComponentProps, useCallback } from 'react';
import { cn } from '../lib/cn';

export type ShimmeringTextProps = Omit<ComponentProps<typeof motion.span>, 'children'> & {
    /** The text to render with the shimmering effect. */
    text: string;
    /**
     * Duration in seconds for one shimmer cycle.
     * @defaultValue 1
     */
    duration?: number;
    /**
     * Whether the shimmer animation is paused.
     * @defaultValue false
     */
    isStopped?: boolean;
};

export function ShimmeringText({
    text,
    duration = 1,
    isStopped = false,
    className,
    ...props
}: ShimmeringTextProps) {
    const reducedMotion = useReducedMotion();
    const stopped = isStopped || reducedMotion === true;

    const createCharVariants = useCallback(
        (charIndex: number): Variants => ({
            running: {
                color: ['var(--color)', 'var(--shimmering-color)', 'var(--color)'],
                transition: {
                    duration,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: 'loop',
                    repeatDelay: text.length * 0.05,
                    delay: (charIndex * duration) / text.length,
                    ease: 'easeInOut',
                },
            },
            stopped: {
                color: 'var(--color)',
                transition: {
                    duration: duration * 0.5,
                    ease: 'easeOut',
                },
            },
        }),
        [duration, text.length],
    );

    return (
        <motion.span
            className={cn(
                'inline-flex select-none items-center',
                '[--color:var(--color-chart-label)] [--shimmering-color:var(--color-chart-foreground)]',
                className,
            )}
            {...props}
        >
            {text.split('').map((char, index) => (
                <motion.span
                    animate={stopped ? 'stopped' : 'running'}
                    aria-hidden
                    className="inline-block whitespace-pre"
                    initial="stopped"
                    // biome-ignore lint/suspicious/noArrayIndexKey: static label text, order never changes
                    key={index}
                    variants={createCharVariants(index)}
                >
                    {char}
                </motion.span>
            ))}
            <span className="sr-only">{text}</span>
        </motion.span>
    );
}
