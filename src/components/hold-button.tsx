'use client';

import {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    useEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { Button, type ButtonProps } from './button';

export type HoldButtonProps = Omit<ButtonProps, 'onClick' | 'render'> & {
    /** Runs once the button has been held for `duration`. */
    onConfirm: () => void;
    /** How long the hold takes, in ms. */
    duration?: number;
};

/** How long a fill that was let go of takes to drain, in ms. */
const DRAIN_MS = 200;

const isHoldKey = (key: string) => key === ' ' || key === 'Enter';

/**
 * A button that runs a destructive action only once it has been held: holding fills it from the
 * start edge in the error tone over `duration` (1000ms), and the action runs when it is full.
 * Letting go sooner drains it back and nothing happens. Space or Enter held works the same. For an
 * action repeated in place where a dialog each time would be clicked through; its label says to
 * hold ("Hold to remove").
 */
export const HoldButton = ({
    onConfirm,
    duration = 1000,
    variant = 'secondary',
    className,
    style,
    disabled,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onKeyDown,
    onKeyUp,
    onBlur,
    ...props
}: HoldButtonProps) => {
    const [holding, setHolding] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    // Whether a key or the pointer started this press, so a click that follows it is not mistaken
    // for a screen reader's activation.
    const pressed = useRef(false);
    const confirm = useRef(onConfirm);
    confirm.current = onConfirm;

    const start = () => {
        if (disabled || timer.current) return;
        pressed.current = true;
        setHolding(true);
        timer.current = setTimeout(() => {
            timer.current = undefined;
            setHolding(false);
            confirm.current();
        }, duration);
    };

    const stop = () => {
        clearTimeout(timer.current);
        timer.current = undefined;
        setHolding(false);
    };

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <Button
            className={cn(
                'relative isolate overflow-hidden',
                // The fill: the error tone's 500 at 20%, under the label, growing from the start edge.
                'before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-error-500/20 before:content-[""] rtl:before:origin-right',
                'before:transition-[scale] before:ease-linear',
                holding
                    ? 'text-error-700 before:scale-x-100 before:duration-(--hold-ms)'
                    : 'before:duration-(--drain-ms)',
                className,
            )}
            data-holding={holding || undefined}
            data-slot="hold-button"
            disabled={disabled}
            onBlur={event => {
                stop();
                onBlur?.(event);
            }}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
                // A screen reader activates a button with a click and no key or pointer before it; it
                // cannot hold, and its activation is deliberate, so it confirms at once.
                if (event.detail === 0 && !pressed.current) confirm.current();
                pressed.current = false;
            }}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                if (isHoldKey(event.key)) {
                    // Enter would click on keydown; the hold decides instead.
                    event.preventDefault();
                    if (!event.repeat) start();
                }
                onKeyDown?.(event);
            }}
            onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
                if (isHoldKey(event.key)) {
                    // Space clicks on keyup; held off so the release is only a release.
                    event.preventDefault();
                    stop();
                    pressed.current = false;
                }
                onKeyUp?.(event);
            }}
            onPointerCancel={(event: PointerEvent<HTMLButtonElement>) => {
                stop();
                onPointerCancel?.(event);
            }}
            onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
                if (event.button === 0) start();
                onPointerDown?.(event);
            }}
            onPointerLeave={(event: PointerEvent<HTMLButtonElement>) => {
                stop();
                onPointerLeave?.(event);
            }}
            onPointerUp={(event: PointerEvent<HTMLButtonElement>) => {
                stop();
                onPointerUp?.(event);
            }}
            style={
                {
                    '--hold-ms': `${duration}ms`,
                    '--drain-ms': `${DRAIN_MS}ms`,
                    ...style,
                } as CSSProperties
            }
            variant={variant}
            {...props}
        />
    );
};
